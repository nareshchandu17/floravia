import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Droplets, 
  Sprout, 
  Trash2, 
  Calendar as CalendarIcon, 
  ExternalLink,
  CalendarCheck2,
  Loader2,
  Globe,
  Scissors,
  Sparkles,
  Filter,
  Search,
  Check,
  ChevronRight,
  ShieldCheck,
  Flame,
  CalendarDays,
  X,
  Play,
  Pause,
  ArrowUpRight,
  Layers,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { createGoogleCalendarCareEvent } from '../services/googleCalendar';
import { getUserTimezone, getTimezoneDisplayOffset, getNextReminderOccurrence } from '../utils/timezone';
import { getUserPlants, addCareLog, SavedPlant } from '../services/firebase';

export interface BotanicalReminder {
  id: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'prune' | 'mist';
  frequencyDays: number;
  time: string;
  timezone?: string;
  enabled: boolean;
  lastCompletedAt?: string;
  googleEventId?: string;
  googleCalendarSynced?: boolean;
  googleCalendarHtmlLink?: string;
  plantId?: string;
  notes?: string;
}

type CareType = 'water' | 'fertilize' | 'prune' | 'mist';
type FilterType = 'all' | 'water' | 'fertilize' | 'prune' | 'mist' | 'synced';

const CARE_CONFIG: Record<CareType, {
  label: string;
  verb: string;
  icon: React.ElementType;
  accentColor: string;
  bgGlow: string;
  badgeBorder: string;
  badgeBg: string;
  textColor: string;
  defaultDays: number;
  tip: string;
}> = {
  water: {
    label: 'Hydration',
    verb: 'Watered',
    icon: Droplets,
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-950/40',
    textColor: 'text-cyan-300',
    defaultDays: 3,
    tip: 'Best performed in early morning to prevent fungal growth.'
  },
  fertilize: {
    label: 'Nutrients',
    verb: 'Fertilized',
    icon: Sprout,
    accentColor: '#34d399',
    bgGlow: 'rgba(52, 211, 153, 0.15)',
    badgeBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-950/40',
    textColor: 'text-emerald-300',
    defaultDays: 14,
    tip: 'Feed during active growing seasons (spring and summer).'
  },
  prune: {
    label: 'Pruning',
    verb: 'Pruned',
    icon: Scissors,
    accentColor: '#fb7185',
    bgGlow: 'rgba(251, 113, 133, 0.15)',
    badgeBorder: 'border-rose-500/30',
    badgeBg: 'bg-rose-950/40',
    textColor: 'text-rose-300',
    defaultDays: 30,
    tip: 'Snip yellowed foliage just above healthy leaf nodes.'
  },
  mist: {
    label: 'Misting',
    verb: 'Misted',
    icon: Sparkles,
    accentColor: '#2dd4bf',
    bgGlow: 'rgba(45, 212, 191, 0.15)',
    badgeBorder: 'border-teal-500/30',
    badgeBg: 'bg-teal-950/40',
    textColor: 'text-teal-300',
    defaultDays: 2,
    tip: 'Elevates ambient canopy humidity for tropical flora.'
  }
};

const STARTER_TEMPLATES: Array<Omit<BotanicalReminder, 'id' | 'enabled'>> = [
  {
    plantName: 'Monstera Deliciosa',
    type: 'water',
    frequencyDays: 7,
    time: '08:30',
    notes: 'Thorough soak when top 2 inches dry'
  },
  {
    plantName: 'Fiddle Leaf Fig',
    type: 'mist',
    frequencyDays: 3,
    time: '09:00',
    notes: 'Canopy misting to boost indoor humidity'
  },
  {
    plantName: 'Golden Pothos',
    type: 'fertilize',
    frequencyDays: 14,
    time: '10:00',
    notes: 'Diluted nitrogen organic feed'
  }
];

