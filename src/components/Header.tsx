import React, { useState } from 'react';
import { Leaf, MessageCircle, Camera, Activity, LogIn, LogOut, Sprout, BookOpen, Users, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { signIn, signOut } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationList } from './NotificationList';

interface HeaderProps {
  activeTab: 'identify' | 'diagnose' | 'chat' | 'garden' | 'guide' | 'profile' | 'community';
  setActiveTab: (tab: 'identify' | 'diagnose' | 'chat' | 'garden' | 'guide' | 'profile' | 'community') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.warn("Sign in cancelled or failed:", err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-green-400/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('identify')}>
            <div className="bg-gradient-to-br from-green-400 to-teal-500 p-2 rounded-xl text-void shadow-glow-green group-hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all duration-300 transform group-hover:scale-105">
              <Leaf className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-display tracking-wide font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-teal-300">
              Floravia
            </h1>
          </div>
          
          <nav className="hidden md:flex gap-1 bg-surface/50 border border-green-400/5 p-1.5 rounded-2xl overflow-x-auto mx-4 flex-1 sm:flex-none hide-scrollbar shadow-inner backdrop-blur-md relative">
            {[
              { id: 'identify', icon: Camera, label: 'Identify', activeColor: 'text-green-400', activeGlow: 'bg-green-500/10 border-green-500/30' },
              { id: 'diagnose', icon: Activity, label: 'Diagnose', activeColor: 'text-amber-400', activeGlow: 'bg-amber-500/10 border-amber-500/30' },
              { id: 'guide', icon: BookOpen, label: 'Guide', activeColor: 'text-blue-400', activeGlow: 'bg-blue-500/10 border-blue-500/30' },
              { id: 'community', icon: Users, label: 'Community', activeColor: 'text-purple-400', activeGlow: 'bg-purple-500/10 border-purple-500/30' },
              ...(user ? [{ id: 'garden', icon: Sprout, label: 'My Garden', activeColor: 'text-teal-400', activeGlow: 'bg-teal-500/10 border-teal-500/30' }] : []),
              { id: 'chat', icon: MessageCircle, label: 'Sage', activeColor: 'text-green-400', activeGlow: 'bg-green-500/10 border-green-500/30' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 border border-transparent z-10 ${
                  activeTab === item.id 
                    ? item.activeColor 
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="headerActiveTab"
                    className={`absolute inset-0 rounded-xl border ${item.activeGlow} -z-10`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 hover:bg-white/5 rounded-full transition-colors group"
                title="Notifications"
              >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-green-400' : 'text-muted group-hover:text-primary'}`} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 text-void font-black text-[9px] flex items-center justify-center rounded-full border border-void ring-2 ring-green-500/20 shadow-glow-green"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

            {user ? (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 p-1.5 rounded-full transition-all border ${
                  activeTab === 'profile'
                    ? 'bg-surface border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
                title="Profile Settings"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-green-500/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-900 text-green-400 flex items-center justify-center font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    {user.displayName?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-xs font-semibold text-primary hidden md:block whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                  {user.displayName?.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                 onClick={handleSignIn}
                 className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-void bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-300 hover:to-teal-300 transition-colors flex-shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <NotificationList 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm md:hidden z-[60] flex items-center justify-between gap-1 bg-surface/80 border border-white/10 p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        {[
          { id: 'identify', icon: Camera, label: 'Lens' },
          { id: 'diagnose', icon: Activity, label: 'Health' },
          { id: 'chat', icon: MessageCircle, label: 'Sage' },
          { id: 'garden', icon: Sprout, label: 'Garden', needsAuth: true },
          { id: 'community', icon: Users, label: 'Feed' },
        ].map((item) => {
          if (item.needsAuth && !user) return null;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all relative ${
                isActive ? 'text-green-400' : 'text-muted'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'} transition-transform`} />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 bg-green-500/10 rounded-full border border-green-500/20 -z-10 shadow-glow-green/20"
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
