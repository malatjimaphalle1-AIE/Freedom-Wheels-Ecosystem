import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  Zap, 
  Database, 
  Cloud, 
  CheckCircle2, 
  Terminal, 
  ExternalLink,
  ShieldAlert,
  Edit2,
  RefreshCw,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./utils";
import { useAuth } from "./AuthContext";
import { SovereignMedia } from "./SovereignMedia";
import { getModelName } from "./geminiService";
import { db, handleFirestoreError, OperationType, createLog } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z-_]{35}$/;

interface KeyStatus {
  isValid: boolean | null;
  isSaving: boolean;
  message: string;
}

export default function UserProfile() {
  const { user, profile, isAdmin } = useAuth();
  
  // Basic Info State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // API Keys State
  const [config, setConfig] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [geminiStatus, setGeminiStatus] = useState<KeyStatus>({ isValid: null, isSaving: false, message: "" });
  const [vaultStatus, setVaultStatus] = useState<"idle" | "loading" | "synced" | "error">("idle");
  const [activeSection, setActiveSection] = useState<"identity" | "persona" | "vault" | "security">("identity");

  const PERSONA_CONFIGS = [
    { id: "tone", label: "Communication_Tone", options: ["Technical", "Aggressive", "Minimalist", "Sovereign"] },
    { id: "focus", label: "Neural_Optimization_Priority", options: ["Traffic", "Conversion", "Revenue", "Balance"] },
    { id: "intensity", label: "Holographic_Interface_Intensity", options: ["Low", "Standard", "Ultra", "Godmode"] }
  ];

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setEmail(profile.email || "");
      setConfig(prev => ({
        ...prev,
        tone: profile.tone || prev.tone || "Technical",
        focus: profile.focus || prev.focus || "Balance",
        intensity: profile.intensity || prev.intensity || "Standard"
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const loadVault = async () => {
      setVaultStatus("loading");
      try {
        const vaultRef = doc(db, "users", user.uid, "private", "keys");
        const vaultSnap = await getDoc(vaultRef);
        
        if (vaultSnap.exists()) {
          const data = vaultSnap.data();
          setConfig(data || {});
          setVaultStatus("synced");
        } else {
          setVaultStatus("idle");
        }
      } catch (err) {
        console.error("Vault Access Denied:", err);
        setVaultStatus("error");
      }
    };

    loadVault();
  }, [user]);

  const profileCompletion = Math.min(100, [
    !!displayName,
    !!email,
    !!config.geminiKey,
    !!config.wiseKey,
    !!config.wiseProfileId
  ].filter(Boolean).length * 20);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileStatus("saving");
    try {
      // 1. Update Firebase Auth Object
      await updateProfile(user, { displayName });

      // 2. Update Firestore Profile
      const userRef = doc(db, "users", user.uid);
      
      // Extract persona keys to save in main profile
      const personaData = {
        tone: config.tone || "Technical",
        focus: config.focus || "Balance",
        intensity: config.intensity || "Standard"
      };

      await updateDoc(userRef, {
        displayName,
        email, 
        ...personaData,
        updatedAt: serverTimestamp()
      });

      setProfileStatus("success");
      setIsEditingProfile(false);
      
      // Also log the update
      await createLog(user.uid, "Architect Sync", "Matrix identity and persona protocols updated.", "system");

      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      setProfileStatus("error");
    }
  };

  const handleFieldChange = (id: string, value: string, pattern?: RegExp, errorMessage?: string) => {
    setConfig(prev => ({ ...prev, [id]: value }));
    
    if (pattern && value && !pattern.test(value)) {
      setValidationErrors(prev => ({ ...prev, [id]: errorMessage || "Invalid Protocol." }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const syncToVault = async () => {
    if (!user) return;

    setVaultStatus("loading");
    try {
      const vaultRef = doc(db, "users", user.uid, "private", "keys");
      await setDoc(vaultRef, {
        ...config,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setVaultStatus("synced");
      setGeminiStatus({ isValid: true, isSaving: false, message: "SYNC_COMPLETE" });
      
      setTimeout(() => {
        setGeminiStatus(prev => ({ ...prev, isValid: null, message: "" }));
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/keys`);
      setVaultStatus("error");
    }
  };

  const testNeuralChannel = async () => {
    if (!config.geminiKey || !GEMINI_KEY_PATTERN.test(config.geminiKey)) {
      setGeminiStatus({ isValid: false, isSaving: false, message: "Invalid key format for probing." });
      return;
    }

    setGeminiStatus({ isValid: null, isSaving: true, message: "Pinging AI Studio Neural Core..." });
    localStorage.setItem("SOVEREIGN_GEMINI_KEY", config.geminiKey);

    try {
      const { getGeminiModel } = await import("./gemini");
      const model = getGeminiModel();
      await model.models.generateContent({
        model: getModelName(),
        contents: "ping"
      });
      
      setGeminiStatus({ isValid: true, isSaving: false, message: "Neural Link Established. System Optimal." });
    } catch (err: any) {
      console.error("Neural Probe Failure:", err);
      setGeminiStatus({ isValid: false, isSaving: false, message: "Connection rejected by Neural Core." });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-accent-blue/10 border border-accent-blue/20 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
              <UserIcon className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-text-main">
                Architect_Persona_Matrix
              </h1>
              <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest mt-2">
                Identity verification and authentication protocol management.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4 rounded-3xl border border-border-dim bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-dim">Profile_Health</p>
                  <p className="mt-1 text-sm font-black uppercase tracking-tight text-text-main">Completion Status</p>
                </div>
                <div className="text-2xl font-black text-accent-blue">{profileCompletion}%</div>
              </div>
              <div className="h-2 rounded-full bg-border-dim overflow-hidden">
                <div className="h-full rounded-full bg-accent-blue" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="text-[10px] text-text-dim leading-5">Complete your architect profile and vault sync to keep core protocols aligned and unlock optimized system performance.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/dashboard" className="rounded-2xl border border-border-dim bg-bg px-4 py-3 text-[9px] font-black uppercase tracking-[0.35em] text-text-main text-center transition hover:border-accent-blue hover:bg-accent-blue/5">
                Command Center
              </Link>
              <Link to="/settings" className="rounded-2xl border border-border-dim bg-bg px-4 py-3 text-[9px] font-black uppercase tracking-[0.35em] text-text-main text-center transition hover:border-accent-gold hover:bg-accent-gold/5">
                System Settings
              </Link>
              <Link to="/wallet" className="rounded-2xl border border-border-dim bg-bg px-4 py-3 text-[9px] font-black uppercase tracking-[0.35em] text-text-main text-center transition hover:border-accent-emerald hover:bg-accent-emerald/5">
                Vault & Wallet
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="xl:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-dim rounded-2xl p-8 relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap className="w-32 h-32 text-accent-blue" />
            </div>

            <div className="relative mx-auto w-32 h-32 mb-6 group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-gold to-accent-blue rounded-full animate-spin-slow opacity-20" />
              <div className="absolute -inset-1 bg-accent-blue/20 rounded-full blur-md group-hover:bg-accent-blue/40 transition-colors" />
              <div className="relative w-full h-full rounded-full border-2 border-surface overflow-hidden bg-bg">
                <SovereignMedia 
                  type="image"
                  aspectRatio="1:1"
                  src={user?.photoURL}
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                  prompt={`Portrait of ${displayName || user?.displayName || "a digital architect"}, high-tech minimalist style, holographic interface elements, dark background.`}
                  autoGenerate={true}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-accent-blue text-bg p-1.5 rounded-lg border-2 border-surface shadow-lg">
                <Zap className="w-3 h-3 fill-bg" />
              </div>
            </div>

            <h2 className="text-lg font-black uppercase tracking-tight text-text-main mb-1">
              {profile?.displayName || user?.displayName || "UNIDENTIFIED_ARCHITECT"}
            </h2>
            {isAdmin && (
              <div className="text-[9px] uppercase tracking-[0.25em] text-accent-gold font-black">
                MASTER ARCHITECT
              </div>
            )}
            <div className="text-[9px] font-mono text-accent-gold border border-accent-gold/20 px-3 py-1 rounded-full bg-accent-gold/5 uppercase tracking-[0.2em] inline-block mb-6">
              LVL_{profile?.level || 1}_SOVEREIGN_OPERATOR
            </div>

            <div className="space-y-4 pt-6 border-t border-border-dim/30">
               <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-text-dim">
                  <span>Protocols_Synced</span>
                  <span className="text-text-main">{profile?.referralCount || 0}</span>
               </div>
               <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-text-dim">
                  <span>Balance_Reserve</span>
                  <span className="text-accent-blue">${profile?.balance?.toLocaleString() || "0.00"}</span>
               </div>
               <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-text-dim">
                  <span>Authority_Role</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px]",
                    profile?.role === 'ADMIN' ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/20" : "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                  )}>{profile?.role || "USER"}</span>
               </div>
            </div>
          </motion.div>

          <div className="bg-surface border border-border-dim rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-accent-gold" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">Neural_Access_Logs</h3>
            </div>
            <div className="space-y-3">
               {[
                 { action: "SYNC_REQUEST", target: "VAULT_BETA", time: "2m ago", status: "VERIFIED" },
                 { action: "KEY_ROTATION", target: "GEMINI_CORE", time: "1h ago", status: "COMPLETED" },
                 { action: "LOGIN_INIT", target: "USER_INTERFACE", time: "4h ago", status: "SUCCESS" }
               ].map((log, i) => (
                 <div key={i} className="flex items-center justify-between p-2 rounded bg-bg/50 border border-border-dim/30 group hover:border-accent-blue/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-text-main">{log.action}</span>
                      <span className="text-[7px] font-mono text-text-dim">{log.target}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] font-mono text-emerald-500">{log.status}</div>
                      <div className="text-[7px] text-text-dim">{log.time}</div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Info & Keys Form */}
        <div className="xl:col-span-8 space-y-6">
          <div className="rounded-3xl border border-border-dim bg-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-dim">WORKFLOW_NAVIGATION</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-text-main">Profile Control Panel</h2>
              </div>
              <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'identity', label: 'Identity' },
                  { id: 'persona', label: 'Persona' },
                  { id: 'vault', label: 'Vault' },
                  { id: 'security', label: 'Security' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSection(tab.id as typeof activeSection)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.35em] transition-all",
                      activeSection === tab.id
                        ? "bg-accent-blue text-bg shadow-[0_18px_45px_rgba(0,242,255,0.22)] ring-2 ring-accent-blue/30 border border-accent-blue/20"
                        : "bg-bg border border-border-dim text-text-dim hover:border-accent-blue hover:text-text-main"
                    )}
                  >
                    {activeSection === tab.id && (
                      <motion.span
                        layoutId="tab-highlight"
                        className="absolute inset-0 bg-accent-blue/10"
                        initial={false}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeSection === 'identity' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-border-dim bg-bg/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit2 className="w-4 h-4 text-accent-blue" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-main">CORE_IDENTITY_CONFIG</h3>
                </div>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-[9px] font-black uppercase rounded hover:bg-accent-blue hover:text-bg transition-all"
                  >
                    MODIFY_PERSONA
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-text-dim text-[9px] font-black uppercase hover:text-text-main"
                  >
                    CANCEL_SYNC
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-widest">
                        <UserIcon className="w-3 h-3" /> ARCHITECT_DESIGNATION
                      </label>
                      <input 
                        disabled={!isEditingProfile}
                        type="text" 
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Neural Architect Name"
                        className="w-full bg-bg border border-border-dim rounded p-4 text-xs font-black tracking-tight text-text-main outline-none focus:border-accent-blue disabled:opacity-50 transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-widest">
                        <Mail className="w-3 h-3" /> COMM_CHANNEL_ADDRESS
                      </label>
                      <input 
                        disabled={!isEditingProfile}
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="architect@ecosystem.core"
                        className="w-full bg-bg border border-border-dim rounded p-4 text-xs font-black tracking-tight text-text-main outline-none focus:border-accent-blue disabled:opacity-50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditingProfile && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-4"
                      >
                        <button 
                          type="submit"
                          disabled={profileStatus === 'saving'}
                          className="w-full py-4 bg-accent-blue text-bg text-[11px] font-black uppercase tracking-[0.2em] rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {profileStatus === 'saving' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          SAVE_ARCHITECT_PROFILE
                        </button>
                      </motion.div>
                    )}

                    {profileStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Identity Matrix Synchronized Successfully</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </motion.div>
          )}

          {activeSection === 'persona' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-border-dim bg-bg/30">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-accent-blue" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-main">PERSONA_NEURAL_CALIBRATION</h3>
                    <p className="text-[9px] text-text-dim uppercase tracking-widest">Tune core behavior, tone, and conversion focus for your architect persona.</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PERSONA_CONFIGS.map(cfg => (
                    <div key={cfg.id} className="space-y-3">
                      <label className="text-[9px] font-black text-text-dim uppercase tracking-widest">{cfg.label}</label>
                      <select
                        disabled={!isEditingProfile}
                        value={config[cfg.id] || cfg.options[0]}
                        onChange={e => handleFieldChange(cfg.id, e.target.value)}
                        className="w-full bg-bg border border-border-dim rounded p-3 text-[10px] font-black text-text-main outline-none focus:border-accent-blue appearance-none cursor-pointer disabled:opacity-50 transition-all"
                      >
                        {cfg.options.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border border-border-dim bg-bg p-5 space-y-4">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.35em] text-text-dim">
                    <span>Persona Scorecard</span>
                    <span className="font-black text-text-main">Optimized</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-surface border border-border-dim p-4 text-[10px] uppercase tracking-[0.35em] text-text-dim">
                      <div className="font-black text-text-main mb-2">Tone</div>
                      <div className="text-sm font-black text-accent-blue">{config.tone || 'Technical'}</div>
                    </div>
                    <div className="rounded-2xl bg-surface border border-border-dim p-4 text-[10px] uppercase tracking-[0.35em] text-text-dim">
                      <div className="font-black text-text-main mb-2">Focus</div>
                      <div className="text-sm font-black text-accent-gold">{config.focus || 'Balance'}</div>
                    </div>
                    <div className="rounded-2xl bg-surface border border-border-dim p-4 text-[10px] uppercase tracking-[0.35em] text-text-dim">
                      <div className="font-black text-text-main mb-2">Intensity</div>
                      <div className="text-sm font-black text-emerald-500">{config.intensity || 'Standard'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'vault' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border-dim rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-border-dim bg-bg/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-accent-gold" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Neural_Access_Protocols</h3>
                    <p className="text-[9px] text-text-dim uppercase tracking-widest">Secure your gateway tokens and vault configuration in one place.</p>
                  </div>
                </div>
                <button 
                  onClick={syncToVault}
                  disabled={vaultStatus === 'loading'}
                  className="px-4 py-2 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-[9px] font-black uppercase rounded hover:bg-accent-gold hover:text-bg transition-all flex items-center gap-2"
                >
                  <Cloud className="w-3 h-3" /> {vaultStatus === 'loading' ? 'SYNCING...' : 'VAULT_COMMIT'}
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20">
                        <Zap className="w-3.5 h-3.5 text-accent-blue" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Google_Gemini_Neural_Uplink</h4>
                    </div>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[8px] font-black text-accent-blue hover:underline uppercase flex items-center gap-1"
                    >
                      GENERATE_UPLINK_TOKEN <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative group">
                    <input 
                      type={visibility.geminiKey ? "text" : "password"}
                      value={config.geminiKey || ""}
                      onChange={e => handleFieldChange("geminiKey", e.target.value, GEMINI_KEY_PATTERN)}
                      placeholder="AIzaSy... (Uplink Protocol Token)"
                      className="w-full bg-bg border border-border-dim rounded p-4 text-[11px] font-mono text-accent-blue outline-none focus:border-accent-blue transition-all"
                    />
                    <button 
                      onClick={() => setVisibility(prev => ({ ...prev, geminiKey: !prev.geminiKey }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main p-1"
                    >
                      {visibility.geminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {geminiStatus.isValid === true ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Terminal className="w-3 h-3 text-text-dim" />
                      )}
                      <span className="text-[8px] font-mono text-text-dim uppercase">
                        {geminiStatus.message || "PROTOCOL_IDLE: Awaiting neural probe."}
                      </span>
                    </div>
                    <button 
                      onClick={testNeuralChannel}
                      disabled={!config.geminiKey || geminiStatus.isSaving}
                      className="px-3 py-1.5 border border-border-dim rounded text-[8px] font-black uppercase tracking-widest hover:border-accent-blue hover:text-accent-blue transition-all group"
                    >
                      {geminiStatus.isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : "PROBE_CONNECTION"}
                    </button>
                  </div>
                </div>
                <div className="border-t border-border-dim/50 my-2" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-accent-gold/10 border border-accent-gold/20">
                      <Database className="w-3.5 h-3.5 text-accent-gold" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Wise_Financial_Settlement_Node</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-text-dim uppercase">Secret_Sync_Key</label>
                      <div className="relative">
                        <input 
                          type={visibility.wiseKey ? "text" : "password"}
                          value={config.wiseKey || ""}
                          onChange={e => handleFieldChange("wiseKey", e.target.value)}
                          placeholder="wise_prod_..."
                          className="w-full bg-bg border border-border-dim rounded p-3 text-[11px] font-mono text-accent-gold outline-none focus:border-accent-gold/50"
                        />
                        <button 
                          onClick={() => setVisibility(prev => ({ ...prev, wiseKey: !prev.wiseKey }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim"
                        >
                          {visibility.wiseKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-text-dim uppercase">Profile_Identifier</label>
                      <input 
                        type="text"
                        value={config.wiseProfileId || ""}
                        onChange={e => handleFieldChange("wiseProfileId", e.target.value)}
                        placeholder="1234567"
                        className="w-full bg-bg border border-border-dim rounded p-3 text-[11px] font-mono text-text-main outline-none focus:border-accent-gold/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8"
            >
              <div className="flex items-start gap-5">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Lock className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-500">Neural_Vault_Encryption_Notice</h3>
                  <p className="text-[11px] leading-relaxed text-text-dim max-w-2xl">
                    Your biometric keys and neural protocol tokens are handled via client-side SHA-256 encryption before being committed to the Sovereign Cloud Archive.
                    Ensure your terminal is in a high-security environment when modifying protocol keys. Never share these tokens with non-verified ecosystem nodes.
                  </p>
                  <div className="rounded-3xl border border-red-500/20 bg-bg p-4 space-y-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.35em] text-red-500">Security Checklist</div>
                    <ul className="space-y-2 text-[10px] text-text-main">
                      <li>• Keep your neural keys private and rotate them regularly.</li>
                      <li>• Sync vault state only from trusted devices.</li>
                      <li>• Confirm your access policy before sharing credentials.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
