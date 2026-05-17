import React, { ReactNode, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Cpu,
  Zap,
  ArrowRight,
  Settings,
  MousePointer2,
  Grid,
  Layers,
  Save,
  FolderOpen,
  X,
  Play,
  Sparkles,
  MessageSquare,
  Webhook,
  Edit,
  Copy,
  RefreshCw,
  ShieldCheck,
  Database,
  ChevronLeft,
  ChevronRight,
  Info,
  Activity,
  Terminal,
  History,
  RotateCcw,
  FileText,
  CircleCheck
} from "lucide-react";
import EditorModule from 'react-simple-code-editor';
// @ts-ignore
const Editor = EditorModule.default || EditorModule;
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useEngineStore } from "../store/useEngineStore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface NodeData {
  id: string;
  label: string;
  type: "input" | "process" | "output" | "connector";
  status: "active" | "inactive" | "error";
  content?: string;
  language?: "javascript" | "json";
  position?: { x: number; y: number };
}

const NODE_CATEGORIES = [
  {
    name: "Inputs",
    type: "input" as const,
    nodes: [
      { 
        label: "Traffic Source", 
        desc: "Ingests high-fidelity traffic data from external channels.",
        useCases: "Social ad campaigns, SEO organic feeds, landing page tracking."
      },
      { 
        label: "Inbound Webhook", 
        desc: "Sovereign entry point for external data packets.",
        useCases: "Stripe alerts, Form submissions, External CRM signals."
      },
      { 
        label: "API Trigger", 
        desc: "Activates engine processes via external system hooks.",
        useCases: "Zapier integrations, custom webhooks, serverless cron jobs."
      },
      { 
        label: "Raw Data Feed", 
        desc: "Processes unstructured data packets for system digestion.",
        useCases: "CSV imports, database sync, scraped content streams."
      },
    ]
  },
  {
    name: "Processing",
    type: "process" as const,
    nodes: [
      { 
        label: "AI Neural Core", 
        desc: "The main decision engine powered by advanced LLMs.",
        useCases: "Dynamic pitch generation, lead scoring, intent analysis." 
      },
      { 
        label: "Sovereign Logic", 
        desc: "Enforces custom business rules and validation gates.",
        useCases: "Fraud detection, qualification filters, regional compliance."
      },
      { 
        label: "Automation Hub", 
        desc: "Coordinates complex multi-step background tasks.",
        useCases: "Email sequencing, document generation, asset delivery."
      },
    ]
  },
  {
    name: "Outputs",
    type: "output" as const,
    nodes: [
      { 
        label: "Revenue Stream", 
        desc: "Monetizes output through integrated gateways.",
        useCases: "Stripe subscriptions, crypto payouts, affiliate payouts."
      },
      { 
        label: "Lead Vault", 
        desc: "Securely stores high-intent lead intelligence.",
        useCases: "CRM insertion, high-value target lists, retargeting pools."
      },
      { 
        label: "Webhook Sync", 
        desc: "Pushes engine results back to external services.",
        useCases: "Slack notifications, external DB updates, client pings."
      },
    ]
  },
  {
    name: "Connectivity",
    type: "connector" as const,
    nodes: [
      { 
        label: "Lead Database", 
        desc: "Proprietary internal lead repository for the core.",
        useCases: "Centralized user data, history tracking, activity logs."
      },
      { 
        label: "Global Relay", 
        desc: "High-speed data transfer node for multi-engine sync.",
        useCases: "Scaling revenue across markets, system-wide state sync."
      },
    ]
  }
];

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

