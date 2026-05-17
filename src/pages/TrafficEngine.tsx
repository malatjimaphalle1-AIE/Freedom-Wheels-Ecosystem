import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Cpu, 
  Globe, 
  Share2, 
  MousePointer2, 
  TrendingUp, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Search, 
  BarChart3, 
  Rocket,
  ChevronRight,
  Plus,
  Play,
  RotateCw,
  CheckCircle,
  Clock,
  Globe as Instagram,
  Globe as Facebook,
  Globe as Twitter,
  Globe as Linkedin,
  Globe as Youtube
} from "lucide-react";
import { Link } from "react-router-dom";

const CONTENT_TYPES = [
  { id: 'post', name: 'Social Post', icon: FileText, color: 'text-accent-blue' },
  { id: 'image', name: 'AI Image', icon: ImageIcon, color: 'text-accent-gold' },
  { id: 'video', name: 'Short Video', icon: Video, color: 'text-purple-500' },
  { id: 'ad', name: 'Ad Copy', icon: Zap, color: 'text-emerald-500' },
];

const PLATFORMS = [
  { id: 'meta', name: 'Meta', icon: Facebook, status: 'Active' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, status: 'Active' },
  { id: 'twitter', name: 'Twitter (X)', icon: Twitter, status: 'Synced' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, status: 'Standby' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, status: 'Standby' },
];

