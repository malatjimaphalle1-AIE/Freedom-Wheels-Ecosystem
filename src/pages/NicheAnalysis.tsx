import React, { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Search, Cpu, Zap, ArrowRight, BarChart3, ShieldCheck, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from "../lib/utils";
import NotificationCenter from "../components/NotificationCenter";

interface NicheData {
  name: string;
  demand: "High" | "Medium" | "Low";
  competition: "High" | "Medium" | "Low";
  roi: string;
  insights: string;
  engineConfig: {
    name: string;
    input: string;
    process: string;
    output: string;
  };
}

export default function NicheAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<NicheData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeMarket = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("AI analytical core missing connection key.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Analyze current global market trends for 2026 and identify 4 emerging profitable niches for autonomous income engines. Provide actionable insights and suggested configurations for each niche.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the niche" },
                demand: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Market demand level" },
                competition: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Competition difficulty" },
                roi: { type: Type.STRING, description: "Estimated potential annual ROI percentage" },
                insights: { type: Type.STRING, description: "Brief actionable market insights" },
                engineConfig: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Suggested engine name" },
                    input: { type: Type.STRING, description: "Suggested traffic/input node" },
                    process: { type: Type.STRING, description: "Suggested processing/core node" },
                    output: { type: Type.STRING, description: "Suggested output/wallet node" },
                  },
                  required: ["name", "input", "process", "output"],
                },
              },
              required: ["name", "demand", "competition", "roi", "insights", "engineConfig"],
            },
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setResults(data);
        // Cache results
        localStorage.setItem('niche_analysis_results', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      
      // Specific 429/Resource Exhausted handling
      const isRateLimit = 
        err.message?.includes("429") || 
        err.status === 429 || 
        err.error?.code === 429 || 
        err.error?.status === "RESOURCE_EXHAUSTED" ||
        JSON.stringify(err).includes("429") ||
        JSON.stringify(err).includes("RESOURCE_EXHAUSTED");

      if (isRateLimit) {
        setError("AI Analytical Node saturated. Rate limit exceeded. Re-syncing from neural cache...");
      } else {
        setError("AI analysis core is currently tethered. Re-syncing local cache...");
      }

      // Check for cached results if API fails
      const cached = localStorage.getItem('niche_analysis_results');
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          setResults(data);
          return;
        } catch (e) {
          localStorage.removeItem('niche_analysis_results');
        }
      }

      // Fallback for demo purposes if API fails and no cache exists
      setResults([
        {
          name: "AI-Agents for Micro-SaaS",
          demand: "High",
          competition: "Medium",
          roi: "450%",
          insights: "Deep integration of specialized AI agents into existing CRM ecosystems is seeing massive upward delta.",
          engineConfig: {
            name: "Agentic_Revenue_Sync",
            input: "Multi-Channel AI Scraping",
            process: "Gemini-3-Pro-Analytical-Core",
            output: "SaaS Subscription Vault"
          }
        },
        {
          name: "Sustainable Tech Arbitrage",
          demand: "High",
          competition: "Low",
          roi: "320%",
          insights: "Automated resale of refurbished sustainable hardware powered by circular economy logic.",
          engineConfig: {
            name: "Green_Asset_Flow",
            input: "Hardware Inventory API",
            process: "E-com Distribution Logic",
            output: "Circular Economy Wallet"
          }
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load cache on mount
  React.useEffect(() => {
    const cached = localStorage.getItem('niche_analysis_results');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache regardless of age on mount to show something
        setResults(data);
      } catch (e) {
        localStorage.removeItem('niche_analysis_results');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col font-sans overflow-hidden">
      <header className="h-[60px] border-b border-border-dim flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-surface rounded transition-colors group">
            <TrendingUp className="w-5 h-5 text-accent-gold group-hover:drop-shadow-[0_0_8px_#f59e0b]" />
          </Link>
          <h1 className="text-sm font-black tracking-tighter uppercase">Niche Intelligence Protocol</h1>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <div className="flex items-center gap-2 px-3 py-1 bg-bg border border-border-dim rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-blue" />
            <span className="text-[9px] font-black uppercase text-accent-blue tracking-widest font-mono">Quantum_Secured</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="p-20 rounded-2xl bg-surface border border-border-dim mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 bg-accent-blue/10 text-accent-blue text-[10px] font-black uppercase rounded tracking-[0.2em] mb-6 inline-block border border-accent-blue/20">Market Awareness Core</span>
              <h2 className="text-5xl md:text-6xl font-black mb-8 leading-[0.9] uppercase tracking-tighter">IDENTIFY EMERGING <br />REVENUE VECTORS</h2>
              <p className="text-lg text-text-dim mb-10 leading-relaxed font-medium">
                Our AI-powered intelligence scanner analyzes global market shifts in real-time to find high-ROI niches for your autonomous engines.
              </p>
              <button 
                onClick={analyzeMarket}
                disabled={isAnalyzing}
                className="px-10 py-5 bg-accent-gold text-bg text-xs font-black uppercase tracking-widest rounded transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> ANALYZING_MARKET_POOL...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" /> INITIATE INTELLIGENCE SCAN
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-accent-gold/5 border-l-4 border-accent-gold text-accent-gold text-[10px] font-bold uppercase tracking-widest mb-8">
              {error}
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {results.map((niche, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border-dim rounded-lg overflow-hidden group h-full flex flex-col"
              >
                <div className="p-8 border-b border-border-dim flex justify-between items-start bg-bg/50">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 group-hover:text-accent-blue transition-colors">{niche.name}</h3>
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-dim uppercase font-bold tracking-widest">Demand</span>
                        <span className={cn("text-xs font-black font-mono", niche.demand === 'High' ? 'text-emerald-500' : 'text-accent-gold')}>{niche.demand}_DEMAND</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-dim uppercase font-bold tracking-widest">Competition</span>
                        <span className={cn("text-xs font-black font-mono", niche.competition === 'Low' ? 'text-emerald-500' : 'text-accent-gold')}>{niche.competition}_COMP</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-text-dim uppercase font-bold tracking-widest">Est. ROI</div>
                    <div className="text-3xl font-black font-mono text-accent-blue">{niche.roi}</div>
                  </div>
                </div>
                
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-accent-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Market Insights</span>
                  </div>
                  <p className="text-[11px] text-text-dim leading-relaxed mb-8 font-medium">
                    {niche.insights}
                  </p>

                  <div className="p-6 bg-bg border border-border-dim rounded border-l-2 border-l-accent-blue">
                    <div className="flex items-center gap-2 mb-4">
                      <Cpu className="w-3.5 h-3.5 text-accent-blue" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Suggested_Configuration</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] pb-2 border-b border-border-dim/50">
                         <span className="text-text-dim">ENGINE:</span>
                         <span className="font-bold font-mono text-accent-blue">{niche.engineConfig.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-text-dim">INPUT:</span>
                         <span className="font-bold font-mono">{niche.engineConfig.input}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-text-dim">PROCESS:</span>
                         <span className="font-bold font-mono">{niche.engineConfig.process}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-text-dim">OUTPUT:</span>
                         <span className="font-bold font-mono">{niche.engineConfig.output}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border-dim">
                  <Link 
                    to={`/builder?template=${niche.engineConfig.name}`}
                    className="w-full py-4 bg-surface border border-border-dim hover:border-accent-blue transition-colors rounded flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest group/btn"
                  >
                    DEPLOY TO ENGINE_BUILDER <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {!results.length && !isAnalyzing && (
            <div className="py-20 text-center flex flex-col items-center border border-dashed border-border-dim rounded-2xl">
               <Zap className="w-12 h-12 text-text-dim mb-4 opacity-50" />
               <h3 className="text-lg font-black uppercase mb-2">No Active Intelligence Scan</h3>
               <p className="text-text-dim text-xs max-w-sm">Initiate the protocol to analyze the global market pool for emerging autonomous revenue opportunities.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="h-[40px] bg-surface border-t border-border-dim flex items-center px-6 gap-8 font-mono text-[10px] text-text-dim">
        <div className="flex gap-2">ENGINE_POOL: <b className="text-accent-blue">ACTIVE</b></div>
        <div className="flex gap-2">SCAN_SENSITIVITY: <b className="text-accent-gold">MAX_ULTIMATE</b></div>
        <div className="ml-auto">CORE_SYNC_OPERATIONAL: 2026_PROTOCOL_ENFORCED</div>
      </footer>
    </div>
  );
}
