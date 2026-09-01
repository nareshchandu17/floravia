import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Beaker, 
  Droplets, 
  Sun, 
  Info, 
  RotateCcw,
  Sliders,
  Plus,
  History,
  ShieldCheck,
  Zap,
  CalendarCheck2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardPlant } from '../../types/botanical';
import { 
  calculateFertilizerSchedule, 
  getSpeciesFertilizerProfile, 
  SpeciesFertilizerProfile, 
  FertilizerScheduleCalculation 
} from '../../utils/fertilizerRequirements';
import { createGoogleCalendarCareEvent } from '../../services/googleCalendar';

interface FertilizerScheduleTrackerProps {
  plant: DashboardPlant;
  onFertilize?: (plantId: string, details: { fertilizerType: string; date: string; notes?: string }) => void;
  className?: string;
}

interface StoredFertilizerLog {
  id: string;
  plantId: string;
  date: string;
  fertilizerType: string;
  npkRatio?: string;
  notes?: string;
  timestamp: number;
}

const COMMON_FERTILIZER_TYPES = [
  { id: 'bloom-booster', name: 'High-Phosphorus Bloom Booster', npk: '10-15-10', icon: '🌸', desc: 'Accelerates bud formation and petal vibrancy' },
  { id: 'balanced-liquid', name: 'Balanced All-Purpose Liquid Feed', npk: '20-20-20', icon: '🌿', desc: 'Uniform macronutrient blend for foliage & roots' },
  { id: 'foliage-nitrogen', name: 'High-Nitrogen Tropical Elixir', npk: '3-1-2', icon: '🍃', desc: 'Promotes rapid cell division and broad leaf growth' },
  { id: 'organic-kelp', name: 'Organic Cold-Water Seaweed Extract', npk: '1-0.5-2', icon: '🌊', desc: 'Gentle bio-stimulant rich in micronutrients and cytokinins' },
  { id: 'slow-release', name: 'Slow-Release Granular Pellets', npk: '14-14-14', icon: '⏳', desc: 'Continuous 3-month controlled micronutrient release' },
  { id: 'succulent-mineral', name: 'Low-Nitrogen Cactus & Arid Blend', npk: '2-7-7', icon: '🌵', desc: 'Prevents soft elongated growth in arid species' }
];

