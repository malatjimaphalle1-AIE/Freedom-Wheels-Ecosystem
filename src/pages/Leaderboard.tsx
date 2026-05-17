import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Medal, Crown, Target, Zap, TrendingUp, 
  Users, ChevronRight, Bell, LayoutDashboard, Cpu,
  ShoppingBag, Book, LogOut, LogIn
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import NotificationCenter from "../components/NotificationCenter";

const topUsers = [
  { rank: 1, name: "Oracle_Alpha", revenue: 145200, leads: 4200, status: "ELITE", color: "text-accent-gold", icon: <Crown className="w-5 h-5" /> },
  { rank: 2, name: "Cyber_Sentinel", revenue: 98400, leads: 2800, status: "SOVEREIGN", color: "text-accent-blue", icon: <Medal className="w-5 h-5" /> },
  { rank: 3, name: "Nexus_Prime", revenue: 82100, leads: 2100, status: "AUTONOMOUS", color: "text-cyan-400", icon: <Trophy className="w-5 h-5" /> },
  { rank: 4, name: "Matrix_Runner", revenue: 65400, leads: 1850, status: "ACTIVE", color: "text-text-main", icon: null },
  { rank: 5, name: "Zion_Operator", revenue: 54300, leads: 1400, status: "ACTIVE", color: "text-text-main", icon: null },
  { rank: 6, name: "Void_Walker", revenue: 42100, leads: 1200, status: "ACTIVE", color: "text-text-main", icon: null },
  { rank: 7, name: "Ghost_In_Shell", revenue: 38900, leads: 950, status: "ACTIVE", color: "text-text-main", icon: null },
];

