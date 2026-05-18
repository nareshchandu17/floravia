import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { getUserPlants, getUserFeedback, getUserPreferences, saveUserPreferences, SavedPlant, FeedbackEntry, UserPreferences } from '../services/firebase';
import { Sprout, Bell, BellOff, MessageSquare, ThumbsUp, ThumbsDown, LogOut, Loader2, Brain, Sparkles, Wand2 } from 'lucide-react';
import { signOut } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  onNavigateToGarden: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigateToGarden }) => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const triggerTestNotification = async () => {
    try {
      await notify(
        "Botanical Alert System", 
        "System check initiated. Real-time neural link established with Floravia core.",
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
        getUserPlants(),
        getUserFeedback(),
        getUserPreferences()
      ]);
      setPlants(savedPlants);
      setFeedbacks(userFeedback);
      setPrefs(userPrefs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrefs = async (updates: Partial<UserPreferences>) => {
    setSavingPrefs(true);
    try {
      await saveUserPreferences(updates);
      setPrefs(prev => prev ? { ...prev, ...updates } : { userId: user?.uid || '', updatedAt: new Date(), ...updates });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
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
      <div className="flex justify-center items-center py-20 text-stone-500">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-stone-500">
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
