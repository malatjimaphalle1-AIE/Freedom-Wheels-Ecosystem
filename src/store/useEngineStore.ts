import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface NodeData {
  id: string;
  label: string;
  type: "input" | "process" | "output" | "connector";
  status: "active" | "inactive" | "error";
  content?: string;
  position?: { x: number; y: number };
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface Engine {
  id: string;
  name: string;
  status: string;
  revenue: string;
  nodes: NodeData[];
  edges: EdgeData[];
  optimizationMultiplier?: number;
  optimizationLevel?: number;
  performance?: string | number;
  lastOptimizedAt?: any;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

interface EngineState {
  engines: Engine[];
  totalYield: number;
  isLoading: boolean;
  
  // Real-time synchronization
  subscribeToEngines: (userId: string) => () => void;
  
  // Actions
  optimizeEngine: (userId: string, engineId: string) => Promise<void>;
  updateEngineRevenue: (userId: string, engineId: string, amount: number) => Promise<void>;
  
  // Builder State (Decoupled from DB until save)
  builder: {
    nodes: NodeData[];
    edges: EdgeData[];
    name: string;
    setNodes: (nodes: NodeData[]) => void;
    setEdges: (edges: EdgeData[]) => void;
    setName: (name: string) => void;
    reset: () => void;
    load: (engine: Engine) => void;
  };
}

export const useEngineStore = create<EngineState>((set, get) => ({
  engines: [],
  totalYield: 0,
  isLoading: true,

  subscribeToEngines: (userId: string) => {
    const q = query(collection(db, "engines"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const engines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Engine));
      const totalYield = engines.reduce((acc, engine) => {
        return acc + (parseFloat((engine.revenue || "$0.00").replace(/[^0-9.]/g, '')) || 0);
      }, 0);
      
      set({ engines, totalYield, isLoading: false });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "engines");
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  optimizeEngine: async (userId: string, engineId: string) => {
    const { engines } = get();
    const engine = engines.find(e => e.id === engineId);
    if (!engine) return;

    const newMultiplier = (engine.optimizationMultiplier || 1.0) + 0.2;
    
    try {
      await updateDoc(doc(db, "engines", engineId), {
        optimizationMultiplier: parseFloat(newMultiplier.toFixed(2)),
        lastOptimizedAt: serverTimestamp(),
        optimizationLevel: (engine.optimizationLevel || 0) + 1
      });

      await addDoc(collection(db, "logs"), {
        userId,
        title: "AutoEngine Optimized",
        desc: `Engine [${engine.name}] efficiency increased to ${parseFloat(newMultiplier.toFixed(2))}x via neural recalibration.`,
        type: "system",
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `engines/${engineId}`);
    }
  },

  updateEngineRevenue: async (userId: string, engineId: string, amount: number) => {
    const engine = get().engines.find(e => e.id === engineId);
    if (!engine) return;

    const currentRev = parseFloat((engine.revenue || "$0.00").replace(/[^0-9.]/g, '')) || 0;
    const newRev = currentRev + amount;

    try {
      await updateDoc(doc(db, "engines", engineId), {
        revenue: `$${newRev.toFixed(2)}`,
        updatedAt: serverTimestamp()
      });

      if (Math.random() > 0.95) {
        const path = "logs";
        try {
          await addDoc(collection(db, path), {
            userId,
            title: engine.optimizationMultiplier && engine.optimizationMultiplier > 1 ? "Optimized Yield Extracted" : "Autonomous Yield Extracted",
            desc: `Core engine [${engine.name}] synthesized +$${amount.toFixed(2)} from neural traffic corridors.`,
            type: "revenue",
            timestamp: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    } catch (err) {
      console.error("Revenue update failure:", err);
      // Don't throw here to avoid crashing the background interval, but log it properly if it's a Firestore error
      if (err instanceof Error && !err.message.includes("Revenue update failure")) {
         try {
           handleFirestoreError(err, OperationType.UPDATE, `engines/${engineId}`);
         } catch (e) {
           // Silent catch to prevent background loop crash
         }
      }
    }
  },

  builder: {
    nodes: [],
    edges: [],
    name: "NEW_SOVEREIGN_ENGINE",
    setNodes: (nodes) => set((state) => ({ builder: { ...state.builder, nodes } })),
    setEdges: (edges) => set((state) => ({ builder: { ...state.builder, edges } })),
    setName: (name) => set((state) => ({ builder: { ...state.builder, name } })),
    reset: () => set((state) => ({ 
      builder: { 
        ...state.builder, 
        nodes: [
          { id: "n0", label: "Lead Database", type: "connector", status: "active", position: { x: 0, y: 0 } },
          { id: "n1", label: "AI Traffic", type: "input", status: "active", position: { x: 300, y: 0 } },
          { id: "n2", label: "Sovereign Core", type: "process", status: "active", position: { x: 600, y: 0 } },
          { id: "n3", label: "Wallet Output", type: "output", status: "inactive", position: { x: 900, y: 0 } },
        ],
        edges: [
          { id: "e0", source: "n0", target: "n1" },
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
        ],
        name: "NEW_SOVEREIGN_ENGINE" 
      } 
    })),
    load: (engine) => set((state) => ({
      builder: {
        ...state.builder,
        nodes: engine.nodes,
        edges: engine.edges,
        name: engine.name
      }
    }))
  }
}));
