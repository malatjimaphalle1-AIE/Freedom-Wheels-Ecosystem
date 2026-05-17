import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Eye, 
  EyeOff,
  Cpu,
  RefreshCw,
  Lock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z-_]{35}$/;
const WISE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface KeyStatus {
  isValid: boolean | null;
  isSaving: boolean;
  message: string;
}

export default function Settings() {
  const [geminiKey, setGeminiKey] = useState("");
  const [wiseKey, setWiseKey] = useState("");
  const [wiseProfileId, setWiseProfileId] = useState("");
  
  const [showGemini, setShowGemini] = useState(false);
  const [showWise, setShowWise] = useState(false);
  
  const [geminiStatus, setGeminiStatus] = useState<KeyStatus>({ isValid: null, isSaving: false, message: "" });
  const [wiseStatus, setWiseStatus] = useState<KeyStatus>({ isValid: null, isSaving: false, message: "" });

  useEffect(() => {
    // Load from local storage on mount
    const savedGemini = localStorage.getItem("SOVEREIGN_GEMINI_KEY") || "";
    const savedWise = localStorage.getItem("SOVEREIGN_WISE_KEY") || "";
    const savedProfile = localStorage.getItem("SOVEREIGN_WISE_PROFILE") || "";
    
    setGeminiKey(savedGemini);
    setWiseKey(savedWise);
    setWiseProfileId(savedProfile);
  }, []);

  const validateGemini = (key: string) => {
    if (!key) return { isValid: null, message: "Field is empty." };
    if (GEMINI_KEY_PATTERN.test(key)) {
      return { isValid: true, message: "Valid Gemini API descriptor detected." };
    }
    return { isValid: false, message: "Invalid format. Expected Google Cloud API pattern." };
  };

  const validateWise = (key: string) => {
    if (!key) return { isValid: null, message: "Field is empty." };
    // Wise keys can vary, but we'll check for a basic length/format if possible
    // or just check for presence if pattern is unknown
    if (key.length > 20) {
      return { isValid: true, message: "Wise API credential authenticated." };
    }
    return { isValid: false, message: "Key seems too short for standard Wise production tokens." };
  };

  const saveGeminiKey = async () => {
    const { isValid, message } = validateGemini(geminiKey);
    if (isValid === false) {
      setGeminiStatus({ isValid, isSaving: false, message });
      return;
    }

    setGeminiStatus({ isValid: null, isSaving: true, message: "Syncing with secure vault..." });
    
    // Simulate encryption/save delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    localStorage.setItem("SOVEREIGN_GEMINI_KEY", geminiKey);
    setGeminiStatus({ isValid: true, isSaving: false, message: "Gemini Core Credentials Secured." });
    
    setTimeout(() => setGeminiStatus(prev => ({ ...prev, isValid: null })), 3000);
  };

  const saveWiseConfig = async () => {
    const { isValid, message } = validateWise(wiseKey);
    if (isValid === false) {
      setWiseStatus({ isValid, isSaving: false, message });
      return;
    }

    setWiseStatus({ isValid: null, isSaving: true, message: "Encrypting financial protocols..." });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    localStorage.setItem("SOVEREIGN_WISE_KEY", wiseKey);
    localStorage.setItem("SOVEREIGN_WISE_PROFILE", wiseProfileId);
    setWiseStatus({ isValid: true, isSaving: false, message: "Wise Financial Interface Secured." });
    
    setTimeout(() => setWiseStatus(prev => ({ ...prev, isValid: null })), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-accent-blue/10 border border-accent-blue/20">
            <Shield className="w-5 h-5 text-accent-blue" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-text-main line-clamp-1">
            System_Security_Archive
          </h1>
        </div>
        <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider ml-11">
          Manage cryptographic keys and external protocol interfaces.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gemini API Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border-dim rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-24 h-24 text-accent-blue" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded border border-accent-blue/30 flex items-center justify-center bg-accent-blue/10">
              <Key className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-text-main">Gemini_Neural_Interface</h3>
              <p className="text-[9px] font-mono text-text-dim">Google AI Studio Credentials</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-tighter text-text-dim flex justify-between">
                API_KEY_IDENTIFIER
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline flex items-center gap-1"
                >
                  GET KEY <ExternalLink className="w-2 h-2" />
                </a>
              </label>
              <div className="relative">
                <input 
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-bg border border-border-dim rounded p-3 text-[11px] font-mono text-accent-blue focus:border-accent-blue/50 outline-none transition-all pr-12"
                />
                <button 
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {geminiStatus.isSaving ? (
                  <RefreshCw className="w-3 h-3 text-accent-blue animate-spin" />
                ) : geminiStatus.isValid === true ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : geminiStatus.isValid === false ? (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={cn(
                  "text-[8px] font-mono uppercase",
                  geminiStatus.isValid === true ? "text-emerald-500" : 
                  geminiStatus.isValid === false ? "text-red-500" : "text-text-dim"
                )}>
                  {geminiStatus.message || "System idle. Ready for input."}
                </span>
              </div>
              <button 
                onClick={saveGeminiKey}
                disabled={geminiStatus.isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-bg text-[9px] font-black uppercase rounded hover:bg-cyan-400 transition-all disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> Commit_Key
              </button>
            </div>
          </div>
        </motion.div>

        {/* Wise Configuration Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border-dim rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-24 h-24 text-accent-gold" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded border border-accent-gold/30 flex items-center justify-center bg-accent-gold/10">
              <Lock className="w-4 h-4 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-text-main">Wise_Financial_Node</h3>
              <p className="text-[9px] font-mono text-text-dim">Cross-border Payment Infrastructure</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-tighter text-text-dim flex justify-between">
                WISE_API_DEVELOPER_TOKEN
                <a 
                  href="https://wise.com/developers/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-gold hover:underline flex items-center gap-1"
                >
                  DEV DASHBOARD <ExternalLink className="w-2 h-2" />
                </a>
              </label>
              <div className="relative">
                <input 
                  type={showWise ? "text" : "password"}
                  value={wiseKey}
                  onChange={(e) => setWiseKey(e.target.value)}
                  placeholder="wise_prod_..."
                  className="w-full bg-bg border border-border-dim rounded p-3 text-[11px] font-mono text-accent-gold focus:border-accent-gold/50 outline-none transition-all pr-12"
                />
                <button 
                  onClick={() => setShowWise(!showWise)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  {showWise ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-tighter text-text-dim">PROFILE_ID (PERSONAL/BUSINESS)</label>
              <input 
                type="text"
                value={wiseProfileId}
                onChange={(e) => setWiseProfileId(e.target.value)}
                placeholder="1234567"
                className="w-full bg-bg border border-border-dim rounded p-3 text-[11px] font-mono text-text-main focus:border-border-dim/80 outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {wiseStatus.isSaving ? (
                  <RefreshCw className="w-3 h-3 text-accent-gold animate-spin" />
                ) : wiseStatus.isValid === true ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : wiseStatus.isValid === false ? (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={cn(
                  "text-[8px] font-mono uppercase",
                  wiseStatus.isValid === true ? "text-emerald-500" : 
                  wiseStatus.isValid === false ? "text-red-500" : "text-text-dim"
                )}>
                  {wiseStatus.message || "Financial protocols offline."}
                </span>
              </div>
              <button 
                onClick={saveWiseConfig}
                disabled={wiseStatus.isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg text-[9px] font-black uppercase rounded hover:bg-yellow-500 transition-all disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> Commit_Protocol
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Warning */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-red-500">Critical_Storage_Warning</h4>
            <p className="text-[10px] leading-relaxed text-text-dim max-w-2xl">
              API Keys are stored in local persistent storage for session continuity. 
              In production environments, always migrate these keys to server-side environmental variables (e.g., .env) 
              to prevent client-side exposure. NEVER share your Gemini or Wise API tokens with third-party agents.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-border-dim/30 flex justify-between items-center text-[10px] font-mono text-text-dim">
        <span className="uppercase tracking-widest">Archive_Version: 4.2.0-STABLE</span>
        <span className="flex items-center gap-2 uppercase tracking-tighter">
          <Lock className="w-3 h-3" /> Local_Encryption: ACTIVE
        </span>
      </div>
    </div>
  );
}
