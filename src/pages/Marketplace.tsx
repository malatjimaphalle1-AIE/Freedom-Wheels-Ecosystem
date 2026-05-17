import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Search, Filter, ShoppingCart, Zap, Cpu, Globe, Star, ArrowRight, Plus, ChevronDown, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import NotificationCenter from "../components/NotificationCenter";

const items = [
  { id: 1, name: "AutoIncome Engine™: Starter Kit", category: "Engine", rating: 4.8, users: 1240, price: "$299", desc: "Basic autonomous income setup for beginner entrepreneurs.", image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60" },
  { id: 2, name: "Neural Traffic Flow V2", category: "Traffic", rating: 4.9, users: 842, price: "$449", desc: "Advanced AI-driven multi-channel traffic automation system.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60" },
  { id: 3, name: "Sovereign Funnel: High Impact", category: "Funnel", rating: 4.7, users: 2150, price: "$199", desc: "Optimized landing pages and sequence for maximum conversion.", image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&auto=format&fit=crop&q=60" },
  { id: 4, name: "Lead Intelligence Extension", category: "Analytics", rating: 4.6, users: 560, price: "$599", desc: "Deep behavioral tracking for enterprise-level marketing.", image: "https://images.unsplash.com/photo-1551288049-bbdac8626ad1?w=800&auto=format&fit=crop&q=60" },
  { id: 5, name: "Affiliate Core Nexus", category: "Engine", rating: 4.3, users: 420, price: "$149", desc: "Lightweight affiliate tracking and management engine.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60" },
  { id: 6, name: "Global Payout Relay", category: "Finance", rating: 4.5, users: 910, price: "$349", desc: "Multi-currency settlement gateway for digital assets.", image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&auto=format&fit=crop&q=60" },
  { id: 7, name: "Cyber-Response Automation", category: "Support", rating: 4.2, users: 310, price: "$259", desc: "Automated customer support agents with neural language processing.", image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?w=800&auto=format&fit=crop&q=60" },
  { id: 8, name: "Niche Dominance Map", category: "Analytics", rating: 4.9, users: 1560, price: "$129", desc: "Predictive market analysis for identifying untapped revenue gaps.", image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&auto=format&fit=crop&q=60" },
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Systems");
  const [minRating, setMinRating] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [aiDescriptions, setAiDescriptions] = useState<Record<number, string>>({});
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    const decryptAssets = async () => {
      // Check cache first
      const cached = localStorage.getItem('marketplace_ai_desc');
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // If less than 24 hours old, use it
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setAiDescriptions(data);
            return;
          }
        } catch (e) {
          localStorage.removeItem('marketplace_ai_desc');
        }
      }

      setIsDecrypting(true);
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.warn("AI decryption unavailable: Missing API key");
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `Generate short, punchy, futuristic fintech descriptions for the following sovereign marketplace assets. 
        Focus on the core value proposition and "automated revenue infrastructure". 
        Format your response as a valid JSON object where keys are the asset IDs and values are the generated descriptions.
        Keep each description under 12 words.
        
        Assets:
        ${JSON.stringify(items.map(i => ({ id: i.id, name: i.name, category: i.category })))}
        
        Example Output: {"1": "Autonomous ignition core for entry-level sovereign income streams."}`;

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });
        
        if (result.text) {
          const cleanedText = result.text.replace(/```json|```/g, "").trim();
          const descriptions = JSON.parse(cleanedText);
          setAiDescriptions(descriptions);
          // Update cache
          localStorage.setItem('marketplace_ai_desc', JSON.stringify({
            data: descriptions,
            timestamp: Date.now()
          }));
        }
      } catch (err: any) {
        console.error("Neural Decryption Failure:", err);
        const isRateLimit = 
          err.message?.includes("429") || 
          err.status === 429 || 
          err.error?.code === 429 || 
          err.error?.status === "RESOURCE_EXHAUSTED" ||
          JSON.stringify(err).includes("429") ||
          JSON.stringify(err).includes("RESOURCE_EXHAUSTED");

        if (isRateLimit) {
          console.warn("Gemini API Rate limit exceeded. Using local fallbacks and cache.");
        }
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptAssets();
  }, []);

  const categories = useMemo(() => ["All Systems", ...new Set(items.map(i => i.category))], []);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Systems" || item.category === selectedCategory;
      const matchesRating = item.rating >= minRating;
      
      return matchesSearch && matchesCategory && matchesRating;
    });
  }, [searchQuery, selectedCategory, minRating]);

  const resetFilters = () => {
    setSelectedCategory("All Systems");
    setMinRating(0);
    setSearchQuery("");
  };

  const isFiltered = searchQuery !== "" || selectedCategory !== "All Systems" || minRating !== 0;

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col font-sans">
       <header className="h-[60px] border-b border-border-dim flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-surface rounded transition-colors group">
               <ShoppingBag className="w-5 h-5 text-accent-blue group-hover:drop-shadow-[0_0_8px_#00f2ff]" />
            </Link>
            <h1 className="text-sm font-black tracking-tighter uppercase">Sovereign Marketplace</h1>
          </div>
          <div className="flex items-center gap-6">
             <NotificationCenter />
             <div className="flex items-center gap-2 bg-bg px-3 py-1.5 rounded border border-border-dim w-80">
                <Search className="w-3.5 h-3.5 text-text-dim" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search systems..." 
                  className="bg-transparent border-none outline-none text-xs w-full font-mono placeholder:text-text-dim" 
                />
             </div>
             <button className="relative p-2 hover:bg-surface rounded transition-all">
                <ShoppingCart className="w-5 h-5 text-text-dim" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-blue rounded-full text-[9px] flex items-center justify-center font-black text-bg">2</div>
             </button>
          </div>
       </header>

       <div className="flex-1 p-8 overflow-y-auto">
          {/* Featured Hero */}
          <div className="p-16 rounded-2xl bg-[radial-gradient(circle_at_right,rgba(0,242,255,0.1),transparent)] border border-border-dim mb-12 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/5 blur-[100px] pointer-events-none" />
             <div className="max-w-2xl relative z-10">
                <span className="px-3 py-1 bg-accent-gold text-bg text-[10px] font-black uppercase rounded tracking-[0.2em] mb-6 inline-block">Featured Engine</span>
                <h2 className="text-5xl md:text-6xl font-black mb-8 leading-[0.9] uppercase tracking-tighter">THE SOVEREIGN CORE <br/>MASTER SYSTEM</h2>
                <p className="text-lg text-text-dim mb-10 leading-relaxed font-medium">
                   The ultimate all-in-one automation stack. Connect your inputs and let the Sovereign Core scale your revenue while you sleep.
                </p>
                <Link 
                  to="/builder?template=THE%20SOVEREIGN%20CORE%20MASTER%20SYSTEM"
                  className="px-10 py-5 bg-accent-blue text-bg text-xs font-black uppercase tracking-widest rounded hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center gap-3 group w-fit"
                >
                   DEPLOY NOW <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>

          {/* Filtering Protocol Section */}
          <div className="mb-8 p-6 bg-surface/30 border border-border-dim rounded-xl backdrop-blur-sm">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-accent-blue">
                    <Filter className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filtration_Module</span>
                  </div>
                  {isFiltered && (
                    <button 
                      onClick={resetFilters}
                      className="text-[9px] text-accent-gold hover:text-accent-gold/80 flex items-center gap-1 transition-colors font-mono uppercase"
                    >
                      [RESET_PROTOCOL]
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-text-dim font-mono tracking-tighter uppercase whitespace-nowrap bg-bg px-3 py-1 rounded border border-border-dim/50">
                  ENGINES_DETECTED: <span className="text-accent-blue">{filteredItems.length}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Filter */}
                <div>
                  <div className="text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3 font-bold">Category_Classification</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all font-mono",
                          selectedCategory === cat 
                            ? 'bg-accent-blue border-accent-blue text-bg shadow-[0_0_15px_rgba(0,242,255,0.3)]' 
                            : 'bg-bg border-border-dim text-text-dim hover:text-accent-blue hover:border-accent-blue/50'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <div className="text-[9px] text-text-dim uppercase tracking-[0.2em] mb-3 font-bold">Performance_Threshold (Stars)</div>
                  <div className="flex items-center gap-3">
                    {[4.5, 4.0, 3.5, 0].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={cn(
                          "px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all font-mono flex items-center gap-2",
                          minRating === rating
                            ? 'bg-accent-gold border-accent-gold text-bg shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'bg-bg border-border-dim text-text-dim hover:text-accent-gold hover:border-accent-gold/50'
                        )}
                      >
                        {rating === 0 ? "ALL" : `${rating}+`}
                        <Star className={cn("w-3 h-3", minRating === rating ? "fill-bg" : "fill-accent-gold/30")} />
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
               layout
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border-dim border border-border-dim"
            >
               {filteredItems.map((item) => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   key={item.id} 
                   className="p-8 bg-bg hover:bg-surface transition-colors group flex flex-col"
                 >
                    <div className="aspect-square bg-surface border border-border-dim rounded mb-8 flex items-center justify-center relative overflow-hidden group-hover:border-accent-blue transition-colors">
                       {/* Background Visual */}
                       <img 
                         src={item.image} 
                         alt={item.name} 
                         referrerPolicy="no-referrer"
                         className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0"
                       />
                       
                       {/* Overlay Gradient */}
                       <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />

                       {/* Central Icon */}
                       <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                          {item.category === 'Engine' ? <Cpu className="w-12 h-12 text-accent-blue drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]" /> :
                           item.category === 'Traffic' ? <Globe className="w-12 h-12 text-accent-blue drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]" /> :
                           <Zap className="w-12 h-12 text-accent-gold drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" />}
                       </div>
                       
                       <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-[0.2em] text-accent-blue bg-bg/60 backdrop-blur-md px-2 py-1 rounded border border-accent-blue/20 z-10">{item.category}</span>
                    </div>
                    
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                             <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
                             <span className="text-[10px] font-black font-mono">{item.rating}</span>
                          </div>
                          <span className="text-[9px] text-text-dim font-black font-mono uppercase">{item.users} DEPLOYED</span>
                       </div>

                       <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                          <span className="text-[8px] font-mono text-accent-blue uppercase tracking-[0.2em]">Sovereign_Insight</span>
                       </div>

                       <h3 className="font-black text-base uppercase tracking-tight mb-3 group-hover:text-accent-blue transition-colors leading-tight">{item.name}</h3>
                       
                       <div className="relative min-h-[3em] mb-8">
                          {isDecrypting && !aiDescriptions[item.id] ? (
                            <div className="space-y-1">
                               <div className="h-2 w-full bg-border-dim rounded animate-pulse" />
                               <div className="h-2 w-2/3 bg-border-dim rounded animate-pulse" />
                            </div>
                          ) : (
                            <p className="text-[10px] text-text-dim font-medium leading-relaxed">
                              {aiDescriptions[item.id] || item.desc}
                            </p>
                          )}
                          
                          {isDecrypting && (
                            <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent pointer-events-none" />
                          )}
                       </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-border-dim">
                       <span className="text-xl font-black font-mono text-accent-blue">{item.price}</span>
                       <Link 
                         to={`/builder?template=${encodeURIComponent(item.name)}`}
                         className="p-3 bg-surface border border-border-dim rounded hover:bg-accent-blue hover:text-bg transition-all"
                       >
                          <Plus className="w-5 h-5" />
                       </Link>
                    </div>
                 </motion.div>
               ))}
            </motion.div>
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
             <div className="py-20 text-center">
                <div className="text-accent-blue font-mono text-xs uppercase mb-4 tracking-[0.3em]">No matching systems detected in current parameters</div>
                <button 
                  onClick={() => { setSelectedCategory("All Systems"); setMinRating(0); setSearchQuery(""); }}
                  className="text-[10px] font-black uppercase text-accent-gold hover:underline tracking-widest"
                >
                  Reset Filtering Protocol
                </button>
             </div>
          )}
       </div>
    </div>
  );
}

// FilterButton component removed as it was replaced by inline mapping for better state control
