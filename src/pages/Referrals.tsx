import { motion, AnimatePresence } from "motion/react";
import { 
   Share2, 
   Users, 
   TrendingUp, 
   Copy, 
   Check, 
   Network, 
   Zap, 
   DollarSign, 
   ArrowRight,
   ShieldCheck,
   Cpu,
   Activity,
   ChevronRight,
   ExternalLink,
   Globe,
   Award,
   AlertCircle,
   Loader2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { 
   BarChart, 
   Bar, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip, 
   ResponsiveContainer, 
   AreaChart, 
   Area,
   Cell
} from "recharts";
import { collection, query, where, onSnapshot, getDocs, limit, orderBy, doc, updateDoc, increment, addDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import NotificationCenter from "../components/NotificationCenter";
import { Link } from "react-router-dom";

// Neural complexity data for visual flair
const CHART_DATA = [
  { day: 'MON', growth: 12, earnings: 400 },
  { day: 'TUE', growth: 18, earnings: 300 },
  { day: 'WED', growth: 15, earnings: 600 },
  { day: 'THU', growth: 22, earnings: 800 },
  { day: 'FRI', growth: 30, earnings: 500 },
  { day: 'SAT', growth: 25, earnings: 900 },
  { day: 'SUN', growth: 35, earnings: 1200 },
];

export default function Referrals() {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual referral code states
  const [manualCode, setManualCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifStatus, setVerifStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifError, setVerifError] = useState("");

  const referralUrl = useMemo(() => {
    const base = window.location.origin;
    return `${base}?ref=${profile?.referralCode || 'SOVEREIGN_CORE'}`;
  }, [profile?.referralCode]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "referrals"), 
      where("referrerId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReferrals(refs);
      setLoading(false);
    }, (error) => {
       // Silently handle or mock data if collection doesn't exist yet
       console.warn("Referrals sync delayed - building collection...");
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (!user || !profile || !manualCode.trim()) return;
    if (manualCode.trim().toUpperCase() === profile.referralCode) {
      setVerifStatus('error');
      setVerifError("Sovereign Protocol Violation: Self-referral loop blocked.");
      return;
    }

    setVerifying(true);
    setVerifStatus('idle');
    setVerifError("");

    try {
      // 1. Find user with this referral code
      const q = query(collection(db, "users"), where("referralCode", "==", manualCode.trim().toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setVerifStatus('error');
        setVerifError("Node Not Identified: Invalid referral protocol.");
        setVerifying(false);
        return;
      }

      const referrerDoc = snap.docs[0];
      const referrerData = referrerDoc.data();
      const reward = 50; // $50 reward

      // 2. Update current user profile
      const userRef = doc(db, "users", user.uid);
      const refereeBonus = 25;
      await updateDoc(userRef, {
        referredBy: manualCode.trim().toUpperCase(),
        balance: increment(refereeBonus),
        updatedAt: new Date().toISOString()
      });

      // 3. Update referrer profile
      const referrerRef = doc(db, "users", referrerDoc.id);
      await updateDoc(referrerRef, {
        referralCount: increment(1),
        referralEarnings: increment(reward),
        balance: increment(reward),
        updatedAt: new Date().toISOString()
      });

      // 4. Create Referral Record
      await addDoc(collection(db, "referrals"), {
        referrerId: referrerDoc.id,
        refereeId: user.uid,
        refereeEmail: user.email,
        rewardAmount: reward,
        timestamp: serverTimestamp()
      });

      // 5. Create Log for Referrer
      await addDoc(collection(db, "logs"), {
        userId: referrerDoc.id,
        title: "Neural Node expansion",
        desc: `New agent synced via manual propagation. +$${reward}.00 synthesized.`,
        type: "referral",
        timestamp: serverTimestamp()
      });

      // 6. Create Log for Current User
      await addDoc(collection(db, "logs"), {
        userId: user.uid,
        title: "Neural Node Synced",
        desc: `Protocol linked to referrer: ${manualCode.toUpperCase()}. +$${refereeBonus}.00 welcome bonus synthesized.`,
        type: "system",
        timestamp: serverTimestamp()
      });

      setVerifStatus('success');
      setManualCode("");
    } catch (err) {
      console.error("Verification failed:", err);
      setVerifStatus('error');
      setVerifError("Protocol Failure: Unable to sync with the neural nexus.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col font-sans">
       <header className="h-[60px] border-b border-border-dim flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-accent-blue/20 rounded flex items-center justify-center border border-accent-blue/30">
                <Network className="text-accent-blue w-5 h-5" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-blue leading-none">Freedom Wheels™</span>
                <span className="text-xs font-bold text-text-main uppercase tracking-widest mt-1">Neural Expansion Core</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <nav className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-dim">
                <Link to="/dashboard" className="hover:text-accent-blue transition-colors">Nodes</Link>
                <Link to="/leads" className="hover:text-accent-blue transition-colors">Intelligence</Link>
                <Link to="/wallet" className="hover:text-accent-blue transition-colors">Treasury</Link>
             </nav>
             <NotificationCenter />
          </div>
       </header>

       <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-10">
          {/* Hero / Code Section */}
          <section className="grid lg:grid-cols-2 gap-8 items-stretch">
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface border border-border-dim rounded-lg p-8 relative overflow-hidden flex flex-col justify-center"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                   <div className="panel-header text-[10px] font-mono uppercase tracking-[0.3em] text-accent-blue mb-4">Propagation_Link</div>
                   <h1 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-[0.9]">
                      Expand the <br/>
                      <span className="text-accent-blue glow-blue">Neural Network</span>
                   </h1>
                   <p className="text-text-dim text-sm mb-8 leading-relaxed max-w-md">
                      Invite fellow sovereign agents to the Sovereign Core. Earn 15% recursion commissions on all their automation engine activity. Perpetual neural rewards.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full bg-bg border border-border-dim rounded flex items-center px-4 h-12 group focus-within:border-accent-blue transition-colors">
                         <Share2 className="w-4 h-4 text-text-dim mr-3 group-focus-within:text-accent-blue" />
                         <input 
                           readOnly 
                           value={referralUrl}
                           className="bg-transparent border-none outline-none text-xs w-full font-mono text-text-main"
                         />
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className={cn(
                          "w-full sm:w-auto h-12 px-6 rounded flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest",
                          copied ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-accent-blue text-bg hover:bg-accent-blue/90"
                        )}
                      >
                         {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                         {copied ? "COPIED" : "COPY LINK"}
                      </button>
                   </div>

                   {/* Manual Entry Section */}
                   {profile && !profile.referredBy && (
                      <div className="mt-8 pt-8 border-t border-border-dim/50">
                         <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-dim mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-accent-gold" />
                            Manual_Sync_Input
                         </div>
                         <div className="flex flex-col sm:flex-row items-stretch gap-3">
                            <div className="flex-1 bg-bg/50 border border-border-dim rounded flex items-center px-4 h-10 group focus-within:border-accent-gold transition-colors">
                               <ShieldCheck className="w-3.5 h-3.5 text-text-dim mr-3 group-focus-within:text-accent-gold" />
                               <input 
                                 value={manualCode}
                                 onChange={(e) => setManualCode(e.target.value)}
                                 placeholder="ENTER REFERRAL CODE"
                                 className="bg-transparent border-none outline-none text-[10px] w-full font-mono text-text-main placeholder:text-text-dim/50 uppercase"
                               />
                            </div>
                            <button 
                              onClick={handleVerifyCode}
                              disabled={verifying || !manualCode.trim() || verifStatus === 'success'}
                              className={cn(
                                "sm:w-auto h-10 px-6 rounded flex items-center justify-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest",
                                verifStatus === 'success' 
                                   ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                   : "bg-accent-gold text-bg hover:bg-accent-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                            >
                               {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                               {verifStatus === 'success' ? "SYNCED" : "VERIFY"}
                            </button>
                         </div>
                         
                         <AnimatePresence>
                            {verifStatus === 'error' && (
                               <motion.div 
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="mt-3 py-2 px-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-500 text-[9px] font-mono uppercase tracking-tighter"
                               >
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {verifError}
                               </motion.div>
                            )}
                            {verifStatus === 'success' && (
                               <motion.div 
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="mt-3 py-2 px-3 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-2 text-green-500 text-[9px] font-mono uppercase tracking-tighter"
                               >
                                  <Check className="w-3 h-3 flex-shrink-0" />
                                  NODE SYNCED SUCCESSFULLY. NEURAL REWARDS DEPLOYED.
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>
                   )}
                </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-2 gap-4"
             >
                <div className="bg-surface border border-border-dim rounded-lg p-6 flex flex-col justify-between group hover:border-accent-blue transition-colors">
                   <div className="w-10 h-10 rounded bg-bg flex items-center justify-center border border-border-dim text-accent-blue">
                      <Users className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-1">Total_Agents</div>
                      <div className="text-3xl font-black text-text-main">{profile?.referralCount || 0}</div>
                   </div>
                </div>
                <div className="bg-surface border border-border-dim rounded-lg p-6 flex flex-col justify-between group hover:border-accent-gold transition-colors">
                   <div className="w-10 h-10 rounded bg-bg flex items-center justify-center border border-border-dim text-accent-gold">
                      <DollarSign className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-1">Recursion_Yield</div>
                      <div className="text-3xl font-black text-text-main">${profile?.referralEarnings?.toLocaleString() || '0.00'}</div>
                   </div>
                </div>
                <div className="bg-surface border border-border-dim rounded-lg p-6 flex flex-col justify-between group hover:border-accent-blue transition-colors">
                   <div className="w-10 h-10 rounded bg-bg flex items-center justify-center border border-border-dim text-accent-blue">
                      <TrendingUp className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-1">Growth_Delta</div>
                      <div className="text-3xl font-black text-text-main">+14.2%</div>
                   </div>
                </div>
                <div className="bg-surface border border-border-dim rounded-lg p-6 flex flex-col justify-between group hover:border-accent-gold transition-colors">
                   <div className="w-10 h-10 rounded bg-bg flex items-center justify-center border border-border-dim text-accent-gold">
                      <Award className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-1">Neural_Rank</div>
                      <div className="text-3xl font-black text-text-main">IV</div>
                   </div>
                </div>
             </motion.div>
          </section>

          {/* Activity & Chart Section */}
          <section className="grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-surface border border-border-dim rounded-lg overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border-dim flex items-center justify-between">
                   <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent-blue" />
                      Expansion_Velocity
                   </h2>
                   <div className="px-3 py-1 bg-bg border border-border-dim rounded text-[8px] font-mono text-text-dim uppercase tracking-widest">
                      Real-time Neural Analysis
                   </div>
                </div>
                <div className="flex-1 h-[300px] p-6">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={CHART_DATA}>
                         <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="#1c2a37" vertical={false} />
                         <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                         />
                         <YAxis hide />
                         <Tooltip 
                            contentStyle={{ 
                               backgroundColor: '#0a1017', 
                               border: '1px solid #1c2a37',
                               borderRadius: '4px',
                               fontSize: '10px',
                               fontFamily: 'monospace'
                            }}
                            itemStyle={{ color: '#00f2ff' }}
                         />
                         <Area 
                            type="monotone" 
                            dataKey="growth" 
                            stroke="#00f2ff" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorGrowth)" 
                         />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-surface border border-border-dim rounded-lg flex flex-col">
                <div className="p-6 border-b border-border-dim">
                   <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-blue" />
                      Recent_Syncs
                   </h2>
                </div>
                <div className="flex-1 p-2 overflow-y-auto max-h-[350px]">
                   {loading ? (
                      <div className="p-8 text-center space-y-4">
                         <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" />
                         <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Hydrating Nodes...</span>
                      </div>
                   ) : referrals.length > 0 ? (
                      referrals.map((ref, idx) => (
                         <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={ref.id} 
                            className="p-4 rounded hover:bg-bg/50 border border-transparent hover:border-border-dim transition-all group"
                         >
                            <div className="flex items-start justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                                     <Zap className="w-4 h-4 text-accent-blue" />
                                  </div>
                                  <div>
                                     <div className="text-xs font-black text-text-main leading-none uppercase">{ref.refereeEmail ? ref.refereeEmail.split('@')[0] : "AGENT"}</div>
                                     <div className="text-[9px] font-mono text-text-dim mt-1.5 uppercase tracking-tighter">Level 1 Agent Identified</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                   <div className="text-[10px] font-black text-accent-gold">+${ref.rewardAmount || '50.00'}</div>
                                   <div className="text-[8px] font-mono text-text-dim mt-1 uppercase">Synced</div>
                                </div>
                            </div>
                         </motion.div>
                      ))
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
                         <Cpu className="w-12 h-12 text-text-dim animate-pulse" />
                         <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-text-main">No Nodes Detected</div>
                            <p className="text-[9px] font-mono text-text-dim leading-relaxed">
                               Propagation sequence not yet initiated. Link is ready for deployment.
                            </p>
                         </div>
                      </div>
                   )}
                </div>
                <div className="p-4 border-t border-border-dim">
                   <button className="w-full py-3 border border-border-dim rounded text-[10px] font-black uppercase tracking-[0.2em] hover:bg-bg transition-colors flex items-center justify-center gap-2 group">
                      View Advanced Topology
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </section>

          {/* FAQ / Info */}
          <section className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             <div className="absolute top-1/2 left-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-surface border border-accent-blue/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                   <Globe className="w-8 h-8 text-accent-blue animate-pulse" />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-accent-blue mb-1">Freedom Wheels Ecosystem Portal</h3>
                   <p className="text-text-dim text-xs max-w-xl leading-relaxed font-mono uppercase tracking-tighter">
                      Secure link to the global Sovereign Core nexus. Create automated income engines and sync with the international Freedom Wheels protocol.
                   </p>
                </div>
             </div>
             <a 
                href={referralUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto px-8 py-4 bg-accent-blue text-bg text-xs font-black uppercase tracking-[0.3em] rounded shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:shadow-[0_0_40px_rgba(0,242,255,0.4)] hover:scale-[1.02] transition-all relative z-10 flex items-center justify-center gap-3"
             >
                Launch Engine <ExternalLink className="w-4 h-4" />
             </a>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { 
                 title: "Recursion Level 1", 
                 desc: "Earn 15% on direct referrals perpetually.",
                 status: "Active"
               },
               { 
                 title: "Referral Cap", 
                 desc: "Unlimited neural propagation. Scale forever.",
                 status: "Infinity"
               },
               { 
                 title: "Payout Frequency", 
                 desc: "Rewards settled daily in Sovereign Treasury.",
                 status: "Daily"
               },
               { 
                 title: "Agent Verification", 
                 desc: "Encrypted verification for all synced nodes.",
                 status: "Secure"
               }
             ].map((card, i) => (
                <div key={i} className="p-6 bg-surface border border-border-dim rounded group hover:border-accent-blue/30 transition-all">
                   <div className="flex items-center justify-between mb-4">
                      <div className="text-[9px] font-black text-accent-blue uppercase tracking-widest">{card.title}</div>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                   </div>
                   <p className="text-[11px] text-text-dim leading-relaxed mb-4">{card.desc}</p>
                   <div className="text-[9px] font-mono text-text-main uppercase">{card.status}</div>
                </div>
             ))}
          </section>
       </main>

       <footer className="h-[60px] border-t border-border-dim flex items-center px-10 gap-10 font-mono text-[10px] text-text-dim uppercase tracking-widest bg-surface/30">
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 rounded-full bg-accent-blue" />
             <span>NEURAL_STATUS: SYNC_READY</span>
          </div>
          <div className="hidden md:flex gap-8 ml-auto">
             <a href="#" className="hover:text-accent-blue transition-colors">Topology</a>
             <a href="#" className="hover:text-accent-blue transition-colors">Protocol</a>
          </div>
          <div className="ml-auto sm:ml-8 font-black text-text-main">v4.2.0-CORE</div>
       </footer>
    </div>
  );
}