export const RemindersView: React.FC = () => {
  const { notify } = useNotifications();
  const { user } = useAuth();
  
  // Stored reminders
  const [reminders, setReminders] = useState<BotanicalReminder[]>(() => {
    try {
      const saved = localStorage.getItem('floravia_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // User garden plants for quick picker
  const [userPlants, setUserPlants] = useState<SavedPlant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Form state
  const [plantName, setPlantName] = useState('');
  const [reminderType, setReminderType] = useState<CareType>('water');
  const [frequencyDays, setFrequencyDays] = useState(3);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [syncToCal, setSyncToCal] = useState(true);
  const [reminderNotes, setReminderNotes] = useState('');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('floravia_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.error(e);
    }
  }, [reminders]);

  // Load user's garden plants if authenticated
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getUserPlants().then((plants) => {
      if (isMounted) setUserPlants(plants);
    }).catch((err) => {
      console.warn("Could not load user plants for reminders:", err);
    });
    return () => { isMounted = false; };
  }, [user]);

  // Calculate next due date string for a reminder
  const getDueStatus = (r: BotanicalReminder) => {
    if (!r.enabled) return { label: 'Paused', isUrgent: false, daysLeft: 999 };
    
    // Compute next due based on last completed or creation
    const { dueDate } = getNextReminderOccurrence(r.frequencyDays, r.time, r.timezone || getUserTimezone());
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'Due Today', isUrgent: true, daysLeft: 0 };
    } else if (diffDays === 1) {
      return { label: 'Due Tomorrow', isUrgent: false, daysLeft: 1 };
    } else {
      return { label: `Due in ${diffDays} days`, isUrgent: false, daysLeft: diffDays };
    }
  };

  // Telemetry Metrics
  const stats = useMemo(() => {
    const total = reminders.length;
    const active = reminders.filter(r => r.enabled).length;
    const waterCount = reminders.filter(r => r.type === 'water').length;
    const syncedCount = reminders.filter(r => r.googleCalendarSynced).length;
    const dueToday = reminders.filter(r => r.enabled && getDueStatus(r).daysLeft <= 0).length;
    return { total, active, waterCount, syncedCount, dueToday };
  }, [reminders]);

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(r => {
      const matchesSearch = r.plantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'synced') return !!r.googleCalendarSynced;
      return r.type === filter;
    });
  }, [reminders, filter, searchQuery]);

  // 7-day care schedule preview
  const weeklyHorizon = useMemo(() => {
    const days = [];
    const today = new Date();
    const userTz = getUserTimezone();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      // Count reminders active on this day
      const count = reminders.filter(r => {
        if (!r.enabled) return false;
        // Simple cadence alignment
        return (i % r.frequencyDays) === 0;
      }).length;

      days.push({
        offset: i,
        dayName,
        dayNum,
        monthName,
        count,
        isToday: i === 0
      });
    }
    return days;
  }, [reminders]);

  // Create Reminder Action
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName.trim()) return;

    const newId = Date.now().toString();
    let googleEventId: string | undefined = undefined;
    let googleCalendarHtmlLink: string | undefined = undefined;
    let googleCalendarSynced = false;

    const d = new Date();
    d.setDate(d.getDate() + Number(frequencyDays));
    const nextDate = d.toISOString().split('T')[0];
    const userTz = getUserTimezone();

    if (syncToCal) {
      try {
        const res = await createGoogleCalendarCareEvent({
          plantName: plantName.trim(),
          type: reminderType,
          date: nextDate,
          time: reminderTime,
          timeZone: userTz,
          notes: reminderNotes ? `${reminderNotes} (Every ${frequencyDays} days)` : `Recurring care cycle: every ${frequencyDays} days`,
          reminderMinutes: [60, 15]
        });
        googleEventId = res.id;
        googleCalendarHtmlLink = res.htmlLink;
        googleCalendarSynced = true;
      } catch (err) {
        console.error('Error syncing reminder to calendar', err);
      }
    }

    const newRem: BotanicalReminder = {
      id: newId,
      plantName: plantName.trim(),
      type: reminderType,
      frequencyDays: Number(frequencyDays),
      time: reminderTime,
      timezone: userTz,
      enabled: true,
      googleEventId,
      googleCalendarSynced,
      googleCalendarHtmlLink,
      plantId: selectedPlantId || undefined,
      notes: reminderNotes.trim() || undefined
    };

    setReminders(prev => [newRem, ...prev]);
    setShowModal(false);
    resetForm();

    notify(
      'Care Alarm Activated! 🌿',
      `${CARE_CONFIG[reminderType].label} scheduled for ${plantName} every ${frequencyDays} days at ${reminderTime} (${getTimezoneDisplayOffset(userTz)}). ${googleCalendarSynced ? 'Synced to Google Calendar.' : ''}`,
      'reminder'
    );
  };

  const resetForm = () => {
    setPlantName('');
    setSelectedPlantId('');
    setReminderType('water');
    setFrequencyDays(3);
    setReminderTime('08:00');
    setReminderNotes('');
    setSyncToCal(true);
  };

  // Quick adopt template
  const handleAdoptTemplate = (tpl: typeof STARTER_TEMPLATES[0]) => {
    setPlantName(tpl.plantName);
    setReminderType(tpl.type);
    setFrequencyDays(tpl.frequencyDays);
    setReminderTime(tpl.time);
    setReminderNotes(tpl.notes || '');
    setShowModal(true);
  };

  // Sync to Google Calendar
  const handleSyncReminderToCalendar = async (reminder: BotanicalReminder) => {
    setSyncingId(reminder.id);
    const d = new Date();
    d.setDate(d.getDate() + Number(reminder.frequencyDays));
    const nextDate = d.toISOString().split('T')[0];
    const userTz = reminder.timezone || getUserTimezone();

    try {
      const res = await createGoogleCalendarCareEvent({
        plantName: reminder.plantName,
        type: reminder.type,
        date: nextDate,
        time: reminder.time,
        timeZone: userTz,
        notes: reminder.notes ? `${reminder.notes} (Every ${reminder.frequencyDays} days)` : `Recurring care cycle: every ${reminder.frequencyDays} days`,
        reminderMinutes: [60, 15]
      });

      setReminders(prev => prev.map(r => r.id === reminder.id ? {
        ...r,
        googleEventId: res.id,
        googleCalendarSynced: true,
        googleCalendarHtmlLink: res.htmlLink
      } : r));

      notify(
        'Calendar Event Synced 📅',
        `Push alert configured for ${reminder.plantName} on ${nextDate} at ${reminder.time}.`,
        'reminder'
      );
    } catch (err: any) {
      console.error('Calendar sync error', err);
      notify('Calendar Sync Notice', err.message || 'Could not sync to Google Calendar', 'info');
    } finally {
      setSyncingId(null);
    }
  };

  // Complete reminder (Mark as done today)
  const handleCompleteCare = async (reminder: BotanicalReminder) => {
    setCompletingId(reminder.id);
    const nowIso = new Date().toISOString();

    // Log to Firebase if plantId exists and user is authenticated
    if (reminder.plantId && user) {
      try {
        await addCareLog(reminder.plantId, reminder.type);
      } catch (e) {
        console.warn("Care log upload deferred:", e);
      }
    }

    // Update reminder timestamp
    setReminders(prev => prev.map(r => r.id === reminder.id ? {
      ...r,
      lastCompletedAt: nowIso
    } : r));

    setTimeout(() => {
      setCompletingId(null);
      notify(
        `${CARE_CONFIG[reminder.type].verb} Recorded! ✨`,
        `${reminder.plantName} care logged successfully. Next cycle resumes in ${reminder.frequencyDays} days.`,
        'success'
      );
    }, 600);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    notify('Reminder Removed', 'Botanical alarm deleted from local cache.', 'info');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* =========================================================================
          HERO BANNER: Framer / Awwwards Aesthetics with Obsidian Mesh Glow
      ========================================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-8 md:p-10 border border-emerald-500/20 bg-gradient-to-br from-[#061810] via-[#092217] to-[#04120b] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Subtle decorative botanical background grid & light glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            {/* Badges strip */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <Bell className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Botanical Neural Engine</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#051c13] border border-emerald-500/20 text-emerald-200/80 text-[11px] font-mono">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>{getUserTimezone()}</span>
                <span className="text-emerald-400 font-bold">({getTimezoneDisplayOffset()})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold">
                <CalendarCheck2 className="w-3 h-3 text-cyan-400" />
                <span>Google Push Sync</span>
              </span>
            </div>

            {/* Headline with Instrument Serif accent */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Care Reminders <span className="font-serif italic font-normal text-emerald-300">&amp; Alarms</span>
            </h1>

            <p className="text-sm md:text-base text-emerald-100/70 leading-relaxed font-normal">
              Maintain optimal botanical health with synchronized microclimate alarms. Track watering cadences, nutrient schedules, and receive automatic Google Calendar push alerts.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Reminder</span>
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400/80 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Browser Push &amp; Local Storage Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TELEMETRY METRICS STRIP: High-Density Dribbble / Framer Cards
      ========================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1f16]/90 border border-emerald-500/15 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/35 transition-all">
          <div className="flex items-center justify-between text-xs text-emerald-200/70 font-semibold mb-2">
            <span>Active Cycles</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.active} <span className="text-xs font-normal text-emerald-400/80">/ {stats.total}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Currently monitoring</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1f16]/90 border border-emerald-500/15 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/35 transition-all">
          <div className="flex items-center justify-between text-xs text-cyan-200/70 font-semibold mb-2">
            <span>Hydration Tasks</span>
            <div className="w-7 h-7 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.waterCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Scheduled water routines
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1f16]/90 border border-emerald-500/15 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/35 transition-all">
          <div className="flex items-center justify-between text-xs text-amber-200/70 font-semibold mb-2">
            <span>Due Today</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.dueToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.dueToday > 0 ? 'Action required today' : 'Canopy up to date'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1f16]/90 border border-emerald-500/15 backdrop-blur-sm relative overflow-hidden group hover:border-teal-500/35 transition-all">
          <div className="flex items-center justify-between text-xs text-teal-200/70 font-semibold mb-2">
            <span>Calendar Synced</span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400">
              <CalendarCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.syncedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Google Calendar events
          </div>
        </div>
      </div>

      {/* =========================================================================
          7-DAY BOTANICAL HORIZON: Interactive Weekly Care Strip
      ========================================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#071610] border border-emerald-500/20 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Upcoming 7-Day Care Horizon</h3>
          </div>
          <span className="text-xs text-emerald-300/80 font-mono">
            Synchronized with {getUserTimezone()}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-1">
          {weeklyHorizon.map((day) => {
            const isSelected = selectedDayOffset === day.offset;
            return (
              <button
                key={day.offset}
                onClick={() => setSelectedDayOffset(day.offset)}
                className={`py-3 px-1 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                    : day.isToday
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0a1f16]/60 border-emerald-500/10 hover:border-emerald-500/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-semibold uppercase">{day.dayName}</span>
                <span className={`text-sm sm:text-base font-extrabold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {day.dayNum}
                </span>
                <div className="h-2 flex items-center justify-center">
                  {day.count > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CONTROLS: Search Bar & Filter Segmented Tabs
      ========================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plant or notes..."
            className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All', icon: Layers },
              { id: 'water', label: 'Hydration', icon: Droplets },
              { id: 'fertilize', label: 'Nutrients', icon: Sprout },
              { id: 'mist', label: 'Misting', icon: Sparkles },
              { id: 'prune', label: 'Pruning', icon: Scissors },
              { id: 'synced', label: 'G-Cal Synced', icon: CalendarCheck2 }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as FilterType)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-[#071610] border border-emerald-500/15 text-slate-400 hover:text-slate-200 hover:border-emerald-500/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          REMINDERS GRID OR EMPTY STATE
      ========================================================================== */}
      {filteredReminders.length === 0 ? (
        <div className="rounded-3xl p-8 sm:p-12 border border-dashed border-emerald-500/25 bg-[#071610]/70 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Bell className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="max-w-md space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              AUTOMATED CANOPY TELEMETRY
            </span>
            <h3 className="text-2xl font-bold text-white font-sans">
              No Recurring Care Cycles Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {searchQuery || filter !== 'all'
                ? 'No care routines matched your filter criteria. Try resetting filters or search.'
                : 'Configure automated schedules for your houseplants to receive browser push reminders and sync directly with Google Calendar.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Custom Reminder</span>
            </button>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setFilter('all'); }}
                className="px-4 py-3 rounded-xl bg-[#0b1f16] border border-emerald-500/20 text-emerald-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Quick-Start Preset Botanical Templates */}
          {!searchQuery && filter === 'all' && (
            <div className="pt-6 border-t border-emerald-500/15 w-full max-w-2xl text-left space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200 tracking-wide uppercase">
                  Or Quick-Start With Recommended Houseplant Routines:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STARTER_TEMPLATES.map((tpl, idx) => {
                  const cfg = CARE_CONFIG[tpl.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleAdoptTemplate(tpl)}
                      className="p-3.5 rounded-xl bg-[#0b1f16] border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-[#0e271c] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.textColor} border ${cfg.badgeBorder}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Every {tpl.frequencyDays}d
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors pt-1">
                          {tpl.plantName}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {tpl.notes}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Activate Cycle</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredReminders.map((r) => {
              const cfg = CARE_CONFIG[r.type];
              const Icon = cfg.icon;
              const due = getDueStatus(r);
              const isCompleting = completingId === r.id;

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl p-5 border flex flex-col justify-between gap-4 transition-all relative overflow-hidden backdrop-blur-md shadow-md hover:shadow-xl ${
                    r.enabled
                      ? 'bg-[#081b13]/90 border-emerald-500/20 hover:border-emerald-500/40'
                      : 'bg-[#06150f]/60 border-white/5 opacity-70'
                  }`}
                >
                  {/* Subtle corner light accent */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40"
                    style={{ backgroundColor: cfg.accentColor }}
                  />

                  {/* Card Header */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                          style={{
                            backgroundColor: cfg.bgGlow,
                            borderColor: cfg.accentColor + '40',
                            color: cfg.accentColor
                          }}
                        >
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                              {r.plantName}
                            </h4>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${cfg.textColor}`}>
                            <span>{cfg.label}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 font-normal">Every {r.frequencyDays} {r.frequencyDays === 1 ? 'day' : 'days'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Delete icon */}
                      <button
                        onClick={() => deleteReminder(r.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Due badge & Timing */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#06130d]/80 border border-emerald-500/10 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{r.time}</span>
                        {r.timezone && (
                          <span className="text-[10px] text-emerald-400/80 font-mono">
                            ({getTimezoneDisplayOffset(r.timezone)})
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                        !r.enabled
                          ? 'bg-slate-800 text-slate-400'
                          : due.isUrgent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {due.label}
                      </span>
                    </div>

                    {/* Notes if provided */}
                    {r.notes && (
                      <p className="text-xs text-slate-400 italic line-clamp-2 px-1">
                        "{r.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions & Sync Footer */}
                  <div className="pt-3 border-t border-emerald-500/10 flex flex-col gap-2.5 relative z-10">
                    {/* Primary Interactive Complete button */}
                    <button
                      onClick={() => handleCompleteCare(r)}
                      disabled={isCompleting || !r.enabled}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !r.enabled
                          ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                          : isCompleting
                            ? 'bg-emerald-500 text-slate-950 scale-95'
                            : 'bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-300 shadow-sm'
                      }`}
                    >
                      {isCompleting ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 animate-bounce" />
                          <span>Care Logged!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Mark {cfg.verb} Today</span>
                        </>
                      )}
                    </button>

                    {/* Sub-bar: G-Cal link & Pause/Resume */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        {r.googleCalendarSynced ? (
                          r.googleCalendarHtmlLink ? (
                            <a
                              href={r.googleCalendarHtmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                            >
                              <CalendarCheck2 className="w-3 h-3" />
                              <span>G-Cal Event</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                              <CalendarCheck2 className="w-3 h-3" />
                              <span>Calendar Synced</span>
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleSyncReminderToCalendar(r)}
                            disabled={syncingId === r.id}
                            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                          >
                            {syncingId === r.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CalendarIcon className="w-3 h-3" />
                            )}
                            <span>Sync to G-Cal</span>
                          </button>
                        )}
                      </div>

                      {/* Toggle status */}
                      <button
                        onClick={() => toggleReminder(r.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          r.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {r.enabled ? (
                          <>
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-2.5 h-2.5 fill-current" />
                            <span>Paused</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================================
          CREATION MODAL: Framer-Level Glassmorphic Dialogue
      ========================================================================== */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-5 my-8 relative overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Bell className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Configure Care Alarm
                    </h3>
                    <p className="text-[11px] text-emerald-200/70">
                      Synchronized with personal timezone alarms &amp; Google Calendar
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm relative z-10">
                
                {/* Saved Plants Quick-Select (if user has plants in their garden) */}
                {userPlants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-bold flex items-center justify-between">
                      <span>Pick From Your Garden</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Click to autofill</span>
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {userPlants.map((plant) => (
                        <button
                          key={plant.id}
                          type="button"
                          onClick={() => {
                            setPlantName(plant.name || plant.commonName);
                            setSelectedPlantId(plant.id || '');
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                            plantName === (plant.name || plant.commonName)
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : 'bg-[#071610] border-emerald-500/20 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                          }`}
                        >
                          <Leaf className="w-3 h-3 text-emerald-400" />
                          <span>{plant.name || plant.commonName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plant Name input */}
                <div>
                  <label className="text-slate-300 text-xs font-bold block mb-1">
                    Plant Name / Species <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    placeholder="e.g., Fiddle Leaf Fig, Monstera, Basil..."
                    required
                    className="w-full bg-[#071610] border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Care Type Selection Grid */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-xs font-bold block">
                    Care Protocol Action
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(CARE_CONFIG) as CareType[]).map((typeKey) => {
                      const cfg = CARE_CONFIG[typeKey];
                      const Icon = cfg.icon;
                      const isSelected = reminderType === typeKey;

                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => {
                            setReminderType(typeKey);
                            setFrequencyDays(cfg.defaultDays);
                          }}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                              : 'bg-[#071610] border-emerald-500/20 text-slate-400 hover:text-white hover:border-emerald-500/40'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? cfg.textColor : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{cfg.label}</span>
                          <span className="text-[10px] text-slate-400">~{cfg.defaultDays}d</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-emerald-400/80 italic pt-0.5">
                    💡 {CARE_CONFIG[reminderType].tip}
                  </p>
                </div>

                {/* Frequency & Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-bold block">
                      Recurrence Interval (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={frequencyDays}
                      onChange={(e) => setFrequencyDays(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full bg-[#071610] border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
                    />
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      {[1, 3, 7, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFrequencyDays(d)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            frequencyDays === d
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-[#071610] border-emerald-500/20 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time of Day */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 text-xs font-bold">
                        Target Alarm Time
                      </label>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {getTimezoneDisplayOffset()}
                      </span>
                    </div>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      required
                      className="w-full bg-[#071610] border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
                    />
                    <p className="text-[10px] text-slate-400 pt-1">
                      Computed in {getUserTimezone()}
                    </p>
                  </div>
                </div>

                {/* Optional Care Instructions/Notes */}
                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-bold block">
                    Special Botanical Care Notes <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    placeholder="e.g., Use room-temperature filtered water only..."
                    className="w-full bg-[#071610] border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs sm:text-sm"
                  />
                </div>

                {/* Google Calendar Sync Option */}
                <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-500/25 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sync-gcal"
                    checked={syncToCal}
                    onChange={(e) => setSyncToCal(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="sync-gcal" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                    <strong className="text-white">Sync Directly to Google Calendar</strong>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Creates an authoritative calendar entry with 60m and 15m push alerts formatted in your exact local timezone.
                    </span>
                  </label>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/15">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Schedule Care Alarm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