const DEFAULT_TEMPLATES = [
  {
    name: "AI_CONTENT_EMPIRE",
    nodes: [
      { id: "n0", label: "Global Nexus", type: "connector", status: "active" as const, position: { x: 0, y: 0 } },
      { id: "n1", label: "Multi-Source AI", type: "input", status: "active" as const, position: { x: 300, y: 0 } },
      { id: "n2", label: "Sovereign Core", type: "process", status: "active" as const, position: { x: 600, y: 0 } },
      { id: "n3", label: "USDT Wallet", type: "output", status: "active" as const, position: { x: 900, y: 0 } },
    ],
    edges: [
      { id: "e0", source: "n0", target: "n1" },
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
  },
];

const getNodeIcon = (type: string, className?: string, label?: string) => {
  if (label?.toLowerCase().includes('webhook')) return <Webhook className={className || "w-3 h-3"} />;
  
  switch (type) {
    case 'input': return <Grid className={className || "w-3 h-3"} />;
    case 'process': return <Cpu className={className || "w-3 h-3"} />;
    case 'output': return <Zap className={className || "w-3 h-3"} />;
    case 'connector': return <Database className={className || "w-3 h-3"} />;
    default: return <Cpu className={className || "w-3 h-3"} />;
  }
};

export default function EngineBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { builder } = useEngineStore();
  const { 
    nodes: storeNodes, 
    edges, 
    name: engineName, 
    setNodes, 
    setEdges, 
    setName: setEngineName, 
    reset: resetBuilder, 
    load: loadBuilder 
  } = builder;

  // Add helper for rendering nodes
  const nodes: NodeData[] = storeNodes;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("n2");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  
  // Versioning State
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [isVersioning, setIsVersioning] = useState(false);
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false);
  const [vName, setVName] = useState("");
  const [vChangelog, setVChangelog] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      target: "#node-repository",
      title: "Neural Repository",
      content: "Drag and drop specialized nodes from this repository into your workspace to build your custom revenue system.",
      position: "right"
    },
    {
      target: "#engine-workspace",
      title: "Engine Mesh",
      content: "This is your core canvas. Connect nodes to define the logic and flow of your autonomous income engine.",
      position: "bottom"
    },
    {
      target: "#engine-save-btn",
      title: "Protocol Sync",
      content: "Save your engine's logic state to the decentralized cloud. Always sync before executing high-capacity tasks.",
      position: "bottom"
    },
    {
      target: "#engine-history-btn",
      title: "Temporal Control",
      content: "Revisit previous versions of your engine. Revert to stable snapshots if technical debt accumulates.",
      position: "bottom"
    }
  ];

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('engineBuilderTutorialSeen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('engineBuilderTutorialSeen', 'true');
  };

  const fetchVersions = async (engineId: string) => {
    try {
      const q = query(
        collection(db, "engines", engineId, "versions"),
        where("userId", "==", user?.uid)
      );
      const querySnapshot = await getDocs(q);
      const versionList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setVersions(versionList);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `engines/${engineId}/versions`);
    }
  };

  const [draggingEdge, setDraggingEdge] = useState<{ sourceId: string; startPos: { x: number; y: number }; currentPos: { x: number; y: number } } | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom & Pan State
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Attach non-passive wheel listener for zoom-at-point
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomSpeed = 0.002;
      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 100); // Exponential zoom for smoothness
      
      setViewState(prev => {
        const newScale = Math.min(Math.max(prev.scale * factor, 0.1), 5);
        
        // Zoom-at-mouse logic
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate the point relative to the untransformed center
        // (Since the container uses items-center justify-center)
        const dx = (mouseX - rect.width / 2 - prev.x) / prev.scale;
        const dy = (mouseY - rect.height / 2 - prev.y) / prev.scale;
        
        return {
          scale: newScale,
          x: mouseX - rect.width / 2 - dx * newScale,
          y: mouseY - rect.height / 2 - dy * newScale
        };
      });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, []);

  const addNewNode = (template: any) => {
    // Determine position - place it after the last node or at center
    const lastNode = nodes[nodes.length - 1];
    const newPos = lastNode?.position 
      ? { x: lastNode.position.x + 300, y: lastNode.position.y } 
      : { x: 0, y: 0 };

    const newNode: NodeData = {
      id: `n-${Date.now()}`,
      label: template.label,
      type: template.type,
      status: "active",
      content: "",
      language: "javascript",
      position: newPos
    };
    
    // Auto-connect to last node for convenience
    if (lastNode) {
      setEdges([...edges, { id: `e-${Date.now()}`, source: lastNode.id, target: newNode.id }]);
    }
    
    setNodes([...storeNodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  useEffect(() => {
    const templateName = searchParams.get("template");
    const editId = searchParams.get("id");

    if (editId) {
      setEditingId(editId);
      const fetchEngine = async () => {
        try {
          const docSnap = await getDoc(doc(db, "engines", editId));
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            loadBuilder({
              id: editId,
              name: data.name,
              nodes: data.nodes,
              edges: data.edges || [],
              status: data.status,
              revenue: data.revenue,
              userId: data.userId
            });
            fetchVersions(editId);
          }
        } catch (err) { handleFirestoreError(err, OperationType.GET, `engines/${editId}`); }
      };
      fetchEngine();
    } else if (templateName) {
      const found = DEFAULT_TEMPLATES.find((t) => t.name === templateName);
      if (found) { 
        setNodes(found.nodes as any); 
        setEdges(found.edges as any); 
        setEngineName(found.name); 
      }
    } else {
      resetBuilder();
    }
  }, [searchParams, loadBuilder, resetBuilder, setNodes, setEdges, setEngineName]);

  const saveTemplate = async (isDeploy: boolean = false) => {
    if (!user) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
      return;
    }
    setIsSaving(true);
    setSaveStatus('IDLE');
    try {
      const engineData = {
        userId: user.uid,
        name: engineName,
        status: "ACTIVE",
        nodes: nodes.map(n => ({ 
          id: n.id, 
          label: n.label, 
          type: n.type, 
          status: n.status, 
          content: n.content || "",
          language: n.language || "javascript",
          position: n.position || { x: 0, y: 0 }
        })),
        edges: edges,
        updatedAt: serverTimestamp(),
      };
      
      let targetId = editingId;
      if (editingId) {
        await updateDoc(doc(db, "engines", editingId), engineData);
      } else {
        const docRef = await addDoc(collection(db, "engines"), { 
          ...engineData, 
          createdAt: serverTimestamp(), 
          revenue: "$0.00", 
          performance: "INITIATING",
          optimizationMultiplier: 1.0,
          optimizationLevel: 0
        });
        targetId = docRef.id;
        setEditingId(targetId);
      }

      await addDoc(collection(db, "logs"), {
        userId: user.uid,
        title: editingId ? "Engine Protocol Updated" : "New Engine Deployed",
        desc: `Sovereign core [${engineName}] has been ${editingId ? 'reconfigured' : 'successfully established in the neural mesh'}.`,
        type: "system",
        timestamp: serverTimestamp()
      });

      setSaveStatus('SUCCESS');
      if (isDeploy) {
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setTimeout(() => setSaveStatus('IDLE'), 3000);
      }
    } catch (err) { 
      setSaveStatus('ERROR');
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, editingId ? `engines/${editingId}` : "engines"); 
    }
    finally { setIsSaving(false); }
  };

  const commitVersion = async () => {
    if (!user || !editingId || !vName) return;
    setIsVersioning(true);
    try {
      const versionData = {
        engineId: editingId,
        userId: user.uid,
        versionName: vName,
        changelog: vChangelog,
        nodes: nodes.map(n => ({ 
          id: n.id, 
          label: n.label, 
          type: n.type, 
          status: n.status, 
          content: n.content || "",
          language: n.language || "javascript",
          position: n.position || { x: 0, y: 0 }
        })),
        edges: edges,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "engines", editingId, "versions"), versionData);
      
      await addDoc(collection(db, "logs"), {
        userId: user.uid,
        title: "New Engine Version Committed",
        desc: `Snapshot [${vName}] created for core [${engineName}].`,
        type: "system",
        timestamp: serverTimestamp()
      });

      setShowSaveVersionModal(false);
      setVName("");
      setVChangelog("");
      fetchVersions(editingId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `engines/${editingId}/versions`);
    } finally {
      setIsVersioning(false);
    }
  };

  const revertToVersion = (version: any) => {
    loadBuilder({
      id: editingId!,
      name: engineName,
      nodes: version.nodes,
      edges: version.edges || [],
      status: "ACTIVE",
      revenue: "$0.00",
      userId: user!.uid
    });
    setShowHistory(false);
  };

  const handleWorkspaceMouseMove = (e: React.MouseEvent) => {
    if (draggingEdge && workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      setDraggingEdge({
        ...draggingEdge,
        currentPos: {
          x: (e.clientX - rect.left) / viewState.scale,
          y: (e.clientY - rect.top) / viewState.scale
        }
      });
      return;
    }

    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewState(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
    // Only pan if we click the background (not a node or other element)
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleWorkspaceMouseUp = () => {
    setIsPanning(false);
    setDraggingEdge(null);
  };

  const startDrag = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const startX = (node.position?.x || 0) + 128;
    const startY = (node.position?.y || 0) + 64; 

    setDraggingEdge({
      sourceId: nodeId,
      startPos: { x: startX, y: startY },
      currentPos: {
        x: (e.clientX - rect.left) / viewState.scale,
        y: (e.clientY - rect.top) / viewState.scale
      }
    });
  };

  const finishDrag = (targetId: string) => {
    if (!draggingEdge || draggingEdge.sourceId === targetId) {
      setDraggingEdge(null);
      return;
    }

    // Check if edge already exists
    if (edges.some(e => e.source === draggingEdge.sourceId && e.target === targetId)) {
      setDraggingEdge(null);
      return;
    }

    const newEdge: EdgeData = {
      id: `e-${Date.now()}`,
      source: draggingEdge.sourceId,
      target: targetId
    };

    setEdges([...edges, newEdge]);
    setDraggingEdge(null);
  };

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden relative">
      <header className="h-[60px] border-b border-border-dim px-8 flex items-center justify-between bg-surface/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Cpu className="w-4 h-4 text-accent-blue" />
          <input value={engineName || ""} onChange={e => setEngineName(e.target.value)} className="bg-transparent border-none outline-none font-black text-sm uppercase tracking-tighter text-text-main w-64 focus:text-accent-blue transition-colors" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4 border-r border-border-dim pr-4">
            <button 
              id="engine-save-btn"
              onClick={() => saveTemplate(false)} 
              disabled={isSaving} 
              className={cn(
                "p-2 rounded transition-all",
                saveStatus === 'SUCCESS' ? "text-emerald-500 bg-emerald-500/10" : 
                saveStatus === 'ERROR' ? "text-red-500 bg-red-500/10" : 
                "text-text-dim hover:text-accent-gold hover:bg-accent-gold/10"
              )}
              title="Save Protocol (Save Tab)"
            >
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowSaveVersionModal(true)} 
              disabled={!editingId || isSaving}
              className="p-2 text-text-dim hover:text-accent-blue hover:bg-accent-blue/10 rounded transition-all disabled:opacity-30" 
              title="Commit New Version"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
               id="engine-history-btn"
               onClick={() => {
                 if (editingId) fetchVersions(editingId);
                 setShowHistory(true);
               }} 
               className="p-2 text-text-dim hover:text-accent-blue hover:bg-accent-blue/10 rounded transition-all" 
               title="Version Control History"
            >
              <History className="w-4 h-4" />
            </button>
            <button onClick={() => setShowTemplates(true)} className="p-2 text-text-dim hover:text-accent-blue hover:bg-accent-blue/10 rounded transition-all" title="Template Repository"><FolderOpen className="w-4 h-4" /></button>
          </div>
          <button 
            id="engine-deploy-btn"
            onClick={() => saveTemplate(true)} 
            disabled={isSaving} 
            className={cn(
              "px-6 py-2 text-bg text-[10px] font-black uppercase tracking-widest rounded transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-50",
              isSaving ? "bg-border-dim" : "bg-accent-gold"
            )}
          >
            {isSaving ? "SYNCING..." : (editingId ? "Update Protocol" : "Deploy to Core")}
          </button>
        </div>
      </header>

      {/* Version History Side Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-bg/60 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-surface border-l border-border-dim h-full shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
               <div className="p-6 border-b border-border-dim flex items-center justify-between bg-bg/50">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-accent-blue" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Neural_History</h2>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-bg rounded-lg border border-border-dim text-text-dim transition-colors"><X className="w-4 h-4" /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {versions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                       <div className="w-16 h-16 rounded-full bg-surface border border-border-dim border-dashed flex items-center justify-center text-text-dim/30">
                          <RotateCcw className="w-8 h-8" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black uppercase text-text-dim mb-1">No_Snapshots_Found</div>
                          <p className="text-[9px] text-text-dim/60 uppercase leading-relaxed">Commit your first version to begin tracking protocol iterations.</p>
                       </div>
                    </div>
                  ) : (
                    versions.map((v) => (
                      <div key={v.id} className="group relative p-4 rounded-xl border border-border-dim bg-bg/50 hover:border-accent-blue transition-all">
                         <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                               <div className="text-[10px] font-black uppercase text-accent-blue tracking-tighter">{v.versionName}</div>
                               <div className="text-[8px] text-text-dim flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  {v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString() : "Syncing..."}
                               </div>
                            </div>
                            <button 
                              onClick={() => revertToVersion(v)}
                              className="px-3 py-1 bg-surface border border-border-dim rounded text-[8px] font-black uppercase text-text-dim hover:text-accent-gold hover:border-accent-gold transition-all"
                            >
                              Revert
                            </button>
                         </div>
                         <div className="p-3 rounded bg-surface border border-border-dim mb-3">
                            <div className="text-[8px] font-black uppercase text-text-dim mb-1 opacity-50">Log_Entry</div>
                            <p className="text-[10px] text-text-main leading-relaxed font-mono italic">"{v.changelog || "No technical log provided."}"</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                               {v.nodes.slice(0, 3).map((n: any, ni: number) => (
                                 <div key={ni} className="w-5 h-5 rounded border border-bg bg-surface flex items-center justify-center text-[8px] text-text-dim relative">
                                    {getNodeIcon(n.type, undefined, n.label)}
                                    <div className={cn(
                                      "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-bg",
                                      n.status === 'active' ? 'bg-emerald-500' : n.status === 'error' ? 'bg-red-500' : 'bg-text-dim'
                                    )} />
                                 </div>
                               ))}
                            </div>
                            <div className="text-[8px] font-black uppercase text-text-dim">{v.nodes.length} Nodes Synchronized</div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
               
               <div className="p-6 border-t border-border-dim bg-bg/30 text-center">
                  <p className="text-[8px] text-text-dim uppercase tracking-widest leading-relaxed">System history is decentralized and stored within the <span className="text-accent-blue">Neural_Sub-Grid</span></p>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Version Modal */}
      <AnimatePresence>
        {showSaveVersionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-bg/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-surface border border-border-dim rounded-2xl shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-border-dim pb-4">
                <CircleCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Commit_Protocol_Snapshot</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-text-dim tracking-widest">Version_Alias</label>
                    <input 
                      value={vName}
                      onChange={e => setVName(e.target.value)}
                      placeholder="e.g. v1.2.0_Neural_Optimization"
                      className="w-full bg-bg border border-border-dim rounded-lg p-3 text-xs text-text-main outline-none focus:border-accent-blue transition-all placeholder:text-text-dim/30 font-mono"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-text-dim tracking-widest">Changelog_Data</label>
                    <textarea 
                      value={vChangelog}
                      onChange={e => setVChangelog(e.target.value)}
                      placeholder="Describe the neural logic modifications..."
                      rows={4}
                      className="w-full bg-bg border border-border-dim rounded-lg p-3 text-xs text-text-main outline-none focus:border-accent-blue transition-all resize-none placeholder:text-text-dim/30 font-mono"
                    />
                 </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                 <button 
                  onClick={() => setShowSaveVersionModal(false)}
                  className="flex-1 py-3 border border-border-dim rounded-xl text-[10px] font-black uppercase tracking-widest text-text-dim hover:bg-bg transition-all"
                 >
                   Abort_Sync
                 </button>
                 <button 
                  onClick={commitVersion}
                  disabled={!vName || isVersioning}
                  className="flex-1 py-3 bg-accent-blue text-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all active:scale-95 disabled:opacity-50"
                 >
                   {isVersioning ? "COMMITING..." : "Confirm_Snapshot"}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-bg/40 backdrop-blur-[2px]" />
            <AnimatePresence mode="wait">
              <motion.div 
                key={tutorialStep}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute pointer-events-auto"
                style={{
                  ...(() => {
                    const el = document.querySelector(tutorialSteps[tutorialStep].target);
                    if (!el) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
                    const rect = el.getBoundingClientRect();
                    const pos = tutorialSteps[tutorialStep].position;
                    if (pos === 'bottom') return { left: rect.left + rect.width / 2, top: Math.min(rect.bottom + 20, window.innerHeight - 250), transform: 'translateX(-50%)' };
                    if (pos === 'right') return { left: rect.right + 20, top: rect.top + 100 };
                    return { left: rect.left + rect.width / 2, top: rect.top - 20, transform: 'translate(-50%, -100%)' };
                  })()
                }}
              >
                <div className="w-[300px] bg-surface border border-accent-blue/30 rounded-xl p-6 shadow-[0_0_50px_rgba(0,242,255,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[8px] font-black uppercase text-accent-blue tracking-widest">Protocol_Tutorial_Step {tutorialStep + 1}/{tutorialSteps.length}</span>
                    <button onClick={finishTutorial} className="text-text-dim hover:text-text-main transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-text-main mb-2">{tutorialSteps[tutorialStep].title}</h4>
                  <p className="text-[10px] text-text-dim font-mono leading-relaxed mb-6 uppercase tracking-wider">{tutorialSteps[tutorialStep].content}</p>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                      disabled={tutorialStep === 0}
                      className="px-3 py-1.5 text-[8px] font-black uppercase text-text-dim hover:text-text-main disabled:opacity-30"
                    >
                      Previous
                    </button>
                    {tutorialStep === tutorialSteps.length - 1 ? (
                      <button 
                        onClick={finishTutorial}
                        className="px-4 py-2 bg-accent-blue text-bg text-[8px] font-black uppercase tracking-widest rounded"
                      >
                        Launch_Builder
                      </button>
                    ) : (
                      <button 
                        onClick={() => setTutorialStep(prev => prev + 1)}
                        className="px-4 py-2 bg-bg border border-border-dim text-text-main text-[8px] font-black uppercase tracking-widest rounded hover:border-accent-blue transition-colors flex items-center gap-2"
                      >
                        Proceed <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        {showTemplates && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-bg/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl w-full bg-surface border border-border-dim rounded-2xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-8 border-b border-border-dim pb-4">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-accent-blue" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Sovereign_Template_Nexus</h2>
                </div>
                <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-bg rounded transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {DEFAULT_TEMPLATES.map(t => (
                   <button 
                    key={t.name}
                    onClick={() => {
                      setNodes(t.nodes as any);
                      setEdges(t.edges as any);
                      setEngineName(t.name);
                      setShowTemplates(false);
                    }}
                    className="p-6 bg-bg border border-border-dim rounded-xl hover:border-accent-blue transition-all group text-left"
                   >
                      <div className="text-[10px] font-black uppercase text-accent-blue mb-2 tracking-widest">{t.name.split('_').join(' ')}</div>
                      <div className="text-[9px] text-text-dim uppercase mb-4">Nodes Detected: {t.nodes.length}</div>
                      <div className="flex gap-2">
                        {t.nodes.slice(0, 4).map((n: any, i) => (
                          <div key={i} className="w-6 h-6 rounded bg-surface border border-border-dim flex items-center justify-center text-[10px] text-text-dim group-hover:text-accent-blue transition-colors relative">
                            {getNodeIcon(n.type, "w-4 h-4", n.label)}
                            <div className={cn(
                              "absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-bg",
                              n.status === 'active' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                              n.status === 'error' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 
                              'bg-text-dim'
                            )} />
                          </div>
                        ))}
                      </div>
                   </button>
                 ))}
              </div>
              
              <div className="mt-12 p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-accent-blue" />
                <p className="text-[10px] text-text-dim uppercase tracking-widest">More neural frameworks can be acquired via the <Link to="/marketplace" className="text-accent-blue hover:underline">Sovereign Marketplace</Link></p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Node Categories */}
        <motion.div 
          initial={false}
          animate={{ width: isLeftSidebarOpen ? 280 : 64 }}
          className="border-r border-border-dim bg-surface/50 backdrop-blur-sm flex flex-col shrink-0 z-30"
          id="node-repository"
        >
          <div className="p-4 border-b border-border-dim flex items-center justify-between">
            {isLeftSidebarOpen && <h3 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Node_Repository</h3>}
            <button 
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="p-1.5 hover:bg-bg rounded-lg border border-border-dim text-text-dim transition-colors"
            >
              {isLeftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {NODE_CATEGORIES.map(category => (
              <div key={category.name} className="mb-8">
                {isLeftSidebarOpen ? (
                  <h4 className="text-[9px] font-black uppercase text-accent-blue tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent-blue" />
                    {category.name}
                  </h4>
                ) : (
                  <div className="h-px bg-border-dim mb-4" />
                )}
                <div className="grid grid-cols-1 gap-2">
                  {category.nodes.map(nodeTemplate => (
                    <div key={nodeTemplate.label} className="relative group/node">
                      <button 
                        onClick={() => addNewNode({ ...nodeTemplate, type: category.type })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border border-border-dim bg-bg/50 hover:border-accent-blue transition-all group w-full text-left",
                          !isLeftSidebarOpen && "justify-center"
                        )}
                        title={nodeTemplate.label}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border-dim flex items-center justify-center shrink-0 group-hover:text-accent-blue transition-colors">
                          {getNodeIcon(category.type, "w-4 h-4", nodeTemplate.label)}
                        </div>
                        {isLeftSidebarOpen && (
                          <div className="text-left flex-1">
                            <div className="text-[10px] font-black uppercase text-text-main group-hover:text-accent-blue transition-colors">{nodeTemplate.label}</div>
                            <div className="text-[8px] text-text-dim uppercase tracking-tighter">Add to engine</div>
                          </div>
                        )}
                        {isLeftSidebarOpen && <Info className="w-3 h-3 text-text-dim/30 group-hover/node:text-accent-blue transition-colors" />}
                      </button>

                      {/* Technical Tooltip */}
                      <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 w-64 p-4 bg-surface border border-border-dim rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover/node:opacity-100 group-hover/node:pointer-events-auto transition-all duration-300 z-50 translate-x-2 group-hover/node:translate-x-0">
                         <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-surface border-l border-b border-border-dim rotate-45" />
                         <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-2">
                               <div className="p-1.5 rounded bg-accent-blue/10 text-accent-blue">
                                  {getNodeIcon(category.type, "w-4 h-4")}
                               </div>
                               <div className="text-[10px] font-black uppercase tracking-widest text-text-main">{nodeTemplate.label}</div>
                            </div>
                            <div className="h-px bg-border-dim" />
                            <div className="space-y-1">
                               <div className="text-[8px] font-black uppercase text-text-dim">Protocol_Function</div>
                               <div className="text-[10px] text-text-dim leading-relaxed font-mono">{nodeTemplate.desc}</div>
                            </div>
                            <div className="space-y-1 pt-1">
                               <div className="text-[8px] font-black uppercase text-accent-gold">Primary_Use_Cases</div>
                               <div className="text-[9px] text-text-dim leading-relaxed font-mono italic">"{nodeTemplate.useCases}"</div>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Canvas Area */}
        <div 
          ref={containerRef}
          id="engine-workspace"
          className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(var(--color-border-dim) 1px, transparent 1px)`,
            backgroundSize: `${32 * viewState.scale}px ${32 * viewState.scale}px`,
            backgroundPosition: `${viewState.x + (containerRef.current?.clientWidth || 0) / 2}px ${viewState.y + (containerRef.current?.clientHeight || 0) / 2}px`
          }}
          onMouseMove={handleWorkspaceMouseMove}
          onMouseDown={handleWorkspaceMouseDown}
          onMouseUp={handleWorkspaceMouseUp}
        >
          {/* Canvas Controls */}
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <div className="flex bg-surface/80 backdrop-blur border border-border-dim rounded-xl p-1 shadow-2xl">
              <button 
                onClick={() => setViewState(v => ({ ...v, scale: Math.min(v.scale * 1.2, 5) }))}
                className="p-2 hover:bg-bg rounded-lg text-text-dim hover:text-text-main transition-colors"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-px bg-border-dim my-1 opacity-50" />
              <button 
                onClick={() => setViewState(v => ({ ...v, scale: Math.max(v.scale / 1.2, 0.1) }))}
                className="p-2 hover:bg-bg rounded-lg text-text-dim hover:text-text-main transition-colors"
                title="Zoom Out"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
              <div className="w-px bg-border-dim my-1 opacity-50" />
              <button 
                onClick={() => setViewState({ scale: 1, x: 0, y: 0 })}
                className="p-2 hover:bg-bg rounded-lg text-text-dim hover:text-text-main transition-colors"
                title="Reset View"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-surface/80 backdrop-blur border border-border-dim rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
              <span className="text-[9px] font-black uppercase text-text-dim tracking-widest leading-none">
                Zoom {Math.round(viewState.scale * 100)}%
              </span>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
            <motion.div 
              ref={workspaceRef} 
              animate={{ 
                scale: viewState.scale, 
                x: viewState.x, 
                y: viewState.y 
              }}
              transition={isPanning ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
              className="relative w-full h-full pointer-events-auto"
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {edges.map(edge => {
                   const source = nodes.find(n => n.id === edge.source);
                   const target = nodes.find(n => n.id === edge.target);
                   if (!source || !target) return null;
                   
                   const x1 = (source.position?.x || 0) + 128;
                   const y1 = (source.position?.y || 0) + 64;
                   const x2 = (target.position?.x || 0);
                   const y2 = (target.position?.y || 0) + 64;
                   
                   const pathD = `M${x1} ${y1} C${x1+48} ${y1}, ${x2-48} ${y2}, ${x2} ${y2}`;
                   
                   return (
                     <g key={edge.id}>
                        <path 
                          d={pathD} 
                          stroke="rgba(0, 242, 255, 0.2)" 
                          strokeWidth="8" 
                          fill="none" 
                          className="blur-md"
                        />
                        <path 
                          d={pathD} 
                          stroke="#00f2ff" 
                          strokeWidth="2" 
                          fill="none" 
                          strokeDasharray="5,5" 
                          className="opacity-50" 
                        />
                        <motion.circle
                          r="3"
                          fill="#00f2ff"
                          initial={{ offsetDistance: "0%" }}
                          animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          style={{ offsetPath: `path("${pathD}")` }}
                        />
                     </g>
                   );
                })}
                {draggingEdge && (
                  <path 
                    d={`M${draggingEdge.startPos.x} ${draggingEdge.startPos.y} C${draggingEdge.startPos.x+48} ${draggingEdge.startPos.y}, ${draggingEdge.currentPos.x-48} ${draggingEdge.currentPos.y}, ${draggingEdge.currentPos.x} ${draggingEdge.currentPos.y}`} 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="5,5" 
                  />
                )}
              </svg>
              {nodes.map(node => (
                <motion.div 
                  drag
                  dragMomentum={false}
                  onDrag={(e, info) => {
                    // Update state on drag for real-time edge updates
                    const newNodes = nodes.map(n => n.id === node.id ? {
                      ...n,
                      position: {
                        x: (node.position?.x || 0) + info.delta.x / viewState.scale,
                        y: (node.position?.y || 0) + info.delta.y / viewState.scale
                      }
                    } : n);
                    setNodes(newNodes);
                  }}
                  key={node.id} 
                  style={{ 
                    x: node.position?.x || 0, 
                    y: node.position?.y || 0,
                    position: 'absolute'
                  }}
                  onClick={() => setSelectedNodeId(node.id)} 
                  className={cn(
                    "w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group z-10", 
                    selectedNodeId === node.id 
                      ? (node.type === 'connector' ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]" : "bg-accent-blue/10 border-accent-blue shadow-[0_0_30px_rgba(0,242,255,0.3)]")
                      : "bg-surface border-border-dim hover:border-text-dim shadow-xl",
                    node.type === 'connector' && "rounded-[2.5rem]"
                  )}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-bg border border-border-dim rounded text-[7px] font-black uppercase text-text-dim group-hover:text-accent-blue transition-colors">
                    {node.type}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNodes(nodes.filter(n => n.id !== node.id));
                      setEdges(edges.filter(edge => edge.source !== node.id && edge.target !== node.id));
                      if (selectedNodeId === node.id) setSelectedNodeId(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface border border-border-dim flex items-center justify-center text-text-dim hover:text-red-500 hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div 
                    onMouseUp={(e) => { e.stopPropagation(); finishDrag(node.id); }}
                    className={cn(
                      "absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-bg bg-border-dim group-hover:bg-accent-blue transition-all z-10",
                      node.type === 'connector' ? "hover:scale-125" : "hover:scale-125"
                    )}
                  />
                  
                  <div 
                    onMouseDown={(e) => startDrag(node.id, e)}
                    className={cn(
                      "absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-bg bg-border-dim group-hover:bg-accent-gold transition-all z-10",
                      node.type === 'connector' ? "hover:scale-125" : "hover:scale-125"
                    )}
                  />

                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-bg border border-border-dim flex items-center justify-center group-hover:scale-110 transition-transform",
                    node.type === 'connector' ? "text-cyan-400" : "text-accent-blue"
                  )}>{getNodeIcon(node.type, "w-6 h-6", node.label)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-center px-2 text-text-main">{node.label}</div>
                  
                  <div className={cn(
                    "absolute bottom-2 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-transparent transition-all overflow-hidden",
                    node.status === 'active' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                    node.status === 'error' ? 'bg-red-500/5 border-red-500/20 animate-pulse' : 
                    'bg-text-dim/5 border-border-dim/20'
                  )}>
                    {node.status === 'active' && (
                      <motion.div 
                        initial={{ left: '-100%' }}
                        animate={{ left: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent pointer-events-none"
                      />
                    )}
                    <div className={cn(
                      "w-1 h-1 rounded-full relative z-10", 
                      node.status === 'active' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 
                      node.status === 'error' ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 
                      'bg-text-dim'
                    )} />
                    <span className={cn(
                      "text-[6px] font-black uppercase tracking-widest relative z-10",
                      node.status === 'active' ? 'text-emerald-500/80' : 
                      node.status === 'error' ? 'text-red-500/80' : 
                      'text-text-dim/60'
                    )}>
                      {node.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right Sidebar: Properties Panel */}
        <AnimatePresence>
          {selectedNodeId && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-96 border-l border-border-dim bg-surface/80 backdrop-blur-md flex flex-col shrink-0 z-30"
            >
              <div className="p-6 border-b border-border-dim flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Settings className="w-4 h-4 text-accent-gold" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Node_Properties</h3>
                </div>
                <button 
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1.5 hover:bg-bg rounded-lg text-text-dim transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                 {/* Header Section */}
                 <div className="bg-bg border border-border-dim p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-surface border border-border-dim flex items-center justify-center text-accent-blue">
                          {getNodeIcon(nodes.find(n => n.id === selectedNodeId)?.type || "", "w-6 h-6", nodes.find(n => n.id === selectedNodeId)?.label)}
                       </div>
                       <div>
                          <div className="text-[8px] font-black uppercase text-accent-blue mb-1">Module_Identity</div>
                          <div className="text-sm font-black uppercase text-text-main tracking-tight">
                            {nodes.find(n => n.id === selectedNodeId)?.label}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <span className="px-2 py-0.5 rounded bg-surface border border-border-dim text-[8px] font-black uppercase text-text-dim">UID: {selectedNodeId}</span>
                       <span className="px-2 py-0.5 rounded bg-surface border border-border-dim text-[8px] font-black uppercase text-text-dim">TYPE: {nodes.find(n => n.id === selectedNodeId)?.type}</span>
                    </div>
                 </div>

                 {/* Configuration Form */}
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase text-text-dim flex items-center gap-2">
                          <Edit className="w-3 h-3" /> Module_Label
                       </label>
                       <input 
                         value={nodes.find(n => n.id === selectedNodeId)?.label || ""} 
                         onChange={e => setNodes(nodes.map(n => n.id === selectedNodeId ? {...n, label: e.target.value} : n))} 
                         className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs outline-none focus:border-accent-blue transition-colors font-black uppercase tracking-tighter" 
                       />
                    </div>

                    <div className="space-y-3">
                       <p className="text-[9px] font-black uppercase text-text-dim flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Operational_Status
                       </p>
                       <div className="grid grid-cols-3 gap-2">
                         {["active", "inactive", "error"].map(s => (
                            <button 
                              key={s} 
                              onClick={() => setNodes(nodes.map(n => n.id === selectedNodeId ? {...n, status: s as any} : n))} 
                              className={cn(
                                "py-3 text-[9px] font-black uppercase border rounded-xl transition-all", 
                                nodes.find(n => n.id === selectedNodeId)?.status === s 
                                  ? 'bg-accent-blue/10 border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                                  : 'bg-bg border-border-dim text-text-dim hover:border-text-dim'
                              )}
                            >
                              {s}
                            </button>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <label className="text-[9px] font-black uppercase text-text-dim flex items-center gap-2">
                            <Terminal className="w-3 h-3" /> Neural_Logic_Snippet
                         </label>
                         <select 
                            value={nodes.find(n => n.id === selectedNodeId)?.language || "javascript"}
                            onChange={e => setNodes(nodes.map(n => n.id === selectedNodeId ? {...n, language: e.target.value as any} : n))}
                            className="bg-bg border border-border-dim rounded px-2 py-0.5 text-[8px] font-black uppercase text-text-dim outline-none focus:border-accent-blue"
                         >
                            <option value="javascript">JS_LOGIC</option>
                            <option value="json">JSON_CONF</option>
                         </select>
                       </div>
                       
                       <div className="w-full bg-bg border border-border-dim rounded-2xl overflow-hidden focus-within:border-accent-blue transition-colors group/editor relative">
                         <div className="absolute top-2 right-2 z-10 flex gap-2">
                           <button 
                             onClick={() => {
                               const node = nodes.find(n => n.id === selectedNodeId);
                               if (!node) return;
                               const presets: Record<string, string> = {
                                 javascript: `// Sovereign Neural Logic\nexport async function execute(data) {\n  console.log('Processing node:', data.id);\n  return { ...data, status: 'ZENITH_ACHIEVED' };\n}`,
                                 json: `{\n  "config_version": "1.0",\n  "optimization_parameters": {\n    "mesh_sync": true,\n    "latency_cap": 50\n  }\n}`
                               };
                               setNodes(nodes.map(n => n.id === selectedNodeId ? {...n, content: presets[n.language || 'javascript']} : n));
                             }}
                             className="px-2 py-1 bg-surface border border-border-dim rounded text-[7px] font-black uppercase text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all"
                           >
                             Insert Preset
                           </button>
                         </div>

                         <Editor
                           value={nodes.find(n => n.id === selectedNodeId)?.content || ""}
                           onValueChange={code => setNodes(nodes.map(n => n.id === selectedNodeId ? {...n, content: code} : n))}
                           highlight={code => {
                             const lang = nodes.find(n => n.id === selectedNodeId)?.language || "javascript";
                             return Prism.highlight(code, Prism.languages[lang === 'json' ? 'json' : 'javascript'], lang);
                           }}
                           padding={16}
                           className="font-mono text-[10px] min-h-[200px] outline-none leading-relaxed"
                           style={{
                             fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                           }}
                           textareaClassName="outline-none"
                         />
                       </div>
                       <div className="flex items-center gap-2 text-[8px] text-text-dim uppercase tracking-tighter bg-bg/50 p-3 rounded-lg border border-dashed border-border-dim">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>Define high-frequency synchronization protocols across the distributed mesh.</span>
                       </div>
                    </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="pt-8 border-t border-border-dim">
                    <button 
                      onClick={() => {
                        const original = nodes.find(n => n.id === selectedNodeId);
                        if (original) {
                          const newNode = { ...original, id: `n-${Date.now()}` };
                          setNodes([...nodes, newNode]);
                          setSelectedNodeId(newNode.id);
                        }
                      }}
                      className="w-full py-4 border border-border-dim rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase text-text-dim hover:text-accent-blue hover:bg-accent-blue/5 transition-all"
                    >
                       <Copy className="w-4 h-4" /> Clone_Module
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
