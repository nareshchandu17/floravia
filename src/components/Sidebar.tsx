import React from 'react';
import { 
  Home, 
  Camera, 
  Sprout, 
  Calendar, 
  Users, 
  BookOpen, 
  Sparkles, 
  Bell, 
  ShoppingBag, 
  Settings, 
  Crown,
  ChevronDown,
  Leaf,
  LogOut,
  LogIn,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export type NavigationTab = 
  | 'home' 
  | 'identify' 
  | 'diagnose' 
  | 'garden' 
  | 'calendar' 
  | 'community' 
  | 'guide' 
  | 'chat' 
  | 'reminders' 
  | 'shop' 
  | 'profile';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenUpgradeModal: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'signup' | 'verify-email') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  onOpenUpgradeModal,
  onOpenAuthModal
}) => {
  const { user, isEmailVerified, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'identify', label: 'Identify Plant', icon: Camera },
    { id: 'garden', label: 'My Garden', icon: Sprout },
    { id: 'calendar', label: 'Care Calendar', icon: Calendar },
    { id: 'community', label: 'Community Forum', icon: Users },
    { id: 'guide', label: 'Plant Encyclopedia', icon: BookOpen },
    { id: 'chat', label: 'AI Assistant', icon: Sparkles },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#08120d] border-r border-emerald-900/20 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none">
      {/* Top Brand / Logo */}
      <div className="p-5 pb-2">
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5 fill-emerald-400/20 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Floravia
            </h1>
            <p className="text-[11px] text-emerald-400/70 font-medium tracking-wide">
              AI Plant Care Companion
            </p>
          </div>
        </div>
      </div>

      {/* Middle Navigation Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                isActive
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-emerald-100 hover:bg-emerald-950/20 border border-transparent'
              }`}
            >
              <Icon 
                className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'
                }`} 
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Premium Card + User Profile Pill */}
      <div className="p-3 pt-0 space-y-3">
        {/* Premium Card */}
        <div className="p-3.5 rounded-2xl bg-[#0d1c15] border border-emerald-800/30 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 tracking-wide">Premium Plan</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-tight">
            You have 23 scans left this month
          </p>
          <button 
            onClick={onOpenUpgradeModal}
            className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer ${
              user && !isEmailVerified
                ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-500/60'
                : 'bg-[#0d1a13] border-emerald-900/30 hover:border-emerald-700/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img 
                  src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/30" 
                />
                {user && !isEmailVerified && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0d1a13]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user ? (user.displayName || user.email?.split('@')[0]) : 'Guest Botanist'}
                </p>
                <p className="text-[10px] text-emerald-400/80 truncate">
                  {user ? (isEmailVerified ? 'Verified Member' : 'Verification Pending') : 'Click to Sign In'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-[#0e1d16] border border-emerald-800/40 rounded-xl shadow-2xl z-50 space-y-1">
              {user && !isEmailVerified && (
                <button 
                  onClick={() => {
                    onOpenAuthModal?.('verify-email');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/40 rounded-lg text-left font-bold"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Verify Email
                </button>
              )}

              <button 
                onClick={() => {
                  setActiveTab('profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-emerald-300 hover:bg-emerald-900/30 rounded-lg text-left"
              >
                <Settings className="w-3.5 h-3.5" />
                Profile & Settings
              </button>

              {user ? (
                <button 
                  onClick={() => {
                    signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      onOpenAuthModal?.('login');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-950/30 rounded-lg text-left font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                  <button 
                    onClick={() => {
                      onOpenAuthModal?.('signup');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-950/30 rounded-lg text-left font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Create Account
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
