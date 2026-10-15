import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Sprout, 
  Scissors, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Leaf,
  Sun,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Check,
  Trash2,
  Bell,
  Sparkles,
  X,
  Loader2,
  ShieldAlert,
  CalendarCheck2,
  Globe
} from 'lucide-react';
import { CareCalendarEvent } from '../types/botanical';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createGoogleCalendarCareEvent, 
  syncCareEventsToGoogleCalendar, 
  deleteGoogleCalendarEvent,
  getCalendarAccessToken,
  isCalendarConnected,
  listSyncedFloraviaCalendarEvents
} from '../services/googleCalendar';
import { useAuth } from '../hooks/useAuth';
import { getUserTimezone, getTimezoneDisplayOffset } from '../utils/timezone';
import { EmptyState } from './EmptyState';

const INITIAL_EVENTS: CareCalendarEvent[] = [
  { id: '1', plantId: '1', plantName: 'Orange Hybrid Tea Rose', scientificName: 'Rosa hybrida', type: 'water', date: '2026-08-23', time: '08:00', completed: false, notes: 'Water base thoroughly before morning heat' },
  { id: '2', plantId: '2', plantName: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', type: 'mist', date: '2026-08-23', time: '09:30', completed: true, notes: 'Mist aerial roots & wipe broad foliage' },
  { id: '3', plantId: '3', plantName: 'Peace Lily', scientificName: 'Spathiphyllum', type: 'water', date: '2026-08-24', time: '08:00', completed: false, notes: 'Check moisture probe before soil drench' },
  { id: '4', plantId: '1', plantName: 'Orange Hybrid Tea Rose', scientificName: 'Rosa hybrida', type: 'fertilize', date: '2026-08-26', time: '10:00', completed: false, notes: 'Apply 10-15-10 bloom booster diluted 50%' },
  { id: '5', plantId: '4', plantName: 'Snake Plant', scientificName: 'Sansevieria trifasciata', type: 'water', date: '2026-08-29', time: '08:00', completed: false, notes: 'Light soil soak around pot rim' },
  { id: '6', plantId: '2', plantName: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', type: 'fertilize', date: '2026-09-02', time: '10:30', completed: false, notes: 'Balanced 20-20-20 tropical foliage elixir' },
  { id: '7', plantId: '5', plantName: 'Fiddle Leaf Fig', scientificName: 'Ficus lyrata', type: 'prune', date: '2026-09-05', time: '11:00', completed: false, notes: 'Prune dry lower leaves with sterilized shears' },
];

export const CareCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState('August 2026');
  const [events, setEvents] = useState<CareCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('floravia_care_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Google Calendar Integration States
  const [isCalendarLinked, setIsCalendarLinked] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; plant: string } | null>(null);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);
  const [calendarToast, setCalendarToast] = useState<{ title: string; desc: string; link?: string } | null>(null);
  const [reminderLeadTime, setReminderLeadTime] = useState<number>(60); // 60 mins popup default

  // Confirmation modal for destructive actions
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; event: CareCalendarEvent | null }>({
    isOpen: false,
    event: null
  });
  const [isDeletingFromCalendar, setIsDeletingFromCalendar] = useState(false);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newType, setNewType] = useState<'water' | 'fertilize' | 'prune' | 'mist' | 'repot'>('water');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('08:30');
  const [newNotes, setNewNotes] = useState('');
  const [syncToGoogleCalOnAdd, setSyncToGoogleCalOnAdd] = useState(true);
  const [isAddingWithSync, setIsAddingWithSync] = useState(false);

  // Save events to local storage
  useEffect(() => {
    try {
      localStorage.setItem('floravia_care_events', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  // Check if calendar token is present in memory
  useEffect(() => {
    setIsCalendarLinked(isCalendarConnected());
  }, []);

  const toggleComplete = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      await getCalendarAccessToken(true);
      setIsCalendarLinked(true);
      setCalendarToast({
        title: 'Google Calendar Connected! 📅',
        desc: 'Plant care schedules can now receive push notifications on your calendar.'
      });
      setTimeout(() => setCalendarToast(null), 5000);
    } catch (err: any) {
      console.error('Calendar connect error', err);
      setCalendarToast({
        title: 'Connection Notice',
        desc: err.message || 'Could not connect Google Calendar. Please allow popup permissions.'
      });
      setTimeout(() => setCalendarToast(null), 6000);
    }
  };

  // Sync a single event to Google Calendar
  const handleSyncSingleEvent = async (event: CareCalendarEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSyncingEventId(event.id);

    try {
      const userTz = getUserTimezone();
      const res = await createGoogleCalendarCareEvent({
        plantName: event.plantName,
        scientificName: event.scientificName,
        type: event.type,
        date: event.date,
        time: event.time || '08:30',
        timeZone: userTz,
        notes: event.notes,
        reminderMinutes: [reminderLeadTime, 15]
      });

      setIsCalendarLinked(true);
      setEvents(prev => prev.map(item => item.id === event.id ? {
        ...item,
        googleEventId: res.id,
        googleCalendarSynced: true,
        googleCalendarHtmlLink: res.htmlLink
      } : item));

      setCalendarToast({
        title: 'Event Synced to Google Calendar! 🔔',
        desc: `Push reminders configured for ${event.plantName} (${event.type}) on ${event.date}.`,
        link: res.htmlLink
      });
      setTimeout(() => setCalendarToast(null), 6000);
    } catch (err: any) {
      console.error('Error syncing single event:', err);
      setCalendarToast({
        title: 'Sync Error',
        desc: err.message || 'Failed to sync event to Google Calendar.'
      });
      setTimeout(() => setCalendarToast(null), 6000);
    } finally {
      setSyncingEventId(null);
    }
  };

  // Sync all pending events in batch
  const handleSyncAllPendingEvents = async () => {
    const pendingEvents = events.filter(e => !e.completed && !e.googleCalendarSynced);
    if (pendingEvents.length === 0) {
      setCalendarToast({
        title: 'All Caught Up! ✨',
        desc: 'All pending care tasks are already synchronized with your Google Calendar.'
      });
      setTimeout(() => setCalendarToast(null), 4000);
      return;
    }

    setIsSyncingAll(true);
    setSyncProgress({ current: 0, total: pendingEvents.length, plant: pendingEvents[0].plantName });

    try {
      const userTz = getUserTimezone();
      const payload = pendingEvents.map(evt => ({
        plantName: evt.plantName,
        scientificName: evt.scientificName,
        type: evt.type,
        date: evt.date,
        time: evt.time || '08:30',
        timeZone: userTz,
        notes: evt.notes,
        reminderMinutes: [reminderLeadTime, 15]
      }));

      const syncRes = await syncCareEventsToGoogleCalendar(payload, (current, total, plantName) => {
        setSyncProgress({ current, total, plant: plantName });
      });

      setIsCalendarLinked(true);

      // Update state for synced events
      setEvents(prev => {
        const resultMap = new Map(syncRes.results.map(r => [r.plantName, r]));
        return prev.map(evt => {
          const match = resultMap.get(evt.plantName);
          if (match && match.eventId) {
            return {
              ...evt,
              googleEventId: match.eventId,
              googleCalendarSynced: true,
              googleCalendarHtmlLink: match.htmlLink
            };
          }
          return evt;
        });
      });

      setCalendarToast({
        title: 'Batch Sync Complete! 📅✨',
        desc: `Successfully synced ${syncRes.successCount} care task(s) with push notifications in Google Calendar.`
      });
      setTimeout(() => setCalendarToast(null), 6000);
    } catch (err: any) {
      console.error('Batch sync error', err);
      setCalendarToast({
        title: 'Sync Interrupted',
        desc: err.message || 'Error occurred during Google Calendar batch synchronization.'
      });
      setTimeout(() => setCalendarToast(null), 6000);
    } finally {
      setIsSyncingAll(false);
      setSyncProgress(null);
    }
  };

  // User confirmation before removing from Google Calendar (Mandatory requirement)
  const handlePromptDeleteCalendarEvent = (event: CareCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteModal({
      isOpen: true,
      event
    });
  };

  const handleExecuteDeleteCalendarEvent = async () => {
    if (!confirmDeleteModal.event || !confirmDeleteModal.event.googleEventId) {
      setConfirmDeleteModal({ isOpen: false, event: null });
      return;
    }

    const event = confirmDeleteModal.event;
    setIsDeletingFromCalendar(true);

    try {
      await deleteGoogleCalendarEvent(event.googleEventId);
      setEvents(prev => prev.map(item => item.id === event.id ? {
        ...item,
        googleEventId: undefined,
        googleCalendarSynced: false,
        googleCalendarHtmlLink: undefined
      } : item));

      setCalendarToast({
        title: 'Removed from Google Calendar',
        desc: `Care notification for ${event.plantName} has been deleted from your primary calendar.`
      });
      setTimeout(() => setCalendarToast(null), 4000);
    } catch (err: any) {
      console.error('Delete calendar event error', err);
      setCalendarToast({
        title: 'Calendar Update Notice',
        desc: err.message || 'Could not remove event from Google Calendar.'
      });
      setTimeout(() => setCalendarToast(null), 5000);
    } finally {
      setIsDeletingFromCalendar(false);
      setConfirmDeleteModal({ isOpen: false, event: null });
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName) return;

    setIsAddingWithSync(true);

    const newId = Date.now().toString();
    let googleEventId: string | undefined = undefined;
    let googleCalendarHtmlLink: string | undefined = undefined;
    let googleCalendarSynced = false;

    if (syncToGoogleCalOnAdd) {
      try {
        const userTz = getUserTimezone();
        const res = await createGoogleCalendarCareEvent({
          plantName: newPlantName,
          type: newType,
          date: newDate,
          time: newTime,
          timeZone: userTz,
          notes: newNotes,
          reminderMinutes: [reminderLeadTime, 15]
        });
        googleEventId = res.id;
        googleCalendarHtmlLink = res.htmlLink;
        googleCalendarSynced = true;
        setIsCalendarLinked(true);

        setCalendarToast({
          title: 'Task Added & Synced! 🔔',
          desc: `Google Calendar push reminder created for ${newPlantName} on ${newDate} at ${newTime}.`,
          link: res.htmlLink
        });
        setTimeout(() => setCalendarToast(null), 6000);
      } catch (err: any) {
        console.error('Add task sync error:', err);
        setCalendarToast({
          title: 'Task Created (Sync Pending)',
          desc: 'Care task added locally. Click sync to push to Google Calendar.'
        });
        setTimeout(() => setCalendarToast(null), 5000);
      }
    }

    const item: CareCalendarEvent = {
      id: newId,
      plantId: 'custom',
      plantName: newPlantName,
      type: newType,
      date: newDate,
      time: newTime,
      completed: false,
      notes: newNotes,
      googleEventId,
      googleCalendarSynced,
      googleCalendarHtmlLink
    };

    setEvents(prev => [...prev, item]);
    setShowAddModal(false);
    setNewNotes('');
    setIsAddingWithSync(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'fertilize': return <Sprout className="w-3.5 h-3.5 text-emerald-400" />;
      case 'prune': return <Scissors className="w-3.5 h-3.5 text-rose-400" />;
      case 'mist': return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      default: return <Leaf className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const syncedCount = events.filter(e => e.googleCalendarSynced).length;
  const pendingCount = events.filter(e => !e.completed).length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {calendarToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 max-w-md bg-[#08150f] border border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">{calendarToast.title}</h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">{calendarToast.desc}</p>
              {calendarToast.link && (
                <a
                  href={calendarToast.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1 underline underline-offset-2"
                >
                  <span>Open in Google Calendar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => setCalendarToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              Care Schedule & Neural Reminders
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{getUserTimezone()}</span>
              <span className="text-emerald-400 font-bold">({getTimezoneDisplayOffset()})</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white font-sans">
            Botanical Care Calendar
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Keep your botanical collection hydrated, fed, and thriving with Google Calendar synchronization and push alerts aligned to your local timezone.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Care Task</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Synchronization Banner */}
      <div className="bg-gradient-to-r from-[#0c1f15] via-[#091810] to-[#0d1c16] border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            {/* Google Calendar Official Styled Emblem */}
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2 shrink-0 shadow-inner">
              <svg viewBox="0 0 24 24" className="w-7 h-7">
                <path fill="#4285F4" d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19Z"/>
                <path fill="#34A853" d="M12 10H7V15H12V10Z"/>
                <path fill="#FBBC05" d="M17 10H13V15H17V10Z"/>
                <path fill="#EA4335" d="M12 16H7V18H12V16Z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-white">Google Calendar Push Notifications</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isCalendarLinked 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {isCalendarLinked ? 'Connected' : 'OAuth Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically push watering and fertilizer alarms to your personal Google Calendar so push notifications ring on your phone, watch, and desktop.
              </p>
            </div>
          </div>

          {/* Sync CTA Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncAllPendingEvents}
              disabled={isSyncingAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing ({syncProgress?.current}/{syncProgress?.total})...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync All Care Tasks</span>
                </>
              )}
            </button>

            {!isCalendarLinked && (
              <button
                onClick={handleConnectGoogleCalendar}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Authorize Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Settings Micro Bar */}
        <div className="pt-3 border-t border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{syncedCount}</strong> of <strong>{events.length}</strong> tasks synchronized</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Push alerts enabled (Popup + Email)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Push Alert Timing:</span>
            <select
              value={reminderLeadTime}
              onChange={(e) => setReminderLeadTime(Number(e.target.value))}
              className="bg-[#060e0a] border border-emerald-900/40 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={15}>15 Minutes Before</option>
              <option value={30}>30 Minutes Before</option>
              <option value={60}>1 Hour Before</option>
              <option value={120}>2 Hours Before</option>
              <option value={1440}>1 Day Before</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar View + Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule Overview */}
        <div className="lg:col-span-2 bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Upcoming Care Schedule</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                {pendingCount} Pending
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="bg-[#071610] px-3 py-1.5 rounded-lg border border-emerald-500/15">{currentMonth}</span>
            </div>
          </div>

          {/* Event Cards */}
          <div className="space-y-3">
            {events.length === 0 ? (
              <EmptyState
                variant="dashed"
                icon={CalendarIcon}
                badge="Botanical Schedule"
                title="No Care Tasks Scheduled"
                description="Your care schedule is currently empty. Add custom tasks for watering, misting, fertilizing, or repotting — with direct push sync to Google Calendar."
                action={{
                  label: "Schedule First Task",
                  onClick: () => setShowAddModal(true),
                  icon: Plus
                }}
                secondaryAction={{
                  label: "Load Sample Schedule",
                  onClick: () => setEvents(INITIAL_EVENTS),
                  title: "Populate sample tasks to test Google Calendar push notifications"
                }}
              />
            ) : (
              events.map((evt) => (
                <div 
                  key={evt.id}
                  onClick={() => toggleComplete(evt.id)}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer transition-all ${
                    evt.completed
                      ? 'bg-[#071610]/60 border-emerald-500/10 opacity-60'
                      : 'bg-[#092217] border-emerald-500/20 hover:border-emerald-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 sm:mt-0 ${
                      evt.completed ? 'bg-emerald-950/40 border-emerald-500/20' : 'bg-[#071610] border-emerald-500/20'
                    }`}>
                      {getEventIcon(evt.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-bold truncate ${evt.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {evt.plantName}
                        </p>
                        
                        {/* Google Calendar Synced Badge */}
                        {evt.googleCalendarSynced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                            <CalendarCheck2 className="w-3 h-3 text-cyan-400" />
                            <span>Synced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px]">
                            Local
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="capitalize text-emerald-300 font-semibold">{evt.type}</span>
                        <span>•</span>
                        <span className="text-slate-300">{evt.date}</span>
                        {evt.time && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {evt.time}
                            </span>
                          </>
                        )}
                        {evt.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] italic text-slate-400">{evt.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/10 w-full sm:w-auto justify-end">
                    {/* Google Calendar Quick Sync / Direct Link */}
                    {evt.googleCalendarSynced ? (
                      <div className="flex items-center gap-1.5">
                        {evt.googleCalendarHtmlLink && (
                          <a
                            href={evt.googleCalendarHtmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 border border-cyan-500/20 text-xs flex items-center gap-1 transition-colors"
                            title="Open event in Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => handlePromptDeleteCalendarEvent(evt, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Unlink and remove from Google Calendar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleSyncSingleEvent(evt, e)}
                        disabled={syncingEventId === evt.id}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Sync this task to Google Calendar with push notification"
                      >
                        {syncingEventId === evt.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                        ) : (
                          <CalendarIcon className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Sync Cal</span>
                      </button>
                    )}

                    {/* Task Completion Checkbox */}
                    <button 
                      className={`p-1.5 rounded-lg transition-colors ${
                        evt.completed ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Sync Benefits & Microclimate Advice */}
        <div className="space-y-6">
          {/* Google Notification Specs */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Push Alert Integration</span>
            </div>
            <h4 className="text-sm font-bold text-white">How Notifications Work</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Events are written directly to your primary Google Calendar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Google Calendar delivers high-priority sound & banner push alerts to Android, iOS, Apple Watch, and Wear OS devices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Full botanical care instructions and NPK ratios are embedded in the calendar event description.</span>
              </li>
            </ul>
          </div>

          {/* Seasonal Advice */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
              <Sun className="w-4 h-4" />
              <span>Microclimate Alert</span>
            </div>
            <h4 className="text-sm font-bold text-white">Summer Hydration Protocol</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ambient temperature is trending high. Ensure plants with delicate roots (like Peace Lilies and Rose saplings) receive water early in the morning before heat peaks.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Destructive Workspace Operations (Mandatory) */}
      <AnimatePresence>
        {confirmDeleteModal.isOpen && confirmDeleteModal.event && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c1a13] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Calendar Event?</h3>
                  <p className="text-xs text-slate-400">Google Calendar Deletion Confirmation</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete the scheduled <strong>{confirmDeleteModal.event.type}</strong> event for <strong>{confirmDeleteModal.event.plantName}</strong> on <strong>{confirmDeleteModal.event.date}</strong> from your personal Google Calendar?
              </p>

              <div className="p-3 rounded-xl bg-[#07110c] border border-emerald-900/40 text-xs space-y-1">
                <p className="text-slate-400"><strong>Plant:</strong> {confirmDeleteModal.event.plantName}</p>
                <p className="text-slate-400"><strong>Scheduled Date:</strong> {confirmDeleteModal.event.date}</p>
                <p className="text-slate-400"><strong>Action:</strong> Remove event and cancel upcoming push notification alarms.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal({ isOpen: false, event: null })}
                  disabled={isDeletingFromCalendar}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteCalendarEvent}
                  disabled={isDeletingFromCalendar}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingFromCalendar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1a13] border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Add Care Task</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Plant Name</label>
                <input 
                  type="text" 
                  value={newPlantName} 
                  onChange={(e) => setNewPlantName(e.target.value)} 
                  className="w-full bg-[#07110c] border border-emerald-900/40 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Task Type</label>
                  <select 
                    value={newType} 
                    onChange={(e: any) => setNewType(e.target.value)} 
                    className="w-full bg-[#07110c] border border-emerald-900/40 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="water">💧 Watering</option>
                    <option value="fertilize">🌱 Fertilizing</option>
                    <option value="prune">✂️ Pruning</option>
                    <option value="mist">💦 Misting</option>
                    <option value="repot">🪴 Repotting</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Due Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)} 
                    className="w-full bg-[#07110c] border border-emerald-900/40 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">Time of Day</label>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getUserTimezone()} ({getTimezoneDisplayOffset()})
                  </span>
                </div>
                <input 
                  type="time" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)} 
                  className="w-full bg-[#07110c] border border-emerald-900/40 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Notes / Instructions (Optional)</label>
                <input 
                  type="text" 
                  value={newNotes} 
                  placeholder="e.g. Check topsoil with moisture probe" 
                  onChange={(e) => setNewNotes(e.target.value)} 
                  className="w-full bg-[#07110c] border border-emerald-900/40 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sync to Google Calendar Checkbox */}
              <div className="p-3 bg-[#07110c] border border-emerald-800/40 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sync-google-cal"
                  checked={syncToGoogleCalOnAdd}
                  onChange={(e) => setSyncToGoogleCalOnAdd(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sync-google-cal" className="text-slate-300 text-[11px] leading-relaxed cursor-pointer">
                  <strong>Sync to personal Google Calendar</strong> with push notification alarms ({reminderLeadTime}m prior) and email reminder.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAddingWithSync}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingWithSync}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAddingWithSync ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Syncing...</span>
                    </>
                  ) : (
                    <span>Save Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
