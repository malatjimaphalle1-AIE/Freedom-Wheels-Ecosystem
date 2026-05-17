import { motion, AnimatePresence } from "motion/react";
import React, { ReactNode, useState, useEffect, useMemo } from "react";
import { Users, Target, Search, Filter, TrendingUp, Mail, MessageSquare, Activity, Zap, Cpu, Shield, Heart, ChevronRight, Tag, Send, X, CheckCircle, Download, Eye, ArrowUpDown, ArrowUp, ArrowDown, LogIn, RefreshCcw, FileText, ArrowRight, MousePointer2, Plus, MoreHorizontal, MinusCircle, XCircle, ExternalLink, Play, Pause, Globe, Edit3, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import NotificationCenter from "../components/NotificationCenter";
import { useNotificationStore } from "../store/useNotificationStore";

const leads = [
  { 
    name: "John Doe", email: "john@cyber.net", status: "Hot", score: 98, source: "Google Ads", active: "2m ago",
    factors: [
      { label: "High Activity Pulse", value: 40, icon: "Activity" },
      { label: "Google Ads Referral", value: 30, icon: "Zap" },
      { label: "Profile Integrity", value: 28, icon: "Shield" },
    ],
    history: [
      { event: "Email Opened", date: "2024-04-24 14:20", meta: "Campaign: Cyber_Launch", type: 'EMAIL' },
      { event: "Link Clicked", date: "2024-04-24 14:22", meta: "Pricing_Matrix", type: 'CLICK' },
      { event: "Dashboard Auth", date: "2024-04-25 09:12", meta: "Session_Start", type: 'AUTH' },
      { event: "Profile Sync", date: "2024-04-25 10:05", meta: "LinkedIn_Bio_Updated", type: 'SYNC' },
    ],
    metrics: {
      lvt: "$1,240.00",
      cac: "$42.50",
      p_score: "0.94/1.0"
    }
  },
  { 
    name: "Sarah Connor", email: "sarah@future.io", status: "Warm", score: 72, source: "Organic Search", active: "15m ago",
    factors: [
      { label: "Content Engagement", value: 35, icon: "MessageSquare" },
      { label: "Organic Search Sync", value: 20, icon: "Search" },
      { label: "Verification Delay", value: 17, icon: "Shield" },
    ],
    history: [
      { event: "Organic Search", date: "2024-04-23 10:05", meta: "Query: Autonomous Income", type: 'SEARCH' },
      { event: "Article Read", date: "2024-04-23 10:15", meta: "The Future of SaaS", type: 'READ' },
      { event: "Opt-in Sequence", date: "2024-04-25 12:30", meta: "Blueprint_Download", type: 'OPTIN' },
      { event: "Email Opened", date: "2024-04-25 13:45", meta: "Welcome_Pack", type: 'EMAIL' },
    ],
    metrics: {
      lvt: "$0.00",
      cac: "$12.80",
      p_score: "0.68/1.0"
    }
  },
  { 
    name: "Neo Anderson", email: "neo@matrix.sys", status: "Hot", score: 95, source: "Referral Program", active: "1h ago",
    factors: [
      { label: "Immediate ROI Pulse", value: 45, icon: "Zap" },
      { label: "Network Connectivity", value: 30, icon: "Users" },
      { label: "Encryption Grade", value: 20, icon: "Shield" },
    ],
    history: [
      { event: "Referral Link", date: "2024-04-24 22:00", meta: "Invited by: Oracle", type: 'REFERRAL' },
      { event: "Vault Setup", date: "2024-04-25 01:45", meta: "Crypto_Integration", type: 'SYNC' },
      { event: "Link Clicked", date: "2024-04-25 02:00", meta: "Stakeholder_Dashboard", type: 'CLICK' },
    ],
    metrics: {
      lvt: "$2,850.00",
      cac: "$0.00",
      p_score: "0.98/1.0"
    }
  },
  { 
    name: "Trinity Moss", email: "trin@zion.log", status: "Cold", score: 32, source: "Social Media", active: "5h ago",
    factors: [
      { label: "Minimal Pulse Rate", value: 12, icon: "Activity" },
      { label: "Initial Handshake", value: 10, icon: "Zap" },
      { label: "Low Data Quality", value: 10, icon: "Shield" },
    ],
    history: [
      { event: "Homepage Landing", date: "2024-04-25 08:00", meta: "Unknown Source" },
    ],
    metrics: {
      lvt: "$0.00",
      cac: "$0.00",
      p_score: "0.12/1.0"
    }
  },
  { 
    name: "Morpheus Dream", email: "morph@nebul.sys", status: "Warm", score: 64, source: "Google Ads", active: "1d ago",
    factors: [
      { label: "Ad Click Intensity", value: 30, icon: "Zap" },
      { label: "Search Relevance", value: 25, icon: "Target" },
      { label: "Stale Engagement", value: 9, icon: "Activity" },
    ],
    history: [
      { event: "Ad Click", date: "2024-04-24 11:30", meta: "Campaign: Reach_The_World" },
      { event: "Landing Page", date: "2024-04-24 11:31", meta: "High Bounce Threat" },
    ],
    metrics: {
      lvt: "$0.00",
      cac: "$115.00",
      p_score: "0.45/1.0"
    }
  },
];

const conversionData = [
  { time: "00:00", rate: 5.2 },
  { time: "04:00", rate: 8.4 },
  { time: "08:00", rate: 12.1 },
  { time: "12:00", rate: 9.8 },
  { time: "16:00", rate: 14.2 },
  { time: "20:00", rate: 11.5 },
  { time: "23:59", rate: 15.8 },
];

function getRelativeTime(dateString: string | null) {
  if (!dateString) return "No activity detected";
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 0) return "Just now";
    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    return past.toLocaleDateString();
  } catch (e) {
    return "Unknown activity";
  }
}

const scoreDistribution = [
  { range: "0-20", count: 120 },
  { range: "21-40", count: 280 },
  { range: "41-60", count: 450 },
  { range: "61-80", count: 320 },
  { range: "81-100", count: 232 },
];

const COMMON_SOURCES = [
  "Google Ads",
  "Referral Program",
  "Organic Search",
  "Social Media",
  "Direct Referral",
  "Cold Outreach",
  "Event/Conference",
  "Strategic Partnership",
  "Manual Insertion"
];