export default function TrafficEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeTab, setActiveTab] = useState('creation');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [seoAnalysisUrl, setSeoAnalysisUrl] = useState('');
  const [nicheContext, setNicheContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedContent, setGeneratedContent] = useState<null | {
    post: string;
    keywords: string[];
    metaDescription: string;
    hashtags: string[];
  }>(null);

  const KEYWORD_RESULTS = [
    { word: 'automated wealth systems', volume: '12.4k', difficulty: 'Med', trend: '+14%' },
    { word: 'sovereign income core', volume: '2.1k', difficulty: 'Low', trend: '+82%' },
    { word: 'ai marketing automation', volume: '45.8k', difficulty: 'High', trend: '+5%' },
    { word: 'passive digital asset', volume: '8.9k', difficulty: 'Med', trend: '+12%' },
    { word: 'financial freedom engines', volume: '1.5k', difficulty: 'Low', trend: '+156%' },
  ];

  const ON_PAGE_CHECKLIST = [
    { task: 'Mission-Critical Keyword Density', status: 'Optimized', impact: 'High' },
    { task: 'Neural Meta-Description Sync', status: 'Pending', impact: 'Med' },
    { task: 'H1-H3 Semantic Hierarchy', status: 'Warning', impact: 'High' },
    { task: 'Asset Alt-Text Calibration', status: 'Optimized', impact: 'Low' },
    { task: 'Mobile Response Latency', status: 'Optimized', impact: 'High' },
  ];

  const generationSteps = [
    "Analyzing Niche Trends...",
    "Querying Sovereign Core Knowledge...",
    "Synthesizing High-Conversion Copy...",
    "Optimizing for Multi-Channel Distribution...",
    "Generating Neural Assets..."
  ];

  const handleGenerate = () => {
    if (!nicheContext || !targetAudience) return;
    setIsGenerating(true);
    setGenerationStep(0);
    setGeneratedContent(null);
  };

  useEffect(() => {
    if (isGenerating && generationStep < generationSteps.length) {
      const timer = setTimeout(() => {
        setGenerationStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (generationStep === generationSteps.length) {
      setTimeout(() => {
        setIsGenerating(false);
        setGeneratedContent({
          post: `NEURAL_TRANSMISSION: THE ARCHITECTURE OF SOVEREIGNTY\n\nStop trading life-hours for digits in a database. The AutoIncome Engines™ are not merely tools—they are the Sovereign Core of your future digital empire. While others chase trends, the wise deploy autonomous systems that harvest value from the global nexus 24/7.\n\nYour wealth should be as automated as your ambition. Secure your node in the Freedom Wheels™ Ecosystem today.\n\n#SovereignCore #AutoIncome #WealthAutomation #FreedomWheels`,
          keywords: ["automated wealth systems", "sovereign income core", "digital sovereignty", "autonomous income engine"],
          metaDescription: "Deploy high-fidelity autonomous marketing engines that synthesize high-intent leads and revenue through the Sovereign Core architecture.",
          hashtags: ["#SovereignCore", "#AutoIncome", "#WealthAutomation", "#FreedomWheels", "#NeuralWealth"]
        });
      }, 1000);
    }
  }, [isGenerating, generationStep]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-accent-blue text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2">
            <Rocket className="w-3 h-3" />
            Module: Traffic_Engine_v4.2
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Traffic <span className="text-accent-blue glow-blue">Engine</span></h1>
          <p className="text-text-dim mt-2 text-sm max-w-xl">
            Autonomous multi-channel content generation and publishing. Attract high-intent traffic to your AutoIncome Engines™ without lifting a finger.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-bg bg-surface flex items-center justify-center">
                <Globe className="w-4 h-4 text-accent-blue" />
              </div>
            ))}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-text-dim uppercase">Reach_Index</div>
            <div className="text-2xl font-black text-accent-gold tracking-tighter">1.4M+</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface/50 border border-border-dim rounded-xl mb-8 w-fit">
        {['creation', 'automation', 'seo', 'ads'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-accent-blue text-bg shadow-[0_0_15px_rgba(0,242,255,0.3)]' 
                : 'text-text-dim hover:text-text-main'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generator / SEO Tools */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'creation' && (
            <>
              <div className="module-card p-8 group relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-accent-blue" />
                    AI_Content_Synthesizer
                  </h2>
                  <div className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SOVEREIGN_CORE_SYNCED
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block mb-2">Campaign_Objective</label>
                    <select className="w-full bg-bg border border-border-dim rounded-lg px-4 py-3 text-sm focus:border-accent-blue focus:outline-none transition-all">
                      <option>Promote: AutoIncome Engines™ (High Ticket)</option>
                      <option>Lead Capture: Sovereign Core Early Access</option>
                      <option>Educational: Future of Digital Sovereignty</option>
                      <option>Case Study: Passive Income Realization</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block mb-2">Target_Niche_Context</label>
                    <textarea 
                      value={nicheContext}
                      onChange={(e) => setNicheContext(e.target.value)}
                      className="w-full bg-bg border border-border-dim rounded-lg px-4 py-3 text-sm h-24 focus:border-accent-blue focus:outline-none transition-all resize-none"
                      placeholder="e.g., High-ticket affiliate marketing for nomadic entrepreneurs..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block mb-2">Target_Audience_Persona</label>
                    <input 
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-bg border border-border-dim rounded-lg px-4 py-3 text-sm focus:border-accent-blue focus:outline-none transition-all"
                      placeholder="e.g., Ex-corporate professionals seeking digital sovereignty..."
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CONTENT_TYPES.map((type) => (
                      <button key={type.id} className="p-4 bg-surface/50 border border-border-dim rounded-xl hover:border-accent-blue/50 transition-all group/btn flex flex-col items-center gap-2">
                        <type.icon className={`w-6 h-6 ${type.color} group-hover/btn:scale-110 transition-transform`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{type.name}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !nicheContext || !targetAudience}
                    className="w-full py-5 bg-accent-blue text-bg font-black uppercase tracking-[0.2em] rounded-xl hover:bg-accent-gold transition-all relative overflow-hidden group disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isGenerating ? generationSteps[generationStep] : 'Initiate Neural Generation'}
                      {!isGenerating && <Zap className="w-4 h-4" />}
                    </span>
                    {isGenerating && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(generationStep / generationSteps.length) * 100}%` }}
                        className="absolute inset-0 bg-accent-gold"
                      />
                    )}
                  </button>
                </div>

                {isGenerating && (
                  <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-12 z-50">
                    <div className="text-center">
                      <div className="w-20 h-20 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(0,242,255,0.2)]" />
                      <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Generating Assets</h3>
                      <p className="text-accent-blue font-mono text-[10px] uppercase animate-pulse">{generationSteps[generationStep]}</p>
                    </div>
                  </div>
                )}

                {generatedContent && !isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-8 pt-8 border-t border-border-dim space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-accent-gold">Generated_Neural_Transmission</h3>
                      <button 
                        onClick={() => setGeneratedContent(null)}
                        className="text-[10px] font-mono text-text-dim hover:text-red-500 transition-colors uppercase"
                      >
                        [ Clear_Output ]
                      </button>
                    </div>

                    <div className="bg-bg border border-border-dim rounded-xl p-6 relative group">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 bg-surface border border-border-dim rounded hover:text-accent-blue transition-colors">
                            <Share2 className="w-4 h-4" />
                         </button>
                         <button className="p-2 bg-surface border border-border-dim rounded hover:text-accent-blue transition-colors">
                            <Plus className="w-4 h-4" />
                         </button>
                      </div>
                      <pre className="text-xs text-text-main whitespace-pre-wrap font-sans leading-relaxed">
                        {generatedContent.post}
                      </pre>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <h4 className="text-[9px] font-black uppercase text-text-dim tracking-widest">Semantic_Keywords</h4>
                         <div className="flex flex-wrap gap-2">
                            {generatedContent.keywords.map(k => (
                              <span key={k} className="px-2 py-1 bg-surface border border-accent-blue/20 text-accent-blue text-[9px] font-mono rounded">
                                {k}
                              </span>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-[9px] font-black uppercase text-text-dim tracking-widest">Neural_Meta_Description</h4>
                         <p className="text-[10px] text-text-dim bg-surface p-3 rounded-lg border border-border-dim leading-normal">
                            {generatedContent.metaDescription}
                         </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[9px] font-black uppercase text-text-dim tracking-widest">Amplification_Hashtags</h4>
                       <div className="flex flex-wrap gap-2">
                          {generatedContent.hashtags.map(h => (
                            <span key={h} className="text-accent-gold font-mono text-[10px]">{h}</span>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="module-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent-gold" />
                    Deployment_Schedule
                  </h2>
                  <button className="text-[10px] font-black text-accent-blue uppercase tracking-widest hover:underline">View History</button>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Sovereign Core Intro Video', platform: 'YouTube', time: 'In 2h 45m', status: 'Queued' },
                    { title: 'Automation Benefits Post', platform: 'LinkedIn', time: 'In 6h 12m', status: 'Queued' },
                    { title: 'The Future of Wealth Grid', platform: 'Instagram', time: 'Scheduled for Tomorrow', status: 'Approved' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-surface/30 border border-border-dim rounded-xl hover:bg-surface/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-bg flex items-center justify-center border border-border-dim">
                          <Play className="w-4 h-4 text-accent-blue" />
                        </div>
                        <div>
                          <div className="text-sm font-black uppercase tracking-tight">{item.title}</div>
                          <div className="text-[10px] text-text-dim font-mono">{item.platform} • {item.time}</div>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                        {item.status}
                      </div>
                    </div>
                  ))}
                  <button className="w-full p-4 border border-dashed border-border-dim rounded-xl text-text-dim text-[10px] font-black uppercase tracking-widest hover:border-accent-blue hover:text-accent-blue transition-all">
                    + Append Scheduled Deployment
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Keyword Research Tool */}
              <div className="module-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <Search className="w-5 h-5 text-accent-gold" />
                    Keyword_Explorer
                  </h2>
                  <div className="text-[10px] font-mono text-accent-gold uppercase tracking-widest opacity-50">
                    Live_Market_Access
                  </div>
                </div>

                <div className="flex gap-4 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input 
                      type="text"
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      placeholder="Enter target phrase or domain..."
                      className="w-full bg-bg border border-border-dim rounded-xl pl-12 pr-4 py-4 text-xs text-text-main focus:border-accent-gold outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setIsSearching(true);
                      setTimeout(() => setIsSearching(false), 2000);
                    }}
                    className="px-8 py-4 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
                  >
                    {isSearching ? 'Querying...' : 'Exploration_Start'}
                  </button>
                </div>

                <div className="overflow-hidden border border-border-dim rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-surface/50 border-b border-border-dim">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-dim">Keyword_Unit</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-dim text-center">Volume</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-dim text-center">Difficulty</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-dim text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dim">
                      {KEYWORD_RESULTS.map((res, i) => (
                        <tr key={i} className="hover:bg-accent-gold/5 transition-colors cursor-pointer group">
                          <td className="px-6 py-4 text-[11px] font-black uppercase tracking-tight group-hover:text-accent-gold transition-colors">{res.word}</td>
                          <td className="px-6 py-4 text-[10px] font-mono text-center">{res.volume}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                              res.difficulty === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                              res.difficulty === 'Med' ? 'bg-accent-gold/10 text-accent-gold' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {res.difficulty}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-[10px] font-mono text-right ${res.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                            {res.trend}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* On-Page Optimization Analyzer */}
              <div className="module-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-blue" />
                    On-Page_Neural_Optimizer
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Input_Protocol_URL</div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={seoAnalysisUrl}
                        onChange={(e) => setSeoAnalysisUrl(e.target.value)}
                        placeholder="https://autoincome.engines/vsl-v1..."
                        className="flex-1 bg-bg border border-border-dim rounded-xl px-4 py-4 text-xs text-text-main focus:border-accent-blue outline-none"
                      />
                      <button className="px-4 bg-bg border border-border-dim text-accent-blue rounded-xl hover:border-accent-blue transition-all">
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl relative overflow-hidden">
                      <div className="text-[32px] font-black tracking-tighter text-accent-blue mb-1">84/100</div>
                      <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Current_Optimization_Index</div>
                      <div className="mt-4 h-1 w-full bg-accent-blue/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '84%' }}
                          className="h-full bg-accent-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Optimization_Logic_Table</div>
                    <div className="space-y-3">
                      {ON_PAGE_CHECKLIST.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-bg border border-border-dim rounded-xl group hover:border-accent-blue/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              item.status === 'Optimized' ? 'bg-emerald-500/10 text-emerald-500' :
                              item.status === 'Warning' ? 'bg-red-500/10 text-red-500' :
                              'bg-accent-gold/10 text-accent-gold'
                            }`}>
                              {item.status === 'Optimized' ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                            <div className="text-[11px] font-bold uppercase tracking-tight">{item.task}</div>
                          </div>
                          <div className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-surface text-text-dim">
                            {item.impact}_Impact
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'automation' && (
            <div className="module-card p-12 text-center">
              <div className="w-16 h-16 bg-surface border border-border-dim rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8 text-accent-blue" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Automation_Neural_Map</h3>
              <p className="text-text-dim text-sm max-w-md mx-auto mb-8">
                Visual workflow builder for autonomous traffic generation. Coming soon to the Sovereign Core.
              </p>
              <button className="px-8 py-3 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">
                Access Prerelease Node
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Platform Sync & Meta */}
        <div className="space-y-8">
          <div className="module-card p-8">
            <h2 className="text-base font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-accent-blue" />
              Platform_Sync
            </h2>
            <div className="space-y-4">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-4 bg-surface/30 border border-border-dim rounded-xl">
                  <div className="flex items-center gap-3">
                    <platform.icon className="w-5 h-5 text-text-main" />
                    <span className="text-xs font-bold uppercase tracking-widest">{platform.name}</span>
                  </div>
                  <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    platform.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 
                    platform.status === 'Synced' ? 'bg-accent-blue/10 text-accent-blue' : 
                    'bg-text-dim/10 text-text-dim'
                  }`}>
                    {platform.status}
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border border-accent-blue/30 text-accent-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-accent-blue hover:text-bg transition-all">
                Integrate New Node
              </button>
            </div>
          </div>

          <div className="module-card p-8">
            <h2 className="text-base font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-accent-gold" />
              SEO_Intelligence
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-bg border border-border-dim rounded-xl">
                <div className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">Top_Performing_Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {['Automated Income', 'Digital Sovereignty', 'Sovereign Core', 'AI Marketing'].map(word => (
                    <span key={word} className="px-2 py-1 bg-surface text-[9px] font-mono text-accent-gold border border-accent-gold/20 rounded">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg border border-border-dim rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-500 tracking-tighter">94/100</div>
                  <div className="text-[8px] font-black text-text-dim uppercase">SEO Score</div>
                </div>
                <div className="p-4 bg-bg border border-border-dim rounded-xl text-center">
                  <div className="text-lg font-black text-accent-blue tracking-tighter">+24%</div>
                  <div className="text-[8px] font-black text-text-dim uppercase">Rank Velocity</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-2xl p-8 relative overflow-hidden group hover:border-accent-blue transition-all cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">Paid_Ads_Optimizer</h3>
            <p className="text-text-dim text-xs mb-4 relative z-10">
              Scale your winners with algorithmic ad budget management.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-accent-blue relative z-10">
              OPEN OPTIMIZER <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