export const FertilizerScheduleTracker: React.FC<FertilizerScheduleTrackerProps> = ({
  plant,
  onFertilize,
  className = ''
}) => {
  const [customInterval, setCustomInterval] = useState<number | undefined>(undefined);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedFertilizerType, setSelectedFertilizerType] = useState(COMMON_FERTILIZER_TYPES[0].name);
  const [selectedFertilizerNPK, setSelectedFertilizerNPK] = useState(COMMON_FERTILIZER_TYPES[0].npk);
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [justFertilizedAnim, setJustFertilizedAnim] = useState(false);

  // Local log history state
  const [logs, setLogs] = useState<StoredFertilizerLog[]>([]);

  // Load custom interval & logs from localStorage
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(`floravia_fert_logs_${plant.id}`);
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        // Initial mock log matching default timeline
        setLogs([
          {
            id: `init-${plant.id}`,
            plantId: plant.id,
            date: plant.healthOverview.lastFertilized || '10 days ago',
            fertilizerType: 'Balanced Species Formula',
            npkRatio: 'Balanced NPK',
            notes: 'Regular scheduled maintenance',
            timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000
          }
        ]);
      }

      const savedInterval = localStorage.getItem(`floravia_fert_interval_${plant.id}`);
      if (savedInterval) {
        setCustomInterval(parseInt(savedInterval, 10));
      } else {
        setCustomInterval(undefined);
      }
    } catch (e) {
      console.error('Error loading fertilizer logs', e);
    }
  }, [plant.id]);

  // Derive active schedule
  const schedule: FertilizerScheduleCalculation = calculateFertilizerSchedule(
    plant.name,
    plant.scientificName,
    logs.length > 0 ? (logs[0].date.includes('-') ? logs[0].date : logs[0].date) : plant.healthOverview.lastFertilized,
    customInterval
  );

  const profile: SpeciesFertilizerProfile = schedule.profile;

  const handleQuickFeedNow = () => {
    executeFeed(profile.fertilizerType, profile.npkRatio, new Date().toISOString().split('T')[0], 'One-click quick feeding applied');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeFeed(selectedFertilizerType, selectedFertilizerNPK, customDate, notes);
    setIsLogModalOpen(false);
  };

  const executeFeed = (fertType: string, npk: string, feedDate: string, feedNotes?: string) => {
    const newLog: StoredFertilizerLog = {
      id: `log-${Date.now()}`,
      plantId: plant.id,
      date: feedDate === new Date().toISOString().split('T')[0] ? 'Today' : feedDate,
      fertilizerType: fertType,
      npkRatio: npk,
      notes: feedNotes,
      timestamp: Date.now()
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    try {
      localStorage.setItem(`floravia_fert_logs_${plant.id}`, JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Error saving log', e);
    }

    setJustFertilizedAnim(true);
    setTimeout(() => setJustFertilizedAnim(false), 2500);

    if (onFertilize) {
      onFertilize(plant.id, {
        fertilizerType: fertType,
        date: newLog.date,
        notes: feedNotes
      });
    }
  };

  const handleUpdateInterval = (days: number) => {
    setCustomInterval(days);
    try {
      localStorage.setItem(`floravia_fert_interval_${plant.id}`, days.toString());
    } catch (e) {
      console.error('Error saving interval', e);
    }
  };

  const [calendarSyncStatus, setCalendarSyncStatus] = useState<{
    isSyncing: boolean;
    syncedEventId?: string;
    syncedEventLink?: string;
    error?: string;
  }>({ isSyncing: false });

  const handleSyncToGoogleCalendar = async () => {
    setCalendarSyncStatus({ isSyncing: true });
    try {
      // Calculate date string for calendar
      const nextDate = schedule.nextDueDate.toISOString().split('T')[0];
      const res = await createGoogleCalendarCareEvent({
        plantName: plant.nickname || plant.name,
        type: 'fertilize',
        date: nextDate,
        time: '09:00',
        notes: `Fertilizer cycle (${profile.macronutrientFocus} - ${profile.dosage}). Preferred blend: ${profile.npkRatio}.`,
        reminderMinutes: [120, 30]
      });

      setCalendarSyncStatus({
        isSyncing: false,
        syncedEventId: res.id,
        syncedEventLink: res.htmlLink
      });
    } catch (err: any) {
      console.error('Error syncing fertilizer to Google Calendar', err);
      setCalendarSyncStatus({
        isSyncing: false,
        error: err.message || 'Failed to sync to Google Calendar'
      });
    }
  };

  const handleResetInterval = () => {
    setCustomInterval(undefined);
    try {
      localStorage.removeItem(`floravia_fert_interval_${plant.id}`);
    } catch (e) {
      console.error('Error resetting interval', e);
    }
  };

  return (
    <div className={`bg-[#0b1711] border border-emerald-900/30 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden ${className}`}>
      {/* Visual celebration particles when feeding is logged */}
      <AnimatePresence>
        {justFertilizedAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-emerald-500/50 rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.5)]"
            >
              <Sparkles className="w-7 h-7 animate-spin" />
            </motion.div>
            <h4 className="text-base font-bold text-white">Nutrient Boost Applied!</h4>
            <p className="text-xs text-emerald-300 max-w-xs">
              Recorded feeding for <strong>{plant.nickname || plant.name}</strong>. Next feeding calculated for <strong>{schedule.nextDueDateFormatted}</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Title and Species Profile Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-200">Fertilizer Schedule Tracker</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
                {profile.macronutrientFocus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Calibrated for <em>{plant.scientificName}</em> ({profile.intervalDays}-day species cycle)
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            schedule.status === 'overdue' 
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' 
              : schedule.status === 'due-today' || schedule.status === 'due-soon'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              schedule.status === 'overdue' ? 'bg-rose-400 animate-ping' :
              schedule.status === 'due-today' ? 'bg-amber-400 animate-ping' :
              'bg-emerald-400'
            }`} />
            <span>{schedule.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar with Cycle Markers */}
      <div className="space-y-1.5 bg-[#08130d] border border-emerald-900/30 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Feeding Cycle Progress</span>
          </span>
          <span className="font-bold text-slate-200 text-[11px]">
            Day {schedule.daysElapsed} of {schedule.profile.intervalDays} ({schedule.progressPercent}%)
          </span>
        </div>

        {/* Bar */}
        <div className="h-2.5 w-full bg-[#040806] rounded-full overflow-hidden border border-emerald-900/40 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${schedule.progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              schedule.status === 'overdue' 
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                : schedule.status === 'due-today' || schedule.status === 'due-soon'
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
            }`}
          />
        </div>

        {/* Timestamps Row */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Last:</span>
            <strong className="text-slate-300 font-semibold">{schedule.lastFertilizedFormatted}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Next:</span>
            <strong className={`font-semibold ${schedule.statusColor}`}>{schedule.nextDueDateFormatted}</strong>
          </span>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Recommended Formula */}
        <div className="p-3 bg-[#08130d] border border-emerald-900/30 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
            <Beaker className="w-3.5 h-3.5" />
            <span>NPK Formula</span>
          </div>
          <p className="text-xs font-bold text-slate-200">{profile.npkRatio}</p>
          <p className="text-[10px] text-slate-400 truncate" title={profile.fertilizerType}>
            {profile.fertilizerType}
          </p>
        </div>

        {/* Dosage & Dilution */}
        <div className="p-3 bg-[#08130d] border border-emerald-900/30 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
            <Droplets className="w-3.5 h-3.5" />
            <span>Dosage & Dilution</span>
          </div>
          <p className="text-xs font-bold text-slate-200 truncate" title={profile.dosage}>
            {profile.dosage}
          </p>
          <p className="text-[10px] text-slate-400 truncate" title={profile.dilution}>
            {profile.dilution}
          </p>
        </div>

        {/* Season & Winter Care */}
        <div className="p-3 bg-[#08130d] border border-emerald-900/30 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <Sun className="w-3.5 h-3.5" />
            <span>Preferred Season</span>
          </div>
          <p className="text-xs font-bold text-slate-200 truncate" title={profile.preferredSeason}>
            {profile.preferredSeason}
          </p>
          <p className="text-[10px] text-slate-400 truncate" title={profile.winterCare}>
            {profile.winterCare}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Feed Now Button */}
          <button
            onClick={handleQuickFeedNow}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Feed Plant Today</span>
          </button>

          {/* Custom Log Dialog Trigger */}
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#08140e] hover:bg-[#0c1f16] border border-emerald-800/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Custom Feed</span>
          </button>

          {/* Sync Next Feeding to Google Calendar */}
          {calendarSyncStatus.syncedEventId ? (
            <a
              href={calendarSyncStatus.syncedEventLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>G-Cal Synced</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          ) : (
            <button
              onClick={handleSyncToGoogleCalendar}
              disabled={calendarSyncStatus.isSyncing}
              className="px-3 py-2 rounded-xl bg-[#08140e] hover:bg-[#0c1f16] border border-cyan-800/40 text-cyan-300 hover:text-cyan-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Sync upcoming feeding cycle to Google Calendar with push notification alarms"
            >
              {calendarSyncStatus.isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <CalendarCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Sync Next Due ({schedule.nextDueDateFormatted})</span>
            </button>
          )}
        </div>

        {/* Secondary toggles (Guidance & History) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
              isHistoryOpen 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => setIsGuidanceOpen(!isGuidanceOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
              isGuidanceOpen 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Species Guide</span>
          </button>
        </div>
      </div>

      {/* Expandable Species Nutritional Guidance Drawer */}
      <AnimatePresence>
        {isGuidanceOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-emerald-900/30 pt-3 space-y-2.5 overflow-hidden"
          >
            <div className="p-3 bg-[#07130d] border border-amber-900/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Botanical Expert Feeding Guidelines</span>
                </span>
                <span className="text-[10px] text-slate-400">Method: {profile.applicationMethod}</span>
              </div>

              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {profile.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 text-xs font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>

              {/* Custom Interval Stepper */}
              <div className="pt-2 border-t border-emerald-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-500" />
                  <span>Custom Schedule Override:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[14, 21, 28, 30, 45, 60].map(days => (
                    <button
                      key={days}
                      onClick={() => handleUpdateInterval(days)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        (customInterval || profile.intervalDays) === days
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                  {customInterval && (
                    <button
                      onClick={handleResetInterval}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Reset to species default"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Feeding History Log Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-emerald-900/30 pt-3 space-y-2 overflow-hidden"
          >
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Feeding History & Notes</span>
            </h4>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-[#07130d] border border-emerald-900/30 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.fertilizerType}</span>
                      {log.npkRatio && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                          {log.npkRatio}
                        </span>
                      )}
                    </div>
                    {log.notes && <p className="text-[10px] text-slate-400 italic">{log.notes}</p>}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold shrink-0 ml-2">
                    {log.date}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal / Dialog for Custom Feeding Log */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#08150f] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Beaker className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Log Fertilization Event</h3>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-3.5">
                {/* Fertilizer Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Fertilizer Formulation
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {COMMON_FERTILIZER_TYPES.map((type) => {
                      const isSelected = selectedFertilizerType === type.name;
                      return (
                        <div
                          key={type.id}
                          onClick={() => {
                            setSelectedFertilizerType(type.name);
                            setSelectedFertilizerNPK(type.npk);
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                              : 'bg-[#050c08] border-emerald-900/30 text-slate-300 hover:border-emerald-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{type.icon}</span>
                            <div>
                              <p className="font-bold text-[11px] text-slate-200">{type.name}</p>
                              <p className="text-[10px] text-slate-400">{type.desc}</p>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-[#0b1711] border border-emerald-900/40 text-emerald-300 font-mono text-[10px] font-bold shrink-0 ml-2">
                            {type.npk}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-[#050c08] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Notes / Dilution Used (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Half-strength diluted in rainwater"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#050c08] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save to Care Schedule</span>
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
