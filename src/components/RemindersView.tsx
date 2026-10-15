import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Droplets, 
  Sprout, 
  Sun, 
  Trash2, 
  Calendar as CalendarIcon, 
  ExternalLink,
  CalendarCheck2,
  Loader2,
  RefreshCw,
  Globe
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { createGoogleCalendarCareEvent } from '../services/googleCalendar';
import { getUserTimezone, getTimezoneDisplayOffset } from '../utils/timezone';
import { EmptyState } from './EmptyState';

interface BotanicalReminder {
  id: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'prune' | 'mist';
  frequencyDays: number;
  time: string;
  timezone?: string;
  enabled: boolean;
  googleEventId?: string;
  googleCalendarSynced?: boolean;
  googleCalendarHtmlLink?: string;
}

const DEFAULT_REMINDERS: BotanicalReminder[] = [
  { id: '1', plantName: 'Orange Hybrid Tea Rose', type: 'water', frequencyDays: 3, time: '08:00', enabled: true },
  { id: '2', plantName: 'Orange Hybrid Tea Rose', type: 'fertilize', frequencyDays: 14, time: '09:00', enabled: true },
  { id: '3', plantName: 'Monstera Deliciosa', type: 'mist', frequencyDays: 2, time: '08:30', enabled: true },
  { id: '4', plantName: 'Peace Lily', type: 'water', frequencyDays: 4, time: '07:30', enabled: true },
];

export const RemindersView: React.FC = () => {
  const { notify } = useNotifications();
  const [reminders, setReminders] = useState<BotanicalReminder[]>(() => {
    try {
      const saved = localStorage.getItem('floravia_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [showModal, setShowModal] = useState(false);
  const [plantName, setPlantName] = useState('');
  const [reminderType, setReminderType] = useState<'water' | 'fertilize' | 'prune' | 'mist'>('water');
  const [frequencyDays, setFrequencyDays] = useState(3);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [syncToCal, setSyncToCal] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('floravia_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.error(e);
    }
  }, [reminders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName) return;

    const newId = Date.now().toString();
    let googleEventId: string | undefined = undefined;
    let googleCalendarHtmlLink: string | undefined = undefined;
    let googleCalendarSynced = false;

    // Calculate next due date
    const d = new Date();
    d.setDate(d.getDate() + Number(frequencyDays));
    const nextDate = d.toISOString().split('T')[0];
    const userTz = getUserTimezone();

    if (syncToCal) {
      try {
        const res = await createGoogleCalendarCareEvent({
          plantName,
          type: reminderType,
          date: nextDate,
          time: reminderTime,
          timeZone: userTz,
          notes: `Recurring cycle: every ${frequencyDays} days`,
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
      plantName,
      type: reminderType,
      frequencyDays: Number(frequencyDays),
      time: reminderTime,
      timezone: userTz,
      enabled: true,
      googleEventId,
      googleCalendarSynced,
      googleCalendarHtmlLink
    };

    setReminders(prev => [newRem, ...prev]);
    setShowModal(false);
    notify(
      'Reminder Configured! 🔔',
      `Hydration cycle scheduled for ${plantName} every ${frequencyDays} days at ${reminderTime} (${getTimezoneDisplayOffset(userTz)}). ${googleCalendarSynced ? 'Synced to Google Calendar.' : ''}`,
      'reminder'
    );
  };

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
        notes: `Recurring cycle: every ${reminder.frequencyDays} days`,
        reminderMinutes: [60, 15]
      });

      setReminders(prev => prev.map(r => r.id === reminder.id ? {
        ...r,
        googleEventId: res.id,
        googleCalendarSynced: true,
        googleCalendarHtmlLink: res.htmlLink
      } : r));

      notify(
        'Calendar Event Created 📅',
        `Push alert configured for ${reminder.plantName} on ${nextDate} at ${reminder.time}.`,
        'reminder'
      );
    } catch (err: any) {
      console.error('Calendar sync error', err);
      notify('Sync Notice', err.message || 'Could not sync to Google Calendar', 'info');
    } finally {
      setSyncingId(null);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              Reminders Engine & Google Push
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{getUserTimezone()}</span>
              <span className="text-emerald-400 font-bold">({getTimezoneDisplayOffset()})</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white font-sans">
            Care Reminders & Alerts
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Never miss a watering or fertilizing cycle with localized microclimate alarms calculated in your personal timezone.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Botanical Cycles ({reminders.length})</h3>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Google Push Ready</span>
          </span>
        </div>

        {reminders.length === 0 ? (
          <EmptyState
            variant="dashed"
            icon={Bell}
            badge="Automated Care Cycles"
            title="No Recurring Care Cycles"
            description="Automated recurring care routines (such as watering every 3 days at 8:00 AM) trigger browser push alerts and sync directly to Google Calendar."
            action={{
              label: "Create First Reminder",
              onClick: () => setShowModal(true),
              icon: Plus
            }}
            secondaryAction={{
              label: "Load Sample Cycles",
              onClick: () => setReminders(DEFAULT_REMINDERS),
              title: "Populate sample reminders to test browser alerts and Google Calendar sync"
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((r) => (
              <div 
                key={r.id}
                className="p-4 rounded-xl bg-[#071610] border border-emerald-500/15 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#0b1f16] border border-emerald-500/20 text-emerald-400">
                      {r.type === 'water' ? <Droplets className="w-4 h-4 text-cyan-400" /> : <Sprout className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{r.plantName}</h4>
                        {r.googleCalendarSynced && (
                          <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-0.5">
                            <CalendarCheck2 className="w-2.5 h-2.5" />
                            <span>G-Cal</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Every {r.frequencyDays} days at {r.time} • <span className="capitalize text-emerald-300">{r.type}</span>
                        {r.timezone && (
                          <span className="text-[10px] text-muted/70 ml-2 font-mono">
                            ({getTimezoneDisplayOffset(r.timezone)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteReminder(r.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10 text-xs">
                  <div>
                    {r.googleCalendarSynced ? (
                      r.googleCalendarHtmlLink ? (
                        <a
                          href={r.googleCalendarHtmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>View in Google Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-cyan-400 font-semibold">Synced to Calendar</span>
                      )
                    ) : (
                      <button
                        onClick={() => handleSyncReminderToCalendar(r)}
                        disabled={syncingId === r.id}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
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

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleReminder(r.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        r.enabled 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      {r.enabled ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1f16] border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Plant Reminder</h3>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Plant Name</label>
                <input 
                  type="text" 
                  value={plantName} 
                  onChange={(e) => setPlantName(e.target.value)} 
                  className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Type</label>
                  <select 
                    value={reminderType} 
                    onChange={(e: any) => setReminderType(e.target.value)} 
                    className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="water">💧 Watering</option>
                    <option value="fertilize">🌱 Fertilizing</option>
                    <option value="prune">✂️ Pruning</option>
                    <option value="mist">💦 Misting</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Frequency (Days)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={frequencyDays} 
                    onChange={(e) => setFrequencyDays(Number(e.target.value))} 
                    className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
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
                  value={reminderTime} 
                  onChange={(e) => setReminderTime(e.target.value)} 
                  className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-[#071610] border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sync-rem-cal"
                  checked={syncToCal}
                  onChange={(e) => setSyncToCal(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sync-rem-cal" className="text-slate-300 text-[11px] leading-relaxed cursor-pointer">
                  <strong>Sync to Google Calendar</strong> with push notification reminder alarms.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-500/15">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