function ConversionPulseChart() {
  return (
    <div className="bg-surface border border-border-dim p-6 rounded-lg relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-accent-blue" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Conversion_Pulse</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-500">+4.2%_LAST_24H</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={conversionData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#666', fontFamily: 'JetBrains Mono' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0c1d2e', border: '1px solid #1e3a5a', borderRadius: '4px', fontSize: '10px' }}
              itemStyle={{ color: '#00f2ff' }}
            />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#00f2ff" 
              fillOpacity={1} 
              fill="url(#areaGrad)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScoreDistributionChart() {
  return (
    <div className="bg-surface border border-border-dim p-6 rounded-lg group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-accent-gold" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Score_Distribution</h3>
        </div>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="range" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#666', fontFamily: 'JetBrains Mono' }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0c1d2e', border: '1px solid #1e3a5a', borderRadius: '4px', fontSize: '10px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {scoreDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 4 ? '#f59e0b' : '#00f2ff'} fillOpacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LeadVelocityChart({ leads }: { leads: any[] }) {
  const velocityData = useMemo(() => {
    // Generate last 7 days of data
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(day => {
      const dayLeads = leads.filter(l => {
        const lastActivity = l.history?.[l.history.length - 1]?.date;
        if (!lastActivity) return false;
        return lastActivity.startsWith(day);
      });

      const avgScore = dayLeads.length > 0
        ? dayLeads.reduce((acc, l) => acc + (l.score || 0), 0) / dayLeads.length
        : 0;
      
      const activityCount = dayLeads.reduce((acc, l) => acc + (l.history?.length || 0), 0);

      return {
        day: day.split('-').slice(1).join('/'),
        velocity: Math.round(avgScore * (activityCount / 10 + 1)),
        activeLeads: dayLeads.length,
        intensity: Math.round(avgScore)
      };
    });
  }, [leads]);

  return (
    <div className="bg-surface border border-border-dim p-6 rounded-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
        <TrendingUp className="w-12 h-12 text-accent-blue" />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-accent-blue" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Neural_Velocity_Vector</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
          <span className="text-[8px] font-mono text-accent-blue">REAL_TIME_FLUX</span>
        </div>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={velocityData}>
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#666', fontFamily: 'JetBrains Mono' }} 
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0c1d2e', border: '1px solid #1e3a5a', borderRadius: '4px', fontSize: '10px' }}
              itemStyle={{ color: '#0ea5e9' }}
              labelStyle={{ color: '#666', marginBottom: '4px' }}
              formatter={(value: any) => [`${value} Units`, 'Velocity']}
            />
            <Area 
              type="monotone" 
              dataKey="velocity" 
              stroke="#0ea5e9" 
              fillOpacity={1} 
              fill="url(#velocityGrad)" 
              strokeWidth={2}
              dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 3, stroke: '#081421' }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border-dim pt-4">
        <div>
          <div className="text-[8px] font-black uppercase text-text-dim mb-0.5">Mean_Intensity</div>
          <div className="text-sm font-black font-mono text-accent-blue">
            {Math.round(velocityData.reduce((acc, d) => acc + d.intensity, 0) / velocityData.length)}%
          </div>
        </div>
        <div>
          <div className="text-[8px] font-black uppercase text-text-dim mb-0.5">Active_Nodes</div>
          <div className="text-sm font-black font-mono text-text-main">
            {velocityData[velocityData.length - 1].activeLeads}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadJourneyFunnel({ leads, outreach }: { leads: any[], outreach: any[] }) {
  const stats = useMemo(() => {
    const totalReach = 284500; // Simulated from stats bar
    const identified = leads.length;
    const qualified = leads.filter(l => l.score >= 50).length;
    const engaged = outreach.length;
    const converted = leads.filter(l => l.status === 'Hot' && l.score > 90).length;

    const stages = [
      { label: "Total_Reach", value: totalReach, color: "text-text-dim", icon: <Users className="w-3 h-3" /> },
      { label: "Identified", value: identified, color: "text-accent-blue", icon: <Target className="w-3 h-3" /> },
      { label: "Qualified", value: qualified, color: "text-cyan-400", icon: <Shield className="w-3 h-3" /> },
      { label: "Engaged", value: engaged, color: "text-accent-gold", icon: <Zap className="w-3 h-3" /> },
      { label: "Synthesized", value: converted, color: "text-emerald-500", icon: <Activity className="w-3 h-3" /> },
    ];

    return stages.map((stage, i) => {
      const prevValue = i === 0 ? null : stages[i-1].value;
      const rate = prevValue ? ((stage.value / prevValue) * 100).toFixed(1) : null;
      return { ...stage, rate };
    });
  }, [leads, outreach]);

  return (
    <div className="bg-surface border border-border-dim p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-blue" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-dim">Conversion_Journey_Synthesis</h3>
        </div>
      </div>
      
      <div className="space-y-2">
        {stats.map((stage, i) => (
          <div key={stage.label} className="relative">
            {i > 0 && (
              <div className="ml-6 py-1 flex items-center gap-2">
                <div className="w-[1px] h-4 bg-border-dim" />
                <div className="px-2 py-0.5 rounded bg-bg border border-border-dim text-[8px] font-mono text-emerald-500">
                  {stage.rate}%_KV_FLOW
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 group">
               <div className={cn("w-12 h-12 rounded-lg bg-bg border border-border-dim flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", stage.color)}>
                  {stage.icon}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-end justify-between mb-1">
                     <span className="text-[10px] font-black uppercase tracking-tight text-text-main">{stage.label}</span>
                     <span className="text-sm font-black font-mono text-text-main">
                        {stage.value > 1000 ? `${(stage.value / 1000).toFixed(1)}k` : stage.value}
                     </span>
                  </div>
                  <div className="w-full h-1 bg-bg border border-border-dim rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(stage.value / stats[0].value) * 100}%` }} 
                        className={cn("h-full", stage.color.replace('text-', 'bg-'))} 
                     />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const INITIAL_ACTIVITIES = [
  { id: 1, type: 'IDENTIFIED', msg: "New lead fingerprint detected from SEO_CORE", time: "JUST_NOW", icon: <Target className="w-3 h-3 text-accent-blue" /> },
  { id: 2, type: 'SYNC', msg: "Conversion sequence initiated for NEO_ANDERSON", time: "2M_AGO", icon: <Zap className="w-3 h-3 text-accent-gold" /> },
  { id: 3, type: 'OPENED', msg: "Sovereign_Funnel_A pitch opened by SARAH_CONNOR", time: "5M_AGO", icon: <Mail className="w-3 h-3 text-emerald-500" /> },
  { id: 4, type: 'SCORE', msg: "Lead score threshold exceeded: JOHN_DOE [98%]", time: "12M_AGO", icon: <TrendingUp className="w-3 h-3 text-accent-blue" /> },
];

const NeuroTooltip = ({ children, text }: { children: ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-surface border border-border-dim rounded shadow-2xl backdrop-blur-xl pointer-events-none"
          >
             <div className="text-[10px] font-black text-accent-blue uppercase mb-2 flex items-center gap-1.5 border-b border-border-dim pb-2">
                <Cpu className="w-3 h-3" />
                Algorithm_Core v4.2
             </div>
             <div className="space-y-2">
                <p className="text-[9px] text-text-main leading-relaxed font-mono">{text}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function LeadScoreRadial({ score, size = 48, showLabel = true }: { score: number, size?: number, showLabel?: boolean }) {
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle className="text-border-dim/20" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle className="text-accent-blue transition-all duration-1000" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      </svg>
      {showLabel && <span className="absolute font-black font-mono text-accent-blue" style={{ fontSize: size / 4 }}>{score}</span>}
    </div>
  );
}

function getEventConfig(type: string) {
  switch (type) {
    case 'EMAIL': return { icon: <Mail className="w-3.5 h-3.5" />, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Email" };
    case 'CLICK': return { icon: <MousePointer2 className="w-3.5 h-3.5" />, color: "text-accent-blue", bg: "bg-accent-blue/10", label: "Interaction" };
    case 'AUTH': return { icon: <LogIn className="w-3.5 h-3.5" />, color: "text-accent-gold", bg: "bg-accent-gold/10", label: "Identity" };
    case 'SYNC': return { icon: <RefreshCcw className="w-3.5 h-3.5" />, color: "text-purple-400", bg: "bg-purple-400/10", label: "Neural_Sync" };
    case 'SEARCH': return { icon: <Search className="w-3.5 h-3.5" />, color: "text-accent-blue", bg: "bg-accent-blue/10", label: "Recon" };
    case 'READ': return { icon: <FileText className="w-3.5 h-3.5" />, color: "text-cyan-400", bg: "bg-cyan-400/10", label: "Intelligence" };
    case 'OPTIN': return { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Conversion" };
    case 'REFERRAL': return { icon: <Users className="w-3.5 h-3.5" />, color: "text-accent-gold", bg: "bg-accent-gold/10", label: "Network" };
    case 'AUTOMATED': return { icon: <Cpu className="w-3.5 h-3.5" />, color: "text-accent-blue", bg: "bg-accent-blue/10", label: "Automation" };
    case 'CAMPAIGN': return { icon: <Target className="w-3.5 h-3.5" />, color: "text-accent-blue", bg: "bg-accent-blue/10", label: "Campaign" };
    default: return { icon: <Activity className="w-3.5 h-3.5" />, color: "text-text-dim", bg: "bg-border-dim/10", label: "Activity" };
  }
}

import { enrichLeadData, generateLeadFollowup } from "../services/geminiService";

const INITIAL_CAMPAIGN_STATE = { 
  name: "", 
  description: "", 
  status: "ACTIVE", 
  goal: "LEAD_GEN", 
  budget: "", 
  audience: "",
  targetIndustry: "",
  targetGeography: "" 
};

const GOAL_LABELS: Record<string, string> = {
  LEAD_GEN: 'Lead Generation',
  AWARENESS: 'Brand Awareness',
  SALES: 'Sales Conversion',
  CONVERSION: 'Conversion',
  RETENTION: 'Retention'
};

const CAMPAIGN_TEMPLATES = [
  {
    id: 'LEAD_GEN',
    name: 'Lead Generation',
    goal: 'LEAD_GEN',
    description: 'Autonomous sequence designed to identify, capture, and qualify high-intent prospects across digital channels.',
    audience: 'Professional decision makers in targeted growth sectors.',
    color: 'text-accent-blue'
  },
  {
    id: 'AWARENESS',
    name: 'Brand Awareness',
    goal: 'AWARENESS',
    description: 'Strategic deployment to expand market presence and establish sovereign authority within specified industries.',
    audience: 'Broad market segment with potential synergy to core infrastructure.',
    color: 'text-accent-gold'
  },
  {
    id: 'SALES',
    name: 'Sales Conversion',
    goal: 'SALES',
    description: 'High-precision offensive aimed at converting existing pipeline intelligence into verified revenue events.',
    audience: 'Qualified leads currently in the mid-to-bottom of the strategic funnel.',
    color: 'text-red-500'
  },
  {
    id: 'CUSTOM',
    name: 'From Scratch',
    goal: 'LEAD_GEN',
    description: '',
    audience: '',
    color: 'text-text-dim'
  }
];

export default function LeadIntelligence() {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [realLeads, setRealLeads] = useState<any[]>([]);
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [activityQueue, setActivityQueue] = useState<any[]>([]);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [activeLeadTab, setActiveLeadTab] = useState<'OVERVIEW' | 'INTELLIGENCE' | 'TIMELINE' | 'CAMPAIGN' | 'OUTREACH'>('OVERVIEW');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [leadSourceFilter, setLeadSourceFilter] = useState("ALL");
  const [campaignFilter, setCampaignFilter] = useState("ALL");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("ALL");
  const [leadSearch, setLeadSearch] = useState("");
  const [contactLead, setContactLead] = useState<any | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<"Empathetic" | "Direct" | "Curiosity" | "Value-First">("Direct");
  const [selectedTone, setSelectedTone] = useState<"Professional" | "Friendly" | "Urgent">("Professional");
  const [selectedLength, setSelectedLength] = useState<"Short" | "Medium" | "Long">("Medium");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [scoreSort, setScoreSort] = useState<'asc' | 'desc' | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ 
    name: "", 
    description: "", 
    status: "ACTIVE", 
    goal: "LEAD_GEN", 
    budget: "", 
    audience: "",
    targetIndustry: "",
    targetGeography: ""
  });
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [assigningToCampaign, setAssigningToCampaign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LEADS' | 'CAMPAIGNS' | 'OUTREACH' | 'SCORING'>('LEADS');
  const [outreachRecords, setOutreachRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "scoringRules"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (fetched.length === 0 && !snapshot.metadata.fromCache) {
        // Seed default rules
        const defaults = [
          { type: 'EMAIL_OPEN', label: "Email Open", weight: 5 },
          { type: 'CLICK', label: "Interface Interaction", weight: 15 },
          { type: 'AUTH', label: "Dashboard Authentication", weight: 25 },
          { type: 'SYNC', label: "Neural Profile Sync", weight: 20 },
          { type: 'READ', label: "Intelligence Consumption", weight: 10 },
          { type: 'OPTIN', label: "Conversion Handshake", weight: 50 },
        ];
        defaults.forEach(rule => {
          addDoc(collection(db, "scoringRules"), { ...rule, userId: user.uid, createdAt: serverTimestamp() });
        });
      }
      setScoringRules(fetched);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "scoringRules"));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "outreach"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOutreachRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "outreach"));
    return () => unsubscribe();
  }, [user]);

  const handleEnrichLead = async (lead: any) => {
    if (!lead.id) return;
    setEnrichingId(lead.id);
    try {
      // Using client-side Gemini service for "External API" enrichment
      const data = await enrichLeadData(lead.name, lead.email);
      
      const newHistory = [
        ...(lead.history || []),
        { 
          event: "Neural Intelligence Sync", 
          date: new Date().toISOString(), 
          meta: `Successfully gathered semantic insights for ${lead.name}. Verified at: ${data.company || 'Autonomous Node'}.`,
          type: 'SYNC' 
        }
      ];

      // Add enriched factors
      const newFactors = [...(lead.factors || [])];
      if (data.company && !newFactors.some(f => f.label === 'Corporate Sync')) {
        newFactors.push({ label: "Corporate Sync", value: 12, icon: "Target" });
      }

      const finalScore = Math.min(100, (lead.score || 0) + 12);
      const newStatus = finalScore >= 80 ? "Hot" : finalScore >= 50 ? "Warm" : "Cold";

      if (newStatus === "Hot" && lead.status !== "Hot") {
        addNotification({
          type: 'LEAD',
          title: "Lead Intensity Threshold Breached",
          message: `${lead.name} has reached critical intensity [${finalScore}%] through sync.`
        });
      }

      await updateDoc(doc(db, "leads", lead.id), {
        history: newHistory,
        score: finalScore,
        status: newStatus,
        enrichedData: {
          ...data,
          verified: true,
          location: data.location || "Distributed Node"
        },
        factors: newFactors
      });
      
    } catch (err) {
      console.error("Enrichment failed:", err);
    } finally {
      setEnrichingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        leads.forEach(async (l) => {
          try {
            await addDoc(collection(db, "leads"), { ...l, userId: user.uid, createdAt: serverTimestamp() });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, "leads");
          }
        });
      } else {
        setRealLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, "leads"));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || realLeads.length === 0 || campaigns.length === 0) return;

    const performAutoAssociation = async () => {
      const autumnCampaign = campaigns.find(c => c.name === "AUTUMN_ACCELERATOR");
      if (!autumnCampaign) return;

      const now = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      const candidates = realLeads.filter(l => {
        // Condition 1: Score >= 85
        if ((l.score || 0) < 85) return false;

        // Condition 2: Recent interaction (last 24h)
        const hasRecentInteraction = (l.history || []).some((h: any) => {
          if (!h.date) return false;
          const eventTime = new Date(h.date).getTime();
          return (now - eventTime) < oneDayInMs;
        });

        if (!hasRecentInteraction) return false;

        // Condition 3: Not already in the campaign
        return l.campaignId !== autumnCampaign.id;
      });

      if (candidates.length === 0) return;

      // Process candidates
      for (const lead of candidates) {
        try {
          const hasAlreadyLogged = (lead.history || []).some((h: any) => h.event === "Automated Alignment: AUTUMN_ACCELERATOR");
          
          await updateDoc(doc(db, "leads", lead.id), {
            campaignId: autumnCampaign.id,
            history: hasAlreadyLogged ? lead.history : [
              ...(lead.history || []),
              {
                event: "Automated Alignment: AUTUMN_ACCELERATOR",
                date: new Date().toISOString(),
                meta: "High-priority score [85+] detected with recent activity pulse. Automated cohort shift triggered.",
                type: 'SYNC'
              }
            ]
          });
        } catch (error) {
          console.error(`Auto-association failed for ${lead.name}:`, error);
        }
      }
    };

    const timer = setTimeout(performAutoAssociation, 2000);
    return () => clearTimeout(timer);
  }, [user, realLeads, campaigns]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "campaigns"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => !c.deleted);
      
      if (fetched.length === 0 && !snapshot.metadata.fromCache) {
        addDoc(collection(db, "campaigns"), {
          name: "AUTUMN_ACCELERATOR",
          description: "AI-driven Q4 lead nurturing sequence.",
          status: "ACTIVE",
          userId: user.uid,
          createdAt: serverTimestamp()
        }).catch(err => console.error("Seeding autumn campaign failed", err));
      }
      
      setCampaigns(fetched);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "campaigns"));
    return () => unsubscribe();
  }, [user]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreatingCampaign(true);
    try {
      if (editingCampaign) {
        await updateDoc(doc(db, "campaigns", editingCampaign.id), {
          ...newCampaign,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "campaigns"), {
          ...newCampaign,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setShowAddCampaign(false);
      setNewCampaign(INITIAL_CAMPAIGN_STATE);
      setEditingCampaign(null);
      setCurrentStep(1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "campaigns");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS CAMPAIGN MISSION? ALL LEAD ASSOCIATIONS WILL BE DROPPED.")) return;
    try {
      // 1. Clear association from leads
      const associatedLeads = realLeads.filter(l => l.campaignId === id);
      const leadPromises = associatedLeads.map(l => updateDoc(doc(db, "leads", l.id), { campaignId: null }));
      await Promise.all(leadPromises);

      // 2. Delete the campaign document (actually we'll just mark as deleted for safety or real delete)
      // I'll do real delete for now as requested "delete marketing campaigns"
      await updateDoc(doc(db, "campaigns", id), { deleted: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "campaigns");
    }
  };

  const toggleCampaignStatus = async (campaign: any) => {
    let newStatus;
    if (campaign.status === 'ACTIVE') newStatus = 'PAUSED';
    else if (campaign.status === 'PAUSED') newStatus = 'COMPLETED';
    else newStatus = 'ACTIVE';

    try {
      await updateDoc(doc(db, "campaigns", campaign.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "campaigns");
    }
  };

  const handleAssignLeads = async (campaignId: string) => {
    if (selectedLeads.size === 0) return;
    setAssigningToCampaign(campaignId);
    try {
      const promises = Array.from(selectedLeads).map((leadId: string) => {
        const lead = realLeads.find(l => l.id === leadId);
        if (!lead || !lead.id) return Promise.resolve();
        return updateDoc(doc(db, "leads", lead.id as string), {
          campaignId: campaignId,
          history: [
            ...(lead.history || []),
            { 
              event: "Assigned to Campaign", 
              date: new Date().toISOString(), 
              meta: `Assigned to ${campaigns.find(c => c.id === campaignId)?.name}`, 
              type: 'SYNC' 
            }
          ]
        });
      });
      await Promise.all(promises);
      setSelectedLeads(new Set());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "leads");
    } finally {
      setAssigningToCampaign(null);
    }
  };

  const filteredLeads = useMemo(() => {
    let result = realLeads.filter(lead => {
      const matchSource = leadSourceFilter === "ALL" || lead.source === leadSourceFilter;
      const matchCampaign = campaignFilter === "ALL" || lead.campaignId === campaignFilter;
      const matchSearch = lead.name.toLowerCase().includes(leadSearch.toLowerCase()) || 
                          lead.email.toLowerCase().includes(leadSearch.toLowerCase());
      return matchSource && matchCampaign && matchSearch;
    });
    if (scoreSort) {
      result = [...result].sort((a, b) => scoreSort === 'asc' ? a.score - b.score : b.score - a.score);
    }
    return result;
  }, [realLeads, leadSourceFilter, campaignFilter, leadSearch, scoreSort]);

  const [showAddLead, setShowAddLead] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      target: "#lead-search-input",
      title: "Neural Search Probe",
      content: "Execute deep scans across the fingerprint database. Search leads by name or encrypted email strings.",
      position: "bottom"
    },
    {
      target: "#lead-source-filter",
      title: "Data Stream Filter",
      content: "Isolate intelligence packets based on their origin node. Track where your high-value assets are coming from.",
      position: "bottom"
    },
    {
      target: "#lead-actions-header",
      title: "Operational Directives",
      content: "Direct access to Neural Enrichment, Mission Assignment, and AI Outreach protocols for every lead node.",
      position: "left"
    }
  ];

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('leadIntelligenceTutorialSeen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('leadIntelligenceTutorialSeen', 'true');
  };
  const [newLead, setNewLead] = useState({ name: "", email: "", score: 75, source: "Manual Insertion" });
  const [isCreating, setIsCreating] = useState(false);
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [messageData, setMessageData] = useState({ subject: "RE: Sovereign Revenue Engine Synchronization", body: "" });

  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [newRule, setNewRule] = useState({ label: "", weight: 10, type: "CLICK" });
  const [isSavingRule, setIsSavingRule] = useState(false);

  const handleSaveScoringRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingRule(true);
    try {
      if (editingRule) {
        await updateDoc(doc(db, "scoringRules", editingRule.id), {
          ...newRule,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "scoringRules"), {
          ...newRule,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setShowScoringModal(false);
      setEditingRule(null);
      setNewRule({ label: "", weight: 10, type: "CLICK" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "scoringRules");
    } finally {
      setIsSavingRule(false);
    }
  };

  const deleteScoringRule = async (id: string) => {
     if (!window.confirm("ARE YOU SURE YOU WANT TO DE-SYNC THIS RULE?")) return;
     try {
       await updateDoc(doc(db, "scoringRules", id), { deleted: true });
     } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, "scoringRules");
     }
  };

  const logInteraction = async (leadId: string, type: string, event: string, meta: string) => {
    const lead = realLeads.find(l => l.id === leadId);
    if (!lead) return;

    try {
      const history = [
        ...(lead.history || []),
        {
          event,
          date: new Date().toISOString(),
          meta,
          type
        }
      ];

      // After logging interaction, we should also recalculate the score
      const tempLead = { ...lead, history };
      const newScore = calculateLeadScore(tempLead);
      const newStatus = newScore >= 80 ? "Hot" : newScore >= 50 ? "Warm" : "Cold";

      if (newStatus === "Hot" && lead.status !== "Hot") {
        addNotification({
          type: 'LEAD',
          title: "High-Intent Hot Lead",
          message: `${lead.name} has reached critical intensity threshold [${newScore}%].`
        });
      }

      await updateDoc(doc(db, "leads", leadId), {
        history,
        score: newScore,
        status: newStatus,
        "metrics.p_score": `${(newScore / 100).toFixed(2)}/1.0`
      });

      // Update the most recent outreach record for this lead with engagement
      const leadOutreach = outreachRecords
        .filter(r => r.leadId === leadId)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];

      if (leadOutreach && leadOutreach.engagement === 'NONE') {
        const engagementMap: { [key: string]: string } = {
          'EMAIL': 'OPENED',
          'CLICK': 'CLICKED',
          'READ': 'CONSUMED',
          'AUTH': 'SYNCED',
          'OPTIN': 'RESPONDED'
        };
        
        await updateDoc(doc(db, "outreach", leadOutreach.id), {
          engagement: engagementMap[type] || 'INTERACTED',
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "leads");
    }
  };

  const calculateLeadScore = (lead: any) => {
    let baseScore = 20; // Starting baseline
    
    // Apply rules based on history
    lead.history?.forEach((event: any) => {
      const rule = scoringRules.find(r => r.type === event.type && !r.deleted);
      if (rule) {
        baseScore += rule.weight;
      }
    });

    // Apply rules based on factors
    lead.factors?.forEach((factor: any) => {
      // If factor label matches a rule label roughly
      const rule = scoringRules.find(r => r.label.toLowerCase().includes(factor.label.toLowerCase()) && !r.deleted);
      if (rule) {
        baseScore += rule.weight / 2; // Factors are usually partial or pre-calculated
      }
    });

    return Math.min(100, baseScore);
  };

  const handleSyncAllScores = async () => {
    setIsSavingRule(true);
    try {
      const promises = realLeads.map(lead => {
        const newScore = calculateLeadScore(lead);
        const newStatus = newScore >= 80 ? "Hot" : newScore >= 50 ? "Warm" : "Cold";
        
        let history = [...(lead.history || [])];
        if (newStatus !== lead.status) {
          if (newStatus === "Hot") {
            addNotification({
              type: 'LEAD',
              title: "High-Intent Hot Lead",
              message: `${lead.name} has reached critical intensity threshold [${newScore}%].`
            });
          }
          history.push({
            event: `Status Shift: ${lead.status} -> ${newStatus}`,
            date: new Date().toISOString(),
            meta: `Algorithmic recalibration triggered status update based on score [${newScore}%]`,
            type: 'SYNC'
          });
        }

        return updateDoc(doc(db, "leads", lead.id), {
          score: newScore,
          status: newStatus,
          history,
          "metrics.p_score": `${(newScore / 100).toFixed(2)}/1.0`
        });
      });
      await Promise.all(promises);
      alert("Neural Synchronization Complete: All lead scores have been recalibrated and status shifts logged.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "leads");
    } finally {
      setIsSavingRule(false);
    }
  };

  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  useEffect(() => {
    if (contactLead && selectedStrategy) {
      handleGeneratePitch(contactLead);
    }
  }, [selectedStrategy, contactLead, selectedTone, selectedLength]);

  const initiateContact = async (lead: any) => {
    setContactLead(lead);
    setMessageData({ subject: "RE: Sovereign Revenue Engine Synchronization", body: "Initiating neural pitch synthesis..." });
  };

  const handleGeneratePitch = async (targetLead?: any) => {
    const lead = targetLead || contactLead;
    if (!lead) return;
    setIsGeneratingPitch(true);
    try {
      const data = await generateLeadFollowup(lead, selectedStrategy, { 
        tone: selectedTone, 
        length: selectedLength 
      });
      setMessageData({ subject: data.subject, body: data.message });
    } catch (err) {
      console.error("Pitch generation failed", err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!contactLead || !user) return;
    
    try {
      // Record the outreach in Firestore
      await addDoc(collection(db, "outreach"), {
        userId: user.uid,
        leadId: contactLead.id,
        campaignId: contactLead.campaignId || "Manual",
        strategy: selectedStrategy,
        subject: messageData.subject,
        body: messageData.body,
        status: "SENT",
        engagement: "NONE",
        createdAt: serverTimestamp()
      });

      // Update lead history
      await updateDoc(doc(db, "leads", contactLead.id), {
        history: [
          ...(contactLead.history || []),
          { 
            event: "AI Outreach Dispatched", 
            date: new Date().toISOString(), 
            meta: `Strategy: ${selectedStrategy} | Subject: ${messageData.subject}`, 
            type: 'EMAIL' 
          }
        ]
      });

      // In a real app, this would trigger an actual email service
      window.location.href = `mailto:${contactLead.email}?subject=${encodeURIComponent(messageData.subject)}&body=${encodeURIComponent(messageData.body)}`;
      setContactLead(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "outreach");
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);
    try {
      const leadData: any = {
        ...newLead,
        status: newLead.score >= 80 ? "Hot" : newLead.score >= 50 ? "Warm" : "Cold",
        active: "Just now",
        userId: user.uid,
        createdAt: serverTimestamp(),
        factors: [
          { label: "Manual Authentication", value: 20, icon: "Shield" },
          { label: "Intelligence Sync", value: 15, icon: "Zap" }
        ],
        history: [
          { event: "Lead Created", date: new Date().toISOString(), meta: "Manual Insertion", type: 'SYNC' }
        ],
        metrics: {
          lvt: "$0.00",
          cac: "$0.00",
          p_score: `${(newLead.score / 100).toFixed(2)}/1.0`
        }
      };

      if (autoEnrich) {
        try {
          const enriched = await enrichLeadData(newLead.name, newLead.email);
          leadData.enrichedData = enriched;
          leadData.history.push({ 
            event: "Auto-Enrichment Sync", 
            date: new Date().toISOString(), 
            meta: `Neural search completed for bio`, 
            type: 'SYNC' 
          });
          leadData.score = Math.min(100, leadData.score + 10);
          leadData.status = leadData.score >= 80 ? "Hot" : leadData.score >= 50 ? "Warm" : "Cold";
          if (enriched.company) {
            leadData.factors.push({ label: "Verified Entity", value: 15, icon: "Shield" });
          }
        } catch (enrichErr) {
          console.error("Auto-enrich failed", enrichErr);
        }
      }

      await addDoc(collection(db, "leads"), leadData);
      
      if (leadData.status === "Hot") {
        addNotification({
          type: 'LEAD',
          title: "High-Intent Hot Lead Detected",
          message: `Priority Lead ${leadData.name} has been synthesized as HOT [${leadData.score}%].`
        });
      } else {
        addNotification({
          type: 'LEAD',
          title: "New Lead Fingerprint",
          message: `Lead ${leadData.name} has been synthesized into the sovereign infrastructure.`
        });
      }

      setShowAddLead(false);
      setNewLead({ name: "", email: "", score: 75, source: "Manual Insertion" });
      setAutoEnrich(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "leads");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-bg space-y-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border-dim border border-border-dim shadow-lg">
        <LeadStat icon={<Users />} label="Total Reach" value="284.5k" sub="+12k this week" />
        <LeadStat icon={<Target />} label="Qualified" value="1,240" sub="88% Core" />
        <LeadStat icon={<TrendingUp />} label="Conv. Rate" value="14.2%" sub="Industry Avg: 2.1%" />
        <LeadStat icon={<MessageSquare />} label="Active Flows" value="482" sub="Autonomous" />
      </div>

      <div className="flex items-center gap-4 border-b border-border-dim mb-8">
        <button 
          onClick={() => setActiveTab('LEADS')}
          className={cn(
            "pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'LEADS' ? "text-accent-blue" : "text-text-dim hover:text-text-main"
          )}
        >
          Intelligence_Pool
          {activeTab === 'LEADS' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
        </button>
        <button 
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={cn(
            "pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'CAMPAIGNS' ? "text-accent-blue" : "text-text-dim hover:text-text-main"
          )}
        >
          Campaign_Control
          {activeTab === 'CAMPAIGNS' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
        </button>
        <button 
          onClick={() => setActiveTab('OUTREACH')}
          className={cn(
            "pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'OUTREACH' ? "text-accent-blue" : "text-text-dim hover:text-text-main"
          )}
        >
          Outreach_Analytics
          {activeTab === 'OUTREACH' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
        </button>
        <button 
          onClick={() => setActiveTab('SCORING')}
          className={cn(
            "pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'SCORING' ? "text-accent-blue" : "text-text-dim hover:text-text-main"
          )}
        >
          Scoring_Matrix
          {activeTab === 'SCORING' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />}
        </button>
      </div>

      {activeTab === 'LEADS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ConversionPulseChart />
            <LeadVelocityChart leads={realLeads} />
            <ScoreDistributionChart />
            <LeadJourneyFunnel leads={realLeads} outreach={outreachRecords} />
          </div>

          <div className="bg-surface border border-border-dim rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border-dim flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg/50">
              <div className="flex items-center gap-4 flex-1 max-w-2xl">
                <div className="flex items-center gap-3 bg-bg px-4 py-3 rounded-lg border border-border-dim flex-1 focus-within:border-accent-blue/50 focus-within:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group/search relative">
                  <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-focus-within/search:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                  <Search className="w-4 h-4 text-text-dim group-focus-within/search:text-accent-blue transition-colors relative z-10" />
                  <input 
                    id="lead-search-input"
                    value={leadSearch || ""} 
                    onChange={e => setLeadSearch(e.target.value)} 
                    placeholder="SCAN LEAD FINGERPRINTS..." 
                    className="bg-transparent border-none outline-none text-[11px] w-full font-mono text-text-main placeholder:text-text-dim/50 uppercase tracking-widest relative z-10" 
                  />
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border-dim relative z-10">
                    <span className="text-[8px] font-mono text-text-dim">CMD</span>
                    <span className="text-[8px] font-mono text-text-dim">K</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 min-w-[160px]">
                  <Filter className="w-3.5 h-3.5 text-text-dim" />
                  <select 
                    id="lead-source-filter"
                    value={leadSourceFilter || "ALL"} 
                    onChange={e => setLeadSourceFilter(e.target.value)}
                    className="bg-bg border border-border-dim rounded px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer w-full text-text-main"
                  >
                    <option value="ALL">ALL_SOURCES</option>
                    {Array.from(new Set([
                      ...COMMON_SOURCES,
                      ...(realLeads.map(l => (l.source as string))).filter(Boolean)
                    ])).sort().map(source => (
                      <option key={source} value={source}>{source.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 min-w-[160px]">
                  <Target className="w-3.5 h-3.5 text-text-dim" />
                  <select 
                    value={campaignFilter || "ALL"} 
                    onChange={e => setCampaignFilter(e.target.value)}
                    className="bg-bg border border-border-dim rounded px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer w-full text-text-main"
                  >
                    <option value="ALL">ALL_CAMPAIGNS</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                {selectedLeads.size > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded mr-4">
                    <span className="text-[9px] font-black font-mono text-accent-blue">{selectedLeads.size} SELECTED</span>
                    <select 
                      defaultValue=""
                      onChange={(e) => handleAssignLeads(e.target.value)}
                      disabled={!!assigningToCampaign}
                      className="bg-bg border border-border-dim rounded px-2 py-1 text-[8px] font-black uppercase tracking-widest outline-none focus:border-accent-blue"
                    >
                      <option value="" disabled>ASSIGN_TO_CAMPAIGN</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setEditingCampaign(null);
                    setNewCampaign(INITIAL_CAMPAIGN_STATE);
                    setShowAddCampaign(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-gold/10 text-accent-gold border border-accent-gold/30 rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-gold hover:text-bg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> New_Campaign
                </button>
                <button 
                  onClick={() => setShowAddLead(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue border border-accent-blue/30 rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-blue hover:text-bg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Manual_Insertion
                </button>
                <div className="h-8 w-[1px] bg-border-dim mx-2" />
                <button onClick={() => setViewMode('TABLE')} className={cn("p-2 rounded", viewMode === 'TABLE' ? "bg-accent-blue text-bg" : "text-text-dim")}><ArrowUpDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode('GRID')} className={cn("p-2 rounded", viewMode === 'GRID' ? "bg-accent-blue text-bg" : "text-text-dim")}><Users className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-text-dim border-b border-border-dim">
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
                          else setSelectedLeads(new Set());
                        }}
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        className="accent-accent-blue"
                      />
                    </th>
                    <th className="px-6 py-4">Lead</th>
                    <th className="px-6 py-4 cursor-pointer" onClick={() => setScoreSort(scoreSort === 'desc' ? 'asc' : 'desc')}>Score</th>
                    <th className="px-6 py-4">Campaign</th>
                    <th id="lead-actions-header" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {viewMode === 'TABLE' ? (
                    filteredLeads.map((lead, i) => (
                      <React.Fragment key={lead.id || i}>
                        <tr className="hover:bg-accent-blue/[0.02] cursor-pointer group">
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedLeads.has(lead.id)}
                              onChange={() => {
                                const next = new Set(selectedLeads);
                                if (next.has(lead.id)) next.delete(lead.id);
                                else next.add(lead.id);
                                setSelectedLeads(next);
                              }}
                              className="accent-accent-blue"
                            />
                          </td>
                          <td className="px-6 py-4" onClick={() => {
                            setExpandedLead(expandedLead === i ? null : i);
                            setActiveLeadTab('OVERVIEW');
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-bg border border-border-dim flex items-center justify-center text-[10px] font-black text-accent-blue">{(lead.name || "?")[0]}</div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold uppercase truncate">{lead.name}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[9px] text-text-dim font-mono truncate max-w-[120px]">{lead.email}</div>
                                  <div className="w-1 h-1 rounded-full bg-border-dim shrink-0" />
                                  <div className="text-[8px] text-accent-gold font-mono uppercase whitespace-nowrap">
                                    {getRelativeTime(lead.history?.length > 0 ? [...lead.history].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={() => {
                            setExpandedLead(expandedLead === i ? null : i);
                            setActiveLeadTab('OVERVIEW');
                          }}>
                            <div className="flex items-center gap-3">
                              <LeadScoreRadial score={lead.score} size={32} />
                              <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${lead.score}%` }} className="h-full bg-accent-blue" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={() => {
                            setExpandedLead(expandedLead === i ? null : i);
                            setActiveLeadTab('OVERVIEW');
                          }}>
                            {lead.campaignId ? (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                                <span className="text-[10px] font-black font-mono text-text-main uppercase">
                                  {campaigns.find(c => c.id === lead.campaignId)?.name || 'Syncing...'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-mono text-text-dim uppercase">UNASSIGNED</span>
                            )}
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                               {/* Quick Action: Enrich */}
                               <NeuroTooltip text="Execute Neural Enrichment Protocol to synthesize deep behavioral insights from public data nodes.">
                                <button 
                                  onClick={() => handleEnrichLead(lead)} 
                                  disabled={enrichingId === lead.id}
                                  className={cn(
                                    "p-2 rounded hover:bg-accent-blue/10 transition-all group/btn",
                                    enrichingId === lead.id ? "text-accent-blue" : "text-text-dim hover:text-accent-blue"
                                  )}
                                >
                                  {enrichingId === lead.id ? (
                                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Zap className="w-3.5 h-3.5 group-hover/btn:fill-accent-blue/20" />
                                  )}
                                </button>
                               </NeuroTooltip>

                               {/* Quick Action: Assign */}
                               <div className="relative group/popover">
                                  <NeuroTooltip text="Map this lead to an active strategic campaign mission.">
                                    <button className="p-2 text-text-dim hover:text-accent-gold hover:bg-accent-gold/10 rounded transition-all">
                                      <Target className="w-3.5 h-3.5" />
                                    </button>
                                  </NeuroTooltip>
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-dim rounded shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/popover:opacity-100 group-hover/popover:translate-y-0 group-hover/popover:pointer-events-auto transition-all z-50">
                                     <div className="p-2 border-b border-border-dim bg-bg/50">
                                        <div className="text-[8px] font-black uppercase text-text-dim tracking-widest">Select_Mission</div>
                                     </div>
                                     <div className="max-h-40 overflow-y-auto p-1 py-1">
                                        {campaigns.map(c => (
                                          <button 
                                            key={c.id}
                                            onClick={() => {
                                               handleAssignLeads(c.id);
                                               // Since handleAssignLeads assigns all selected leads, 
                                               // we might need a single-lead variant or select just this lead first
                                               const next = new Set<string>();
                                               next.add(lead.id);
                                               setSelectedLeads(next);
                                               handleAssignLeads(c.id);
                                            }}
                                            className={cn(
                                              "w-full text-left p-2 rounded text-[9px] font-black uppercase tracking-tight hover:bg-accent-blue/10 hover:text-accent-blue transition-colors",
                                              lead.campaignId === c.id && "text-accent-blue bg-accent-blue/5"
                                            )}
                                          >
                                            {c.name}
                                          </button>
                                        ))}
                                     </div>
                                  </div>
                               </div>

                               {/* Quick Action: Outreach */}
                               <NeuroTooltip text="Initiate AI-synthesized outreach sequence.">
                                <button onClick={() => initiateContact(lead)} className="p-2 text-text-dim hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-all">
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                               </NeuroTooltip>

                               <div className="w-[1px] h-4 bg-border-dim mx-1" />

                               <button className="p-2 text-text-dim hover:text-text-main transition-colors">
                                 <MoreHorizontal className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedLead === i && (
                            <tr>
                              <td colSpan={5} className="p-0 border-b border-border-dim">
                                 <motion.div 
                                   initial={{ height: 0, opacity: 0 }} 
                                   animate={{ height: 'auto', opacity: 1 }} 
                                   exit={{ height: 0, opacity: 0 }} 
                                   className="overflow-hidden bg-surface/50"
                                 >
                                   <div className="p-8 border-l-2 border-accent-blue">
                                      {/* Detail Tabs */}
                                      <div className="flex items-center gap-6 border-b border-border-dim mb-8">
                                        {[
                                          { id: 'OVERVIEW', label: 'Overview', icon: <Eye className="w-3 h-3" /> },
                                          { id: 'INTELLIGENCE', label: 'Intelligence', icon: <Cpu className="w-3 h-3" /> },
                                          { id: 'TIMELINE', label: 'Timeline', icon: <Activity className="w-3 h-3" /> },
                                          { id: 'CAMPAIGN', label: 'Campaign', icon: <Target className="w-3 h-3" /> },
                                          { id: 'OUTREACH', label: 'Outreach', icon: <Send className="w-3 h-3" /> }
                                        ].map(tab => (
                                          <button
                                            key={tab.id}
                                            onClick={() => setActiveLeadTab(tab.id as any)}
                                            className={cn(
                                              "pb-3 px-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all relative group",
                                              activeLeadTab === tab.id ? "text-accent-blue" : "text-text-dim hover:text-text-main"
                                            )}
                                          >
                                            <span className={cn("transition-colors", activeLeadTab === tab.id ? "text-accent-blue" : "text-text-dim group-hover:text-accent-blue")}>
                                              {tab.icon}
                                            </span>
                                            {tab.label}
                                            {activeLeadTab === tab.id && (
                                              <motion.div layoutId="detail-tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
                                            )}
                                          </button>
                                        ))}
                                      </div>

                                      <div className="min-h-[320px]">
                                        <AnimatePresence mode="wait">
                                          {activeLeadTab === 'OVERVIEW' && (
                                            <motion.div 
                                              key="overview"
                                              initial={{ opacity: 0, x: 10 }} 
                                              animate={{ opacity: 1, x: 0 }} 
                                              exit={{ opacity: 0, x: -10 }}
                                              className="grid grid-cols-1 md:grid-cols-3 gap-8"
                                            >
                                              <div className="space-y-6">
                                                <div className="p-4 bg-bg border border-border-dim rounded-lg space-y-4">
                                                  <h6 className="text-[8px] font-black uppercase text-text-dim tracking-widest border-b border-border-dim pb-2">Contact_Core</h6>
                                                  <div className="space-y-3">
                                                    <div>
                                                      <div className="text-[7px] text-text-dim uppercase">Full Name</div>
                                                      <div className="text-xs font-bold">{lead.name}</div>
                                                    </div>
                                                    <div>
                                                      <div className="text-[7px] text-text-dim uppercase">Email Node</div>
                                                      <div className="text-xs font-mono text-accent-blue">{lead.email}</div>
                                                    </div>
                                                    <div>
                                                      <div className="text-[7px] text-text-dim uppercase">Origin Source</div>
                                                      <div className="text-xs font-bold uppercase">{lead.source}</div>
                                                    </div>
                                                    <div>
                                                      <div className="text-[7px] text-text-dim uppercase border-t border-border-dim/30 pt-3 mt-1">Last Activity Pulse</div>
                                                      <div className="text-xs font-black font-mono text-accent-gold uppercase">
                                                        {getRelativeTime(lead.history?.length > 0 ? [...lead.history].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-6">
                                                <div className="p-4 bg-bg border border-border-dim rounded-lg space-y-4 h-full">
                                                  <h6 className="text-[8px] font-black uppercase text-text-dim tracking-widest border-b border-border-dim pb-2">Synthesis_Metrics</h6>
                                                  <div className="grid grid-cols-1 gap-4">
                                                    <div className="p-3 bg-surface/50 border border-border-dim rounded">
                                                      <div className="text-[7px] text-text-dim uppercase">Lifetime Value (LVT)</div>
                                                      <div className="text-lg font-black font-mono text-emerald-500">{lead.metrics?.lvt || "$0.00"}</div>
                                                    </div>
                                                    <div className="p-3 bg-surface/50 border border-border-dim rounded">
                                                      <div className="text-[7px] text-text-dim uppercase">Acquisition Cost (CAC)</div>
                                                      <div className="text-lg font-black font-mono text-text-main">{lead.metrics?.cac || "$0.00"}</div>
                                                    </div>
                                                    <div className="p-3 bg-surface/50 border border-border-dim rounded">
                                                      <div className="text-[7px] text-text-dim uppercase">Propensity_Score</div>
                                                      <div className="text-lg font-black font-mono text-accent-blue">{lead.metrics?.p_score || "0.0/1.0"}</div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-6">
                                                <div className="p-4 bg-bg border border-border-dim rounded-lg h-full flex flex-col justify-center items-center gap-4 text-center">
                                                   <LeadScoreRadial score={lead.score} size={100} />
                                                   <div>
                                                      <div className="text-[8px] font-black uppercase text-accent-blue tracking-[0.2em] mb-1">Algorithmic_Fit</div>
                                                      <div className="text-[10px] font-mono text-text-dim italic">"High conversion probability based on neural pulse detection."</div>
                                                   </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}

                                          {activeLeadTab === 'INTELLIGENCE' && (
                                            <motion.div 
                                              key="intelligence"
                                              initial={{ opacity: 0, x: 10 }} 
                                              animate={{ opacity: 1, x: 0 }} 
                                              exit={{ opacity: 0, x: -10 }}
                                              className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                            >
                                              <div className="space-y-6">
                                                <h5 className="text-[10px] font-black uppercase text-accent-gold tracking-widest">Weighting_Factors</h5>
                                                <div className="grid grid-cols-1 gap-2">
                                                   {(lead.factors || []).map((f: any, idx: number) => (
                                                     <div key={idx} className="flex items-center justify-between p-3 bg-bg border border-border-dim rounded group hover:border-accent-gold/40 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                           <div className="w-6 h-6 rounded bg-surface border border-border-dim flex items-center justify-center text-accent-gold">
                                                              <Tag className="w-3 h-3" />
                                                           </div>
                                                           <span className="text-[9px] font-black uppercase text-text-main">{f.label}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-accent-blue font-bold">+{f.value}%</span>
                                                     </div>
                                                   ))}
                                                </div>
                                                
                                                <button 
                                                  onClick={() => handleEnrichLead(lead)} 
                                                  disabled={enrichingId === lead.id}
                                                  className="w-full py-4 bg-accent-blue/10 text-accent-blue border border-accent-blue/30 rounded text-[9px] font-black uppercase tracking-[0.2em] hover:bg-accent-blue hover:text-bg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                  {enrichingId === lead.id ? (
                                                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                                  ) : (
                                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                                  )}
                                                  Run_Neural_Enrichment_Protocol
                                                </button>

                                                <button 
                                                  onClick={() => initiateContact(lead)}
                                                  className="w-full py-4 bg-accent-gold/10 text-accent-gold border border-accent-gold/30 rounded text-[9px] font-black uppercase tracking-[0.2em] hover:bg-accent-gold hover:text-bg transition-all flex items-center justify-center gap-2"
                                                >
                                                  <Mail className="w-3.5 h-3.5" />
                                                  Generate_Strategic_Followup
                                                </button>
                                              </div>

                                              <div className="space-y-4">
                                                 <h5 className="text-[10px] font-black uppercase text-accent-blue tracking-widest flex items-center justify-between">
                                                   Enriched_State
                                                   {lead.enrichedData?.verified && (
                                                     <span className="flex items-center gap-1 text-[8px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        <CheckCircle className="w-2.5 h-2.5" /> VERIFIED_IDENTITY
                                                     </span>
                                                   )}
                                                 </h5>
                                                 {lead.enrichedData ? (
                                                   <div className="p-6 bg-bg border border-accent-blue/20 rounded-lg space-y-6 relative overflow-hidden">
                                                      <div className="absolute top-0 right-0 p-3">
                                                         <Shield className="w-4 h-4 text-accent-blue opacity-30" />
                                                      </div>
                                                      
                                                      <div className="grid grid-cols-2 gap-6">
                                                         <div>
                                                            <div className="text-[7px] text-text-dim uppercase mb-1">Affiliated Entity</div>
                                                            <div className="text-xs font-bold text-text-main">{lead.enrichedData.company}</div>
                                                         </div>
                                                         <div>
                                                            <div className="text-[7px] text-text-dim uppercase mb-1">Current Position</div>
                                                            <div className="text-xs font-bold text-text-main">{lead.enrichedData.title}</div>
                                                         </div>
                                                      </div>

                                                      <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border-dim/30">
                                                         <div>
                                                            <div className="text-[7px] text-text-dim uppercase mb-2">Social_Frequencies</div>
                                                            <div className="flex items-center gap-3">
                                                               {lead.enrichedData.linkedin && (
                                                                 <a href={`https://${lead.enrichedData.linkedin}`} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-bg border border-border-dim text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all">
                                                                   <MessageSquare className="w-3 h-3" />
                                                                 </a>
                                                               )}
                                                               {lead.enrichedData.twitter && (
                                                                 <a href={`https://twitter.com/${lead.enrichedData.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-bg border border-border-dim text-text-dim hover:text-cyan-400 hover:border-cyan-400 transition-all">
                                                                   <Globe className="w-3 h-3" />
                                                                 </a>
                                                               )}
                                                               {!lead.enrichedData.linkedin && !lead.enrichedData.twitter && (
                                                                 <span className="text-[8px] font-mono text-text-dim italic">NO_SOCIAL_SIGNALS</span>
                                                               )}
                                                            </div>
                                                         </div>
                                                         <div>
                                                            <div className="text-[7px] text-text-dim uppercase mb-1">Deployment Node</div>
                                                            <div className="text-xs font-mono text-text-main">{lead.enrichedData.location || "DECENTRALIZED"}</div>
                                                         </div>
                                                      </div>
                                                      
                                                      <div className="space-y-2">
                                                         <div className="text-[7px] text-text-dim uppercase">Algorithmic_Bio</div>
                                                         <p className="text-[10px] font-mono text-text-main leading-relaxed bg-surface/30 p-3 rounded border border-border-dim italic">
                                                            {lead.enrichedData.bio || "No semantic data recovered yet."}
                                                         </p>
                                                      </div>

                                                      <div className="space-y-2">
                                                         <div className="text-[7px] text-text-dim uppercase mb-2">Technology_Stack</div>
                                                         <div className="flex flex-wrap gap-2">
                                                            {lead.enrichedData.technologies?.map((t: string, i: number) => (
                                                              <span key={i} className="px-2 py-1 bg-accent-blue/5 text-accent-blue border border-accent-blue/10 rounded text-[9px] font-mono uppercase tracking-tighter">
                                                                 {t}
                                                              </span>
                                                            )) || <span className="text-[9px] text-text-dim italic">No stack data identified.</span>}
                                                         </div>
                                                      </div>
                                                   </div>
                                                 ) : (
                                                   <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border-dim rounded-lg p-12 text-center bg-bg/50">
                                                      <Cpu className="w-8 h-8 text-text-dim mb-4 opacity-20" />
                                                      <p className="text-[10px] font-black uppercase text-text-dim tracking-widest">Awaiting_Neural_Sync</p>
                                                   </div>
                                                 )}
                                              </div>
                                            </motion.div>
                                          )}

                                          {activeLeadTab === 'TIMELINE' && (
                                            <motion.div 
                                              key="timeline"
                                              initial={{ opacity: 0, x: 10 }} 
                                              animate={{ opacity: 1, x: 0 }} 
                                              exit={{ opacity: 0, x: -10 }}
                                              className="max-w-4xl mx-auto"
                                            >
                                              <div className="flex flex-col md:flex-row gap-8">
                                                <div className="flex-1 space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-dim">
                                                  {(() => {
                                                    const sorted = [...(lead.history || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                                    const groups: { [key: string]: any[] } = {};
                                                    sorted.forEach(h => {
                                                      const day = new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                                      if (!groups[day]) groups[day] = [];
                                                      groups[day].push(h);
                                                    });
                                                    
                                                    return Object.entries(groups).map(([day, events], gIdx) => (
                                                      <div key={day} className="space-y-4">
                                                        <div className="flex items-center gap-4 py-2 sticky top-0 bg-surface/50 backdrop-blur-sm z-20">
                                                           <div className="w-7 h-7 rounded-lg bg-bg border border-border-dim flex items-center justify-center shrink-0">
                                                              <Activity className="w-3 h-3 text-text-dim" />
                                                           </div>
                                                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-dim bg-bg px-2 py-0.5 rounded border border-border-dim">{day}</span>
                                                           <div className="flex-1 h-[1px] bg-border-dim/30" />
                                                        </div>
                                                        <div className="space-y-4">
                                                          {events.map((h, eIdx) => {
                                                            const config = getEventConfig(h.type || '');
                                                            return (
                                                              <motion.div 
                                                                key={`${gIdx}-${eIdx}`}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: eIdx * 0.05 }}
                                                                className="flex gap-5 relative group"
                                                               >
                                                                <div className={cn("w-7 h-7 rounded-full border border-border-dim flex items-center justify-center z-10 shrink-0 transition-all group-hover:scale-110", config.bg, config.color)}>
                                                                  {config.icon}
                                                                </div>
                                                                <div className="flex-1 min-w-0 bg-bg border border-border-dim p-4 rounded-lg group-hover:border-accent-blue/30 transition-all shadow-sm hover:shadow-accent-blue/5">
                                                                  <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                      <span className="text-[10px] font-black uppercase tracking-tight text-text-main">{h.event}</span>
                                                                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none", config.bg, config.color)}>
                                                                        {config.label}
                                                                      </span>
                                                                    </div>
                                                                    <span className="text-[8px] font-mono text-text-dim shrink-0 bg-surface px-1.5 py-0.5 rounded border border-border-dim">
                                                                      {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                  </div>
                                                                  <div className="text-[9px] text-text-dim font-mono leading-relaxed bg-surface/30 p-2 rounded border border-border-dim/30 italic">
                                                                    {h.meta}
                                                                  </div>
                                                                </div>
                                                              </motion.div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                    ));
                                                  })()}
                                                  {(lead.history || []).length === 0 && (
                                                    <div className="text-center py-20 text-text-dim font-mono text-[10px] uppercase">
                                                      No interaction vectors recorded for this node.
                                                    </div>
                                                  )}
                                                </div>

                                                <div className="w-full md:w-64 shrink-0 space-y-6">
                                                  <div className="p-6 bg-surface border border-border-dim rounded-xl space-y-4">
                                                    <h6 className="text-[8px] font-black uppercase text-accent-blue tracking-widest border-b border-border-dim pb-2 flex items-center gap-2">
                                                      <Zap className="w-3 h-3" /> interaction_sim
                                                    </h6>
                                                    <div className="grid grid-cols-1 gap-2">
                                                      <button 
                                                        onClick={() => logInteraction(lead.id, 'EMAIL', 'Email Opened', 'Recipient accessed pitch payload via mobile device.')}
                                                        className="w-full py-2 px-3 bg-bg border border-border-dim rounded text-[8px] font-black uppercase text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all text-left flex items-center gap-2"
                                                      >
                                                        <Mail className="w-3 h-3 text-emerald-500" /> Log_Email_Open
                                                      </button>
                                                      <button 
                                                        onClick={() => logInteraction(lead.id, 'CLICK', 'Interface Engagement', 'Lead executed high-intent interaction on pricing node.')}
                                                        className="w-full py-2 px-3 bg-bg border border-border-dim rounded text-[8px] font-black uppercase text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all text-left flex items-center gap-2"
                                                      >
                                                        <MousePointer2 className="w-3 h-3 text-accent-blue" /> Log_Link_Click
                                                      </button>
                                                      <button 
                                                        onClick={() => logInteraction(lead.id, 'READ', 'Intelligence Consumption', 'Session duration exceeded threshold: 5m 24s.')}
                                                        className="w-full py-2 px-3 bg-bg border border-border-dim rounded text-[8px] font-black uppercase text-text-dim hover:text-accent-blue hover:border-accent-blue transition-all text-left flex items-center gap-2"
                                                      >
                                                        <FileText className="w-3 h-3 text-cyan-400" /> Log_Data_Read
                                                      </button>
                                                      <button 
                                                        onClick={() => logInteraction(lead.id, 'AUTH', 'Dashboard Auth', 'Session sequence fully decrypted and authenticated via biometric bypass.')}
                                                        className="w-full py-2 px-3 bg-bg border border-border-dim rounded text-[8px] font-black uppercase text-text-dim hover:text-accent-gold hover:border-accent-gold transition-all text-left flex items-center gap-2"
                                                      >
                                                        <LogIn className="w-3 h-3 text-accent-gold" /> Log_Dashboard_Auth
                                                      </button>
                                                    </div>
                                                  </div>

                                                  <div className="p-6 bg-bg border border-border-dim rounded-xl">
                                                    <div className="flex items-center gap-2 mb-4">
                                                      <TrendingUp className="w-3 h-3 text-accent-blue" />
                                                      <span className="text-[8px] font-black uppercase text-text-dim">Score_Velocity</span>
                                                    </div>
                                                    <div className="text-2xl font-black font-mono text-text-main mb-1">
                                                      {lead.score > 80 ? "ACCELERATING" : "STABLE"}
                                                    </div>
                                                    <p className="text-[8px] text-text-dim font-mono uppercase">
                                                      {lead.history?.length || 0} Total interactions detected since identification.
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}

                                          {activeLeadTab === 'OUTREACH' && (
                                            <motion.div 
                                              key="outreach"
                                              initial={{ opacity: 0, x: 10 }} 
                                              animate={{ opacity: 1, x: 0 }} 
                                              exit={{ opacity: 0, x: -10 }}
                                              className="max-w-4xl mx-auto space-y-8"
                                            >
                                              <div className="flex items-center justify-between border-b border-border-dim pb-4">
                                                <div className="flex items-center gap-2">
                                                  <Send className="w-4 h-4 text-accent-blue" />
                                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">AI-Generated_Outreach_Payloads</h3>
                                                </div>
                                                <button 
                                                  onClick={() => initiateContact(lead)}
                                                  className="px-4 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded text-[9px] font-black uppercase hover:bg-accent-blue/20 transition-all flex items-center gap-2"
                                                >
                                                  <Zap className="w-3.5 h-3.5" /> Execute_New_Dispatch
                                                </button>
                                              </div>

                                              <div className="grid grid-cols-1 gap-6">
                                                {outreachRecords
                                                  .filter(r => r.leadId === lead.id)
                                                  .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                                                  .map((record, rIdx) => (
                                                    <div key={record.id || rIdx} className="bg-bg border border-border-dim rounded-xl overflow-hidden group hover:border-accent-blue/30 transition-all shadow-lg">
                                                       <div className="p-4 bg-surface/30 border-b border-border-dim flex items-center justify-between">
                                                          <div className="flex items-center gap-4">
                                                             <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                   "w-2 h-2 rounded-full",
                                                                   record.status === 'SENT' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-accent-gold"
                                                                )} />
                                                                <span className="text-[10px] font-black uppercase text-text-main tracking-widest">{record.status}</span>
                                                             </div>
                                                             <div className="h-4 w-[1px] bg-border-dim" />
                                                             <div className="flex items-center gap-2">
                                                                <div className="text-[8px] font-black uppercase text-text-dim">Strategy:</div>
                                                                <div className="px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue text-[8px] font-black uppercase border border-accent-blue/20">
                                                                   {record.strategy}
                                                                </div>
                                                             </div>
                                                          </div>
                                                          <div className="flex items-center gap-4">
                                                             <div className="flex items-center gap-2">
                                                                <div className="text-[8px] font-black uppercase text-text-dim">Engagement:</div>
                                                                <div className={cn(
                                                                   "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                                                   record.engagement && record.engagement !== 'NONE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-bg text-text-dim border-border-dim"
                                                                )}>
                                                                   {record.engagement || 'NONE'}
                                                                </div>
                                                             </div>
                                                             <span className="text-[9px] font-mono text-text-dim">
                                                                {record.createdAt?.seconds ? new Date(record.createdAt.seconds * 1000).toLocaleString() : "Syncing..."}
                                                             </span>
                                                          </div>
                                                       </div>
                                                       <div className="p-6 space-y-6">
                                                          <div className="space-y-2">
                                                             <div className="text-[7px] text-text-dim uppercase tracking-[0.2em]">Subject_Line</div>
                                                             <div className="p-3 bg-surface/50 border border-border-dim rounded text-xs font-bold text-text-main">
                                                                {record.subject}
                                                             </div>
                                                          </div>
                                                          <div className="space-y-2">
                                                             <div className="text-[7px] text-text-dim uppercase tracking-[0.2em]">Payload_Body</div>
                                                             <div className="p-4 bg-surface/30 border border-border-dim rounded text-[10px] text-text-main leading-relaxed font-mono whitespace-pre-wrap selection:bg-accent-blue/30">
                                                                {record.body}
                                                              </div>
                                                           </div>
                                                        </div>
                                                     </div>
                                                   ))}
                                                 
                                                 {outreachRecords.filter(r => r.leadId === lead.id).length === 0 && (
                                                   <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-bg/20 rounded-xl border border-border-dim border-dashed">
                                                      <div className="w-16 h-16 rounded-full bg-surface border border-border-dim flex items-center justify-center text-text-dim/20">
                                                         <Send className="w-8 h-8" />
                                                      </div>
                                                      <div>
                                                         <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-1">No_Payloads_Dispatched</h4>
                                                         <p className="text-[9px] text-text-dim/60 uppercase max-w-xs mx-auto leading-relaxed">
                                                            Initiate an AI outreach sequence to synthesize personalized engagement vectors for this lead node.
                                                         </p>
                                                      </div>
                                                   </div>
                                                 )}
                                               </div>
                                             </motion.div>
                                           )}
                                           {activeLeadTab === 'CAMPAIGN' && (
                                            <motion.div 
                                              key="campaign"
                                              initial={{ opacity: 0, x: 10 }} 
                                              animate={{ opacity: 1, x: 0 }} 
                                              exit={{ opacity: 0, x: -10 }}
                                              className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                            >
                                              <div className="space-y-6">
                                                 <h5 className="text-[10px] font-black uppercase text-accent-blue tracking-widest">Active_Mission_Assignment</h5>
                                                 {lead.campaignId ? (
                                                   <div className="p-6 bg-bg border border-accent-blue/30 rounded-xl space-y-6">
                                                      <div className="flex items-center justify-between">
                                                         <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20">
                                                               <Target className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                               <div className="text-xs font-black uppercase text-text-main">
                                                                  {campaigns.find(c => c.id === lead.campaignId)?.name}
                                                               </div>
                                                               <div className="text-[8px] font-mono text-emerald-500 uppercase">Operational_State: ACTIVE</div>
                                                            </div>
                                                         </div>
                                                         <div className="flex flex-col items-end gap-2">
                                                            <span className="px-2 py-1 rounded bg-accent-blue/10 text-accent-blue text-[8px] font-black uppercase shadow-[0_0_10px_rgba(0,242,255,0.1)]">SINCE_04_24</span>
                                                            <button 
                                                              onClick={() => {
                                                                if(window.confirm("TERMINATE THIS MISSION ASSOCIATION?")) {
                                                                   updateDoc(doc(db, "leads", lead.id), { campaignId: null });
                                                                }
                                                              }}
                                                              className="text-[7px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                                                            >
                                                              <MinusCircle className="w-2.5 h-2.5" /> Drop_Mission
                                                            </button>
                                                          </div>
                                                      </div>
                                                      
                                                      <p className="text-[10px] text-text-dim font-mono leading-relaxed border-t border-border-dim pt-4">
                                                         {campaigns.find(c => c.id === lead.campaignId)?.description || "Mission parameters undefined."}
                                                      </p>

                                                      <div className="grid grid-cols-2 gap-4">
                                                         <div className="p-3 bg-surface/50 border border-border-dim rounded">
                                                            <div className="text-[7px] text-text-dim uppercase">Sequence Stage</div>
                                                            <div className="text-xs font-black text-text-main uppercase">Engagement_A</div>
                                                         </div>
                                                         <div className="p-3 bg-surface/50 border border-border-dim rounded">
                                                            <div className="text-[7px] text-text-dim uppercase">Total Outreach</div>
                                                            <div className="text-xs font-black text-text-main uppercase">{outreachRecords.filter(r => r.leadId === lead.id).length} Dispatch(es)</div>
                                                         </div>
                                                      </div>
                                                   </div>
                                                 ) : (
                                                   <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-dim rounded-xl p-8 text-center bg-bg/30">
                                                      <Target className="w-10 h-10 text-text-dim mb-4 opacity-20" />
                                                      <h6 className="text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest">No_Assigned_Operational_Flow</h6>
                                                   </div>
                                                 )}
                                              </div>

                                              <div className="space-y-6">
                                                 <h5 className="text-[10px] font-black uppercase text-text-dim tracking-widest">Reassignment_Matrix</h5>
                                                 <div className="bg-bg border border-border-dim rounded-lg overflow-hidden">
                                                    <div className="p-4 border-b border-border-dim bg-surface/30">
                                                       <p className="text-[9px] text-text-dim uppercase font-mono tracking-tight leading-relaxed">
                                                          Select a new strategic sequence for lead extraction and revenue synthesis.
                                                       </p>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-border-dim">
                                                       {campaigns.map(c => (
                                                         <button 
                                                            key={c.id}
                                                            onClick={() => handleAssignLeads(c.id)}
                                                            disabled={lead.campaignId === c.id || assigningToCampaign === c.id}
                                                            className={cn(
                                                              "w-full p-4 flex items-center justify-between transition-all hover:bg-accent-blue/5 group",
                                                              lead.campaignId === c.id && "bg-accent-blue/5"
                                                            )}
                                                         >
                                                            <div className="flex items-center gap-3">
                                                               <div className={cn(
                                                                  "w-2 h-2 rounded-full",
                                                                  lead.campaignId === c.id ? "bg-accent-blue" : "bg-border-dim group-hover:bg-accent-blue/50"
                                                               )}></div>
                                                               <div className="text-left">
                                                                  <div className={cn(
                                                                     "text-xs font-bold uppercase transition-colors",
                                                                     lead.campaignId === c.id ? "text-accent-blue" : "text-text-main"
                                                                  )}>{c.name}</div>
                                                                  <div className="text-[8px] text-text-dim uppercase">{c.status}</div>
                                                               </div>
                                                            </div>
                                                            {lead.campaignId === c.id ? (
                                                               <CheckCircle className="w-4 h-4 text-accent-blue" />
                                                            ) : (
                                                               <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-accent-blue transition-all group-hover:translate-x-1" />
                                                            )}
                                                         </button>
                                                       ))}
                                                    </div>
                                                 </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                   </div>
                               </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredLeads.map((lead, lIdx) => (
                            <motion.div 
                              key={lead.id || lIdx}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-surface border border-border-dim rounded-xl p-6 group hover:border-accent-blue transition-all flex flex-col h-full"
                            >
                               <div className="flex items-start justify-between mb-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-lg bg-bg border border-border-dim flex items-center justify-center text-lg font-black text-accent-blue shadow-inner group-hover:border-accent-blue/50 transition-colors">
                                        {(lead.name || "?")[0]}
                                     </div>
                                     <div>
                                        <div className="text-sm font-black uppercase text-text-main mb-0.5">{lead.name}</div>
                                        <div className="text-[10px] font-mono text-text-dim truncate max-w-[120px]">{lead.email}</div>
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                     <LeadScoreRadial score={lead.score} size={40} />
                                     <div className={cn(
                                       "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                       lead.status === 'Hot' ? "bg-red-500/10 text-red-500" : 
                                       lead.status === 'Warm' ? "bg-accent-gold/10 text-accent-gold" : 
                                       "bg-text-dim/10 text-text-dim"
                                     )}>
                                       ID_LEVEL: {lead.status}
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-4 mb-8 flex-1">
                                  <div className="p-3 bg-bg/50 border border-border-dim rounded space-y-2">
                                     <div className="flex justify-between items-center text-[8px] font-black uppercase text-text-dim">
                                        <span>Origin_Node</span>
                                        <span className="text-text-main tracking-widest">{lead.source}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[8px] font-black uppercase text-text-dim">
                                        <span>Mission</span>
                                        <span className="text-accent-blue truncate ml-4 max-w-[100px] text-right">
                                          {campaigns.find(c => c.id === lead.campaignId)?.name || "UNASSIGNED"}
                                        </span>
                                     </div>
                                     <div className="flex justify-between items-center text-[8px] font-black uppercase text-text-dim">
                                        <span>Last Pulse</span>
                                        <span className="text-accent-gold">
                                          {getRelativeTime(lead.history?.length > 0 ? [...lead.history].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null)}
                                        </span>
                                     </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                     <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-text-dim">Extraction_Progress</span>
                                        <span className="text-[9px] font-black font-mono text-accent-blue">{lead.score}%</span>
                                     </div>
                                     <div className="w-full h-1 bg-bg border border-border-dim rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${lead.score}%` }} className="h-full bg-accent-blue" />
                                     </div>
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-border-dim">
                                  <button 
                                    onClick={() => handleEnrichLead(lead)}
                                    disabled={enrichingId === lead.id}
                                    className="flex flex-col items-center justify-center gap-1.5 p-2 rounded bg-bg border border-border-dim hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-text-dim hover:text-accent-blue disabled:opacity-50"
                                  >
                                     {enrichingId === lead.id ? (
                                       <RefreshCcw className="w-4 h-4 animate-spin" />
                                     ) : (
                                       <Zap className="w-4 h-4" />
                                     )}
                                     <span className="text-[7px] font-black uppercase tracking-tighter">Enrich</span>
                                  </button>
                                  
                                  <div className="relative group/popover">
                                     <button className="w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded bg-bg border border-border-dim hover:border-accent-gold hover:bg-accent-gold/5 transition-all text-text-dim hover:text-accent-gold">
                                        <Target className="w-4 h-4" />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Assign</span>
                                     </button>
                                     <div className="absolute left-1/2 -top-1 -translate-x-1/2 -translate-y-full mb-2 w-48 bg-surface border border-border-dim rounded shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/popover:opacity-100 group-hover/popover:scale-100 group-hover/popover:pointer-events-auto transition-all z-50">
                                        <div className="p-2 border-b border-border-dim bg-bg/50">
                                          <div className="text-[8px] font-black uppercase text-text-dim tracking-widest text-center">Select_Mission</div>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto p-1">
                                          {campaigns.map(c => (
                                            <button 
                                              key={c.id}
                                              onClick={() => {
                                                const next = new Set<string>();
                                                next.add(lead.id);
                                                setSelectedLeads(next);
                                                handleAssignLeads(c.id);
                                              }}
                                              className={cn(
                                                "w-full text-left p-2 rounded text-[9px] font-black uppercase tracking-tight hover:bg-accent-blue/10 hover:text-accent-blue transition-colors",
                                                lead.campaignId === c.id && "text-accent-blue bg-accent-blue/5"
                                              )}
                                            >
                                              {c.name}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-surface border-r border-b border-border-dim rotate-45" />
                                     </div>
                                  </div>

                                  <button 
                                    onClick={() => initiateContact(lead)}
                                    className="flex flex-col items-center justify-center gap-1.5 p-2 rounded bg-bg border border-border-dim hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-text-dim hover:text-emerald-500"
                                  >
                                     <Mail className="w-4 h-4" />
                                     <span className="text-[7px] font-black uppercase tracking-tighter">Outreach</span>
                                  </button>
                               </div>
                            </motion.div>
                          ))}
                       </div>
                    </td>
                  </tr>
                )
              }
            </tbody>
              </table>
            </div>
          </div>
        </div>

        </div>
      ) : activeTab === 'SCORING' ? (
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-text-main">Neural_Scoring_Matrix</h2>
              <p className="text-[10px] text-text-dim font-mono uppercase mt-1">Configure algorithmic weight distribution for lead qualification</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleSyncAllScores}
                  disabled={isSavingRule || scoringRules.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-dim text-text-main text-[10px] font-black uppercase tracking-widest rounded transition-all hover:border-accent-blue/50 disabled:opacity-50"
                >
                  <RefreshCcw className={cn("w-4 h-4", isSavingRule && "animate-spin")} /> Global_Re-Sync
                </button>
                <button 
                  onClick={() => {
                    setEditingRule(null);
                    setNewRule({ label: "", weight: 10, type: "CLICK" });
                    setShowScoringModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Define_New_Factor
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {scoringRules.filter(r => !r.deleted).map((rule) => (
                <motion.div 
                  key={rule.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface border border-border-dim rounded-xl p-6 relative overflow-hidden group hover:border-accent-blue/40 transition-all"
                >
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded bg-bg border border-border-dim flex items-center justify-center text-accent-blue">
                         {getEventConfig(rule.type).icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingRule(rule);
                            setNewRule({ label: rule.label, weight: rule.weight, type: rule.type });
                            setShowScoringModal(true);
                          }}
                          className="p-1 px-2 hover:bg-accent-blue/10 text-text-dim hover:text-accent-blue rounded text-[8px] font-black uppercase tracking-widest transition-all border border-border-dim/30 hover:border-accent-blue/40 flex items-center gap-1.5"
                        >
                           <Edit3 className="w-2.5 h-2.5" />
                           Edit
                        </button>
                        <button 
                          onClick={() => deleteScoringRule(rule.id)}
                          className="p-1 px-2 hover:bg-red-500/10 text-text-dim hover:text-red-500 rounded text-[8px] font-black uppercase tracking-widest transition-all border border-border-dim/30 hover:border-red-500/40 flex items-center gap-1.5"
                        >
                           <Trash2 className="w-2.5 h-2.5" />
                           Remove
                        </button>
                      </div>
                   </div>
                   
                   <h3 className="text-xs font-black uppercase text-text-main mb-2 tracking-tight group-hover:text-accent-blue transition-colors">{rule.label}</h3>
                   <p className="text-[9px] text-text-dim font-mono uppercase mb-6">Interaction Node: {rule.type}</p>
                   
                   <div className="flex items-end justify-between border-t border-border-dim pt-4">
                      <div>
                         <div className="text-[8px] text-text-dim uppercase mb-1">Score_Weight</div>
                         <div className={cn(
                           "text-2xl font-black font-mono",
                           rule.weight >= 0 ? "text-accent-blue" : "text-red-500"
                         )}>
                           {rule.weight > 0 ? '+' : ''}{rule.weight}%
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[8px] text-text-dim uppercase mb-1">Impact_Range</div>
                         <div className={cn(
                           "text-[10px] font-mono",
                           Math.abs(rule.weight) > 30 ? "text-red-500" : Math.abs(rule.weight) > 15 ? "text-accent-gold" : "text-text-main"
                         )}>
                            {Math.abs(rule.weight) > 30 ? "CRITICAL" : Math.abs(rule.weight) > 15 ? "HIGH" : "STANDARD"}
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>

           <div className="p-8 bg-bg border border-border-dim rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <Cpu className="w-12 h-12 text-accent-blue opacity-10" />
              </div>
              <h4 className="text-[10px] font-black uppercase text-accent-blue tracking-[0.2em] mb-4">Algorithmic_Logic_Manifest</h4>
              <p className="text-[11px] text-text-dim font-mono leading-relaxed max-w-2xl">
                The lead score is dynamic. Each time a lead interacts with the Sovereign Core, its score is incremented by the weighted factors defined above. 
                Scores are capped at 100%. "Hot" leads (Score &gt; 85) are automatically prioritized for extraction.
              </p>
           </div>
        </div>
      ) : activeTab === 'CAMPAIGNS' ? (
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-text-main">Campaign_Control</h2>
                 <p className="text-[10px] text-text-dim font-mono uppercase mt-1">Strategic marketing sequence orchestration</p>
              </div>
              <button 
                onClick={() => {
                  setEditingCampaign(null);
                  setNewCampaign(INITIAL_CAMPAIGN_STATE);
                  setShowAddCampaign(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] shadow-lg"
              >
                <Plus className="w-4 h-4" /> Create_New_Campaign
              </button>
           </div>

           <div className="flex items-center gap-2">
             {['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'].map((status) => (
               <button
                 key={status}
                 onClick={() => setCampaignStatusFilter(status)}
                 className={cn(
                   "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all rounded",
                   campaignStatusFilter === status 
                     ? "bg-accent-blue/10 border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                     : "bg-surface border-border-dim text-text-dim hover:border-text-main"
                 )}
               >
                 {status}
               </button>
             ))}
           </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.filter(c => campaignStatusFilter === 'ALL' || c.status === campaignStatusFilter).length > 0 ? (
                campaigns
                  .filter(c => campaignStatusFilter === 'ALL' || c.status === campaignStatusFilter)
                  .map((campaign) => {
                  const campaignLeads = realLeads.filter(l => l.campaignId === campaign.id);
                  const leadCount = campaignLeads.length;
                  const convertedCount = campaignLeads.filter(l => l.status === 'Hot').length;
                  const conversionRate = leadCount > 0 ? ((convertedCount / leadCount) * 100).toFixed(1) : '0.0';

                  // Calculate Total LVT (ROI)
                  const totalLVT = campaignLeads.reduce((acc, lead) => {
                    const lvtStr = lead.metrics?.lvt || "$0.00";
                    const numericLvt = parseFloat(lvtStr.replace(/[$,]/g, '')) || 0;
                    return acc + numericLvt;
                  }, 0);

                  return (
                    <motion.div 
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface border border-border-dim rounded-xl p-6 group hover:border-accent-blue/50 transition-all relative overflow-hidden"
                    >
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                               campaign.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : 
                               campaign.status === 'PAUSED' ? "bg-amber-500/10 text-amber-500" :
                               campaign.status === 'COMPLETED' ? "bg-accent-blue/10 text-accent-blue" :
                               "bg-border-dim text-text-dim"
                             )}>
                                {campaign.status}
                             </div>
                             <button 
                               onClick={() => toggleCampaignStatus(campaign)}
                               className={cn(
                                 "p-1.5 rounded border transition-all flex items-center justify-center",
                                 campaign.status === 'ACTIVE' 
                                   ? "border-amber-500/40 text-amber-500 hover:bg-amber-500/10" 
                                   : campaign.status === 'PAUSED'
                                   ? "border-accent-blue/40 text-accent-blue hover:bg-accent-blue/10"
                                   : "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                               )}
                               title={
                                 campaign.status === 'ACTIVE' ? "Pause Campaign" : 
                                 campaign.status === 'PAUSED' ? "Complete Campaign" : 
                                 "Activate Campaign"
                               }
                             >
                               {campaign.status === 'ACTIVE' ? <Pause className="w-3 h-3 fill-amber-500" /> : 
                                campaign.status === 'PAUSED' ? <CheckCircle className="w-3 h-3 text-accent-blue" /> :
                                <Play className="w-3 h-3 fill-emerald-500" />}
                             </button>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => {
                                 setEditingCampaign(campaign);
                                 setNewCampaign({ 
                                   name: campaign.name, 
                                   description: campaign.description || "", 
                                   status: campaign.status,
                                   goal: campaign.goal || "LEAD_GEN",
                                   budget: campaign.budget || "",
                                   audience: campaign.audience || "",
                                   targetIndustry: campaign.targetIndustry || "",
                                   targetGeography: campaign.targetGeography || ""
                                 });
                                 setCurrentStep(2);
                                 setShowAddCampaign(true);
                                }}
                                className="p-1.5 hover:bg-accent-blue/10 hover:text-accent-blue rounded text-[8px] font-black uppercase tracking-widest transition-all border border-border-dim/30 hover:border-accent-blue/40 flex items-center gap-1.5"
                             >
                                <Edit3 className="w-2.5 h-2.5" />
                                Edit
                             </button>
                             <button 
                               onClick={() => deleteCampaign(campaign.id)}
                               className="p-1.5 hover:bg-red-500/10 text-text-dim hover:text-red-500 rounded text-[8px] font-black uppercase tracking-widest transition-all border border-border-dim/30 hover:border-red-500/40 flex items-center gap-1.5"
                             >
                                <Trash2 className="w-2.5 h-2.5" />
                                Delete
                             </button>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2 mb-2">
                         <h3 className="text-sm font-black uppercase tracking-tight text-text-main group-hover:text-accent-blue transition-colors">
                            {campaign.name}
                         </h3>
                       </div>
                       <p className="text-[10px] text-text-dim font-mono leading-relaxed h-12 overflow-hidden mb-2 line-clamp-2">
                          {campaign.description || "No mission parameters defined."}
                       </p>
                       <div className="mb-6 space-y-3">
                         <div>
                            <div className="text-[8px] text-text-dim uppercase mb-1">Target_Audience</div>
                            <div className="text-[10px] text-text-main font-mono line-clamp-1 italic">
                              {campaign.audience || "Global_Market_Segment"}
                            </div>
                         </div>
                         {(campaign.targetIndustry || campaign.targetGeography) && (
                           <div className="grid grid-cols-2 gap-2">
                             {campaign.targetIndustry && (
                               <div>
                                 <div className="text-[7px] text-text-dim uppercase mb-0.5">Industry</div>
                                 <div className="text-[9px] text-accent-blue font-mono truncate">{campaign.targetIndustry}</div>
                               </div>
                             )}
                             {campaign.targetGeography && (
                               <div>
                                 <div className="text-[7px] text-text-dim uppercase mb-0.5">Geography</div>
                                 <div className="text-[9px] text-accent-blue font-mono truncate">{campaign.targetGeography}</div>
                               </div>
                             )}
                           </div>
                         )}
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-bg/50 border border-border-dim/50 rounded-lg">
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">Campaign_Goal</div>
                             <div className="text-[10px] font-black font-mono text-accent-gold uppercase truncate">
                                {GOAL_LABELS[campaign.goal] || campaign.goal || "Lead Generation"}
                             </div>
                          </div>
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">Total_Budget</div>
                             <div className="text-[10px] font-black font-mono text-text-main">
                                ${campaign.budget || "0"}
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-dim">
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">Target_Nodes</div>
                             <div className="text-lg font-black font-mono text-text-main">{leadCount}</div>
                          </div>
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">ROI_(Sum_LVT)</div>
                             <div className="text-lg font-black font-mono text-emerald-500">
                                ${totalLVT.toLocaleString()}
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-4">
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">Conversion</div>
                             <div className="text-[10px] font-black font-mono text-text-main tracking-tighter">
                                {conversionRate}%_RATE
                             </div>
                          </div>
                          <div>
                             <div className="text-[8px] text-text-dim uppercase mb-1">Avg_CAC</div>
                             <div className="text-[10px] font-black font-mono text-text-dim">
                                ${leadCount > 0 ? (campaignLeads.reduce((acc, l) => acc + (parseFloat((l.metrics?.cac || "$0").replace(/[$,]/g, ''))), 0) / leadCount).toFixed(2) : "0.00"}
                             </div>
                          </div>
                       </div>
                       
                       <div className="mt-6 flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setCampaignFilter(campaign.id);
                              setActiveTab('LEADS');
                            }}
                            className="flex-1 py-2 bg-border-dim/20 hover:bg-accent-blue/10 hover:text-accent-blue rounded text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                             View_Leads
                          </button>
                          <button 
                            onClick={() => {
                              setCampaignFilter(campaign.id);
                              setActiveTab('OUTREACH');
                            }}
                            className="p-2 border border-border-dim rounded hover:border-accent-blue hover:text-accent-blue transition-all"
                          >
                             <Send className="w-4 h-4" />
                          </button>
                       </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-border-dim rounded-2xl">
                   <Target className="w-8 h-8 text-text-dim mx-auto mb-4 opacity-20" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                     {campaignStatusFilter === 'ALL' ? 'No_Active_Campaigns_Detected' : `No_${campaignStatusFilter}_Campaigns_Found`}
                   </h3>
                   <button 
                    onClick={() => {
                      setEditingCampaign(null);
                      setNewCampaign(INITIAL_CAMPAIGN_STATE);
                      setShowAddCampaign(true);
                    }}
                    className="mt-4 text-accent-blue text-[9px] font-black uppercase tracking-widest hover:underline"
                   >
                    Initiate_First_Campaign
                   </button>
                </div>
              )}
           </div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {(["Empathetic", "Direct", "Curiosity", "Value-First"] as const).map(strategy => {
                const results = outreachRecords.filter(r => r.strategy === strategy);
                const sentCount = results.length;
                const engagedCount = results.filter(r => r.engagement !== 'NONE').length;
                const bounceCount = results.filter(r => r.status === 'FAILED').length;
                const engagementRate = sentCount > 0 ? ((engagedCount / sentCount) * 100).toFixed(1) : '0.0';

                const strategyLabels: { [key: string]: string } = {
                  "Empathetic": "Pain-Point Mirroring",
                  "Direct": "Revenue Injection",
                  "Curiosity": "Pattern Interruption",
                  "Value-First": "Reciprocity Loop"
                };

                return (
                  <div key={strategy} className="bg-surface border border-border-dim p-6 rounded-xl space-y-4 group hover:border-accent-blue/30 transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-3">
                        {parseFloat(engagementRate) > 15 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <Activity className="w-3 h-3 text-text-dim opacity-20" />}
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-accent-blue tracking-widest">{strategy}</span>
                        <div className="p-1 px-2 bg-accent-blue/10 text-accent-blue text-[8px] font-black rounded uppercase">{strategyLabels[strategy]}</div>
                     </div>
                     <div className="flex items-end justify-between">
                        <div>
                           <div className="text-2xl font-black font-mono text-text-main">{engagementRate}%</div>
                           <div className="text-[8px] text-text-dim uppercase">Engagement_Rate</div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-black font-mono text-text-dim">{sentCount}</div>
                           <div className="text-[8px] text-text-dim uppercase">Total_Dispatches</div>
                        </div>
                     </div>
                     <div className="w-full h-1 bg-border-dim rounded-full overflow-hidden">
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: `${engagementRate}%` }} className="h-full bg-accent-blue" />
                     </div>
                     <div className="flex items-center justify-between pt-2 border-t border-border-dim/30">
                        <div className="flex items-center gap-1">
                           <span className="text-[8px] text-text-dim uppercase">Bounced:</span>
                           <span className="text-[8px] font-mono text-red-500">{bounceCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-[8px] text-text-dim uppercase">Responsive:</span>
                           <span className="text-[8px] font-mono text-emerald-500">{engagedCount}</span>
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>

           <div className="bg-surface border border-border-dim rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border-dim flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-accent-blue" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">Autonomous_Outreach_Log</h3>
                 </div>
                 <div className="flex gap-2">
                    <select 
                      value={campaignFilter || "ALL"} 
                      onChange={e => setCampaignFilter(e.target.value)}
                      className="bg-bg border border-border-dim rounded px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:border-accent-blue"
                    >
                      <option value="ALL">ALL_CAMPAIGNS</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[9px] font-black text-text-dim uppercase border-b border-border-dim">
                          <th className="px-6 py-4">Lead</th>
                          <th className="px-6 py-4">Strategy</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Engagement</th>
                          <th className="px-6 py-4">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dim">
                       {outreachRecords
                        .filter(r => campaignFilter === 'ALL' || r.campaignId === campaignFilter)
                        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                        .map(record => (
                          <tr key={record.id} className="hover:bg-accent-blue/[0.02]">
                             <td className="px-6 py-4">
                                <span className="text-[10px] font-bold uppercase text-text-main">
                                  {realLeads.find(l => l.id === record.leadId)?.name || 'Unknown Lead'}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-[9px] font-black uppercase text-accent-blue border border-accent-blue/20 px-2 py-1 rounded bg-accent-blue/5">
                                   {record.strategy}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[9px] font-black uppercase",
                                  record.status === 'SENT' ? "text-emerald-500" : "text-text-dim"
                                )}>
                                   {record.status}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   {record.engagement === 'NONE' ? (
                                      <span className="text-[9px] font-mono text-text-dim">UNOPENED</span>
                                   ) : (
                                      <span className="text-[9px] font-black uppercase text-accent-gold flex items-center gap-1">
                                         <Zap className="w-3 h-3 fill-accent-gold" /> {record.engagement}
                                      </span>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-[9px] font-mono text-text-dim">
                                   {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleString() : 'RECENT'}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      <AnimatePresence>
        {showScoringModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md bg-surface border border-border-dim rounded-2xl overflow-hidden p-8 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between border-b border-border-dim pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tighter text-text-main">
                      {editingRule ? 'Rule_Modification' : 'Rule_Initialization'}
                    </h3>
                    <p className="text-[9px] text-text-dim font-mono uppercase mt-1">
                      Define the neural weight for lead extraction
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowScoringModal(false);
                      setEditingRule(null);
                    }} 
                    className="p-2 hover:bg-bg rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleSaveScoringRule} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Factor_Label</label>
                     <input 
                      required
                      value={newRule.label || ""} 
                      onChange={e => setNewRule({...newRule, label: e.target.value})} 
                      className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                      placeholder="e.g. Website Engagement Pulse"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Activity_Type</label>
                       <select 
                        value={newRule.type} 
                        onChange={e => setNewRule({...newRule, type: e.target.value})} 
                        className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono appearance-none"
                       >
                         <option value="EMAIL">Email Event</option>
                         <option value="CLICK">Interaction</option>
                         <option value="AUTH">Authentication</option>
                         <option value="SYNC">Neural Sync</option>
                         <option value="SEARCH">Search/Recon</option>
                         <option value="READ">Data Consumption</option>
                         <option value="OPTIN">Conversion</option>
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest flex justify-between">
                          Score_Weight_Impact <span className={cn(newRule.weight >= 0 ? "text-accent-blue" : "text-red-500")}>
                            {newRule.weight > 0 ? '+' : ''}{newRule.weight}%
                          </span>
                       </label>
                       <div className="flex items-center gap-4">
                         <span className="text-[8px] font-mono text-text-dim">-100%</span>
                         <input 
                           type="range"
                           min="-100"
                           max="100"
                           step="5"
                           value={newRule.weight}
                           onChange={e => setNewRule({...newRule, weight: parseInt(e.target.value)})}
                           className="flex-1 accent-accent-blue h-6 mt-2"
                         />
                         <span className="text-[8px] font-mono text-text-dim">+100%</span>
                       </div>
                       <p className="text-[8px] text-text-dim italic font-mono">
                         {newRule.weight > 0 ? "Positive impact: increases lead intensity." : "Negative impact: reduces lead intensity for undesirable behavior."}
                       </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSavingRule}
                      className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50 shadow-lg"
                    >
                       {isSavingRule ? (
                         <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <>
                           {editingRule ? <RefreshCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                           {editingRule ? 'Update_Rule' : 'Inject_Rule'}
                         </>
                       )}
                    </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddCampaign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-lg bg-surface border border-border-dim rounded-2xl overflow-hidden p-8 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between border-b border-border-dim pb-4">
                   <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black uppercase tracking-tighter text-text-main">
                        {editingCampaign ? 'Campaign_Modification' : 'Campaign_Initialization'}
                      </h3>
                      <div className="flex items-center gap-2 ml-4">
                        {[1, 2, 3, 4].map(step => (
                          <React.Fragment key={step}>
                            <div 
                              className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-black transition-all duration-300",
                                currentStep === step 
                                  ? "border-accent-blue bg-accent-blue text-bg shadow-[0_0_10px_rgba(0,242,255,0.4)] scale-110" 
                                  : currentStep > step 
                                    ? "border-accent-blue/50 bg-accent-blue/10 text-accent-blue" 
                                    : "border-border-dim bg-bg text-text-dim"
                              )}
                            >
                              {currentStep > step ? "✓" : step}
                            </div>
                            {step < 4 && (
                              <div className={cn(
                                "w-4 h-[1px] transition-all duration-500",
                                currentStep > step ? "bg-accent-blue" : "bg-border-dim"
                              )} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-text-dim font-mono uppercase">
                      Step {currentStep}_of_4: {
                        currentStep === 1 ? 'Strategy_Protocol' : 
                        currentStep === 2 ? 'Mission_Identity' : 
                        currentStep === 3 ? 'Strategic_Objectives' : 
                        'Audience_Intelligence'
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddCampaign(false);
                      setEditingCampaign(null);
                      setNewCampaign(INITIAL_CAMPAIGN_STATE);
                      setCurrentStep(1);
                    }} 
                    className="p-2 hover:bg-bg rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="space-y-6">
                 {currentStep === 1 && (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    className="space-y-4"
                   >
                      <div className="grid grid-cols-2 gap-4">
                        {CAMPAIGN_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setNewCampaign({
                                ...newCampaign,
                                goal: template.goal,
                                description: template.description,
                                audience: template.audience
                              });
                              setCurrentStep(2);
                            }}
                            className="p-4 bg-bg border border-border-dim rounded-xl hover:border-accent-blue transition-all group text-left space-y-3"
                          >
                            <div className={cn("w-8 h-8 rounded bg-bg border border-border-dim/50 flex items-center justify-center group-hover:border-accent-blue/30 group-hover:text-accent-blue transition-colors", template.color)}>
                              {template.id === 'LEAD_GEN' && <Users className="w-4 h-4" />}
                              {template.id === 'AWARENESS' && <Globe className="w-4 h-4" />}
                              {template.id === 'SALES' && <Target className="w-4 h-4" />}
                              {template.id === 'CUSTOM' && <Cpu className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-tight text-text-main line-clamp-1">{template.name.replace(' ', '_')}</div>
                              <p className="text-[8px] text-text-dim font-mono leading-tight mt-1 line-clamp-2">
                                {template.id === 'CUSTOM' ? "Build your proprietary campaign architecture from absolute zero." : template.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                   </motion.div>
                 )}

                 {currentStep === 2 && (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    className="space-y-6"
                   >
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Campaign_Name</label>
                         <input 
                          required
                          value={newCampaign.name || ""} 
                          onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                          placeholder="e.g. Q2_CYBER_ACCELERATOR"
                         />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Operational_Status</label>
                         <select 
                          value={newCampaign.status} 
                          onChange={e => setNewCampaign({...newCampaign, status: e.target.value})} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono appearance-none"
                         >
                           <option value="ACTIVE">Active</option>
                           <option value="PAUSED">Paused</option>
                           <option value="COMPLETED">Completed</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Strategic_Description</label>
                         <textarea 
                          value={newCampaign.description} 
                          onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors h-32 resize-none font-mono" 
                          placeholder="Define the core mission objective..."
                         />
                      </div>
                   </motion.div>
                 )}

                 {currentStep === 3 && (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    className="space-y-6"
                   >
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Campaign_Goal</label>
                         <select 
                          value={newCampaign.goal} 
                          onChange={e => setNewCampaign({...newCampaign, goal: e.target.value})} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono appearance-none"
                         >
                           <option value="LEAD_GEN">Lead Generation</option>
                           <option value="AWARENESS">Brand Awareness</option>
                           <option value="SALES">Sales Conversion</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Allocated_Budget_USD</label>
                         <input 
                          type="number"
                          value={newCampaign.budget} 
                          onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})} 
                          className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                          placeholder="e.g. 5000"
                         />
                      </div>
                   </motion.div>
                 )}

                 {currentStep === 4 && (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    className="space-y-6"
                   >
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Primary_Target_Audience</label>
                         <input 
                           value={newCampaign.audience || ""} 
                           onChange={e => setNewCampaign({...newCampaign, audience: e.target.value})} 
                           className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                           placeholder="e.g. Fintech founders, SaaS CEOs..."
                         />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Target_Industries</label>
                           <input 
                             value={newCampaign.targetIndustry || ""} 
                             onChange={e => setNewCampaign({...newCampaign, targetIndustry: e.target.value})} 
                             className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                             placeholder="e.g. Fintech, Crypto, AI"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Geographic_Focus</label>
                           <input 
                             value={newCampaign.targetGeography || ""} 
                             onChange={e => setNewCampaign({...newCampaign, targetGeography: e.target.value})} 
                             className="w-full bg-bg border border-border-dim rounded p-4 text-xs outline-none focus:border-accent-blue transition-colors font-mono" 
                             placeholder="e.g. USA, EU, APAC"
                           />
                        </div>
                      </div>
                   </motion.div>
                 )}

                  <div className="flex items-center gap-4 pt-4 border-t border-border-dim">
                    {(currentStep > 1 || (currentStep === 1 && editingCampaign)) && (
                      <button 
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="flex-1 py-4 bg-bg border border-border-dim text-text-dim text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-3 hover:border-text-dim transition-all"
                      >
                         Back
                      </button>
                    )}
                    
                    {currentStep < 4 ? (
                      <button 
                        type="button"
                        onClick={() => {
                          if (currentStep === 2 && !newCampaign.name) {
                            addNotification({
                              type: 'SECURITY',
                              title: "Validation Error",
                              message: "Campaign name is required"
                            });
                            return;
                          }
                          setCurrentStep(prev => prev + 1);
                        }}
                        className="flex-[2] py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all shadow-lg"
                      >
                         Next_Step <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={(e) => handleCreateCampaign(e as any)}
                        disabled={isCreatingCampaign}
                        className="flex-[2] py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50 shadow-lg"
                      >
                         {isCreatingCampaign ? (
                           <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <>
                             {editingCampaign ? <RefreshCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                             {editingCampaign ? 'Update_Campaign' : 'Initiate_Campaign'}
                           </>
                         )}
                      </button>
                    )}
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-lg bg-surface border border-border-dim rounded-2xl overflow-hidden p-8 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between border-b border-border-dim pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tighter text-text-main">Manual_Intelligence_Entry</h3>
                    <p className="text-[9px] text-text-dim font-mono uppercase mt-1">Inject high-integrity lead data into the core</p>
                  </div>
                  <button onClick={() => setShowAddLead(false)} className="p-2 hover:bg-bg rounded transition-colors"><X className="w-5 h-5" /></button>
               </div>

               <form onSubmit={handleCreateLead} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Full Name</label>
                       <input 
                        required
                        value={newLead.name || ""} 
                        onChange={e => setNewLead({...newLead, name: e.target.value})} 
                        className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue transition-colors" 
                        placeholder="e.g. Satoshi Nakamoto"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Email Address</label>
                       <input 
                        required
                        type="email"
                        value={newLead.email || ""} 
                        onChange={e => setNewLead({...newLead, email: e.target.value})} 
                        className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue transition-colors" 
                        placeholder="satosh@p2p.foundation"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Intelligence Score</label>
                       <div className="flex items-center gap-3">
                         <input 
                          type="range"
                          min="0"
                          max="100"
                          value={newLead.score} 
                          onChange={e => setNewLead({...newLead, score: parseInt(e.target.value)})} 
                          className="flex-1 accent-accent-blue"
                         />
                         <span className="text-xs font-mono font-black text-accent-blue w-8">{newLead.score}%</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-text-dim tracking-widest">Origin Source</label>
                       <select 
                        value={newLead.source} 
                        onChange={e => setNewLead({...newLead, source: e.target.value})} 
                        className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue transition-colors appearance-none font-mono"
                       >
                         {COMMON_SOURCES.map(source => (
                           <option key={source} value={source}>{source}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent-blue/5 border border-accent-blue/10 rounded">
                    <div className="flex items-center gap-3">
                       <Zap className="w-4 h-4 text-accent-blue" />
                       <div>
                          <div className="text-[10px] font-black uppercase text-text-main">Neural Enrichment</div>
                          <div className="text-[8px] text-text-dim uppercase">Sync data from public nodes on creation</div>
                       </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAutoEnrich(!autoEnrich)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-all",
                        autoEnrich ? "bg-accent-blue" : "bg-border-dim"
                      )}
                    >
                       <div className={cn(
                         "absolute top-1 w-3 h-3 rounded-full bg-bg transition-all",
                         autoEnrich ? "right-1" : "left-1"
                       )} />
                    </button>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isCreating}
                      className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50"
                    >
                       {isCreating ? (
                         <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <>
                           <Plus className="w-4 h-4" /> Finalize_Injection
                         </>
                       )}
                    </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}

        {showTutorial && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-bg/40 backdrop-blur-[2px]" />
            <AnimatePresence mode="wait">
              <motion.div 
                key={tutorialStep}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute pointer-events-auto"
                style={{
                  ...(() => {
                    const el = document.querySelector(tutorialSteps[tutorialStep].target);
                    if (!el) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
                    const rect = el.getBoundingClientRect();
                    const pos = tutorialSteps[tutorialStep].position;
                    if (pos === 'bottom') return { left: rect.left + rect.width / 2, top: rect.bottom + 20, transform: 'translateX(-50%)' };
                    if (pos === 'left') return { left: rect.left - 320, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' };
                    return { left: rect.left + rect.width / 2, top: rect.top - 20, transform: 'translate(-50%, -100%)' };
                  })()
                }}
              >
                <div className="w-[300px] bg-surface border border-accent-blue/30 rounded-xl p-6 shadow-[0_0_50px_rgba(0,242,255,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[8px] font-black uppercase text-accent-blue tracking-widest">Protocol_Tutorial_Step {tutorialStep + 1}/{tutorialSteps.length}</span>
                    <button onClick={finishTutorial} className="text-text-dim hover:text-text-main transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-text-main mb-2">{tutorialSteps[tutorialStep].title}</h4>
                  <p className="text-[10px] text-text-dim font-mono leading-relaxed mb-6 uppercase tracking-wider">{tutorialSteps[tutorialStep].content}</p>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                      disabled={tutorialStep === 0}
                      className="px-3 py-1.5 text-[8px] font-black uppercase text-text-dim hover:text-text-main disabled:opacity-30"
                    >
                      Previous
                    </button>
                    {tutorialStep === tutorialSteps.length - 1 ? (
                      <button 
                        onClick={finishTutorial}
                        className="px-4 py-2 bg-accent-blue text-bg text-[8px] font-black uppercase tracking-widest rounded"
                      >
                        Terminal_Ready
                      </button>
                    ) : (
                      <button 
                        onClick={() => setTutorialStep(prev => prev + 1)}
                        className="px-4 py-2 bg-bg border border-border-dim text-text-main text-[8px] font-black uppercase tracking-widest rounded hover:border-accent-blue transition-colors flex items-center gap-2"
                      >
                        Proceed <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {contactLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-lg bg-surface border border-border-dim rounded-2xl overflow-hidden p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Execute_Outreach</h3>
                    <p className="text-[9px] text-text-dim font-mono uppercase mt-1">Initiate protocol handshake sequence</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleGeneratePitch()}
                      disabled={isGeneratingPitch}
                      className="p-2 bg-accent-blue/10 text-accent-blue border border-accent-blue/30 rounded flex items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-accent-blue hover:text-bg transition-all disabled:opacity-50"
                    >
                      {isGeneratingPitch ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                      Synthesize_AI_Pitch
                    </button>
                    <button onClick={() => setContactLead(null)} className="p-2 hover:bg-border-dim rounded transition-colors"><X className="w-4 h-4 text-text-dim" /></button>
                  </div>
               </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Outreach Strategy (A/B testing)</label>
                         <div className="grid grid-cols-2 gap-2">
                            {(["Empathetic", "Direct", "Curiosity", "Value-First"] as const).map(strategy => (
                              <button
                                key={strategy}
                                onClick={() => setSelectedStrategy(strategy)}
                                className={cn(
                                  "py-2 px-1 rounded border text-[8px] font-black uppercase tracking-tight transition-all",
                                  selectedStrategy === strategy 
                                    ? "bg-accent-blue/10 border-accent-blue text-accent-blue shadow-[0_0_10px_rgba(0,242,255,0.2)]" 
                                    : "bg-bg border-border-dim text-text-dim hover:border-text-dim"
                                )}
                              >
                                {strategy}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Synthetic Tone</label>
                           <div className="grid grid-cols-1 gap-2">
                              {(["Professional", "Friendly", "Urgent"] as const).map(tone => (
                                <button
                                  key={tone}
                                  onClick={() => setSelectedTone(tone)}
                                  className={cn(
                                    "py-2 px-2 rounded border text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                                    selectedTone === tone 
                                      ? "bg-accent-blue/10 border-accent-blue text-accent-blue" 
                                      : "bg-bg border-border-dim text-text-dim hover:border-text-dim"
                                  )}
                                >
                                  {tone}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Output Length</label>
                           <div className="grid grid-cols-1 gap-2">
                              {(["Short", "Medium", "Long"] as const).map(length => (
                                <button
                                  key={length}
                                  onClick={() => setSelectedLength(length)}
                                  className={cn(
                                    "py-2 px-2 rounded border text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                                    selectedLength === length 
                                      ? "bg-accent-blue/10 border-accent-blue text-accent-blue" 
                                      : "bg-bg border-border-dim text-text-dim hover:border-text-dim"
                                  )}
                                >
                                  {length}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-text-dim">Subject</label>
                         <input value={messageData.subject} onChange={e => setMessageData({...messageData, subject: e.target.value})} className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none focus:border-accent-blue transition-colors font-mono" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-text-dim">Direct Directive</label>
                         <textarea rows={8} value={messageData.body} onChange={e => setMessageData({...messageData, body: e.target.value})} className="w-full bg-bg border border-border-dim rounded p-3 text-xs outline-none resize-none focus:border-accent-blue transition-colors font-mono" placeholder="Enter Outreach Payload..." />
                      </div>
                    </div>
                  </div>
               </div>
               <button onClick={handleSendOutreach} className="w-full py-4 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">
                  <Send className="w-4 h-4" /> Ship outreach payload
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeadStat({ icon, label, value, sub }: any) {
  return (
    <div className="p-8 bg-bg group transition-colors hover:bg-surface">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 border border-border-dim rounded text-accent-blue">{icon}</div>
        <div className="text-[9px] font-black font-mono text-emerald-500">{sub}</div>
      </div>
      <div className="text-3xl font-black font-mono text-accent-blue">{value}</div>
      <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">{label}</div>
    </div>
  );
}



