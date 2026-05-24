import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Info, Zap, Target, Shield, Check, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useNotificationStore, Notification } from "../store/useNotificationStore";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Effect to handle new incoming notifications for the toast
  React.useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    const newest = unread[0];
    
    if (newest && newest.id !== lastNotificationId) {
      setLastNotificationId(newest.id);
      setActiveToast(newest);
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, lastNotificationId]);

  const unreadCount = notifications.filter(n => !n.read).length;


  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'INFO': return <Info className="w-4 h-4 text-accent-blue" />;
      case 'REVENUE': return <Zap className="w-4 h-4 text-accent-gold" />;
      case 'LEAD': return <Target className="w-4 h-4 text-accent-blue" />;
      case 'SECURITY': return <Shield className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-surface border border-border-dim hover:text-accent-blue transition-all group"
      >
        <Bell className={cn("w-4 h-4", unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-blue text-bg text-[8px] font-black flex items-center justify-center rounded-full shadow-[0_0_8px_#00f2ff]">
            {unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-6 right-6 z-[200] w-72 md:w-80 bg-surface border-2 border-accent-blue/30 rounded-xl shadow-[0_0_30px_rgba(0,242,255,0.15)] overflow-hidden cursor-pointer group"
            onClick={() => {
              setIsOpen(true);
              setActiveToast(null);
            }}
          >
            <div className="p-4 flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg border border-accent-blue/20 flex items-center justify-center shrink-0">
                {getIcon(activeToast.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-[10px] font-black uppercase tracking-tight text-accent-blue truncate">
                    {activeToast.title}
                  </h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
                    className="p-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-text-main leading-tight line-clamp-2">{activeToast.message}</p>
              </div>
            </div>
            <div className="h-0.5 w-full bg-accent-blue/10">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-accent-blue shadow-[0_0_10px_#00f2ff]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile or closing on click outside */}
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-4 w-80 md:w-96 bg-surface border border-border-dim rounded-xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-4 border-b border-border-dim flex items-center justify-between bg-bg/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main">Neural_Notifications</h3>
                  <span className="text-[8px] font-mono text-text-dim px-1.5 py-0.5 rounded border border-border-dim uppercase">Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={markAllAsRead}
                    className="text-[9px] font-black uppercase tracking-widest text-accent-blue hover:text-accent-blue/80 transition-colors"
                  >
                    Mark All Read
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-text-dim hover:text-text-main"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-4 rounded-lg border transition-all group relative",
                        notification.read 
                          ? "bg-bg/40 border-transparent text-text-dim" 
                          : "bg-surface border-border-dim hover:border-accent-blue/30"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "mt-1 w-8 h-8 rounded border flex items-center justify-center shrink-0",
                          notification.read ? "border-border-dim bg-bg" : "border-accent-blue/20 bg-accent-blue/5"
                        )}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={cn(
                              "text-[11px] font-bold uppercase tracking-tight truncate",
                              !notification.read && "text-text-main"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-[8px] font-mono text-text-dim">{notification.time}</span>
                          </div>
                          <p className="text-[10px] leading-relaxed line-clamp-2">{notification.message}</p>
                          
                          <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button 
                                onClick={() => markAsRead(notification.id)}
                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent-blue transition-colors hover:text-accent-blue/80"
                              >
                                <Check className="w-3 h-3" /> Acknowledge
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notification.id)}
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 transition-colors hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" /> Expunge
                            </button>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#00f2ff]" />
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex p-4 rounded-full bg-surface border border-border-dim mb-4">
                      <Shield className="w-6 h-6 text-text-dim" />
                    </div>
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">No active system alerts.</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border-dim bg-bg/50 text-center">
                 <span className="text-[8px] font-mono text-text-dim uppercase tracking-widest">Sovereign_Security_Watch :: Monitoring_Active</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
