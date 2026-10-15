import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { EmptyState } from './EmptyState';

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ isOpen, onClose }) => {
  const { notifications, markRead, removeNotification } = useNotifications();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Sparkles className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'reminder': return <Bell className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/5 border-green-500/20';
      case 'warning': return 'bg-amber-500/5 border-amber-500/20';
      case 'error': return 'bg-red-500/5 border-red-500/20';
      case 'reminder': return 'bg-blue-500/5 border-blue-500/20';
      default: return 'bg-cyan-500/5 border-cyan-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed top-20 right-4 md:right-8 w-full max-w-sm bg-[#0b1f16] border border-emerald-500/20 rounded-2xl z-[101] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between bg-[#071610]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-lg tracking-tight text-white">Intelligence Log</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 hide-scrollbar">
              {notifications.length === 0 ? (
                <EmptyState
                  variant="compact"
                  icon={Bell}
                  title="No Botanical Alerts"
                  description="Sage has not issued any alerts. All scheduled tasks and system diagnostics are currently up to date."
                />
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all relative group ${getBgColor(n.type)} ${!n.read ? 'ring-1 ring-green-500/20' : ''}`}
                  >
                    {!n.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-400 shadow-glow-green" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-xl border shrink-0 ${getBgColor(n.type)}`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className={`text-sm font-bold tracking-tight ${!n.read ? 'text-primary' : 'text-secondary'}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                          {n.body}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-mono text-muted uppercase">
                            {n.createdAt?.toDate?.() ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                          <div className="flex items-center gap-2">
                            {!n.read && (
                              <button 
                                onClick={() => n.id && markRead(n.id)}
                                className="p-1 px-2 hover:bg-green-500/10 rounded-lg text-green-400 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Mark Seen
                              </button>
                            )}
                            <button 
                               onClick={() => n.id && removeNotification(n.id)}
                               className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 border-t border-emerald-500/10 bg-[#071610] text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80 italic">Neural Archive Active</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
