import { motion, AnimatePresence } from "motion/react";
import React, { useState, useMemo } from "react";
import { 
  Zap, 
  Cpu, 
  Workflow, 
  Mail, 
  MessageSquare, 
  Clock, 
  Bell, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Activity,
  Layers,
  Webhook,
  Filter,
  Users,
  Target,
  ArrowRight,
  Database,
  Globe,
  Calendar,
  Send,
  Share2,
  Repeat,
  Edit,
  Save,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../lib/utils";

const WORKFLOW_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Sequence', type: 'Email', triggers: 'New Lead', icon: Mail, color: 'text-accent-blue' },
  { id: 'recovery', name: 'Cart Recovery', type: 'SMS', triggers: 'Incomplete Checkout', icon: MessageSquare, color: 'text-accent-gold' },
  { id: 'nurture', name: 'Niche Nurture', type: 'Multi', triggers: 'Specific Tag', icon: Workflow, color: 'text-purple-500' },
  { id: 'sales', name: 'Sales Pipeline', type: 'CRM', triggers: 'High Intent Alert', icon: Target, color: 'text-emerald-500' },
];

const CONTENT_TEMPLATES = [
  { 
    id: 'sovereign-01', 
    name: 'Neural_Pitch_v4.2', 
    subject: 'Your digital sovereignty is a calculation',
    body: 'Your digital sovereignty is not a dream, it is a calculation. Deploy your first AutoIncome Engine™ node today and harvest value from the global nexus 24/7.'
  },
  { 
    id: 'sovereign-02', 
    name: 'Wealth_Synthesis_Protocol', 
    subject: 'Automated Revenue Generation Active',
    body: 'The Freedom Wheels™ Ecosystem has detected a high-probability yield window. Activate your Sovereign Core to begin wealth synthesis immediately.'
  },
  { 
    id: 'sovereign-03', 
    name: 'Engine_Reboot_Sequence', 
    subject: 'Resume Your Passive Income Stream',
    body: 'System diagnostics indicate your AutoIncome Engine™ is idle. A simple reboot will reconnect you to the revenue mesh. Don\'t leave value on the table.'
  }
];

const OUTBOUND_PIPELINES = [
  {
    id: 'outbound-email',
    name: 'Sovereign_Email_Outreach',
    type: 'Email',
    icon: Mail,
    color: 'text-accent-blue',
    trigger: 'Lead_Scoring_Threshold > 80',
    schedule: 'Staggered_Batch (T+2h, T+24h, T+72h)',
    nextCycle: '2026-05-04 14:00Z',
    template: 'Neural_Pitch_v4.2',
    description: 'High-fidelity automated outreach for top-tier prospects.'
  },
  {
    id: 'outbound-sms',
    name: 'Flash_SMS_Blitz',
    type: 'SMS',
    icon: MessageSquare,
    color: 'text-accent-gold',
    trigger: 'Critical_Engine_Alert',
    schedule: 'Instant_Transmission',
    template: 'Short_Code_Recovery',
    description: 'Ultra-low latency mobile notifications for system-critical events.'
  },
  {
    id: 'outbound-social',
    name: 'Multi-Channel_Social_Feed',
    type: 'Social',
    icon: Globe,
    color: 'text-purple-500',
    trigger: 'Content_Engine_Asset_Finalized',
    schedule: 'AI_Optimal_Window_Detection',
    template: 'Social_Amplification_Pack',
    description: 'Automated social media distribution across the neural mesh.'
  }
];

// --- Workflow Builder Component ---

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  label: string;
  sublabel: string;
  x: number;
  y: number;
  icon: any;
  config: any;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

