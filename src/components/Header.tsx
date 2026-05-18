import React from "react";
import { Link } from "react-router-dom";
import { Search, Map as MapIcon, Cpu } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "../contexts/AuthContext";

export default function Header({ onSearchClick }: { onSearchClick?: () => void }) {
  const { user, logOut } = useAuth();

  return (
    <header className="h-[64px] border-b border-border-dim bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-bg border border-border-dim flex items-center justify-center group-hover:border-accent-blue transition-colors">
            <Cpu className="w-5 h-5 text-accent-blue group-hover:drop-shadow-[0_0_8px_#00f2ff]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tighter uppercase leading-none text-accent-blue">Freedom Wheels™</span>
            <span className="text-[9px] font-bold text-accent-gold uppercase tracking-[0.2em] leading-none mt-1">Ecosystem</span>
          </div>
        </Link>
        
        <div 
          onClick={onSearchClick}
          className="hidden md:flex items-center justify-between gap-3 bg-bg border border-border-dim px-4 py-2 rounded-lg w-96 group hover:border-accent-blue cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-text-dim group-hover:text-accent-blue" />
            <span className="text-[11px] font-mono text-text-dim/50">Search autonomous infrastructure...</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-dim text-[8px] font-mono text-text-dim group-hover:text-accent-blue transition-colors">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-dim text-[8px] font-mono text-text-dim group-hover:text-accent-blue transition-colors">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <NotificationCenter />
        
        <div className="h-8 w-[1px] bg-border-dim" />
        
        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex flex-col items-end hover:opacity-80 transition-opacity">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-main">{user.email?.split('@')[0]}</span>
              <span className="text-[9px] font-bold text-accent-blue uppercase tracking-widest">View Profile</span>
            </Link>
            <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-accent-gold p-[1px] hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-[10px] font-black overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.email || 'User'} className="w-full h-full object-cover" />
                ) : (
                  user.email?.[0].toUpperCase()
                )}
              </div>
            </Link>
          </div>
        ) : (
          <Link 
            to="/join"
            className="px-6 py-2 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all"
          >
            Access_Protocol
          </Link>
        )}
      </div>
    </header>
  );
}