export default function Leaderboard() {
  const { user, profile, signIn, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"REVENUE" | "LEADS">("REVENUE");
  const [users, setUsers] = useState(topUsers);
  const [pulses, setPulses] = useState([
    { user: "Oracle_Alpha", action: "SYNTHESIZED", val: "+ $1.2k", time: "2m ago" },
    { user: "Nexus_Prime", action: "DEPLOYED", val: "ENGINE_V4", time: "15m ago" },
    { user: "Ghost_In_Shell", action: "ACQUIRED", val: "24 LEADS", time: "42m ago" }
  ]);

  // Real-time update simulation
  useEffect(() => {
    const dataInterval = setInterval(() => {
      setUsers(currentUsers => {
        return currentUsers.map(u => {
          if (Math.random() > 0.7) {
            const revenueGain = Math.floor(Math.random() * 500);
            const leadGain = Math.floor(Math.random() * 5);
            return {
              ...u,
              revenue: u.revenue + revenueGain,
              leads: u.leads + leadGain
            };
          }
          return u;
        });
      });
    }, 3000);

    const pulseInterval = setInterval(() => {
      const users = ["Oracle_Alpha", "Cyber_Sentinel", "Nexus_Prime", "Ghost_In_Shell", "Matrix_Runner"];
      const actions = ["SYNTHESIZED", "DEPLOYED", "ACQUIRED", "SCALED", "OPTIMIZED"];
      
      const newPulse = {
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        val: Math.random() > 0.5 ? `+ $${Math.floor(Math.random() * 1000)}` : `${Math.floor(Math.random() * 50)} LEADS`,
        time: "Just now"
      };

      setPulses(prev => [newPulse, ...prev.slice(0, 2)]);
    }, 5000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => 
      activeTab === "REVENUE" ? b.revenue - a.revenue : b.leads - a.leads
    );
    // Re-assign ranks based on sorted order
    return sorted.map((u, index) => ({ ...u, rank: index + 1 }));
  }, [users, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-main font-sans overflow-hidden">
      {/* Top Nav */}
      <header className="h-[60px] border-b border-border-dim flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 font-extrabold tracking-tighter text-lg text-accent-gold uppercase">
          Freedom Wheels™ <span className="text-text-main">Leaderboard</span>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="bg-surface border border-border-dim px-3 py-1 rounded-full text-[11px] font-mono text-text-dim flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#00f2ff]" />
            NETWORK STATUS: SECURE
          </div>
          <div className="bg-surface border border-border-dim px-3 py-1 rounded-full text-[11px] font-mono text-text-dim flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#00f2ff]" />
            SOVEREIGN_V2_CORE
          </div>
        </div>
        <div className="flex items-center gap-4 pl-4 border-l border-border-dim">
           {user && <NotificationCenter />}
           {user ? (
             <>
               <div className="text-right hidden sm:block">
                 <div className="text-xs font-bold truncate max-w-[120px]">{user.displayName || user.email}</div>
                 <div className="flex items-center gap-2 justify-end">
                    <div className={cn(
                      "text-[8px] font-black font-mono px-1.5 py-0.5 rounded border uppercase tracking-widest",
                      profile?.role === 'ADMIN' ? "bg-accent-gold/10 text-accent-gold border-accent-gold/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]" :
                      profile?.role === 'VIEWER' ? "bg-text-dim/10 text-text-dim border-text-dim/30" :
                      "bg-accent-blue/10 text-accent-blue border-accent-blue/30"
                    )}>
                      {profile?.role || 'USER'}
                    </div>
                    <div className="text-[10px] text-accent-blue font-mono uppercase">Level {profile?.level || 1}</div>
                 </div>
               </div>
               <button 
                 onClick={logOut}
                 className="w-9 h-9 rounded-lg bg-surface border border-border-dim flex items-center justify-center font-bold text-text-dim hover:text-red-400 transition-colors"
                 title="Logout"
               >
                 <LogOut className="w-4 h-4" />
               </button>
             </>
           ) : (
             <button 
               onClick={signIn}
               className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
             >
               <LogIn className="w-4 h-4" /> INITIALIZE CORE
             </button>
           )}
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 geometric-grid grid-cols-[240px_1fr_240px]">
        {/* Left Panel */}
        <aside className="geometric-panel">
          <div className="panel-header text-[10px] uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-4">Neural Navigation</div>
          
          <nav className="space-y-1">
             <Link to="/dashboard" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <LayoutDashboard className="w-3.5 h-3.5" /> DASHBOARD
             </Link>
             <Link to="/builder" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <Cpu className="w-3.5 h-3.5" /> ENGINE BUILDER
             </Link>
             <Link to="/marketplace" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <ShoppingBag className="w-3.5 h-3.5" /> MARKETPLACE
             </Link>
             <Link to="/analysis" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <TrendingUp className="w-3.5 h-3.5" /> NICHE INTEL
             </Link>
             <Link to="/leads" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <Target className="w-3.5 h-3.5" /> LEAD INTELLIGENCE
             </Link>
             <Link to="/leaderboard" className="flex items-center gap-2 p-2 text-[11px] text-accent-blue bg-accent-blue/5 border-l-2 border-accent-blue transition-colors">
               <Trophy className="w-3.5 h-3.5" /> LEADERBOARD
             </Link>
             <Link to="/knowledge" className="flex items-center gap-2 p-2 text-[11px] text-text-dim hover:text-accent-blue transition-colors">
               <Book className="w-3.5 h-3.5" /> KNOWLEDGE BASE
             </Link>
          </nav>
        </aside>

        {/* Center Stage: Leaderboard */}
        <section className="bg-[radial-gradient(circle_at_center,#0c1d2e_0%,#05070a_70%)] flex flex-col items-center relative p-8 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Ecosystem_Dominance</h1>
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-4 flex items-center gap-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#00f2ff]" />
                    <span className="text-[8px] font-black text-accent-blue tracking-tighter">LIVE</span>
                  </motion.div>
                </div>
                <div className="h-10 w-[1px] bg-border-dim hidden sm:block" />
                <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest italic hidden sm:block">Live Ranking of Sovereign Income Architects</p>
              </div>
              <div className="flex p-1 bg-surface border border-border-dim rounded-lg">
                <button 
                  onClick={() => setActiveTab("REVENUE")}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                    activeTab === "REVENUE" ? "bg-accent-gold text-bg" : "text-text-dim hover:text-text-main"
                  )}
                >
                  Revenue_Delta
                </button>
                <button 
                  onClick={() => setActiveTab("LEADS")}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                    activeTab === "LEADS" ? "bg-accent-gold text-bg" : "text-text-dim hover:text-text-main"
                  )}
                >
                  Lead_Synthesis
                </button>
              </div>
            </div>

            {/* Top 3 Visual */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              {sortedUsers.slice(0, 3).map((u, idx) => (
                <motion.div
                  key={u.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  className={cn(
                    "relative p-8 rounded-xl border flex flex-col items-center text-center overflow-hidden group",
                    idx === 0 ? "bg-accent-gold/5 border-accent-gold/30 order-2 h-[280px]" : 
                    idx === 1 ? "bg-accent-blue/5 border-accent-blue/20 order-1 h-[240px] mt-10" : 
                    "bg-cyan-400/5 border-cyan-400/20 order-3 h-[220px] mt-15"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={cn("mb-4 transform group-hover:scale-110 transition-transform", u.color)}>
                    {u.icon}
                  </div>
                  <div className="text-[10px] font-mono text-text-dim uppercase mb-1">Rank_0{u.rank}</div>
                  <div className="text-lg font-black uppercase tracking-tight mb-4">{u.name}</div>
                  <div className="mt-auto">
                    <div className={cn("text-xl font-black font-mono", u.color)}>
                      {activeTab === "REVENUE" ? `$${(u.revenue/1000).toFixed(1)}k` : u.leads.toLocaleString()}
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-text-dim mt-1">{activeTab}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-surface/50 border border-border-dim rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border-dim bg-bg/40 text-[9px] font-black uppercase tracking-widest text-text-dim">
                <div className="col-span-1">Rank</div>
                <div className="col-span-1">Icon</div>
                <div className="col-span-4">Architect_Identity</div>
                <div className="col-span-2">Status_Node</div>
                <div className="col-span-2 text-right">Revenue</div>
                <div className="col-span-2 text-right">Lead_Intel</div>
              </div>
              <div className="divide-y divide-border-dim">
                {sortedUsers.map((u, idx) => (
                  <motion.div 
                    key={u.name}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      layout: { duration: 0.4, ease: "easeOut" },
                      opacity: { duration: 0.2 }
                    }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-bg/60 transition-colors group"
                  >
                    <div className="col-span-1 font-mono text-xs text-text-dim">#{u.rank}</div>
                    <div className="col-span-1 flex justify-center">
                       <div className={cn("p-1.5 rounded bg-bg border border-border-dim group-hover:border-accent-blue transition-colors", u.color)}>
                          {u.icon || <Users className="w-3.5 h-3.5" />}
                       </div>
                    </div>
                    <div className="col-span-4 font-black text-xs uppercase tracking-tight">{u.name}</div>
                    <div className="col-span-2">
                       <span className={cn(
                         "text-[8px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-widest flex items-center w-fit gap-1",
                         u.status === 'ELITE' ? "bg-accent-gold/10 text-accent-gold border-accent-gold/30" :
                         u.status === 'SOVEREIGN' ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30" :
                         "bg-text-dim/10 text-text-dim border-text-dim/30"
                       )}>
                          <div className={cn("w-1 h-1 rounded-full", u.status === 'ELITE' ? "bg-accent-gold" : "bg-accent-blue")} />
                          {u.status}
                       </span>
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-[11px] text-emerald-500">
                      ${u.revenue.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-[11px] text-accent-blue opacity-80">
                      {u.leads.toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute bottom-10 right-10 flex gap-4 pointer-events-none opacity-20">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="w-[1px] h-32 bg-gradient-to-t from-accent-blue to-transparent" />
             ))}
          </div>
        </section>

        {/* Right Panel: Network Pulse */}
        <aside className="geometric-panel">
          <div className="panel-header text-[10px] uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-1">Architect_Activity</div>
          <div className="space-y-4 mt-2 h-[260px] relative overflow-hidden">
             <AnimatePresence initial={false}>
               {pulses.map((p, i) => (
                  <motion.div
                    key={`${p.user}-${p.time}-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                     <PulseItem 
                       user={p.user} 
                       action={p.action} 
                       val={p.val} 
                       time={p.time}
                     />
                  </motion.div>
               ))}
             </AnimatePresence>
          </div>

          <div className="panel-header text-[10px] uppercase tracking-widest text-text-dim border-b border-border-dim pb-2 mb-1 mt-8">Network_Intel</div>
          <div className="mt-4 p-4 bg-accent-gold/5 border border-accent-gold/20 rounded-lg">
             <div className="text-[10px] font-black text-accent-gold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Medal className="w-3.5 h-3.5" /> Promotion_Active
             </div>
             <p className="text-[9px] text-text-dim leading-relaxed font-medium uppercase tracking-tight">
                Top 3 architects this cycle receiving a multiplier on all referral synthesis.
             </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function PulseItem({ user, action, val, time }: { user: string, action: string, val: string, time: string }) {
  return (
    <div className="p-3 bg-bg/40 border border-border-dim rounded group hover:bg-bg/60 transition-colors">
       <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest">{user}</span>
          <span className="text-[8px] font-mono text-text-dim uppercase">{time}</span>
       </div>
       <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-accent-blue uppercase tracking-tighter">{action}</span>
          <span className="text-[10px] font-bold font-mono text-accent-gold">{val}</span>
       </div>
    </div>
  );
}
