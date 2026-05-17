import React, { ReactNode, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, LayoutDashboard, Cpu, MessageSquare, BarChart3, 
  Wallet, ShoppingBag, Settings, LogOut, TrendingUp, 
  Users, Target, Search, Bell, ChevronRight, Zap, Shield, RefreshCcw,
  LogIn, Layers, ArrowRight, Copy, Book, Trophy, Globe, ExternalLink,
  Edit2, Trash2, Play, Pause, AlertCircle, Plus, Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useEngineStore } from "../store/useEngineStore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

const revenueData = [
  { name: 'Mon', revenue: 400 },
  { name: 'Tue', revenue: 600 },
  { name: 'Wed', revenue: 500 },
  { name: 'Thu', revenue: 900 },
  { name: 'Fri', revenue: 1100 },
  { name: 'Sat', revenue: 1500 },
  { name: 'Sun', revenue: 1300 },
];

const roiPerformanceData = [
  { name: '01', roi: 42, threshold: 30 },
  { name: '05', roi: 45, threshold: 30 },
  { name: '10', roi: 38, threshold: 30 },
  { name: '15', roi: 52, threshold: 35 },
  { name: '20', roi: 68, threshold: 35 },
  { name: '25', roi: 61, threshold: 40 },
  { name: '30', roi: 75, threshold: 40 },
];

const profitabilityData = [
  { name: 'Engine Alpha', roi: 45, marketShare: 12, cac: 45 },
  { name: 'Lead Sovereign', roi: 30, marketShare: 8, cac: 60 },
  { name: 'AI Content V1', roi: 65, marketShare: 20, cac: 25 },
  { name: 'Neural Pulse', roi: 50, marketShare: 15, cac: 35 },
];

import { analyzeStrategicInsights } from "../services/geminiService";
import { fetchWithRetry } from "../lib/fetchUtils";