function NodeConfigPanel({ node, onUpdate, onClose }: { node: WorkflowNode, onUpdate: (id: string, config: any) => void, onClose: () => void }) {
  const [config, setConfig] = useState(node.config || {});

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(node.id, newConfig);
  };

  return (
    <aside className="w-96 border-l border-border-dim bg-surface/50 backdrop-blur-md p-8 flex flex-col gap-8 z-30 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-1">Config_Matrix</div>
          <h2 className="text-xl font-black uppercase tracking-tight text-text-main">{node.label}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-bg rounded-lg transition-all text-text-dim hover:text-text-main"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {node.type === 'trigger' && (
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Select_Trigger_Protocol</div>
            <select 
              value={config.trigger || ''} 
              onChange={(e) => handleChange('trigger', e.target.value)}
              className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-gold outline-none appearance-none"
            >
              <option value="">Select Protocol...</option>
              <option value="new_lead">NEW_LEAD_ACQUIRED</option>
              <option value="payment">PAYMENT_CONFIRMED</option>
              <option value="form_submit">DATA_PACK_SUBMITTED</option>
              <option value="engine_optimization">ENGINE_CALIBRATED</option>
            </select>
          </div>
        )}

        {(node.label.includes('Email') || node.label.includes('SMS')) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Transmission_Subject</div>
              <input 
                type="text" 
                value={config.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Protocol Alpha..."
                className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-blue outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Payload_Content</div>
              <textarea 
                value={config.body || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Executing neural sequence..."
                className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-blue outline-none h-40 resize-none"
              />
            </div>
          </div>
        )}

        {node.type === 'delay' && (
          <div className="space-y-4">
             <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Temporal_Wait_Value</div>
             <div className="flex gap-2">
                <input 
                  type="number" 
                  value={config.delayValue || ''}
                  onChange={(e) => handleChange('delayValue', e.target.value)}
                  className="flex-1 bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-gold outline-none"
                />
                <select 
                  value={config.delayUnit || 'm'}
                  onChange={(e) => handleChange('delayUnit', e.target.value)}
                  className="w-24 bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-gold outline-none"
                >
                  <option value="m">MIN</option>
                  <option value="h">HR</option>
                  <option value="d">DAY</option>
                </select>
             </div>
          </div>
        )}

        {node.type === 'condition' && (
          <div className="space-y-4">
             <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Logical_Filter_Protocol</div>
             <div className="space-y-2">
                <select 
                  value={config.field || ''}
                  onChange={(e) => handleChange('field', e.target.value)}
                  className="w-full bg-bg border border-border-dim rounded-xl p-3 text-[10px] uppercase font-bold text-text-main"
                >
                  <option value="">Field_Selector</option>
                  <option value="score">LEAD_SCORE</option>
                  <option value="source">SOURCE_ORIGIN</option>
                  <option value="value">LIFETIME_VALUE</option>
                </select>
                <div className="flex gap-2">
                  <select 
                    value={config.op || ''}
                    onChange={(e) => handleChange('op', e.target.value)}
                    className="flex-1 bg-bg border border-border-dim rounded-xl p-3 text-[10px] uppercase font-bold text-text-main"
                  >
                    <option value="gt">GT {'>'}</option>
                    <option value="lt">LT {'<'}</option>
                    <option value="eq">EQ {'='}</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Val..."
                    value={config.targetValue || ''}
                    onChange={(e) => handleChange('targetValue', e.target.value)}
                    className="w-24 bg-bg border border-border-dim rounded-xl p-3 text-[10px] text-text-main outline-none"
                  />
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
           <div className="flex items-center gap-2 text-accent-blue text-[8px] font-black uppercase tracking-widest mb-1">
             <Activity className="w-3 h-3" /> System_Note
           </div>
           <p className="text-[10px] text-text-dim leading-relaxed">
             This node configuration will be pushed to the neural mesh upon total sequence deployment.
           </p>
        </div>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
        >
          Commit_Configuration
        </button>
      </div>
    </aside>
  );
}

function WorkflowBuilder({ onExit, nodes, setNodes, edges, setEdges }: { 
  onExit: () => void, 
  nodes: WorkflowNode[], 
  setNodes: (n: any) => void, 
  edges: WorkflowEdge[], 
  setEdges: (e: any) => void 
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeConnection, setActiveConnection] = useState<{ sourceId: string, x: number, y: number } | null>(null);
  const lastMousePos = React.useRef({ x: 0, y: 0 });
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const NODE_TYPES = [
    { type: 'trigger', label: 'Trigger', sublabel: 'System Event', icon: Zap, color: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/50' },
    { type: 'action', label: 'Email Outreach', sublabel: 'Neural Mailer', icon: Mail, color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/50' },
    { type: 'action', label: 'SMS Alert', sublabel: 'Mobile Sync', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
    { type: 'delay', label: 'Temporal Wait', sublabel: 'Time Delay', icon: Clock, color: 'text-text-dim', bg: 'bg-surface', border: 'border-border-dim' },
    { type: 'condition', label: 'Logic Gate', sublabel: 'Smart Branch', icon: Filter, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (draggingNode) {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - dragOffset.x) / viewState.scale;
        const y = (e.clientY - rect.top - dragOffset.y) / viewState.scale;
        setNodes(nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n));
      }
    } else if (activeConnection) {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / viewState.scale;
        const y = (e.clientY - rect.top) / viewState.scale;
        setActiveConnection({ ...activeConnection, x, y });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    setDraggingNode(null);

    if (activeConnection) {
      // Find node under mouse
      const targetNode = nodes.find(node => {
        const xInRange = activeConnection.x >= node.x && activeConnection.x <= node.x + 200;
        const yInRange = activeConnection.y >= node.y && activeConnection.y <= node.y + 110;
        return xInRange && yInRange && node.id !== activeConnection.sourceId;
      });

      if (targetNode) {
        connectNodes(activeConnection.sourceId, targetNode.id);
      }
      setActiveConnection(null);
    }
  };

  const addNode = (type: any) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type.type,
      label: type.label,
      sublabel: type.sublabel,
      icon: type.icon,
      x: 100 - viewState.x / viewState.scale,
      y: 100 - viewState.y / viewState.scale,
      config: {}
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    if (edges.some(e => e.source === sourceId && e.target === targetId)) return;
    setEdges([...edges, { id: `edge-${Date.now()}`, source: sourceId, target: targetId }]);
  };

  const updateNodeConfig = (id: string, config: any) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, config } : n));
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar: Node Repository */}
      <aside className="w-80 border-r border-border-dim bg-surface/50 backdrop-blur-md p-6 flex flex-col gap-8 z-30">
        <div>
          <div className="text-[10px] font-black uppercase text-accent-gold tracking-widest mb-4">Neural_Components</div>
          <div className="space-y-3">
            {NODE_TYPES.map((node, i) => (
              <div 
                key={i}
                onClick={() => addNode(node)}
                className="p-4 bg-bg border border-border-dim rounded-xl hover:border-accent-blue transition-all cursor-grab active:cursor-grabbing group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${node.bg} border ${node.border} flex items-center justify-center transition-all group-hover:scale-110`}>
                    <node.icon className={`w-5 h-5 ${node.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight text-text-main">{node.label}</div>
                    <div className="text-[10px] text-text-dim uppercase tracking-widest">{node.sublabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border-dim">
           <button 
            onClick={onExit}
            className="w-full py-4 bg-bg border border-border-dim rounded-xl text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-accent-gold hover:border-accent-gold transition-all flex items-center justify-center gap-2"
           >
             <ChevronRight className="w-4 h-4 rotate-180" />
             Exit_Builder
           </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-crosshair bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Connection Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0,242,255,0.3)" />
            </marker>
          </defs>
          <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
            {edges.map(edge => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const x1 = source.x + 100; // Half node width
              const y1 = source.y + 110; // Bottom handle
              const x2 = target.x + 100; // Half node width
              const y2 = target.y - 10;  // Top handle
              
              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`}
                  stroke="rgba(0,242,255,0.3)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                />
              );
            })}
            
            {activeConnection && (() => {
              const source = nodes.find(n => n.id === activeConnection.sourceId);
              if (!source) return null;
              const x1 = source.x + 100;
              const y1 = source.y + 110;
              const x2 = activeConnection.x;
              const y2 = activeConnection.y;
              
              return (
                <path
                  d={`M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`}
                  stroke="rgba(0,242,255,0.6)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  className="animate-pulse shadow-[0_0_15px_rgba(0,242,255,0.8)]"
                />
              );
            })()}
          </g>
        </svg>

        {/* Nodes Layer */}
        <div 
          ref={workspaceRef}
          className="w-full h-full origin-top-left"
          style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})` }}
        >
          {nodes.map(node => {
            const nodeType = NODE_TYPES.find(t => t.type === node.type) || NODE_TYPES[0];
            return (
              <motion.div
                key={node.id}
                initial={false}
                style={{ 
                  left: node.x, 
                  top: node.y,
                  width: 200,
                }}
                className={`absolute group cursor-pointer z-10 transition-shadow ${selectedNodeId === node.id ? 'z-20' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
              >
                {/* Node Controls (Delete) */}
                <AnimatePresence>
                  {selectedNodeId === node.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface border border-border-dim rounded-lg p-1"
                    >
                      <button 
                        onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}
                        className="p-1.5 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 hover:text-accent-blue transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Node Body */}
                <div 
                  className={`relative p-5 bg-bg/80 backdrop-blur-md border rounded-2xl transition-all duration-300 ${
                    selectedNodeId === node.id 
                    ? 'border-accent-blue shadow-[0_0_30px_rgba(0,242,255,0.2)]' 
                    : 'border-border-dim hover:border-accent-blue/50 shadow-xl'
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNode(node.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${nodeType.bg} border ${nodeType.border} flex items-center justify-center`}>
                      <nodeType.icon className={`w-4 h-4 ${nodeType.color}`} />
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] font-black uppercase tracking-tight text-text-main leading-tight">{node.label}</div>
                      <div className="text-[8px] text-text-dim uppercase tracking-widest leading-tight">{node.sublabel}</div>
                    </div>
                  </div>

                  {/* Handles */}
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bg border border-accent-blue/50 flex items-center justify-center hover:bg-accent-blue group/h cursor-pointer transition-all active:scale-125"
                    onClick={() => {}} // Handle connection landing
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue group-hover/h:bg-bg" />
                  </div>

                  {node.type === 'condition' ? (
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-around px-4">
                      {['TRUE', 'FALSE'].map((port) => (
                        <div 
                          key={port}
                          className="relative group/p flex flex-col items-center"
                        >
                          <div 
                            className={`w-4 h-4 rounded-full bg-bg border flex items-center justify-center cursor-pointer transition-all active:scale-125 z-10 ${
                              port === 'TRUE' ? 'border-emerald-500/50 hover:bg-emerald-500' : 'border-red-500/50 hover:bg-red-500'
                            }`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const parentRect = workspaceRef.current!.getBoundingClientRect();
                              setActiveConnection({
                                sourceId: node.id,
                                x: (rect.left + rect.width / 2 - parentRect.left) / viewState.scale,
                                y: (rect.top + rect.height / 2 - parentRect.top) / viewState.scale
                              });
                            }}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${port === 'TRUE' ? 'bg-emerald-500 group-hover/p:bg-bg' : 'bg-red-500 group-hover/p:bg-bg'}`} />
                          </div>
                          <span className={`absolute -bottom-4 text-[6px] font-black tracking-widest ${port === 'TRUE' ? 'text-emerald-500' : 'text-red-500'}`}>{port}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bg border border-accent-blue/50 flex items-center justify-center hover:bg-accent-blue group/h cursor-pointer transition-all active:scale-125"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentRect = workspaceRef.current!.getBoundingClientRect();
                        setActiveConnection({
                          sourceId: node.id,
                          x: (rect.left + rect.width / 2 - parentRect.left) / viewState.scale,
                          y: (rect.top + rect.height / 2 - parentRect.top) / viewState.scale
                        });
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue group-hover/h:bg-bg" />
                    </div>
                  )}
                </div>

                {/* Connection helper buttons */}
                <AnimatePresence>
                   {selectedNodeId === node.id && (
                     <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-4 flex flex-col gap-2"
                     >
                       {[Plus, ArrowRight].map((Icon, i) => (
                         <button 
                          key={i}
                          className="w-8 h-8 rounded-full bg-surface border border-border-dim flex items-center justify-center text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all shadow-lg"
                          onClick={() => {
                            // Quick connect functionality
                            const target = nodes.find(n => n.id !== node.id && !edges.some(e => e.source === node.id && e.target === n.id));
                            if (target) connectNodes(node.id, target.id);
                          }}
                         >
                           <Icon className="w-4 h-4" />
                         </button>
                       ))}
                     </motion.div>
                   )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-30">
          <div className="flex bg-surface/80 backdrop-blur-xl border border-border-dim rounded-2xl p-1 shadow-2xl">
            <button 
              onClick={() => setViewState(v => ({ ...v, scale: Math.min(v.scale + 0.1, 2) }))}
              className="p-3 text-text-dim hover:text-accent-blue transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="w-px bg-border-dim self-stretch lg:my-2" />
            <button 
              onClick={() => setViewState(v => ({ ...v, scale: Math.max(v.scale - 0.1, 0.5) }))}
              className="p-3 text-text-dim hover:text-accent-blue transition-all"
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            <div className="w-px bg-border-dim self-stretch lg:my-2" />
            <button 
              onClick={() => setViewState({ scale: 1, x: 0, y: 0 })}
              className="p-3 text-text-dim hover:text-accent-blue transition-all font-mono text-[10px] font-bold"
            >
              100%
            </button>
          </div>

          <button 
            className="px-8 py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:shadow-[0_0_50px_rgba(0,242,255,0.5)] transition-all transform hover:-translate-y-1 active:translate-y-0"
            onClick={() => {
              // Deploy logic
              onExit();
            }}
          >
            Deploy_Sequence
          </button>
        </div>

        {/* Workspace HUD */}
        <div className="absolute top-10 left-10 pointer-events-none">
          <div className="text-[10px] font-mono text-accent-blue border-l-2 border-accent-blue pl-4 mb-2 opacity-50 uppercase tracking-[0.3em]">
            System_Status: Stable
          </div>
          <div className="text-2xl font-black uppercase tracking-tighter text-text-main">
            Neural_Builder_v3
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex shrink-0 h-full border-l border-border-dim z-40 bg-bg"
          >
            <NodeConfigPanel 
              node={selectedNode} 
              onUpdate={updateNodeConfig}
              onClose={() => setSelectedNodeId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AutomationHub() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [isBuilding, setIsBuilding] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    trigger: "new_lead",
    templateId: ""
  });
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [configuringPipeline, setConfiguringPipeline] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"one-time" | "recurring">("one-time");
  const [recurrenceInterval, setRecurrenceInterval] = useState("Daily");
  
  // Trigger intelligence state
  const [triggerEvent, setTriggerEvent] = useState("LEAD_SCORE");
  const [triggerOperator, setTriggerOperator] = useState(">");
  const [triggerValue, setTriggerValue] = useState("80");

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState(CONTENT_TEMPLATES[0].id);
  const [templateSubject, setTemplateSubject] = useState(CONTENT_TEMPLATES[0].subject);
  const [templateBody, setTemplateBody] = useState(CONTENT_TEMPLATES[0].body);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  // Social/SMS Specific State
  const [socialPlatform, setSocialPlatform] = useState("Twitter/X");
  const [smsLink, setSmsLink] = useState("https://freedomwheels.ai/engine-active");

  // Webhook State
  const [webhooks, setWebhooks] = useState([
    { id: 'wh_st_01', name: 'Stripe: Payment_Success', engineId: 'revenue_matrix', active: true, secret: 'sk_sov_88291', lastTriggered: '2026-05-03 14:15' },
    { id: 'wh_tf_01', name: 'Typeform: Lead_Submitted', engineId: 'niche_analyzer', active: true, secret: 'sk_sov_11029', lastTriggered: '2026-05-03 12:42' },
  ]);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);

  const handleCreateWebhook = () => {
    if (!newWebhookName) return;
    const newWh = {
      id: `wh_${Math.random().toString(36).substr(2, 6)}`,
      name: newWebhookName,
      engineId: 'default',
      active: true,
      secret: `sk_sov_${Math.random().toString(36).substr(2, 5)}`,
      lastTriggered: 'Never'
    };
    setWebhooks([...webhooks, newWh]);
    setNewWebhookName("");
    setIsAddingWebhook(false);
  };

  const handleTemplateChange = (id: string) => {
    const template = CONTENT_TEMPLATES.find(t => t.id === id);
    if (template) {
      setSelectedTemplateId(id);
      setTemplateSubject(template.subject);
      setTemplateBody(template.body);
    }
  };

  const selectedPipeline = OUTBOUND_PIPELINES.find(p => p.id === configuringPipeline);

  if (isBuilding) {
    return (
      <div className="h-screen bg-bg overflow-hidden flex flex-col relative w-full fixed inset-0 z-[100]">
        <WorkflowBuilder
          onExit={() => setIsBuilding(false)}
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-accent-gold text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2">
            <Workflow className="w-3 h-3" />
            Module: Automation_Hub_v2.0
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Automation <span className="text-accent-gold glow-gold">Hub</span></h1>
          <p className="text-text-dim mt-2 text-sm max-w-xl">
            Design and deploy intelligent automation pipelines. Connect your AutoIncome Engines™ to high-conversion nurturing sequences that scale your revenue silently.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setShowCreateWizard(true);
              setWizardStep(1);
            }}
            className="px-6 py-3 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreateWizard && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateWizard(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-surface border border-border-dim rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-dim">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-text-main">Workflow_Initialization</h2>
                    <div className="flex items-center gap-2 ml-4">
                      {[1, 2, 3].map(step => (
                        <React.Fragment key={step}>
                          <div 
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-black transition-all",
                              wizardStep === step 
                                ? "border-accent-gold bg-accent-gold text-bg shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
                                : wizardStep > step 
                                  ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold" 
                                  : "border-border-dim bg-bg text-text-dim"
                            )}
                          >
                            {wizardStep > step ? "✓" : step}
                          </div>
                          {step < 3 && (
                            <div className={cn(
                              "w-4 h-[1px]",
                              wizardStep > step ? "bg-accent-gold" : "bg-border-dim"
                            )} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">
                    Step {wizardStep}_of_3: {
                      wizardStep === 1 ? 'Protocol_Selection' : 
                      wizardStep === 2 ? 'Identity_Binding' : 
                      'Neural_Architecture'
                    }
                  </p>
                </div>
                <button onClick={() => setShowCreateWizard(false)} className="p-2 hover:bg-bg rounded-lg transition-all text-text-dim hover:text-text-main">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="min-h-[400px] flex flex-col">
                {wizardStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {WORKFLOW_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setNewWorkflow({ ...newWorkflow, templateId: template.id });
                          setWizardStep(2);
                        }}
                        className="p-6 bg-bg border border-border-dim rounded-2xl hover:border-accent-gold transition-all text-left group relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 w-20 h-20 bg-accent-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent-gold/10 transition-all" />
                         <div className={`w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border-dim group-hover:border-accent-gold transition-all mb-4`}>
                            <template.icon className={`w-5 h-5 ${template.color}`} />
                         </div>
                         <div className="text-xs font-black uppercase tracking-tight mb-1 group-hover:text-accent-gold">{template.name}</div>
                         <div className="text-[10px] text-text-dim uppercase tracking-widest">{template.type} Protocol</div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setNewWorkflow({ ...newWorkflow, templateId: 'custom' });
                        setWizardStep(2);
                      }}
                      className="p-6 bg-bg border border-border-dim border-dashed rounded-2xl hover:border-accent-gold transition-all text-left group flex flex-col items-center justify-center gap-2"
                    >
                       <Plus className="w-6 h-6 text-text-dim group-hover:text-accent-gold transition-all" />
                       <div className="text-[10px] font-black uppercase tracking-widest text-text-dim group-hover:text-accent-gold">Start_From_Scratch</div>
                    </button>
                  </motion.div>
                )}

                {wizardStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 flex-1"
                  >
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Workflow_Identity</label>
                       <input 
                         type="text" 
                         value={newWorkflow.name}
                         onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})}
                         placeholder="Protocol_X-Alpha..."
                         className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-gold outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Trigger_Protocol</label>
                       <select 
                         value={newWorkflow.trigger}
                         onChange={e => setNewWorkflow({...newWorkflow, trigger: e.target.value})}
                         className="w-full bg-bg border border-border-dim rounded-xl p-4 text-xs text-text-main focus:border-accent-gold outline-none appearance-none"
                       >
                          <option value="new_lead">NEW_LEAD_ACQUIRED</option>
                          <option value="payment">PAYMENT_CONFIRMED</option>
                          <option value="form_submit">DATA_PACK_SUBMITTED</option>
                          <option value="engine_optimization">ENGINE_CALIBRATED</option>
                       </select>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-border-dim flex items-center justify-between">
                       <button onClick={() => setWizardStep(1)} className="text-[10px] font-black uppercase text-text-dim hover:text-text-main tracking-widest">Back</button>
                       <button 
                        onClick={() => {
                          if (!newWorkflow.name) return;
                          setWizardStep(3);
                          // Initialize canvas with basic nodes based on template
                          const template = WORKFLOW_TEMPLATES.find(t => t.id === newWorkflow.templateId);
                          if (template) {
                            setNodes([
                              { id: 'trigger-0', type: 'trigger', label: template.triggers, sublabel: 'System Event', x: 250, y: 50, icon: Zap, config: { trigger: 'new_lead' } },
                              { id: 'node-1', type: 'action', label: template.name, sublabel: template.type, x: 250, y: 200, icon: template.icon, config: {} }
                            ]);
                            setEdges([{ id: 'e1', source: 'trigger-0', target: 'node-1' }]);
                          } else {
                            setNodes([{ id: 'trigger-0', type: 'trigger', label: 'Trigger', sublabel: 'System Event', x: 250, y: 100, icon: Zap, config: {} }]);
                            setEdges([]);
                          }
                          setTimeout(() => {
                            setShowCreateWizard(false);
                            setIsBuilding(true);
                          }, 500);
                        }}
                        className="px-8 py-3 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg"
                       >
                         Initialize_Editor
                       </button>
                    </div>
                  </motion.div>
                )}

                {wizardStep === 3 && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                     <div className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
                     <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold animate-pulse">Synchronizing_Neural_Canvas</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPipeline && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfiguringPipeline(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border-dim rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-bg border border-border-dim flex items-center justify-center`}>
                    <selectedPipeline.icon className={`w-6 h-6 ${selectedPipeline.color}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-1">Pipeline_Calibration</div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-text-main">{selectedPipeline.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setConfiguringPipeline(null)}
                  className="p-2 hover:bg-bg rounded-lg transition-all text-text-dim hover:text-text-main"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Trigger_Intelligence</div>
                    <div className="p-4 bg-bg border border-border-dim rounded-xl space-y-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Neural_Event</label>
                          <select 
                            value={triggerEvent}
                            onChange={(e) => setTriggerEvent(e.target.value)}
                            className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                          >
                             <option value="LEAD_SCORE">LEAD_SCORING_THRESHOLD</option>
                             <option value="LAST_INTERACTION">LAST_INTERACTION_AGE</option>
                             <option value="CONVERSION_COUNT">CONVERSION_MATRIX_COUNT</option>
                             <option value="ENGINE_HEALTH">ENGINE_HEALTH_METRIC</option>
                             <option value="LEAD_SOURCE">LEAD_SOURCE_ORIGIN</option>
                          </select>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Operator</label>
                             <select 
                               value={triggerOperator}
                               onChange={(e) => setTriggerOperator(e.target.value)}
                               className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                             >
                                <option value=">">GREATER {'>'}</option>
                                <option value="<">LESS {'<'}</option>
                                <option value="==">EQUALS ==</option>
                                <option value="!=">NOT_EQUAL !=</option>
                                <option value="IN">IN_SET</option>
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Threshold_Value</label>
                             <input 
                               type="text" 
                               value={triggerValue}
                               onChange={(e) => setTriggerValue(e.target.value)}
                               placeholder="Enter Value..."
                               className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                             />
                          </div>
                       </div>
                       
                       <p className="text-[8px] text-text-dim uppercase tracking-widest px-1">
                          Protocol: {triggerEvent} {triggerOperator} {triggerValue || '...'}
                       </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center justify-between">
                       <span>Temporal_Orchestration</span>
                       <div className="flex bg-bg p-1 rounded-lg border border-border-dim">
                          <button 
                            onClick={() => setScheduleType("one-time")}
                            className={`px-3 py-1 text-[8px] font-black uppercase rounded transition-all ${scheduleType === "one-time" ? "bg-accent-blue text-bg" : "text-text-dim hover:text-text-main"}`}
                          >
                            Single
                          </button>
                          <button 
                            onClick={() => setScheduleType("recurring")}
                            className={`px-3 py-1 text-[8px] font-black uppercase rounded transition-all ${scheduleType === "recurring" ? "bg-accent-blue text-bg" : "text-text-dim hover:text-text-main"}`}
                          >
                            Recurring
                          </button>
                       </div>
                    </div>
                                        <div className="p-4 bg-bg border border-border-dim rounded-xl space-y-4">
                       {scheduleType === "one-time" ? (
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Target_Date</label>
                                  <div className="relative">
                                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-blue" />
                                     <input type="date" className="w-full bg-surface border border-border-dim rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none" defaultValue="2026-05-15" />
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">System_Time</label>
                                  <div className="relative">
                                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-blue" />
                                     <input type="time" className="w-full bg-surface border border-border-dim rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none" defaultValue="14:00" />
                                  </div>
                               </div>
                            </div>
                            {selectedPipeline.id === 'outbound-email' && (
                              <div className="pt-2 border-t border-border-dim/50 space-y-3">
                                 <div className="text-[8px] font-black uppercase text-text-dim tracking-widest">Active_Queue_Status</div>
                                 <div className="bg-surface rounded-lg p-3 flex items-center justify-between border border-border-dim/50">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                                       <span className="text-[9px] font-mono text-text-main uppercase">Transmission_Pending</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-accent-blue">v4.2_SYDNEY</span>
                                 </div>
                              </div>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Cycle_Interval</label>
                                  <select 
                                    value={recurrenceInterval}
                                    onChange={(e) => setRecurrenceInterval(e.target.value)}
                                    className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                                  >
                                     <option>Daily</option>
                                     <option>Weekly</option>
                                     <option>Monthly</option>
                                     <option>Neural_Optimal</option>
                                  </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Exec_Window</label>
                                  <div className="relative">
                                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-gold" />
                                     <input type="time" className="w-full bg-surface border border-border-dim rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none" defaultValue="09:00" />
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-dim/50">
                               {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                 <button key={i} className={`w-7 h-7 rounded bg-surface border border-border-dim text-[8px] font-black flex items-center justify-center hover:border-accent-blue hover:text-accent-blue transition-all ${[0,2,4].includes(i) ? 'border-accent-blue text-accent-blue' : ''}`}>
                                   {day}
                                 </button>
                               ))}
                            </div>
                         </div>
                       )}
                       <p className="text-[8px] text-text-dim uppercase tracking-widest px-1">
                          {scheduleType === "one-time" ? "Protocol executes as a single burst transmission." : `Autonomously repeats on a ${recurrenceInterval.toLowerCase()} cycle.`}
                       </p>
                    </div>
                  </div>
                </div>

                {selectedPipeline.id === 'outbound-email' && (
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center justify-between">
                       <span>Staggered_Batches_Sequence</span>
                       <button className="text-accent-blue hover:text-accent-gold transition-colors">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                       {[
                         { step: 'Neural_Batch_01', delay: 'Instant', status: 'Active', desc: 'Initial Sovereignty Bridge' },
                         { step: 'Neural_Batch_02', delay: 'T + 24 Hours', status: 'In_Queue', desc: 'Trust Synthesis Sequence' },
                         { step: 'Neural_Batch_03', delay: 'T + 72 Hours', status: 'Pending', desc: 'Conversion Matrix Activation' },
                       ].map((b, idx) => (
                         <div key={idx} className="flex items-center justify-between p-4 bg-bg border border-border-dim rounded-xl hover:border-accent-blue/30 transition-all group/batch">
                           <div className="flex items-center gap-4">
                             <div className={`w-2 h-2 rounded-full ${b.status === 'Active' ? 'bg-accent-blue animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.5)]' : b.status === 'In_Queue' ? 'bg-accent-gold' : 'bg-surface border border-border-dim'}`} />
                             <div>
                               <div className="text-[10px] font-mono text-text-main flex items-center gap-2">
                                 {b.step}
                                 <span className="text-[8px] text-text-dim font-sans">{b.desc}</span>
                               </div>
                               <div className="text-[8px] font-mono text-text-dim uppercase tracking-widest mt-0.5">{b.delay}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${b.status === 'Active' ? 'bg-accent-blue/10 text-accent-blue' : b.status === 'In_Queue' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-surface text-text-dim'}`}>
                               {b.status}
                             </span>
                             <button className="opacity-0 group-hover/batch:opacity-100 transition-opacity p-1 hover:text-accent-blue">
                                <Settings className="w-3 h-3" />
                             </button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center justify-between">
                      <span>Neural_Content_Template_Designer</span>
                      <div className="flex items-center gap-2">
                         <select 
                           value={selectedTemplateId}
                           onChange={(e) => handleTemplateChange(e.target.value)}
                           className="bg-bg border border-border-dim rounded-lg px-3 py-1 text-[8px] font-mono text-text-main focus:border-accent-blue outline-none"
                         >
                            {CONTENT_TEMPLATES.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                         </select>
                         <button 
                           onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                           className="p-1 hover:text-accent-blue transition-colors"
                         >
                            {isEditingTemplate ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                         </button>
                      </div>
                    </div>
                    <div className="p-6 bg-bg border border-border-dim rounded-2xl space-y-4 group">
                       {isEditingTemplate ? (
                         <div className="space-y-4">
                            {selectedPipeline.type === 'Email' && (
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Sovereign_Subject_Line</label>
                                 <input 
                                   type="text" 
                                   value={templateSubject}
                                   onChange={(e) => setTemplateSubject(e.target.value)}
                                   className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                                 />
                              </div>
                            )}

                            {selectedPipeline.type === 'Social' && (
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Target_Network</label>
                                 <select 
                                   value={socialPlatform}
                                   onChange={(e) => setSocialPlatform(e.target.value)}
                                   className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                                 >
                                    <option>Twitter/X</option>
                                    <option>LinkedIn</option>
                                    <option>Instagram</option>
                                    <option>Facebook</option>
                                 </select>
                              </div>
                            )}

                            <div className="space-y-1">
                               <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">
                                 {selectedPipeline.type === 'SMS' ? 'Short_Code_Message' : 'Transmission_Payload_Body'}
                               </label>
                               <textarea 
                                 value={templateBody}
                                 onChange={(e) => setTemplateBody(e.target.value)}
                                 rows={selectedPipeline.type === 'SMS' ? 2 : 4}
                                 className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none resize-none"
                                 placeholder={selectedPipeline.type === 'SMS' ? 'Maximum 160 characters...' : 'Enter content...'}
                               />
                               {selectedPipeline.type === 'SMS' && (
                                 <div className="text-[7px] text-text-dim uppercase text-right">Characters: {templateBody.length}/160</div>
                               )}
                            </div>

                            {selectedPipeline.type === 'SMS' && (
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Sovereign_Redirect_Link</label>
                                 <input 
                                   type="text" 
                                   value={smsLink}
                                   onChange={(e) => setSmsLink(e.target.value)}
                                   className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] font-mono text-text-main focus:border-accent-blue outline-none"
                                 />
                              </div>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-mono text-accent-gold flex items-center gap-2">
                                 <FileText className="w-3 h-3" />
                                 {selectedPipeline.type === 'Email' ? templateSubject : `${selectedPipeline.type}_Transmission v4.2`}
                              </div>
                              {selectedPipeline.type === 'Social' && (
                                <span className="text-[8px] font-black bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded uppercase">{socialPlatform}</span>
                              )}
                            </div>
                            <div className="p-4 bg-surface rounded-xl border border-border-dim/50 italic text-text-dim text-[11px] leading-relaxed">
                              "{templateBody}"
                              {selectedPipeline.type === 'SMS' && <span className="text-accent-blue ml-1 underline">{smsLink}</span>}
                            </div>
                         </div>
                       )}
                       <div className="pt-2 border-t border-border-dim/50 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                             <span className="w-1 h-1 rounded-full bg-accent-blue" />
                             <span className="text-[7px] text-text-dim uppercase">Liquid_Merge_Tags_Enabled</span>
                          </div>
                          <div className="text-[7px] text-text-dim font-mono tracking-tighter">CHECKSUM: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</div>
                       </div>
                    </div>
                  </div>

                <div className="flex items-center gap-4 pt-4">
                   <button 
                     onClick={() => setConfiguringPipeline(null)}
                     className="flex-1 py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(0,242,255,0.3)] transition-all"
                   >
                     Update_Pipeline_Protocol
                   </button>
                   <button 
                     onClick={() => setConfiguringPipeline(null)}
                     className="px-8 py-4 bg-bg border border-border-dim text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-accent-gold hover:text-accent-gold transition-all"
                   >
                     Cancel
                   </button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-gold/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sovereign Command Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        {/* Main Overview Panel */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-full module-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/30">
            <div className="flex-1 space-y-4 z-10">
              <div>
                <div className="text-[10px] font-black uppercase text-accent-blue tracking-[0.3em] mb-2">Global_Performance_Nexus</div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Sovereign <span className="text-accent-blue glow-blue">Command</span></h2>
              </div>
              <p className="text-sm text-text-dim max-w-md">
                Aggregated intelligence from across the neural mesh. Optimized for maximum yield and high-fidelity lead conversion.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">Global_Conversion</span>
                  <span className="text-xl font-black font-mono text-emerald-500">18.42% <span className="text-[10px] text-emerald-500/50">▲ 2.4%</span></span>
                </div>
                <div className="w-px h-8 bg-border-dim" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">Neural_Efficiency</span>
                  <span className="text-xl font-black font-mono text-accent-blue">98.2% <span className="text-[10px] text-accent-blue/50">Optimal</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex shrink-0 gap-3 z-10">
              <div className="p-4 bg-surface/50 border border-border-dim rounded-2xl flex flex-col items-center justify-center w-28 h-28">
                <div className="text-2xl font-black text-text-main line-clamp-1">3.1k</div>
                <div className="text-[8px] font-black text-text-dim uppercase tracking-widest mt-1 text-center">Nodes_Active</div>
              </div>
              <div className="p-4 bg-surface/50 border border-border-dim rounded-2xl flex flex-col items-center justify-center w-28 h-28">
                <div className="text-2xl font-black text-accent-gold line-clamp-1">42.1k</div>
                <div className="text-[8px] font-black text-text-dim uppercase tracking-widest mt-1 text-center">Leads_Synced</div>
              </div>
            </div>

            {/* Decorative Neural Grid */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-20">
               <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="neural-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.5" fill="var(--blue)" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#neural-grid)" />
               </svg>
            </div>
          </div>

          <div className="module-card p-6 flex flex-col gap-4 group hover:border-accent-gold transition-all">
            <div className="flex items-center justify-between">
               <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5" />
               </div>
               <div className="text-[8px] font-black uppercase text-text-dim tracking-widest">Emails_Total</div>
            </div>
            <div>
               <div className="text-2xl font-black font-mono">1.2M</div>
               <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Velocity: High-Priority</div>
            </div>
          </div>

          <div className="module-card p-6 flex flex-col gap-4 group hover:border-purple-500 transition-all">
            <div className="flex items-center justify-between">
               <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
               </div>
               <div className="text-[8px] font-black uppercase text-text-dim tracking-widest">Social_Reach</div>
            </div>
            <div>
               <div className="text-2xl font-black font-mono">245k</div>
               <div className="text-[10px] font-bold text-accent-blue uppercase tracking-tighter mt-1">Expansion: 14 Nodes</div>
            </div>
          </div>

          <div className="module-card p-6 flex flex-col gap-4 group hover:border-accent-blue transition-all">
            <div className="flex items-center justify-between">
               <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
               </div>
               <div className="text-[8px] font-black uppercase text-text-dim tracking-widest">SMS_Transmissions</div>
            </div>
            <div>
               <div className="text-2xl font-black font-mono">84.2k</div>
               <div className="text-[10px] font-bold text-accent-gold uppercase tracking-tighter mt-1">Health: 99.9% Sync</div>
            </div>
          </div>
        </div>

        {/* Real-time Pipeline Monitor */}
        <div className="module-card p-6 border-l-2 border-emerald-500">
           <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Pipeline_Monitor</div>
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
           </div>
           <div className="space-y-4">
              {[
                { name: 'Sovereign_Email', status: 'Optimal', load: 84 },
                { name: 'Flash_SMS', status: 'Paused', load: 0 },
                { name: 'Social_Mesh', status: 'Active', load: 42 },
              ].map((p, i) => (
                <div key={i} className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-main">{p.name}</span>
                      <span className={p.status === 'Optimal' ? 'text-emerald-500' : p.status === 'Active' ? 'text-accent-blue' : 'text-text-dim'}>{p.status}</span>
                   </div>
                   <div className="h-1 bg-surface rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.load}%` }}
                        className={`h-full ${p.status === 'Optimal' ? 'bg-emerald-500' : 'bg-accent-blue'}`}
                      />
                   </div>
                </div>
              ))}
              <div className="pt-2">
                 <button className="w-full py-2 bg-surface text-[8px] font-black uppercase tracking-[0.2em] rounded-lg border border-border-dim hover:border-accent-blue transition-all">
                    Calibrate_All_Gears
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Automation Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* READY-TO-DEPLOY PROTOCOLS (TEMPLATES) */}
          <div className="module-card p-8 bg-gradient-to-br from-bg to-surface/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Workflow className="w-5 h-5 text-accent-gold" />
                Templated_Workflow_Protocols
              </h2>
              <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Matrix_v4.20</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WORKFLOW_TEMPLATES.map((template) => (
                <div 
                  key={template.id} 
                  className="p-6 bg-bg/50 border border-border-dim rounded-3xl hover:border-accent-gold/50 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
                  onClick={() => setIsBuilding(true)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent-gold/10 transition-all" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border-dim group-hover:border-accent-gold transition-all`}>
                      <template.icon className={`w-5 h-5 ${template.color}`} />
                    </div>
                    <div className="text-[9px] font-mono font-bold text-accent-gold uppercase px-2 py-0.5 rounded border border-accent-gold/20">Protocol</div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-sm font-black uppercase tracking-tight mb-1 group-hover:text-accent-gold transition-colors">{template.name}</div>
                    <div className="text-[10px] text-text-dim uppercase tracking-widest flex items-center gap-2">
                      {template.type} • {template.triggers}
                    </div>
                  </div>
                  <div className="mt-2 text-accent-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all relative z-10 translate-y-1 group-hover:translate-y-0 opacity-80 group-hover:opacity-100">
                    INITIALIZE SEQUENCE <ChevronRight className="w-3 h-3 text-accent-gold" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OUTBOUND MARKETING PIPELINES MATRIX */}
          <div className="module-card p-8 border-t-2 border-accent-blue/30">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Send className="w-5 h-5 text-accent-blue" />
                Outbound_Marketing_Pipelines_Matrix
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest">All_Systems_Sync</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {OUTBOUND_PIPELINES.map((pipeline) => (
                <div key={pipeline.id} className="p-8 bg-surface/30 border border-border-dim rounded-3xl hover:border-accent-blue/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue/20 group-hover:bg-accent-blue transition-all" />
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl bg-bg flex items-center justify-center border border-border-dim group-hover:border-accent-blue transition-all shadow-xl group-hover:scale-105`}>
                        <pipeline.icon className={`w-7 h-7 ${pipeline.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-black uppercase tracking-tight group-hover:text-accent-blue transition-colors">
                            {pipeline.name}
                          </div>
                          <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-surface border border-border-dim text-text-dim">ACTIVE</span>
                        </div>
                        <div className="text-[11px] text-text-dim leading-relaxed max-w-md line-clamp-2">
                          {pipeline.description}
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                           <div className="flex -space-x-2">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-5 h-5 rounded-full bg-surface border border-bg flex items-center justify-center">
                                   <Users className="w-2.5 h-2.5 text-accent-blue" />
                                </div>
                              ))}
                           </div>
                           <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">14.2k High-Intent Leads</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 xl:max-w-3xl pt-6 xl:pt-0 border-t xl:border-t-0 border-border-dim/50">
                      <div className="space-y-1.5">
                        <div className="text-[8px] font-black text-text-dim uppercase tracking-widest">Trigger_Vector</div>
                        <div className="text-[10px] font-mono text-text-main truncate border-b border-border-dim/30 pb-0.5" title={pipeline.trigger}>{pipeline.trigger}</div>
                        <div className="text-[8px] font-mono text-emerald-500 uppercase">Live_Sync_Active</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[8px] font-black text-text-dim uppercase tracking-widest">Temporal_Cycle</div>
                        <div className="text-[10px] font-mono text-text-main truncate border-b border-border-dim/30 pb-0.5" title={pipeline.schedule}>{pipeline.schedule}</div>
                        {pipeline.nextCycle && (
                          <div className="text-[8px] font-mono text-accent-blue mt-1 uppercase tracking-tighter animate-pulse">NEXT: {pipeline.nextCycle}</div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[8px] font-black text-text-dim uppercase tracking-widest">Active_Payload</div>
                        <div className="text-[10px] font-mono text-accent-gold border-b border-border-dim/30 pb-0.5">{pipeline.template}</div>
                        <div className="text-[8px] font-mono text-text-dim uppercase">Designer_v4.2</div>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button className="p-3 bg-surface border border-border-dim rounded-xl text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all group/btn">
                           <Activity className="w-4 h-4 group-hover/btn:scale-110" />
                        </button>
                        <button 
                          onClick={() => setConfiguringPipeline(pipeline.id)}
                          className="px-6 py-3 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all flex items-center justify-center"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="w-full mt-8 py-5 border-2 border-dashed border-border-dim rounded-3xl text-text-dim hover:border-accent-blue hover:text-accent-blue transition-all flex flex-col items-center justify-center gap-2 group"
              onClick={() => setIsBuilding(true)}
            >
               <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
               <div className="text-[10px] font-black uppercase tracking-[0.3em]">Assemble_New_Custom_Pipeline</div>
            </button>
          </div>

          <div className="module-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-blue" />
                Transmission_Scheduler_Log
              </h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-accent-blue hover:underline">
                 View_Full_Chronicle
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-dim/50">
                    <th className="text-left py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">ID</th>
                    <th className="text-left py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">Pipeline</th>
                    <th className="text-left py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">Target</th>
                    <th className="text-left py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">Schedule_Time</th>
                    <th className="text-left py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">Status</th>
                    <th className="text-right py-3 px-4 text-[8px] font-black text-text-dim uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim/30">
                  {[
                    { id: 'TX-8921', pipeline: 'Sovereign_Email', target: 'Tier_1_Segments', schedule: '2026-05-03 14:00', status: 'Pending' },
                    { id: 'TX-8922', pipeline: 'Flash_SMS', target: 'Alert_Group_A', schedule: '2026-05-03 14:05', status: 'Completed' },
                    { id: 'TX-8923', pipeline: 'Social_Feed', target: 'Neural_Mesh_v2', schedule: '2026-05-04 09:00', status: 'In_Queue' },
                    { id: 'TX-8924', pipeline: 'Sovereign_Email', target: 'Niche_Nurture_B', schedule: '2026-05-04 11:30', status: 'Pending' },
                  ].map((tx, idx) => (
                    <tr key={idx} className="group hover:bg-surface/20 transition-colors">
                      <td className="py-4 px-4 text-[10px] font-mono text-accent-blue">{tx.id}</td>
                      <td className="py-4 px-4 text-[10px] font-mono text-text-main">{tx.pipeline}</td>
                      <td className="py-4 px-4 text-[10px] font-mono text-text-dim">{tx.target}</td>
                      <td className="py-4 px-4 text-[10px] font-mono text-text-dim">{tx.schedule}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          tx.status === 'Pending' ? 'bg-accent-gold/10 text-accent-gold' :
                          'bg-accent-blue/10 text-accent-blue'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-[10px] text-text-dim hover:text-accent-blue transition-colors">
                           <Settings className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="module-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-blue" />
                Sovereign_Active_Automations
              </h2>
              <div className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Neural_Sync: High</div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Cold Outreach -> VSL Opt-in', status: 'Running', events: '1.2k today', conversions: '14.2%' },
                { name: 'Webinar Follow-up Sequence', status: 'Running', events: '458 today', conversions: '8.4%' },
                { name: 'Sovereign Core Onboarding', status: 'Paused', events: '0 today', conversions: '--' },
                { name: 'Exit Intent Discount Flow', status: 'Running', events: '293 today', conversions: '22.1%' },
              ].map((flow, i) => (
                <div key={i} className="group p-6 bg-surface/30 border border-border-dim rounded-2xl hover:border-accent-blue/50 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl bg-bg flex items-center justify-center border border-border-dim group-hover:border-accent-blue transition-all shadow-inner`}>
                      <Workflow className={`w-6 h-6 ${flow.status === 'Running' ? 'text-accent-blue' : 'text-text-dim'}`} />
                    </div>
                    <div>
                      <div className="text-base font-black uppercase tracking-tight group-hover:text-accent-blue transition-all">{flow.name}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                          <Activity className="w-3 h-3" /> {flow.events}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-bold">
                          <Target className="w-3 h-3" /> {flow.conversions}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2.5 rounded-lg bg-bg border border-border-dim text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all">
                      {flow.status === 'Running' ? <Pause className="w-4 h-4 shadow-[0_0_8px_rgba(0,242,255,0.2)]" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-2.5 rounded-lg bg-bg border border-border-dim text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Trigger Logic & Notifications */}
        <div className="space-y-8">
          <div className="module-card p-8 bg-accent-blue/5 border-accent-blue/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <Webhook className="w-5 h-5 text-accent-blue" />
                Sovereign_Webhooks
              </h2>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded text-[8px] font-black uppercase tracking-widest">
                 Bridge_Active
              </div>
            </div>
            <p className="text-xs text-text-dim mb-6 leading-relaxed">
              Connect external data sources to trigger your internal automation hub. Integrate with 2,000+ apps via Sovereign Bridge.
            </p>
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div 
                  key={wh.id} 
                  className="group flex items-center justify-between p-3 bg-bg border border-border-dim rounded-lg hover:border-accent-blue transition-all cursor-pointer"
                  onClick={() => setSelectedWebhook(wh)}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-1.5 h-1.5 rounded-full ${wh.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-dim'}`} />
                     <span className="text-[10px] font-mono text-text-main group-hover:text-accent-blue transition-colors">{wh.name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-text-dim group-hover:text-accent-blue group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
              
              {isAddingWebhook ? (
                <div className="space-y-2 mt-4 p-4 bg-bg border border-accent-blue/30 rounded-xl">
                   <div className="text-[8px] font-black uppercase text-accent-blue tracking-widest mb-2">Protocol_Identification</div>
                   <input 
                    autoFocus
                    placeholder="Webhook Name (e.g. Shopify_Order)..."
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWebhook()}
                    className="w-full bg-surface border border-border-dim rounded-lg px-3 py-2 text-[10px] text-text-main focus:border-accent-blue outline-none"
                   />
                   <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleCreateWebhook}
                        className="flex-1 py-2 bg-accent-blue text-bg text-[9px] font-black uppercase rounded-lg"
                      >
                        Commit
                      </button>
                      <button 
                        onClick={() => setIsAddingWebhook(false)}
                        className="flex-1 py-2 bg-surface text-text-dim text-[9px] font-black uppercase rounded-lg"
                      >
                        Abort
                      </button>
                   </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingWebhook(true)}
                  className="w-full mt-4 py-3 bg-surface border border-border-dim text-accent-blue text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-accent-blue hover:text-bg hover:border-accent-blue"
                >
                  Create New Bridge
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {selectedWebhook && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-bg/80 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg bg-surface border border-border-dim rounded-3xl shadow-2xl p-8 relative overflow-hidden"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                   
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-bg border border-border-dim flex items-center justify-center text-accent-blue">
                            <Webhook className="w-6 h-6" />
                         </div>
                         <div>
                            <div className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-1">Bridge_Configuration</div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-text-main">{selectedWebhook.name}</h2>
                         </div>
                      </div>
                      <button 
                        onClick={() => setSelectedWebhook(null)}
                        className="p-2 hover:bg-bg rounded-lg border border-border-dim text-text-dim transition-colors"
                      >
                         <Plus className="w-6 h-6 rotate-45" />
                      </button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <div className="text-[9px] font-black uppercase text-text-dim tracking-widest">Sovereign_Endpoint_URL</div>
                         <div className="flex items-center gap-2">
                            <div className="flex-1 bg-bg border border-border-dim rounded-xl p-3 text-[10px] font-mono text-text-dim truncate">
                               https://sovereign-core.ai/api/webhooks/{selectedWebhook.id}
                            </div>
                            <button 
                              className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-xl text-accent-blue hover:bg-accent-blue hover:text-bg transition-all"
                              onClick={() => navigator.clipboard.writeText(`https://sovereign-core.ai/api/webhooks/${selectedWebhook.id}`)}
                            >
                               <Save className="w-4 h-4" />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="text-[9px] font-black uppercase text-text-dim tracking-widest">Neural_Secret_Key</div>
                         <div className="flex items-center gap-2">
                            <div className="flex-1 bg-bg border border-border-dim rounded-xl p-3 text-[10px] font-mono text-text-dim">
                               ••••••••••••••••••••••••••••••
                            </div>
                            <button 
                              className="p-3 bg-surface border border-border-dim rounded-xl text-text-dim hover:text-accent-gold transition-all"
                              onClick={() => alert(`Sovereign Secret: ${selectedWebhook.secret}`)}
                            >
                               <Settings className="w-4 h-4" />
                            </button>
                         </div>
                         <p className="text-[8px] text-text-dim italic uppercase">Headers: Include "X-Sovereign-Secret" for cryptographic validation.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-bg border border-border-dim rounded-2xl">
                            <div className="text-[8px] font-black uppercase text-text-dim tracking-widest mb-1">Status</div>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black uppercase text-text-main">Listening</span>
                            </div>
                         </div>
                         <div className="p-4 bg-bg border border-border-dim rounded-2xl">
                            <div className="text-[8px] font-black uppercase text-text-dim tracking-widest mb-1">Last_Execution</div>
                            <div className="text-[10px] font-black uppercase text-text-main">{selectedWebhook.lastTriggered}</div>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-border-dim/50 flex gap-4">
                         <button 
                          className="flex-1 py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(0,242,255,0.3)] transition-all"
                          onClick={() => setSelectedWebhook(null)}
                         >
                           Update_Configuration
                         </button>
                         <button 
                          className="px-6 py-4 bg-surface border border-border-dim rounded-xl text-text-dim hover:text-red-500 hover:border-red-500 transition-all"
                          onClick={() => {
                            setWebhooks(webhooks.filter(w => w.id !== selectedWebhook.id));
                            setSelectedWebhook(null);
                          }}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="module-card p-8">
            <h2 className="text-base font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-gold" />
              Live_Intelligence_Feed
            </h2>
            <div className="space-y-6 relative">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border-dim" />
              {[
                { time: '2m ago', event: 'Workflow: [Sales Pipeline] triggered for lead #8842', color: 'bg-emerald-500' },
                { time: '14m ago', event: 'Email sequence [Nurture_v2] completed for 12 nodes', color: 'bg-accent-blue' },
                { time: '1h ago', event: 'Automation Error: Meta API connection timed out', color: 'bg-red-500' },
                { time: '3h ago', event: 'New Workflow [Onboarding] deployed successfully', color: 'bg-accent-gold' },
              ].map((log, i) => (
                <div key={i} className="relative pl-8">
                  <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-bg ${log.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                  <div className="text-[10px] font-mono text-text-dim mb-1">{log.time}</div>
                  <div className="text-[11px] font-bold text-text-main leading-tight">{log.event}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border-dim rounded-2xl p-8 group hover:border-accent-gold transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center border border-border-dim group-hover:border-accent-gold transition-all">
                <Database className="w-6 h-6 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Global_Nurture_v3</h3>
                <p className="text-[10px] text-accent-gold font-mono uppercase">Neural_Expansion_Pack</p>
              </div>
            </div>
            <p className="text-text-dim text-xs mb-6 leading-relaxed">
              Unlock advanced AI behavioral nurturing sequences that adapt content based on user clicks.
            </p>
            <button className="w-full py-3 bg-surface border border-border-dim text-text-main text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-gold hover:text-bg transition-all">
              Upgrade Hub Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
