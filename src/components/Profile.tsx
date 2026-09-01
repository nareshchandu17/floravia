import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { getUserPlants, getUserFeedback, getUserPreferences, saveUserPreferences, SavedPlant, FeedbackEntry, UserPreferences } from '../services/firebase';
import { 
  Sprout, 
  Bell, 
  BellOff, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  LogOut, 
  Loader2, 
  Brain, 
  Sparkles, 
  Wand2, 
  Globe, 
  Clock, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { signOut } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { EmailVerificationGate } from './EmailVerificationGate';
import { 
  COMMON_TIMEZONES, 
  getUserTimezone, 
  setUserTimezoneCache, 
  getDeviceTimezone, 
  getUserLocalCurrentTimeString, 
  getTimezoneDisplayOffset 
} from '../utils/timezone';

interface ProfileProps {
  onNavigateToGarden: () => void;
  onOpenAuthModal?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigateToGarden, onOpenAuthModal }) => {
  const { user, isEmailVerified } = useAuth();
  const { 
    enabled: notificationsEnabled, 
    loading: notifsLoading, 
    isToggling: togglingNotifs, 
    toggle: toggleNotifications,
    notify
  } = useNotifications();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const activeTimezone = getUserTimezone(prefs?.timezone);

  // Update live clock every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(getUserLocalCurrentTimeString(activeTimezone));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [activeTimezone]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const triggerTestNotification = async () => {
    try {
      await notify(
        "Botanical Alert System", 
        `System check initiated. Real-time neural link active in ${activeTimezone}.`,
        "success"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [savedPlants, userFeedback, userPrefs] = await Promise.all([
        getUserPlants().catch(() => []),
        getUserFeedback().catch(() => []),
        getUserPreferences().catch(() => null)
      ]);
      setPlants(savedPlants || []);
      setFeedbacks(userFeedback || []);
      
      // If user has no timezone preference yet, auto-detect device timezone and save
      const deviceTz = getDeviceTimezone();
      if (userPrefs) {
        if (!userPrefs.timezone) {
          userPrefs.timezone = deviceTz;
          saveUserPreferences({ timezone: deviceTz });
        }
        setUserTimezoneCache(userPrefs.timezone);
        setPrefs(userPrefs);
      } else {
        const initialPrefs: UserPreferences = {
          userId: user?.uid || '',
          timezone: deviceTz,
          expertise: 'intermediate',
          sageTone: 'Friendly',
          updatedAt: new Date()
        };
        saveUserPreferences({ timezone: deviceTz });
        setUserTimezoneCache(deviceTz);
        setPrefs(initialPrefs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrefs = async (updates: Partial<UserPreferences>) => {
    setSavingPrefs(true);
    if (updates.timezone) {
      setUserTimezoneCache(updates.timezone);
    }
    try {
      await saveUserPreferences(updates);
      setPrefs(prev => prev ? { ...prev, ...updates } : { userId: user?.uid || '', updatedAt: new Date(), ...updates });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAutoDetectTimezone = async () => {
    const deviceTz = getDeviceTimezone();
    await handleUpdatePrefs({ timezone: deviceTz });
  };

  const handleToggleNotifications = async () => {
    try {
      const success = await toggleNotifications();
      if (!success) {
        if (!notificationsEnabled) {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'denied') {
              alert('Notifications are blocked. Please enable them in your browser site settings to receive reminders.');
            } else if (Notification.permission === 'default') {
              alert('Notification permission was not granted. Please try again and click Allow.');
            } else {
              alert('Could not enable notifications. If you are in a preview window, try opening the app in a new tab.');
            }
          } else {
            alert('Your browser does not support push notifications.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      alert('An unexpected error occurred while setting up notifications.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Sprout className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Sign In to View Settings</h3>
        <p className="text-xs text-emerald-200/70 leading-relaxed">
          Access your botanical preferences, notifications, and cloud telemetry.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (user && !isEmailVerified) {
    return (
      <EmailVerificationGate 
        featureName="Profile & Settings" 
        onVerified={loadProfileData} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      
      {/* Profile Header */}
      <div className="glass-card p-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-20 h-20 rounded-full border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface border border-green-500/20 flex items-center justify-center text-green-400 text-2xl font-bold shadow-inner">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-display font-bold text-primary">{user.displayName || 'Anonymous User'}</h2>
            <p className="text-secondary text-sm hidden sm:block font-ui tracking-wide">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-6 py-2.5 bg-surface/50 hover:bg-surface text-secondary hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-xl transition-all font-semibold font-ui text-sm shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Notifications & Garden Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-8 flex flex-col justify-center items-center text-center space-y-4 hover:-translate-y-1 transition-transform group">
          <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-shadow">
            <Sprout className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold text-primary">{plants.length}</h3>
            <p className="text-secondary text-sm font-ui mt-1">Plants in your Garden</p>
          </div>
          <button 
            onClick={onNavigateToGarden}
            className="mt-2 text-green-400 hover:text-green-300 font-semibold font-ui text-sm transition-colors"
          >
            View Garden &rarr;
          </button>
        </div>

        <div className="glass-card p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className={`p-4 rounded-2xl border transition-all ${notificationsEnabled ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'bg-surface/50 border-white/5'}`}>
            {notificationsEnabled ? (
              <Bell className="w-8 h-8 text-blue-400" />
            ) : (
              <BellOff className="w-8 h-8 text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-primary">Notifications</h3>
            <p className="text-secondary text-sm font-ui mt-1">Plant care reminders</p>
          </div>
          <button 
            onClick={handleToggleNotifications}
            disabled={togglingNotifs}
            className={`mt-2 px-6 py-2 rounded-xl font-bold font-ui text-sm transition-all focus:outline-none ${
              notificationsEnabled 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30' 
                : 'bg-surface text-secondary border border-white/10 hover:text-primary hover:border-white/20'
            }`}
          >
            {togglingNotifs ? 'Saving...' : notificationsEnabled ? 'Enabled' : 'Disabled'}
          </button>
          
          <button
            onClick={triggerTestNotification}
            className="text-[10px] uppercase font-black tracking-widest text-muted hover:text-green-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Send Test Alert
          </button>
        </div>
      </div>

      {/* Timezone & Temporal Reminder Alignment (P0) */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-primary">Timezone & Temporal Scheduling</h3>
              <p className="text-secondary text-xs font-ui mt-0.5">
                Ensures plant care reminders execute at your local time (e.g. 9:00 AM in your timezone, not server UTC)
              </p>
            </div>
          </div>
          {savingPrefs && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Active Timezone Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Clock className="w-3 h-3 text-emerald-400" />
                Active Botanical Timezone
              </label>
              <select
                value={activeTimezone}
                onChange={(e) => handleUpdatePrefs({ timezone: e.target.value })}
                className="w-full bg-surface border border-white/10 text-primary text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-elevated text-primary">
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted">
                  Offset: <span className="text-emerald-400 font-mono font-medium">{getTimezoneDisplayOffset(activeTimezone)}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAutoDetectTimezone}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Auto-Detect Device ({getDeviceTimezone()})
                </button>
              </div>
            </div>

            {/* Live Local Clock & Calculation Preview */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Temporal Sync
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Active Sync
                </span>
              </div>
              <div>
                <p className="text-xl font-mono font-bold text-white tracking-wide">
                  {currentTimeStr || 'Synchronizing...'}
                </p>
                <p className="text-[11px] text-emerald-200/70 mt-1 leading-relaxed">
                  "Remind me at 9 AM" executes at <span className="text-white font-semibold">09:00:00</span> in this zone.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-secondary leading-relaxed">
              All hydration, misting, and nutrient alerts in <span className="text-emerald-400 font-semibold">My Garden</span>, <span className="text-emerald-400 font-semibold">Care Calendar</span>, and Google Calendar synchronizations are computed against your verified local timezone.
            </p>
          </div>
        </div>
      </div>

      {/* Sage Memory & Persona Engine */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400 shadow-glow-purple" />
            <h3 className="text-xl font-display font-bold text-primary">Sage Identity Settings</h3>
          </div>
          {savingPrefs && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
        </div>
        
        <div className="p-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Expertise Level */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Gardening Expertise
              </label>
              <div className="flex flex-wrap gap-2">
                {['beginner', 'intermediate', 'expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleUpdatePrefs({ expertise: level as any })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      prefs?.expertise === level 
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                        : 'bg-surface text-secondary border-white/5 hover:border-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Persona Tone */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Wand2 className="w-3 h-3" />
                Sage Advisory Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {['Clinical', 'Friendly', 'Supportive', 'Direct'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleUpdatePrefs({ sageTone: tone })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      prefs?.sageTone === tone 
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                        : 'bg-surface text-secondary border-white/5 hover:border-white/20'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-muted leading-relaxed">
              These preferences are analyzed by the <span className="text-purple-400 font-bold">Sage Memory Engine</span> to adjust technicality, narrative depth, and proactive advice protocols within the Botanical Sanctuary interaction layer.
            </p>
          </div>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-secondary" />
          <h3 className="text-xl font-display font-bold text-primary">Your Feedback History</h3>
        </div>
        
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {feedbacks.length > 0 ? (
              feedbacks.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 flex items-center justify-between hover:bg-surface/50 transition-colors font-ui"
                >
                  <div>
                    <p className="font-semibold text-primary/90 flex items-center gap-2">
                      <span className="capitalize">{item.analysisType}</span> Analysis
                    </p>
                    <p className="text-xs text-secondary mt-1">
                      {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border ${item.isPositive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {item.isPositive ? <><ThumbsUp className="w-4 h-4" /> Helpful</> : <><ThumbsDown className="w-4 h-4" /> Not Helpful</>}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="bg-surface/50 p-4 rounded-2xl border border-white/5 inline-block text-muted">
                  <MessageSquare className="w-8 h-8 opacity-20" />
                </div>
                <div className="max-w-xs mx-auto">
                  <p className="text-secondary font-display font-bold">No Feedback Recorded</p>
                  <p className="text-[10px] text-muted uppercase tracking-widest font-black mt-1">
                    Your interactions help Sage learn your garden's specific needs.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