export default function Dashboard() {
  const { user, profile, signIn, logOut } = useAuth();
  const { engines, totalYield: totalEngineRevenue, optimizeEngine } = useEngineStore();
  const [revenue, setRevenue] = useState<{ total: number, currency: string, breakdown: { wise: number, crypto: number, engines: number, settled: number } } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [neuralLogs, setNeuralLogs] = useState<any[]>([]);
  const [wiseData, setWiseData] = useState<{ balances: any[], transactions: any[] } | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredEngines = useMemo(() => {
    if (statusFilter === "ALL") return engines;
    return engines.filter(e => e.status === statusFilter);
  }, [engines, statusFilter]);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setNeuralLogs([]);
      return;
    }
    
    // Original logs query for other components if needed (stays same for now)
    const qAll = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      if (!snapshot.empty) {
        const logList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logList.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setLogs(logList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "logs");
    });

    // Specific query for Neural Logs panel: latest 5
    const qNeural = query(
      collection(db, "logs"), 
      where("userId", "==", user.uid)
    );
    // Actually we can just slice from logs if we want, but the requirement said "fetching... latest 5"
    // To be efficient and follow instructions:
    const unsubNeural = onSnapshot(qNeural, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logList.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setNeuralLogs(logList.slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "logs");
    });

    return () => {
      unsubAll();
      unsubNeural();
    };
  }, [user]);

  const fetchWiseData = async () => {
    try {
      const [balResult, txResult] = await Promise.allSettled([
        fetchWithRetry("/api/wise/balance"),
        fetchWithRetry("/api/wise/transactions")
      ]);
      
      let balanceData: any[] = [];
      let transactionData: any[] = [];

      if (balResult.status === 'fulfilled') {
        balanceData = balResult.value;
      } else {
        console.warn("Wise Balance fetch failed:", balResult.reason);
      }

      if (txResult.status === 'fulfilled') {
        transactionData = txResult.value;
      } else {
        console.warn("Wise Transactions fetch failed:", txResult.reason);
      }

      setWiseData({ 
        balances: Array.isArray(balanceData) ? balanceData : [], 
        transactions: Array.isArray(transactionData) ? transactionData : [] 
      });
      
      const wiseTotal = (Array.isArray(balanceData) ? balanceData : []).reduce((acc: number, b: any) => {
        const val = b?.amount?.value || 0;
        if (b?.amount?.currency === "USD") return acc + parseFloat(val);
        if (b?.amount?.currency === "EUR") return acc + (parseFloat(val) * 1.08); 
        return acc;
      }, 0);

      setRevenue({
        total: wiseTotal + (profile?.usdtBalance || 0) + (profile?.balance || 0) + totalEngineRevenue,
        currency: "USD",
        breakdown: {
          wise: wiseTotal,
          crypto: profile?.usdtBalance || 0,
          engines: totalEngineRevenue,
          settled: profile?.balance || 0
        }
      });

    } catch (err) {
      console.error("High-level system error in fetchWiseData lifecycle:", err);
    }
  };

  useEffect(() => {
    fetchWiseData();
    const interval = setInterval(fetchWiseData, 30000);
    return () => clearInterval(interval);
  }, [profile, totalEngineRevenue]);

  const combinedActivities = useMemo(() => {
    const firestoreLogs = (logs || []).map(l => {
      let timeStr = 'Just now';
      let ts = Date.now();
      if (l.timestamp && typeof l.timestamp.seconds === 'number') {
        const d = new Date(l.timestamp.seconds * 1000);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ts = d.getTime();
      }
      return { id: l.id, title: l.title || "Log Entry", desc: l.desc || "", type: l.type, time: timeStr, timestamp: ts };
    });

    const wiseActions = (wiseData?.transactions || []).slice(0, 10).map((t: any) => {
      let timeStr = 'Recently';
      let ts = Date.now();
      if (t.created) {
        const d = new Date(t.created);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ts = d.getTime();
      }
      return {
        id: t.id,
        title: t.type === 'RECEIVE' ? 'Revenue Settled' : 'Withdrawal Executed',
        desc: `${t.type === 'RECEIVE' ? 'Incoming flow of' : 'Disbursement of'} ${t.amount?.value} ${t.amount?.currency} finalized via global relay.`,
        type: t.type === 'RECEIVE' ? 'revenue' : 'withdrawal',
        time: timeStr,
        timestamp: ts
      };
    });

    return [...firestoreLogs, ...wiseActions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [logs, wiseData]);

  const [insights, setInsights] = useState<{ summary: string, actionItems: string[], riskLevel: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeProtocol = async () => {
    if (!revenue || engines.length === 0) return;
    setAnalyzing(true);
    try {
      const data = await analyzeStrategicInsights(
        revenue.breakdown,
        engines.map(e => ({ name: e.name, revenue: e.revenue, status: e.status }))
      );
      setInsights(data);
      // Cache insights for 1 hour
      localStorage.setItem('dashboard_strategic_insights', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      console.error("Analysis failed", err);
      if (err.message?.includes("429") || err.status === 429 || JSON.stringify(err).includes("429") || JSON.stringify(err).includes("RESOURCE_EXHAUSTED")) {
        setInsights({
          summary: "AI analytical channels are currently saturated. Fetching local strategic pulse...",
          actionItems: ["Monitor Engine Efficiency", "Optimize Traffic Flow"],
          riskLevel: "Low"
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Check cache first
    const cached = localStorage.getItem('dashboard_strategic_insights');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setInsights(data);
          return;
        }
      } catch (e) {
        localStorage.removeItem('dashboard_strategic_insights');
      }
    }

    if (revenue && engines.length > 0 && !insights && !analyzing) {
      analyzeProtocol();
    }
  }, [revenue, engines]);

  if (!user) return (
    <div className="h-full flex items-center justify-center p-8 bg-bg">
      <div className="max-w-md w-full bg-surface border border-border-dim p-12 rounded-2xl text-center space-y-8">
        <Cpu className="w-16 h-16 text-accent-blue mx-auto animate-pulse" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">Access Required</h1>
        <button onClick={signIn} className="w-full py-4 bg-accent-blue text-bg font-black uppercase tracking-widest rounded transition-all active:scale-95">Establish_Connection</button>
      </div>
    </div>
  );

  return (
    <div className="h-full geometric-grid grid-cols-[280px_1fr_280px] overflow-hidden bg-bg relative pixel-grid">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue/5 via-transparent to-transparent pointer-events-none" />
      {/* Left Panel: Engines */}
      <aside className="geometric-panel border-r border-border-dim overflow-y-auto custom-scrollbar p-6">
        <div className="flex items-center justify-between mb-4 border-b border-border-dim pb-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-text-dim">Sovereign Engines</div>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-text-dim" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest outline-none text-accent-blue cursor-pointer"
            >
              <option value="ALL">ALL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {filteredEngines.length > 0 ? (
            filteredEngines.map(engine => (
              <EngineItem 
                key={engine.id}
                id={engine.id}
                name={engine.name}
                status={engine.status}
                revenue={engine.revenue}
                performance={engine.performance}
                optimizationMultiplier={engine.optimizationMultiplier}
                onOptimize={optimizeEngine}
                onToggleStatus={async (id, currentStatus) => {
                  const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                  await updateDoc(doc(db, "engines", id), { status: nextStatus, updatedAt: serverTimestamp() });
                }}
                onDelete={async (id) => {
                  if (confirm("Expunge engine?")) await deleteDoc(doc(db, "engines", id));
                }}
              />
            ))
          ) : (
            <div className="p-8 border border-dashed border-border-dim rounded-xl text-center opacity-50">
              <Cpu className="w-8 h-8 mx-auto mb-2" />
              <div className="text-[10px] uppercase">No active engines</div>
              <Link to="/builder" className="text-accent-blue text-[9px] uppercase mt-2 inline-block">Initialize Builder</Link>
            </div>
          )}
        </div>

        <div className="panel-header text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-4">Intelligence Pulse</div>
        <div className="module-card">
          <span className="text-[9px] text-text-dim uppercase">Traffic Pulse (24H)</span>
          <div className="text-xl font-black font-mono text-accent-blue">42,891</div>
        </div>
      </aside>

      {/* Center: Command Center */}
      <section className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-bg relative">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TrendingUp />} label="Total Sync" value={`$${(revenue?.total || 0).toLocaleString()}`} trend="ACTIVE" />
          <StatCard icon={<Cpu />} label="Active Yield" value={`$${(totalEngineRevenue || 0).toLocaleString()}`} trend="LIVE" />
          <StatCard 
            icon={<Zap />} 
            label="Liquid" 
            value={`$${(revenue?.breakdown?.wise || 0).toLocaleString()}`} 
            trend="FLOW" 
            detail={wiseData?.balances?.map(b => `${b.amount.value} ${b.amount.currency}`).join(' | ')}
          />
          <StatCard icon={<Shield />} label="Secured" value={`$${(revenue?.breakdown?.crypto || 0).toLocaleString()}`} trend="VAULT" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
           <div className="p-6 rounded-xl bg-surface border border-border-dim">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-blue">Global_Strategic_Insights</h3>
                 <button 
                  onClick={analyzeProtocol} 
                  disabled={analyzing}
                  className="p-1.5 hover:bg-bg rounded transition-colors disabled:opacity-50"
                 >
                   <RefreshCcw className={cn("w-3.5 h-3.5 text-text-dim", analyzing && "animate-spin")} />
                 </button>
              </div>
              
              {insights ? (
                <div className="space-y-4">
                  <div className="p-3 bg-bg border border-accent-blue/20 rounded">
                    <p className="text-[10px] text-accent-blue font-bold uppercase mb-1">Neural Summary</p>
                    <p className="text-[11px] leading-relaxed italic">"{insights.summary}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-text-dim">Priority Action Protocol</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {insights.actionItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <ArrowRight className="w-3 h-3 text-accent-gold mt-0.5 shrink-0" />
                          <span className="text-[10px] text-text-main">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      insights.riskLevel === 'Low' ? 'bg-emerald-500' : insights.riskLevel === 'High' ? 'bg-red-500' : 'bg-accent-gold'
                    )} />
                    <span className="text-[9px] font-black uppercase text-text-dim">Risk Level: {insights.riskLevel}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4 opacity-50">
                  <Network className={cn("w-8 h-8 mx-auto text-accent-blue", analyzing && "animate-pulse")} />
                  <p className="text-[10px] uppercase font-mono">{analyzing ? "Synthesizing Protocol..." : "Awaiting Strategy Sequence"}</p>
                </div>
              )}
           </div>

           <div className="p-6 rounded-xl bg-surface border border-border-dim">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-blue mb-4">Revenue_Synthesis_Velocity</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#00f2ff" fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="p-6 rounded-xl bg-surface border border-border-dim">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-gold mb-4">Profitability_Matrix</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityData}>
                    <Bar dataKey="roi" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="marketShare" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* New Interactive Widgets */}
           <div className="p-6 rounded-xl bg-surface border border-border-dim">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-blue mb-4">Lead_Conversion_Funnel</h3>
              <div className="space-y-4">
                {[
                  { label: "Identification", value: 1240, total: 1240, color: "bg-accent-blue" },
                  { label: "Interest", value: 840, total: 1240, color: "bg-cyan-400" },
                  { label: "Interaction", value: 420, total: 1240, color: "bg-accent-gold" },
                  { label: "Synthesis", value: 125, total: 1240, color: "bg-emerald-500" },
                ].map((stage, i) => (
                  <div key={stage.label} className="group cursor-help">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[9px] font-black uppercase text-text-dim tracking-tighter">{stage.label}</span>
                      <span className="text-[10px] font-mono text-text-main font-bold">{stage.value}</span>
                    </div>
                    <div className="w-full h-2 bg-bg border border-border-dim rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stage.value / stage.total) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn("h-full", stage.color)}
                      />
                      {i > 0 && (
                        <div className="absolute right-2 top-0 text-[7px] font-mono text-text-dim/50 italic">
                          {((stage.value / [1240, 1240, 840, 420][i-1]) * 100).toFixed(1)}% Yield
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border-dim/30 flex justify-between items-center text-[8px] font-mono text-text-dim uppercase">
                <span>Core Conversion Efficiency</span>
                <span className="text-emerald-500">10.1% Global Avg</span>
              </div>
           </div>

           <div className="p-6 rounded-xl bg-surface border border-border-dim">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-gold mb-4">Revenue_ROI_Performance</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roiPerformanceData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#050505', border: '1px solid #1e3a5a', borderRadius: '4px' }}
                      itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#00f2ff" 
                      strokeWidth={2} 
                      dot={{ r: 2, fill: '#00f2ff' }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={2000}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="threshold" 
                      stroke="#f59e0b" 
                      strokeWidth={1} 
                      strokeDasharray="4 4" 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-[8px] font-black uppercase text-text-dim">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-[1px] bg-accent-blue" /> Actual ROI Sync
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-[1px] bg-accent-gold border-dashed" /> Baseline Target
                </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 border-t border-border-dim/30">
          <div className="w-64 h-64 rounded-full border border-accent-blue/10 flex items-center justify-center relative shadow-[0_0_50px_rgba(0,242,255,0.05)]">
             <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-accent-gold mb-1">AutoIncome Engines™</div>
                <div className="text-2xl font-black uppercase tracking-tighter">SOVEREIGN CORE</div>
                <Link to="/builder" className="mt-4 inline-block px-6 py-2 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded transition-all">Engage Funnel Builder</Link>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-20">
               <NeuralMap />
             </div>
          </div>
        </div>
      </section>

      {/* Right: Neural Logs */}
      <aside className="geometric-panel border-l border-border-dim overflow-y-auto custom-scrollbar p-6">
        <div className="panel-header text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-4 flex items-center justify-between">
          <span>Neural_Logs</span>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[7px] text-emerald-500 font-mono">LIVE</span>
          </div>
        </div>
        
        <div className="space-y-6 mb-8 mt-2">
           {neuralLogs.length > 0 ? (
             neuralLogs.map((log) => {
               let timeStr = 'Recently';
               if (log.timestamp && typeof log.timestamp.seconds === 'number') {
                 const d = new Date(log.timestamp.seconds * 1000);
                 timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
               }
               return (
                 <ActivityItem 
                   key={log.id} 
                   icon={<Cpu className="w-3 h-3 text-accent-blue" />} 
                   title={log.title} 
                   time={timeStr} 
                   desc={log.desc} 
                 />
               );
             })
           ) : (
             <div className="text-center py-8 border border-dashed border-border-dim rounded opacity-50">
               <div className="text-[9px] uppercase tracking-widest">Awaiting Neural Pulse...</div>
             </div>
           )}
        </div>

        <div className="panel-header text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-4">Finance_Stream</div>
        <div className="space-y-4 mb-8">
           {wiseData?.transactions?.slice(0, 3).map((t: any) => (
             <ActivityItem 
               key={t.id} 
               icon={<Zap className="w-3 h-3 text-accent-gold" />} 
               title={t.type === 'RECEIVE' ? 'Revenue' : 'Withdrawal'} 
               time={new Date(t.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
               desc={`${t.amount?.value || '0.00'} ${t.amount?.currency || ''}`} 
             />
           ))}
        </div>

        <div className="mt-auto pt-4 border-t border-border-dim">
           <div className="text-[9px] font-black text-text-dim uppercase mb-1">Total_Yield_Sync</div>
           <div className="text-xl font-black font-mono text-accent-blue">${(revenue?.total || 0).toLocaleString()}</div>
           <Link to="/wallet" className="mt-3 block text-center py-2 bg-accent-blue text-bg text-[9px] font-black uppercase tracking-widest rounded transition-all hover:brightness-110 active:scale-95">Withdraw_Protocol</Link>
        </div>
      </aside>
    </div>
  );
}

function EngineItem({ id, name, status, revenue, performance, optimizationMultiplier, onDelete, onToggleStatus, onOptimize }: any) {
  const safeRevenue = revenue || "$0.00";
  const [liveRevenue, setLiveRevenue] = useState(parseFloat(safeRevenue.replace(/[^0-9.]/g, '')) || 0);

  useEffect(() => {
    if (status !== 'ACTIVE') return;
    const interval = setInterval(() => {
      const inc = (Math.random() * 0.005 + 0.001) * (optimizationMultiplier || 1.0);
      setLiveRevenue(prev => prev + inc);
    }, 5000);
    return () => clearInterval(interval);
  }, [status, optimizationMultiplier]);

  return (
    <div className="p-4 rounded bg-surface border border-border-dim hover:border-accent-blue transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-border-dim flex items-center justify-center bg-bg group-hover:text-accent-blue transition-colors relative">
            <Cpu className="w-4 h-4" />
            {status === 'ACTIVE' && (
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded border border-emerald-500/50 bg-emerald-500/10"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-black uppercase tracking-tight">{name || "UNNAMED"}</div>
              {status === 'ERROR' && (
                <motion.div 
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="text-red-500"
                >
                  <AlertCircle className="w-3 h-3" />
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-[9px] font-mono uppercase ${status === 'ACTIVE' ? 'text-emerald-500' : status === 'ERROR' ? 'text-red-500 font-bold' : 'text-text-dim'}`}>{status}</div>
              <div className="w-1 h-1 rounded-full bg-border-dim" />
              <div className="text-[10px] font-black font-mono text-accent-blue">${liveRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <button onClick={() => onOptimize(id)} className="p-1 border border-border-dim rounded hover:border-accent-gold transition-colors"><TrendingUp className="w-3 h-3" /></button>
        <button onClick={() => onToggleStatus(id, status)} className="p-1 border border-border-dim rounded hover:border-emerald-500 transition-colors">{status === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}</button>
        <button onClick={() => onDelete(id)} className="p-1 border border-border-dim rounded hover:border-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, desc }: any) {
  return (
    <div className="flex gap-3 text-left">
      <div className="w-6 h-6 rounded bg-surface flex items-center justify-center shrink-0 border border-border-dim">{icon}</div>
      <div className="flex-1 border-b border-border-dim/50 pb-3">
        <div className="flex justify-between items-start mb-1">
          <div className="text-[10px] font-black uppercase tracking-tight leading-none">{title}</div>
          <div className="text-[8px] font-mono text-text-dim uppercase">{time}</div>
        </div>
        <div className="text-[9px] text-text-dim leading-tight">{desc}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, detail }: any) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-dim hover:border-accent-blue transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-lg bg-bg border border-border-dim flex items-center justify-center text-accent-blue">{icon}</div>
        <div className="text-[8px] font-black bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded tracking-widest">{trend}</div>
      </div>
      <div className="text-xl font-black font-mono text-accent-blue">{value}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black text-text-dim uppercase tracking-widest truncate">{label}</div>
        {detail && (
          <div className="text-[8px] font-mono text-accent-gold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function NeuralMap() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" className="animate-pulse">
       <circle cx="200" cy="200" r="100" stroke="#00f2ff" strokeWidth="0.5" strokeDasharray="4,4" fill="none" />
       <circle cx="200" cy="200" r="150" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="8,8" fill="none" />
       <line x1="200" y1="200" x2="300" y2="100" stroke="#00f2ff" strokeWidth="0.5" opacity="0.3" />
       <line x1="200" y1="200" x2="100" y2="300" stroke="#f59e0b" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
