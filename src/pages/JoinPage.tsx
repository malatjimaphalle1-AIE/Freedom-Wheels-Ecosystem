import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Network, Shield, Zap, Globe, Cpu, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const ref = searchParams.get("ref");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("referredBy", ref);
    }
  }, [ref]);

  useEffect(() => {
    if (user && !isProcessing) {
      // If user is already logged in, redirect to dashboard or process referral
      setIsProcessing(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    }
  }, [user, navigate, isProcessing]);

  const handleJoin = async () => {
    setError(null);
    try {
      await signIn();
      // AuthProvider handles profile creation
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to initialize Sovereign Core. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-gold/5 rounded-full blur-[120px]" />
      </div>

      <header className="h-[70px] border-b border-border-dim flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 font-extrabold tracking-tighter text-lg text-accent-gold uppercase">
          Freedom Wheels™ <span className="text-text-main">Ecosystem</span>
        </div>
        <div className="text-[10px] font-mono text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-3 py-1 rounded border border-accent-blue/20">
          Protocol: v2.4_SECURE
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-surface border border-border-dim rounded-2xl p-10 shadow-2xl relative"
        >
          {/* Status Indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-bg border border-border-dim rounded-full flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Access_Gateway_Active</span>
          </div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-accent-blue/10 rounded-xl flex items-center justify-center border border-accent-blue/20 mx-auto mb-6 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
               <Cpu className="text-accent-blue w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Initialize Your Engine</h1>
            <p className="text-text-dim text-sm leading-relaxed mb-4">
              You are invited to join the Sovereign Core. Setup your automated revenue infrastructure and start scaling autonomously.
            </p>
            {ref && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg border border-border-dim rounded text-[10px] font-mono text-accent-gold uppercase mb-6">
                <Zap className="w-3 h-3" /> Referral_Validated: {ref.substring(0, 8)}...
              </div>
            )}
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-3 mb-6">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-xs text-red-500/90 font-medium">{error}</p>
              </div>
            )}

            {loading || isProcessing ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                 <div className="w-10 h-10 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin" />
                 <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-blue">Syncing with Sovereign Core...</div>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleJoin}
                  className="w-full py-4 bg-accent-gold text-bg text-sm font-black uppercase tracking-widest rounded flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all transform hover:scale-[1.02]"
                >
                  Authorize via Google <ArrowRight className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-[10px] text-text-dim font-medium uppercase tracking-[0.2em]">Zero manual setup required</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-border-dim grid grid-cols-2 gap-6 text-[10px] uppercase font-mono font-bold tracking-wider text-text-dim">
             <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> AES-256 SECURED
             </div>
             <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-gold" /> INSTANT_DEPLOYS
             </div>
             <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent-blue" /> GLOBAL_ACCESS
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> NO_API_REQUIRED
             </div>
          </div>
        </motion.div>
      </main>

      <footer className="h-[40px] px-6 flex items-center justify-between font-mono text-[9px] text-text-dim uppercase tracking-[0.3em] overflow-hidden">
        <div>© 2026 Sovereign_Core_Nexus</div>
        <div className="hidden sm:block">STATUS: SYSTEM_READY // PORT: 3000 // SESSION: ENCRYPTED</div>
      </footer>
    </div>
  );
}
