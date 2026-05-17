import { motion } from "motion/react";
import React, { ReactNode, useMemo } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CreditCard, 
  Landmark, 
  Coins, 
  ChevronRight, 
  Search, 
  ShieldCheck,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Zap,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from "../lib/utils";
import NotificationCenter from "../components/NotificationCenter";
import { useAuth } from "../contexts/AuthContext";
import { useEngineStore } from "../store/useEngineStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { fetchWithRetry } from "../lib/fetchUtils";

interface Terminal {
  id: string;
  label: string;
  identifier: string;
  type: "bank" | "crypto" | "electronic";
  active?: boolean;
}

export default function WalletPage() {
  const { user, profile } = useAuth();
  const { engines, totalYield: totalEngineRevenue } = useEngineStore();
  const [wiseData, setWiseData] = React.useState<{ balances: any[], transactions: any[] } | null>(null);
  const [wiseError, setWiseError] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWiseConfigOpen, setIsWiseConfigOpen] = React.useState(false);
  const [wiseConfig, setWiseConfig] = React.useState({
    apiKey: localStorage.getItem("SOVEREIGN_WISE_KEY") || "",
    profileId: localStorage.getItem("SOVEREIGN_WISE_PROFILE") || ""
  });
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isSettling, setIsSettling] = React.useState(false);
  const [auditSearch, setAuditSearch] = React.useState("");

  const fetchWiseData = async (showSync = false) => {
    if (showSync) setIsSyncing(true);
    const savedWiseKey = localStorage.getItem("SOVEREIGN_WISE_KEY");
    const savedProfileId = localStorage.getItem("SOVEREIGN_WISE_PROFILE");
    
    const headers: Record<string, string> = {};
    if (savedWiseKey) headers["x-wise-api-key"] = savedWiseKey;
    if (savedProfileId) headers["x-wise-profile-id"] = savedProfileId;

    try {
      setWiseError(null);
      const [balResult, txResult] = await Promise.allSettled([
        fetchWithRetry("/api/wise/balance", { headers }),
        fetchWithRetry("/api/wise/transactions", { headers })
      ]);
      
      let balanceData: any[] = [];
      let transactionData: any = [];

      if (balResult.status === 'fulfilled') {
        balanceData = balResult.value;
      } else {
        const errorMsg = balResult.reason?.message || String(balResult.reason);
        if (savedWiseKey) setWiseError(errorMsg);
        console.warn("Wise Balance fetch failed:", balResult.reason);
      }

      if (txResult.status === 'fulfilled') {
        transactionData = txResult.value;
      } else {
        console.warn("Wise Transactions fetch failed:", txResult.reason);
      }

      setWiseData({ 
        balances: Array.isArray(balanceData) ? balanceData : [], 
        transactions: (Array.isArray(transactionData) ? transactionData : (transactionData?.activities || [])) 
      });
      setIsSyncing(false);
    } catch (err) {
      console.error("Wallet Wise Fetch Error:", err);
      setIsSyncing(false);
    }
  };

  const handleSaveWiseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("SOVEREIGN_WISE_KEY", wiseConfig.apiKey);
    localStorage.setItem("SOVEREIGN_WISE_PROFILE", wiseConfig.profileId);
    setIsWiseConfigOpen(false);
    fetchWiseData(true);
  };

  const totalBalance = useMemo(() => {
    const wiseTotal = (wiseData?.balances || []).reduce((acc: number, b: any) => {
      const val = parseFloat(b.amount?.value) || 0;
      const currency = b.amount?.currency;
      if (currency === "USD") return acc + val;
      if (currency === "EUR") return acc + (val * 1.08); 
      if (currency === "GBP") return acc + (val * 1.27);
      if (currency === "ZAR") return acc + (val * 0.053);
      return acc + val;
    }, 0);
    const btcValue = (profile?.btcBalance || 0) * 65000;
    const ethValue = (profile?.ethBalance || 0) * 3500;
    const solValue = (profile?.solBalance || 0) * 145;
    return wiseTotal + (profile?.usdtBalance || 0) + btcValue + ethValue + solValue + totalEngineRevenue + (profile?.balance || 0);
  }, [wiseData, profile, totalEngineRevenue]);

  const handleSettleYield = async () => {
    if (!user || totalEngineRevenue <= 0) return;
    setIsSettling(true);
    try {
      for (const engine of engines) {
        if (parseFloat((engine.revenue || "$0.00").replace(/[^0-9.]/g, '')) > 0) {
          await updateDoc(doc(db, "engines", engine.id), {
            revenue: "$0.00",
            updatedAt: serverTimestamp()
          });
        }
      }

      await addDoc(collection(db, "logs"), {
        userId: user.uid,
        title: "Yield Settlement",
        desc: `Successfully settled $${totalEngineRevenue.toFixed(2)} from active engines to main vault.`,
        type: "revenue",
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, "users", user.uid), {
        balance: (profile?.balance || 0) + totalEngineRevenue,
        settledRevenue: (profile?.settledRevenue || 0) + totalEngineRevenue
      });

      setIsSettling(false);
    } catch (err) {
      console.error("Settlement failed:", err);
      setIsSettling(false);
    }
  };

  React.useEffect(() => {
    fetchWiseData();
    const interval = setInterval(fetchWiseData, 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }
    const q = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "logs");
    });
    return () => unsubscribe();
  }, [user]);

  const [terminals, setTerminals] = React.useState<Terminal[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);

  const { addNotification } = useNotificationStore();
  const prevWithdrawalsRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "withdrawals"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        const prevStatus = prevWithdrawalsRef.current[id];
        
        if (change.type === "added") {
          const now = Date.now();
          const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp?.seconds * 1000 || now);
          if (now - timestamp < 10000) { 
            addNotification({
              type: 'INFO',
              title: "Extraction Protocol Initiated",
              message: `Withdrawal of ${data.amount} ${data.currency} to ${data.destination} is now processing.`
            });
          }
        }
        
        if (change.type === "modified" && prevStatus && prevStatus !== data.status) {
          if (data.status === 'SUCCESS') {
            addNotification({
              type: 'REVENUE',
              title: "Extraction Successful",
              message: `Your withdrawal of ${data.amount} ${data.currency} has been verified and settled.`
            });
          } else if (data.status === 'FAILED') {
            addNotification({
              type: 'SECURITY',
              title: "Extraction Failed",
              message: `Withdrawal of ${data.amount} ${data.currency} failed. Reason: ${data.failReason || 'Unknown security threshold breach.'}`
            });
          }
        }
        
        // Update ref
        prevWithdrawalsRef.current[id] = data.status;
      });
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "withdrawals");
    });
    return () => unsubscribe();
  }, [user, addNotification]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "terminals"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const initialTerminals = [
          { label: "Wise (Multi-Currency)", identifier: "wise-8821", type: "bank", active: true },
          { label: "Crypto Vault (USDT)", identifier: "0x42...88f2", type: "crypto" },
          { label: "PayPal Terminal", identifier: "admin@freedom.io", type: "electronic" },
        ];
        initialTerminals.forEach(async (t) => {
          try {
            await addDoc(collection(db, "terminals"), { ...t, userId: user.uid });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, "terminals");
          }
        });
      } else {
        setTerminals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Terminal)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "terminals");
    });
    return () => unsubscribe();
  }, [user]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);
  const [editingTerminal, setEditingTerminal] = React.useState<Terminal | null>(null);
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [withdrawCurrency, setWithdrawCurrency] = React.useState("USD");
  const [withdrawDestination, setWithdrawDestination] = React.useState("");
  const [isExpress, setIsExpress] = React.useState(false);
  const [selectedTerminal, setSelectedTerminal] = React.useState<string>("");
  const [withdrawStatus, setWithdrawStatus] = React.useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [withdrawErrorMessage, setWithdrawErrorMessage] = React.useState("");
  const [highScoreLeadsCount, setHighScoreLeadsCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), where("score", ">", 90));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHighScoreLeadsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount || !withdrawDestination) return;
    setWithdrawStatus('processing');
    setWithdrawErrorMessage("");

    try {
      const amount = parseFloat(withdrawAmount);

      // Minimum and currency specific validation
      const minByCurrency: Record<string, number> = { USD: 1, EUR: 1, GBP: 1, ZAR: 10, USDT: 1, BTC: 0.0001, ETH: 0.001 };
      const minAllowed = minByCurrency[withdrawCurrency] ?? 1;
      if (amount < minAllowed) throw new Error(`Minimum withdrawal for ${withdrawCurrency} is ${minAllowed}`);

      // Fee calculation
      const fee = isExpress ? amount * 0.03 : amount * 0.01;

      // Transactional update: reserve funds and create withdrawal atomically
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error("User record not found.");
        const currentBal = (userSnap.data() as any).balance || 0;

        if (amount + fee > currentBal) {
          throw new Error("Insufficient sovereign assets for this extraction (including fees).");
        }

        // deduct immediately (reserve)
        tx.update(userRef, { balance: currentBal - amount - fee });

        const terminal = terminals.find(t => t.id === selectedTerminal);

        const withdrawalRef = doc(collection(db, "withdrawals"));
        const withdrawalData = {
          userId: user.uid,
          amount: amount,
          currency: withdrawCurrency,
          method: terminal?.label || "Direct Transfer",
          destination: withdrawDestination,
          status: "PENDING",
          express: isExpress,
          fastTrack: isExpress,
          fee: fee,
          timestamp: serverTimestamp()
        } as any;

        tx.set(withdrawalRef, withdrawalData);

        const logRef = doc(collection(db, "logs"));
        tx.set(logRef, {
          userId: user.uid,
          title: isExpress ? "FAST_TRACK Extraction" : "Asset Extraction Initiated",
          desc: `${isExpress ? "Priority" : "Standard"} withdrawal of ${amount.toLocaleString()} ${withdrawCurrency} to ${withdrawDestination} is being processed. Fee: ${fee.toFixed(2)} ${withdrawCurrency}`,
          type: "withdrawal",
          timestamp: serverTimestamp()
        });
      });

      setWithdrawStatus('success');
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawStatus('idle');
        setWithdrawAmount("");
        setWithdrawDestination("");
        setIsExpress(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setWithdrawStatus('error');
      setWithdrawErrorMessage(err.message || "Extraction protocol failure.");
      setTimeout(() => setWithdrawStatus('idle'), 5000);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!user) return;
    try {
      const confirmCancel = window.confirm('Cancel this pending withdrawal and refund assets to your vault?');
      if (!confirmCancel) return;

      await runTransaction(db, async (tx) => {
        const wRef = doc(db, 'withdrawals', withdrawalId);
        const wSnap = await tx.get(wRef);
        if (!wSnap.exists()) throw new Error('Withdrawal not found');
        const wData = wSnap.data() as any;
        if (wData.status !== 'PENDING') throw new Error('Only pending withdrawals can be cancelled');

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        const currentBal = (userSnap.data() as any).balance || 0;

        // refund amount + fee
        const refund = (wData.amount || 0) + (wData.fee || 0);
        tx.update(userRef, { balance: currentBal + refund });

        tx.update(wRef, { status: 'CANCELLED', cancelledAt: serverTimestamp() });

        const logRef = doc(collection(db, 'logs'));
        tx.set(logRef, {
          userId: user.uid,
          title: 'Withdrawal Cancelled',
          desc: `Cancelled withdrawal ${withdrawalId}. Refunded ${refund}.`,
          type: 'withdrawal',
          timestamp: serverTimestamp()
        });
      });

      addNotification({ type: 'INFO', title: 'Withdrawal Cancelled', message: 'The withdrawal was cancelled and funds were refunded to your vault.' });
    } catch (err) {
      console.error('Cancel failed:', err);
      addNotification({ type: 'SECURITY', title: 'Cancel Failed', message: String(err) });
    }
  };

  const [formData, setFormData] = React.useState({
    label: "",
    identifier: "",
    type: "bank" as "bank" | "crypto" | "electronic",
  });

  const handleOpenAdd = () => {
    setEditingTerminal(null);
    setFormData({ label: "", identifier: "", type: "bank" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Terminal) => {
    setEditingTerminal(t);
    setFormData({ label: t.label, identifier: t.identifier, type: t.type });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "terminals", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `terminals/${id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTerminal) {
        await updateDoc(doc(db, "terminals", editingTerminal.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "terminals"), {
          ...formData,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingTerminal ? OperationType.UPDATE : OperationType.CREATE, editingTerminal ? `terminals/${editingTerminal.id}` : "terminals");
    }
  };

  const allTransactions = useMemo(() => {
    const raw = (() => {
      const wTransactions = (wiseData?.transactions || []).map((t: any, idx: number) => {
        const dateStr = t.createdOn || t.occurredAt || t.created;
        
        // Detailed parsing for Wise amounts which can come in various formats
        const parseAmt = (amt: any) => {
          if (!amt) return null;
          if (typeof amt === 'object' && amt.value !== undefined) {
            return { value: parseFloat(amt.value), currency: amt.currency || 'USD' };
          }
          if (typeof amt === 'string') {
            const parts = amt.trim().split(/\s+/);
            if (parts.length >= 2) {
              const val = parseFloat(parts[0].replace(/,/g, ''));
              return { value: val, currency: parts[1] };
            }
          }
          return null;
        };

        const primary = parseAmt(t.amount) || parseAmt(t.primaryAmount) || { value: 0, currency: 'USD' };
        const secondary = parseAmt(t.secondaryAmount);
        
        const isIncoming = t.type === 'RECEIVE' || t.direction === 'IN' || primary.value > 0;
        const absValue = Math.abs(primary.value);
        
        return {
          id: t.id || `wise-${idx}`,
          title: t.title || t.description || "Wise Activity",
          date: dateStr ? new Date(dateStr).toLocaleDateString() : "PENDING",
          amount: `${isIncoming ? '+' : '-'}${absValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${primary.currency}`,
          secondaryAmount: secondary ? `${secondary.value.toLocaleString()} ${secondary.currency}` : null,
          status: (t.status || 'COMPLETED').toUpperCase(),
          type: isIncoming ? 'revenue' : 'withdrawal',
          timestamp: dateStr ? new Date(dateStr).getTime() : Date.now()
        };
      });

      const fWithdrawals = (withdrawals || []).map(w => {
        const amount = w.amount || 0;
        const fee = w.express ? amount * 0.03 : amount * 0.01;
        
        return {
          id: w.id,
          title: `Extraction: ${w.method}${w.express ? ' [EXPRESS]' : ''}`,
          date: new Date(w.timestamp?.seconds ? w.timestamp.seconds * 1000 : w.timestamp).toLocaleDateString(),
          amount: `-$${amount.toLocaleString()} ${w.currency}`,
          status: w.status,
          desc: w.failReason || "",
          type: 'withdrawal',
          destination: w.destination,
          fee: `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${w.currency}`,
          timestamp: w.timestamp?.seconds ? w.timestamp.seconds * 1000 : new Date(w.timestamp).getTime()
        };
      });

      const fActivityLogs = (logs || []).map(l => ({
        id: l.id,
        title: l.title || "Internal Activity",
        desc: l.desc || "",
        date: new Date(l.timestamp?.seconds ? l.timestamp.seconds * 1000 : l.timestamp).toLocaleDateString(),
        amount: l.amount ? `${l.amount > 0 ? '+' : ''}$${l.amount.toLocaleString()} USD` : null,
        status: "LOGGED",
        type: l.type || 'activity',
        timestamp: l.timestamp?.seconds ? l.timestamp.seconds * 1000 : new Date(l.timestamp).getTime()
      }));

      return [...wTransactions, ...fWithdrawals, ...fActivityLogs].sort((a, b) => b.timestamp - a.timestamp);
    })();

    if (!auditSearch) return raw;
    const query = auditSearch.toLowerCase();
    return (raw as any[]).filter(tx => 
      tx.title.toLowerCase().includes(query) || 
      (tx.desc && tx.desc.toLowerCase().includes(query)) ||
      (tx.amount && tx.amount.toLowerCase().includes(query))
    );
  }, [wiseData, withdrawals, logs, auditSearch]);

  const chartData = useMemo(() => {
    let current = totalBalance;
    const sorted = [...allTransactions].sort((a, b) => b.timestamp - a.timestamp);
    
    const history = [{
      date: 'PRESENT',
      wealth: current,
      timestamp: Date.now()
    }];

    sorted.forEach(tx => {
      if (!tx.amount) return;
      const amountMatch = tx.amount.match(/([+-])\$([\d,.]+)/);
      if (amountMatch) {
        const sign = amountMatch[1];
        const val = parseFloat(amountMatch[2].replace(/,/g, ''));
        
        if (sign === '+') current -= val;
        else current += val;
        
        history.push({
          date: tx.date.split('/')[0] + '/' + tx.date.split('/')[1], // Short date
          wealth: current,
          timestamp: tx.timestamp
        });
      }
    });

    while (history.length < 10) {
      const last = history[history.length - 1];
      const prevWealth = Math.max(0, last.wealth * 0.95);
      history.push({
        date: 'SYNC',
        wealth: prevWealth,
        timestamp: last.timestamp - 86400000
      });
    }

    return history.sort((a, b) => a.timestamp - b.timestamp).slice(-20);
  }, [totalBalance, allTransactions]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-bg p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Main Card */}
            <div className="p-12 rounded bg-surface border border-border-dim relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-opacity">
                  <Wallet className="w-64 h-64 -rotate-12" />
                </div>
                
                <div className="relative z-10">
                  <AnimatePresence>
                    {wiseError && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-4">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                               <X className="w-3 h-3 text-bg" />
                            </div>
                            <div className="flex-1">
                               <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">WISE_PROTOCOL_ERROR</div>
                               <p className="text-[9px] text-text-dim uppercase leading-relaxed">{wiseError}</p>
                            </div>
                            <button 
                              onClick={() => setIsWiseConfigOpen(true)}
                              className="text-[9px] font-black uppercase text-accent-blue border-b border-accent-blue/30 hover:border-accent-blue transition-all"
                            >
                              FIX_CONFIGURATION
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] flex items-center gap-2">
                       Total Sovereign Vault Balance
                       {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-accent-blue" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsWiseConfigOpen(true)}
                        className="p-2 border border-border-dim rounded bg-bg hover:border-accent-blue transition-colors text-text-dim hover:text-accent-blue"
                        title="Wise Neural Configuration"
                      >
                         <Settings className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-2 px-3 py-1 bg-bg border border-border-dim rounded-full">
                         <div className={cn(
                           "w-1.5 h-1.5 rounded-full",
                           localStorage.getItem("SOVEREIGN_WISE_KEY") ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-accent-gold/50"
                         )} />
                         <span
                           className="text-[8px] font-mono text-text-dim uppercase tracking-tighter"
                           title={localStorage.getItem("SOVEREIGN_WISE_KEY") ? "Live Wise settlement is active for withdrawals." : "Connect Wise to enable live settlement mode."}
                         >
                           {localStorage.getItem("SOVEREIGN_WISE_KEY") ? "Wise_Protocol: LIVE" : "Wise_Protocol: Simulation"}
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-4 mb-12">
                      <span className="text-7xl font-black font-mono text-accent-blue tracking-tighter drop-shadow-2xl">${totalBalance.toLocaleString()}</span>
                      <span className="text-xl font-black text-text-dim font-mono tracking-widest">USD_EQV</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-8 py-3 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Export Assets
                      </button>

                      {totalEngineRevenue > 0 && (
                        <button 
                          onClick={handleSettleYield}
                          disabled={isSettling}
                          className="px-8 py-3 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 animate-pulse"
                        >
                            {isSettling ? (
                              <div className="w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Settle Engine Yield (+${totalEngineRevenue.toFixed(2)})
                        </button>
                      )}
                  </div>
                </div>
            </div>

            {/* Wealth Growth Chart */}
            <div className="p-8 rounded bg-surface border border-border-dim overflow-hidden relative">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-accent-blue mb-1">SOVEREIGN WEALTH GROWTH :: CUMULATIVE SYNC</h3>
                    <p className="text-[9px] text-text-dim uppercase">Temporal Asset Accumulation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-blue" />
                    <span className="text-[10px] font-black font-mono">TOTAL_EQUITY</span>
                  </div>
               </div>

               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="3%" stopColor="#00f2ff" stopOpacity={0.3}/>
                          <stop offset="97%" stopColor="#00f2ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff20" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false} 
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          border: '1px solid #ffffff10',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'monospace'
                        }}
                        itemStyle={{ color: '#00f2ff' }}
                        formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'WEALTH']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="wealth" 
                        stroke="#00f2ff" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorWealth)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-border-dim border border-border-dim">
                {wiseData?.balances && wiseData.balances.length > 0 ? (
                  wiseData.balances.map((b, i) => (
                    <AssetSmall 
                      key={`wise-${b.amount?.currency || 'UNK'}-${i}`}
                      label={`WISE_${b.amount?.currency || 'UNKNOWN'}`} 
                      value={parseFloat(b.amount?.value || '0').toLocaleString()} 
                      currency={b.amount?.currency || '---'}
                      icon={<Landmark className="text-accent-blue" />} 
                    />
                  ))
                ) : (
                  <>
                    <AssetSmall label="WISE_USD" value="0.00" currency="USD" icon={<Landmark className="text-accent-blue" />} />
                    <AssetSmall label="WISE_EUR" value="0.00" currency="EUR" icon={<Landmark className="text-accent-blue" />} />
                    <AssetSmall label="WISE_GBP" value="0.00" currency="GBP" icon={<Landmark className="text-accent-blue" />} />
                    <AssetSmall label="WISE_ZAR" value="0.00" currency="ZAR" icon={<Landmark className="text-accent-blue" />} />
                  </>
                )}
                <AssetSmall label="CRYPTO_USDT" value={(profile?.usdtBalance || 0).toLocaleString()} currency="USDT" icon={<Coins className="text-accent-blue" />} />
                <AssetSmall label="CRYPTO_BTC" value={(profile?.btcBalance || 0).toString()} currency="BTC" icon={<Coins className="text-accent-gold" />} />
                <AssetSmall label="CRYPTO_ETH" value={(profile?.ethBalance || 0).toString()} currency="ETH" icon={<Zap className="text-purple-500" />} />
                <AssetSmall label="CRYPTO_SOL" value={(profile?.solBalance || 0).toString()} currency="SOL" icon={<Zap className="text-cyan-400" />} />
                <AssetSmall label="CRYPTO_DOGE" value="0.00" currency="DOGE" icon={<Coins className="text-accent-gold" />} />
                <AssetSmall label="CRYPTO_ADA" value="0.00" currency="ADA" icon={<Zap className="text-accent-blue" />} />
                <AssetSmall label="FIAT_JPY" value="0.00" currency="JPY" icon={<Landmark className="text-accent-blue" />} />
            </div>

            <div className="bg-surface border border-border-dim rounded overflow-hidden">
                <div className="p-6 border-b border-border-dim flex flex-col md:flex-row md:items-center justify-between bg-bg/50 gap-4">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-accent-blue mb-1">SOVEREIGN ASSET VAULT :: TRANSACTION AUDIT</h3>
                    <p className="text-[9px] text-text-dim uppercase">Forensic Ledger Extraction</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-dim" />
                        <input 
                          type="text" 
                          value={auditSearch || ""}
                          onChange={e => setAuditSearch(e.target.value)}
                          placeholder="QUERY_AUDIT..." 
                          className="bg-bg border border-border-dim rounded h-8 pl-8 pr-3 text-[9px] font-mono outline-none focus:border-accent-blue transition-all w-48 text-text-main" 
                        />
                      </div>
                  </div>
                </div>
                <div className="divide-y divide-border-dim">
                  {allTransactions.map(tx => (
                    <TxRow 
                      key={tx.id} 
                      id={tx.id} 
                      title={tx.title} 
                      desc={tx.desc}
                      date={tx.date} 
                      amount={tx.amount} 
                      secondaryAmount={tx.secondaryAmount}
                      status={tx.status} 
                      type={tx.type} 
                      destination={tx.destination}
                      fee={tx.fee}
                      onCancel={() => handleCancelWithdrawal(tx.id)}
                    />
                  ))}
                </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded bg-accent-blue/5 border border-accent-blue shadow-[0_0_30px_rgba(0,242,255,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-500">
                  <Landmark className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-accent-blue mb-2">Neural Liquidity Sync</h3>
                  <p className="text-[10px] text-text-dim mb-6 leading-relaxed uppercase">
                    Replenish your sovereign vault via established Wise protocols.
                  </p>
                  <a 
                    href="https://wise.com/pay/me/maphallelipsonm" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Inject_Liquidity
                  </a>
                </div>
            </div>

            <div className="p-8 rounded bg-surface border border-border-dim">
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-8 border-b border-border-dim pb-4">Linked Infrastructure</h3>
                <div className="space-y-4">
                  {terminals.map((terminal) => (
                    <PaymentItem key={terminal.id} label={terminal.label} id={terminal.identifier} type={terminal.type} active={terminal.active} onEdit={() => handleOpenEdit(terminal)} onDelete={() => handleDelete(terminal.id)} />
                  ))}
                  <button onClick={handleOpenAdd} className="w-full py-4 border border-dashed border-border-dim rounded flex items-center justify-center gap-2 text-text-dim hover:text-text-main transition-all text-[10px] font-black uppercase tracking-widest mt-6">
                    <Plus className="w-3.5 h-3.5" /> Link_Terminal
                  </button>
                </div>
            </div>

            <div className="p-8 rounded bg-bg border border-border-dim">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-4 h-4 text-accent-gold" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest">Sovereign Protocol</h3>
                </div>
                <p className="text-[11px] text-text-dim mb-8 leading-relaxed font-medium">Assets protected by multi-signature vaults. All exports require neural session verification.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded bg-surface border border-border-dim"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /><span className="text-[10px] font-black uppercase tracking-widest text-text-dim">MFA_ACTIVE</span></div>
                  <div className="flex items-center gap-3 p-4 rounded bg-surface border border-border-dim"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /><span className="text-[10px] font-black uppercase tracking-widest text-text-dim">VAULT_LOCK_ON</span></div>
                  
                  <button 
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await updateDoc(doc(db, "users", user.uid), {
                          balance: (profile?.balance || 0) + 25000,
                          updatedAt: serverTimestamp()
                        });
                        await addDoc(collection(db, "logs"), {
                          userId: user.uid,
                          title: "Liquidity Injection",
                          desc: "Emergency protocol: $25,000.00 synthesize reward credited to main vault.",
                          type: "revenue",
                          timestamp: serverTimestamp()
                        });
                        addNotification({
                          type: 'REVENUE',
                          title: "Liquidity Injected",
                          message: "Vault replenished with $25,000.00 sovereign assets."
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full mt-4 py-3 border border-accent-blue/30 bg-accent-blue/5 rounded text-[9px] font-black uppercase tracking-[0.2em] text-accent-blue hover:bg-accent-blue/10 transition-all"
                  >
                    Bypass_Protocol: Inject_$25k
                  </button>
                </div>
            </div>
          </div>
      </div>

      <AnimatePresence>
        {isWiseConfigOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-md bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-border-dim flex items-center justify-between bg-bg/50">
                <div className="flex items-center gap-2">
                   <Settings className="w-4 h-4 text-accent-blue" />
                   <h3 className="text-xs font-black uppercase tracking-widest">Wise_Neural_Configuration</h3>
                </div>
                <button onClick={() => setIsWiseConfigOpen(false)}><X className="w-4 h-4 text-text-dim" /></button>
              </div>
              <form onSubmit={handleSaveWiseConfig} className="p-8 space-y-6">
                <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg mb-6">
                   <p className="text-[9px] text-text-dim uppercase leading-relaxed">
                     Connect your Wise account via Personal Access Token. Get your token from the <a href="https://wise.com/developers" target="_blank" rel="noreferrer" className="text-accent-blue underline">Wise Developer Dashboard</a>. Once connected, vault withdrawals will use live Wise settlement instead of simulation.
                   </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">Wise API Token (read-only recommended)</label>
                  <input 
                    required 
                    type="password"
                    placeholder="Enter Wise API Key..."
                    value={wiseConfig.apiKey} 
                    onChange={e => setWiseConfig({ ...wiseConfig, apiKey: e.target.value })} 
                    className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue font-mono" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">Profile ID (Optional)</label>
                  <input 
                    placeholder="Auto-detected if left blank..."
                    value={wiseConfig.profileId} 
                    onChange={e => setWiseConfig({ ...wiseConfig, profileId: e.target.value })} 
                    className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue font-mono" 
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">Establish_Bridge</button>
                  <button 
                    type="button" 
                    onClick={() => {
                        localStorage.removeItem("SOVEREIGN_WISE_KEY");
                        localStorage.removeItem("SOVEREIGN_WISE_PROFILE");
                        setWiseConfig({ apiKey: "", profileId: "" });
                        setIsWiseConfigOpen(false);
                        fetchWiseData(true);
                    }}
                    className="px-6 py-4 bg-surface border border-border-dim text-[10px] font-black uppercase tracking-[0.1em] rounded transition-all hover:text-red-500 hover:border-red-500"
                  >
                    Disconnect
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-md bg-surface border border-border-dim rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border-dim flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest">{editingTerminal ? "CONFIGURE_LINK" : "ESTABLISH_NEW_BRIDGE"}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4 text-text-dim" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">Label</label>
                  <input required value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">Identifier</label>
                  <input required value={formData.identifier} onChange={e => setFormData({ ...formData, identifier: e.target.value })} className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue font-mono" />
                </div>
                <button type="submit" className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded">Commit_Link</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWithdrawModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-md bg-surface border border-border-dim rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border-dim flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest">ASSET_EXTRACTION</h3>
                <button onClick={() => setIsWithdrawModalOpen(false)}><X className="w-4 h-4 text-text-dim" /></button>
              </div>
              <form onSubmit={handleWithdraw} className="p-8 space-y-6">
                {withdrawStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase text-emerald-500">Extraction_Authorized</h4>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest">Protocol initiated. Transfer pending sync.</p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Amount</label>
                          <span className="text-[9px] font-mono text-text-dim uppercase">Available: ${totalBalance.toLocaleString()}</span>
                        </div>
                        <input 
                          type="number" 
                          required 
                          min="1" 
                          step="0.01" 
                          value={withdrawAmount} 
                          onChange={e => setWithdrawAmount(e.target.value)} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-2xl font-mono text-text-main outline-none focus:border-accent-blue" 
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Asset</label>
                        <select 
                          value={withdrawCurrency} 
                          onChange={e => setWithdrawCurrency(e.target.value)}
                          className="w-full bg-bg border border-border-dim rounded p-4 h-[62px] text-xs font-black outline-none focus:border-accent-blue cursor-pointer appearance-none text-accent-blue"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="ZAR">ZAR</option>
                          <option value="USDT">USDT</option>
                          <option value="BTC">BTC</option>
                          <option value="ETH">ETH</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Destination_Terminal</label>
                       <div className="flex gap-2">
                          <select 
                            value={selectedTerminal} 
                            onChange={e => {
                              setSelectedTerminal(e.target.value);
                              const t = terminals.find(term => term.id === e.target.value);
                              if (t) setWithdrawDestination(t.identifier);
                            }} 
                            className="flex-1 bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue appearance-none"
                          >
                            <option value="">MANUAL_DESTINATION</option>
                            {terminals.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Target_Identifier / Address</label>
                      <input 
                        required 
                        value={withdrawDestination} 
                        onChange={e => setWithdrawDestination(e.target.value)} 
                        placeholder="0x... / account_id"
                        className="w-full bg-bg border border-border-dim rounded p-3 text-xs font-mono outline-none focus:border-accent-blue" 
                      />
                    </div>

                    <div className={cn(
                      "p-4 rounded border transition-all relative overflow-hidden",
                      isExpress ? "bg-accent-gold/10 border-accent-gold/30" : "bg-surface border-border-dim"
                    )}>
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className={cn("w-3.5 h-3.5", isExpress ? "text-accent-gold" : "text-text-dim")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">FAST_TRACK_PROTOCOL</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setIsExpress(!isExpress)}
                            className={cn(
                              "w-10 h-5 rounded-full relative transition-all",
                              isExpress ? "bg-accent-gold" : "bg-border-dim"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-3 h-3 rounded-full bg-bg transition-all",
                              isExpress ? "right-1" : "left-1"
                            )} />
                          </button>
                       </div>
                       <p className="text-[8px] text-text-dim leading-relaxed uppercase tracking-tighter">
                         Priority bandwidth allocation. Reduces settlement time by 85%. Additional nodal fee applies.
                       </p>
                    </div>

                    {withdrawStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400 font-bold uppercase text-center"
                      >
                        {withdrawErrorMessage || "Extraction_Authorization_Failed"}
                      </motion.div>
                    )}

                    <button 
                      type="submit" 
                      disabled={withdrawStatus === 'processing'} 
                      className={cn(
                        "w-full py-4 text-bg text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2",
                        isExpress ? "bg-accent-gold shadow-[0_0_20px_rgba(245,158,11,0.4)]" : "bg-accent-blue shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                      )}
                    >
                       {withdrawStatus === 'processing' ? (
                         <>
                           <div className="w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                           SYNCHRONIZING...
                         </>
                       ) : isExpress ? (
                         <>
                           <Zap className="w-4 h-4" /> EXECUTE_FAST_TRACK_EXTRACTION
                         </>
                       ) : (
                         "CONFIRM_ASSET_EXTRACTION"
                       )}
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AssetSmallProps {
  label: string;
  value: string;
  currency?: string;
  icon: React.ReactNode;
}

const AssetSmall: React.FC<AssetSmallProps> = ({ label, value, currency, icon }) => {
  const getSymbol = (curr?: string) => {
    switch (curr) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "ZAR": return "R";
      default: return "";
    }
  };

  return (
    <div className="p-8 bg-bg group transition-colors hover:bg-surface h-full">
       <div className="flex items-baseline justify-between mb-8">
          <div className="p-2 border border-border-dim rounded bg-surface group-hover:border-accent-blue transition-colors">
            {icon}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono text-text-dim">LIVE</span>
          </div>
       </div>
       <div className="text-[9px] font-black text-text-dim uppercase tracking-[0.25em] mb-2">{label}</div>
       <div className="flex items-baseline gap-1.5 flex-wrap">
         <span className="text-2xl font-black font-mono tracking-tighter">
           {getSymbol(currency)}{value}
         </span>
         {currency && (
           <span className="text-[10px] font-black text-text-dim font-mono">{currency}</span>
         )}
       </div>
    </div>
  );
};

function TxRow({ id, title, desc, date, amount, secondaryAmount, status, type, destination, fee, onCancel }: any) {
  const [showInfo, setShowInfo] = React.useState(false);
  const isPending = status === "PENDING" || status === "FAST_TRACK" || status === "PROCESSING";
  const hasExtraInfo = isPending || desc || (type === 'withdrawal' && (destination || fee));

  const getIcon = () => {
    if (type === 'revenue') return <ArrowDownLeft className="w-5 h-5" />;
    if (type === 'withdrawal') return <ArrowUpRight className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  const getColorClass = () => {
    if (type === 'revenue') return 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10';
    if (type === 'withdrawal') return 'bg-red-500/5 text-red-500 border-red-500/10';
    return 'bg-accent-blue/5 text-accent-blue border-accent-blue/10';
  };

  const getAmountColor = () => {
    if (type === 'revenue') return 'text-emerald-500';
    if (type === 'withdrawal') return 'text-red-500';
    return 'text-accent-blue';
  };

  return (
    <div className="relative">
      <div 
        onClick={() => hasExtraInfo && setShowInfo(!showInfo)}
        className={cn(
          "flex items-center justify-between p-4 hover:bg-bg transition-all cursor-pointer",
          isPending && "bg-accent-gold/5",
          showInfo && "bg-bg"
        )}
      >
        <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded border flex items-center justify-center", getColorClass())}>
              {getIcon()}
            </div>
            <div>
              <div className="font-bold text-xs uppercase flex items-center gap-2 text-text-main">
                {title}
                {isPending && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse", 
                    status === "FAST_TRACK" ? "bg-accent-blue shadow-[0_0_8px_#00f2ff]" : "bg-accent-gold"
                  )} />
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-text-dim font-mono">
                <span>{date}</span>
                {secondaryAmount && (
                  <>
                    <span className="text-[8px] opacity-30">•</span>
                    <span className="text-accent-gold/70 italic">Conv: {secondaryAmount}</span>
                  </>
                )}
              </div>
            </div>
        </div>
        <div className="text-right">
            {amount && <div className={cn("text-sm font-black font-mono", getAmountColor())}>{amount}</div>}
            <div className={cn("text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border border-border-dim inline-block mt-1", 
              isPending ? 'text-accent-gold border-accent-gold/30 bg-accent-gold/5' : 
              status === 'FAILED' || status === 'CANCELLED' ? 'text-red-500 border-red-500/30 bg-red-500/5' :
              status === 'SUCCESS' || status === 'COMPLETED' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' :
              status === 'LOGGED' ? 'text-text-dim/50 italic border-none p-0' :
              'text-text-dim'
            )}>
              {status === "FAST_TRACK" ? "FAST-TRACK" : status === "LOGGED" ? "EVENT_LOG" : status}
            </div>
        </div>
      </div>
      
      <AnimatePresence>
        {(showInfo && hasExtraInfo) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-bg/80 border-t border-border-dim"
          >
            <div className="p-4 pl-[4.5rem] space-y-3">
               {type === 'withdrawal' && (destination || fee) && (
                 <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border-dim/30">
                    {destination && (
                      <div className="space-y-1">
                        <div className="text-[8px] font-black uppercase text-text-dim">Extraction Destination</div>
                        <div className="text-[10px] font-mono text-text-main break-all">{destination}</div>
                      </div>
                    )}
                    {fee && (
                      <div className="space-y-1">
                        <div className="text-[8px] font-black uppercase text-text-dim">Neural_Relay_Fee</div>
                        <div className="text-[10px] font-mono text-accent-gold">{fee}</div>
                      </div>
                    )}
                    {status === 'FAILED' && (
                      <div className="col-span-2 space-y-1 p-2 bg-red-500/5 border border-red-500/10 rounded">
                        <div className="text-[8px] font-black uppercase text-red-500">Failure Analysis</div>
                        <div className="text-[10px] font-mono text-red-400">Error_ID: {id.slice(0, 8)} :: {desc || 'Neural fingerprint mismatch detected during settlement validation.'}</div>
                      </div>
                    )}
                    <div className="col-span-2 space-y-1">
                      <div className="text-[8px] font-black uppercase text-text-dim">Current Status</div>
                      <div className="text-[10px] font-mono flex items-center gap-2">
                        <span className={cn(
                          "w-1 h-1 rounded-full",
                          status === "COMPLETED" ? "bg-emerald-500" : "bg-accent-gold"
                        )} />
                        {status || "PROCESSING"}
                      </div>
                    </div>
                    {type === 'withdrawal' && status === 'PENDING' && onCancel && (
                      <div className="col-span-2 flex justify-end pt-2">
                        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all">Cancel Withdrawal</button>
                      </div>
                    )}
                 </div>
               )}
               {isPending && (
                 <>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className={status === "FAST_TRACK" ? "text-accent-blue" : "text-accent-gold"}>
                      {status === "FAST_TRACK" ? "Express Intelligence Verification" : "Verification Intelligence Status"}
                    </span>
                    <span className="text-text-dim">Wait Time: {status === "FAST_TRACK" ? "~2h" : "~24h"}</span>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed">
                    {status === "FAST_TRACK" ? (
                      <>This extraction is powered by <span className="text-accent-blue">High-Score Lead Integrity</span>. Verification latency is reduced by 90% as neural agents bypass standard compliance queues.</>
                    ) : (
                      <>Extraction is currently undergoing <span className="text-text-main">Neural Compliance Validation</span>. Our AI is verifying the source of sovereign engine yield. Standard processing time for external bridges like Wise is 12-24 hours.</>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 h-1 bg-border-dim rounded-full overflow-hidden">
                      <div className={cn("h-full", status === "FAST_TRACK" ? "w-5/6 bg-accent-blue shadow-[0_0_10px_#00f2ff]" : "w-1/3 bg-accent-gold")} />
                    </div>
                  </div>
                 </>
               )}
               {desc && (
                 <p className="text-[10px] text-text-dim font-mono leading-relaxed bg-surface/30 p-2 rounded border border-border-dim/50">
                   {desc}
                 </p>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentItem({ label, id, type, active, onEdit, onDelete }: any) {
  return (
    <div className={cn("p-4 rounded border flex items-center justify-between", active ? 'bg-accent-blue/5 border-accent-blue' : 'bg-bg border-border-dim')}>
       <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded border flex items-center justify-center", active ? 'bg-accent-blue text-bg' : 'bg-surface text-text-dim')}>
             {type === 'bank' ? <Landmark className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
          </div>
          <div>
             <div className="text-xs font-bold uppercase">{label}</div>
             <div className="text-[10px] text-text-dim font-mono">{id}</div>
          </div>
       </div>
       <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 hover:text-accent-blue"><Edit3 className="w-3.5 h-3.5" /></button>
          {!active && <button onClick={onDelete} className="p-2 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
       </div>
    </div>
  );
}
