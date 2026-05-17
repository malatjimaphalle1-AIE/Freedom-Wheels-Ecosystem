import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Cpu, 
  ShoppingBag, 
  Target, 
  Trophy, 
  Network, 
  Book,
  TrendingUp,
  Wallet,
  Zap,
  Settings as SettingsIcon
} from "lucide-react";
import { cn } from "../lib/utils";

const navigation = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "Funnel Builder", href: "/builder", icon: Cpu },
  { name: "Traffic Engine", href: "/traffic", icon: TrendingUp },
  { name: "Automation Hub", href: "/automation", icon: Zap },
  { name: "Lead Intelligence", href: "/leads", icon: Target },
  { name: "Affiliate Engine", href: "/referrals", icon: Network },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Wallet & Revenue", href: "/wallet", icon: Wallet },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Knowledge Base", href: "/knowledge", icon: Book },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-bg border-r border-border-dim flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border-dim">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">Navigation_Link</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all group",
                isActive 
                  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20" 
                  : "text-text-dim hover:bg-surface hover:text-text-main"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-accent-blue" : "text-text-dim group-hover:text-text-main"
              )} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto border-t border-border-dim space-y-4">
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-4">
          <div className="text-[9px] font-black text-accent-blue uppercase tracking-widest mb-1">System_Status</div>
          <div className="flex items-center gap-2 text-[10px] text-text-main">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CORE: OPTIMAL
          </div>
        </div>

        <div className="bg-surface border border-border-dim rounded-lg p-4 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-1 opacity-20">
             <Cpu className="w-8 h-8 text-text-dim" />
          </div>
          <div className="text-[8px] font-black text-text-dim uppercase tracking-widest mb-2 border-b border-border-dim/30 pb-1">Sovereign_Manifest</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[7px] font-mono">
              <span className="text-text-dim">DEPLOY_ID</span>
              <span className="text-accent-gold">SVGN-8842-1648</span>
            </div>
            <div className="flex justify-between text-[7px] font-mono">
              <span className="text-text-dim">NODE_VER</span>
              <span className="text-text-main">v20.18.0</span>
            </div>
            <div className="flex justify-between text-[7px] font-mono">
              <span className="text-text-dim">SYNC_STATE</span>
              <span className="text-emerald-500 italic uppercase">Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
