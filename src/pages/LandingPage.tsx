import { motion } from "motion/react";
import { ArrowRight, Shield, Zap, Globe, Cpu, BarChart3, Wallet, Network } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { useEffect } from "react";

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const joinUrl = "/dashboard"; // Unified join/login path

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('referredBy', ref);
      console.log("Referral synchronization established:", ref);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-bg text-text-main overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-md border-b border-border-dim">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-blue/20 rounded flex items-center justify-center border border-accent-blue/30 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
              <Network className="text-accent-blue w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase text-accent-gold">
              Freedom Wheels™ <span className="text-text-main">Ecosystem</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-widest text-text-dim">
            <a href="#features" className="hover:text-accent-blue transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-accent-blue transition-colors">Protocol</a>
            <a href="#marketplace" className="hover:text-accent-blue transition-colors">Marketplace</a>
          </div>
          <Link to="/dashboard" className="px-5 py-2 bg-accent-blue text-bg text-xs font-black uppercase tracking-widest rounded transition-colors hover:bg-accent-gold">
            Command Center
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-accent-blue/5 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-accent-gold/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-surface border border-border-dim text-accent-blue text-[10px] font-mono font-bold uppercase tracking-widest mb-8 inline-block">
              <div className="inline-block w-1.5 h-1.5 rounded-full bg-accent-blue mr-2 animate-pulse" />
              Sovereign Core System Active
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.85] uppercase">
              BUILD INCOME THAT <br />
              <span className="text-accent-blue glow-blue">WORKS WITHOUT YOU</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-text-dim mb-12 leading-relaxed font-medium">
              Deploy automated revenue systems powered by the Sovereign Core. 
              The all-in-one infrastructure to attract, convert, and scale autonomously.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to={joinUrl}
                className="w-full sm:w-auto px-10 py-5 bg-accent-gold text-bg text-sm font-black uppercase tracking-widest rounded transition-all hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 group"
              >
                Launch Your First Income Engine
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-surface border border-border-dim text-text-main text-sm font-black uppercase tracking-widest rounded hover:bg-surface/80 transition-all">
                View System Map
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-24 relative max-w-5xl mx-auto"
          >
            <div className="aspect-video bg-surface rounded-2xl overflow-hidden border border-border-dim shadow-2xl relative group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0c1d2e_0%,#05070a_70%)] flex items-center justify-center p-12">
                 <div className="w-48 h-48 rounded-full border border-accent-blue/10 flex items-center justify-center relative shadow-[0_0_60px_rgba(0,242,255,0.05)]">
                   <div className="w-32 h-32 rounded-full border-2 border-accent-gold flex flex-col items-center justify-center text-center p-4">
                      <Cpu className="text-accent-blue w-8 h-8 glow-blue mb-2" />
                      <div className="text-[10px] font-mono font-bold text-accent-blue">CORE_SYNC</div>
                   </div>
                   <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_8px_#00f2ff]" />
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-blue" />
                 </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-text-dim uppercase tracking-wider">
                 <div>STATUS: NOMINAL</div>
                 <div>LATENCY: 14MS</div>
                 <div>UPTIME: 99.99%</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 bg-surface/30 border-y border-border-dim">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="panel-header text-[10px] font-mono uppercase tracking-widest text-accent-blue mb-4">The Human Limitation</div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight uppercase">The Cycle of <br/><span className="text-text-dim">Manual Labor</span></h2>
              <p className="text-text-dim text-lg leading-relaxed mb-8">
                Most entrepreneurs are caught in a fatal loop: trading finite hours for volatile income. If you stop the grind, the core dies.
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-1 bg-accent-gold" />
                 <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold">Sovereign Alternative Detected</span>
              </div>
            </div>
            <div className="geometric-grid grid-cols-1 sm:grid-cols-2">
               {[
                 { title: "Manual Outreach", desc: "Spending 10+ hours a day manually DMing leads with zero scale." },
                 { title: "Fractured Tools", desc: "Paying for disconnected apps that hemorrhage data and attention." },
                 { title: "Zero Predictability", desc: "Living launch-to-launch with no steady, automated revenue stream." },
                 { title: "The Time Debt", desc: "Exchanging your most valuable asset (time) for mere survival." },
               ].map((item, i) => (
                 <div key={i} className="module-card rounded-none border-none">
                   <h3 className="text-base font-black mb-3 uppercase tracking-tight text-accent-blue">{item.title}</h3>
                   <p className="text-text-dim text-sm leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <div className="text-[10px] font-mono uppercase tracking-widest text-accent-gold mb-4">Operational Protocol</div>
          <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter">Inputs → Automation → <span className="text-accent-gold glow-gold">Income</span></h2>
          <p className="text-text-dim max-w-2xl mx-auto text-lg">
            The Freedom Wheels™ ecosystem simplifies revenue generation into a three-step autonomous loop.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-[1px] bg-border-dim border border-border-dim">
          {[
            { 
              icon: <Zap className="text-accent-blue" />, 
              title: "1. Connect Inputs", 
              desc: "Feed the core with content, data, or tool preferences. Our AI Traffic engine takes care of the rest." 
            },
            { 
              icon: <Cpu className="text-accent-blue" />, 
              title: "2. Autonomous Execution", 
              desc: "The Sovereign Core handles lead capture, nurturing, and sales closure using neural marketing flows." 
            },
            { 
              icon: <Wallet className="text-accent-gold" />, 
              title: "3. Direct Payouts", 
              desc: "Earnings are settled real-time in your choice of fiat or crypto. Withdraw securely at any time." 
            },
          ].map((item, i) => (
            <div key={i} className="bg-bg p-12 group transition-colors hover:bg-surface">
              <div className="mb-8 w-14 h-14 rounded-lg bg-surface flex items-center justify-center border border-border-dim border-l-2 border-l-accent-blue">
                {item.icon}
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter group-hover:text-accent-blue transition-colors">{item.title}</h3>
              <p className="text-text-dim leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 md:p-24 rounded-2xl bg-surface border border-border-dim text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] uppercase tracking-tighter">
              READY TO CLAIM YOUR <br />
              <span className="text-accent-gold glow-gold">SOVEREIGNTY?</span>
            </h2>
            <p className="text-xl text-text-dim mb-12 max-w-xl mx-auto font-medium">
              Join thousands of sovereign entrepreneurs building the next generation of automated wealth.
            </p>
            <Link 
              to={joinUrl}
              className="inline-flex px-12 py-5 bg-accent-gold text-bg text-base font-black rounded uppercase tracking-widest hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
            >
              LAUNCH YOUR ENGINE
            </Link>
          </div>
        </div>
      </section>

      <footer className="h-[60px] bg-bg border-t border-border-dim flex items-center px-10 gap-10 font-mono text-[10px] text-text-dim uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <Network className="w-4 h-4 text-accent-blue" />
          <span className="font-bold">Freedom Wheels™ Ecosystem</span>
        </div>
        <div className="hidden md:flex gap-8 ml-auto">
          <a href="#" className="hover:text-accent-blue transition-colors">Legal</a>
          <a href="#" className="hover:text-accent-blue transition-colors">Protocol</a>
          <a href="#" className="hover:text-accent-blue transition-colors">Access</a>
        </div>
        <div className="ml-auto sm:ml-8">© 2026 Sovereign_Core_Nexus</div>
      </footer>
    </div>

  );
}
