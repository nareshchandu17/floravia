import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Sprout, 
  X, 
  Activity,
  ArrowUp,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { DashboardPlant, GrowthMeasurement } from '../types/botanical';

interface GrowthTimelineTrackerProps {
  plant: DashboardPlant;
  onGrowthUpdated?: (measurements: GrowthMeasurement[]) => void;
}

export const GrowthTimelineTracker: React.FC<GrowthTimelineTrackerProps> = ({
  plant,
  onGrowthUpdated
}) => {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHeight, setNewHeight] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const storageKey = `floravia_growth_${plant.id}`;

  // Load from localStorage or plant history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeasurements(parsed);
          return;
        }
      }
    } catch {
      // Fallback
    }

    const initial = plant.growthHistory && plant.growthHistory.length > 0 
      ? plant.growthHistory 
      : [];
    
    setMeasurements(initial);
  }, [plant.id]);

  // Set default date when opening add form
  useEffect(() => {
    if (isAdding) {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setNewDate(todayStr);
      // Pre-fill with a suggested next height
      if (measurements.length > 0) {
        const lastCm = measurements[measurements.length - 1].heightCm;
        const suggested = unit === 'cm' 
          ? (lastCm + 1.5).toFixed(1) 
          : ((lastCm + 1.5) / 2.54).toFixed(1);
        setNewHeight(suggested);
      } else {
        setNewHeight(unit === 'cm' ? '20' : '8');
      }
      setNewNote('');
      setFormError(null);
    }
  }, [isAdding, unit, measurements]);

  // Sync back to storage & callback
  const persistMeasurements = (updated: GrowthMeasurement[]) => {
    setMeasurements(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist growth measurements:', e);
    }
    if (onGrowthUpdated) {
      onGrowthUpdated(updated);
    }
  };

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newHeight);
    if (isNaN(val) || val <= 0) {
      setFormError(`Please enter a valid height greater than 0 ${unit}.`);
      return;
    }

    if (val > 1000) {
      setFormError('Height value exceeds maximum threshold.');
      return;
    }

    const heightInCm = unit === 'cm' ? Number(val.toFixed(1)) : Number((val * 2.54).toFixed(1));
    const cleanDate = newDate.trim() || 'Today';

    const newEntry: GrowthMeasurement = {
      id: `m_${Date.now()}`,
      date: cleanDate,
      heightCm: heightInCm,
      note: newNote.trim() || undefined
    };

    const updated = [...measurements, newEntry];
    persistMeasurements(updated);
    setIsAdding(false);
    setToastMessage(`Logged new height: ${formatHeight(heightInCm, unit)} on ${cleanDate}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = (id: string) => {
    const updated = measurements.filter(m => m.id !== id);
    persistMeasurements(updated);
  };

  const formatHeight = (cm: number, targetUnit: 'cm' | 'in') => {
    if (targetUnit === 'in') {
      return `${(cm / 2.54).toFixed(1)} in`;
    }
    return `${cm.toFixed(1)} cm`;
  };

  // Compute metrics
  const stats = useMemo(() => {
    if (measurements.length === 0) {
      return { currentCm: 0, initialCm: 0, deltaCm: 0, deltaPercent: 0, avgRate: '0' };
    }
    const initialCm = measurements[0].heightCm;
    const currentCm = measurements[measurements.length - 1].heightCm;
    const deltaCm = Number((currentCm - initialCm).toFixed(1));
    const deltaPercent = initialCm > 0 ? Math.round((deltaCm / initialCm) * 100) : 0;
    
    // Monthly growth rate estimation
    const count = measurements.length;
    const avgRate = count > 1 ? (deltaCm / (count * 0.75)).toFixed(1) : '1.5';

    return { currentCm, initialCm, deltaCm, deltaPercent, avgRate };
  }, [measurements]);

  // Chart data formatted for selected unit
  const chartData = useMemo(() => {
    return measurements.map((m, idx) => {
      const heightVal = unit === 'cm' ? m.heightCm : Number((m.heightCm / 2.54).toFixed(1));
      const prevCm = idx > 0 ? measurements[idx - 1].heightCm : null;
      const changeCm = prevCm !== null ? Number((m.heightCm - prevCm).toFixed(1)) : 0;
      const changeVal = unit === 'cm' ? changeCm : Number((changeCm / 2.54).toFixed(1));

      return {
        id: m.id,
        date: m.date,
        height: heightVal,
        heightCm: m.heightCm,
        note: m.note,
        change: changeVal,
        unitLabel: unit
      };
    });
  }, [measurements, unit]);

  return (
    <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
      {/* Background ambient decorative glow */}
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-[70px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-white tracking-tight">
                Growth Timeline Tracker
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold uppercase">
                Biometric Progression
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-ui mt-0.5">
              Track vertical elongation & foliar milestone development
            </p>
          </div>
        </div>

        {/* Controls: Unit Switcher + Add Button */}
        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center bg-[#071610] border border-emerald-500/25 rounded-xl p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                unit === 'cm'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnit('in')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                unit === 'in'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              in
            </button>
          </div>

          {/* Add Measurement Button */}
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isAdding ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Height</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Add Measurement Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <form 
              onSubmit={handleAddMeasurement}
              className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/30 space-y-3.5 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                  Log New Height Check-in
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Active Unit: {unit.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Height Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    Height ({unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={unit === 'cm' ? '0.1' : '0.05'}
                      min="0.5"
                      max="1000"
                      value={newHeight}
                      onChange={(e) => setNewHeight(e.target.value)}
                      placeholder={unit === 'cm' ? '28.5' : '11.2'}
                      required
                      autoFocus
                      className="w-full bg-[#05110a] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-emerald-600/40 focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    Date of Record
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      placeholder="e.g. Jun 15 or Today"
                      required
                      className="w-full bg-[#05110a] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-600/40 focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Milestone / Note */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    Observation (Optional)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. New leaf shoot emerged"
                    className="w-full bg-[#05110a] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-600/40 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              {/* Form Error */}
              {formError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">
                  {formError}
                </p>
              )}

              {/* Submit / Cancel Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Updates trend line & growth velocity analysis</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#0b1f16] hover:bg-[#0f2a1e] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Save Measurement
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Biometric Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Current Height */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Ruler className="w-3 h-3 text-emerald-400" />
            Current Height
          </span>
          <p className="text-base font-mono font-bold text-white">
            {formatHeight(stats.currentCm, unit)}
          </p>
          <span className="text-[9px] font-bold text-emerald-400 block truncate uppercase">
            {measurements.length > 0 ? measurements[measurements.length - 1].date : 'Pending'}
          </span>
        </div>

        {/* Net Growth */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Net Extension
          </span>
          <p className="text-base font-mono font-bold text-emerald-300 flex items-center justify-center gap-1">
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>+{formatHeight(Math.max(0, stats.deltaCm), unit)}</span>
          </p>
          <span className="text-[9px] font-bold text-emerald-400 block truncate uppercase">
            +{stats.deltaPercent}% Overall
          </span>
        </div>

        {/* Growth Velocity */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            Growth Rate
          </span>
          <p className="text-base font-mono font-bold text-emerald-200">
            ~{unit === 'cm' ? `${stats.avgRate} cm` : `${(Number(stats.avgRate) / 2.54).toFixed(1)} in`}/mo
          </p>
          <span className="text-[9px] font-bold text-emerald-400 block truncate uppercase">
            Vegetative Pace
          </span>
        </div>

        {/* Total Logs */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Logged Points
          </span>
          <p className="text-base font-mono font-bold text-slate-200">
            {measurements.length}
          </p>
          <span className="text-[9px] font-bold text-emerald-400 block truncate uppercase">
            Data Samples
          </span>
        </div>
      </div>

      {/* Small Recharts Trend Line / Area Chart */}
      <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-500/20 mb-4 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Elongation Trend Curve</span>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            Scale: {unit.toUpperCase()} vs Time
          </span>
        </div>

        {measurements.length > 0 ? (
          <div className="h-40 w-full relative pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 12, right: 15, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.06)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#5e8770" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  stroke="#5e8770" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-[#0b1f16] border border-emerald-500/40 rounded-xl text-xs shadow-2xl space-y-1 z-50 backdrop-blur-md">
                          <div className="flex items-center justify-between gap-4 border-b border-emerald-500/20 pb-1">
                            <span className="font-bold text-white">{d.date}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              Milestone
                            </span>
                          </div>
                          
                          <div className="flex items-baseline justify-between gap-3 pt-0.5">
                            <span className="text-slate-400 text-[11px]">Recorded Height:</span>
                            <span className="text-emerald-400 font-mono font-extrabold text-sm">
                              {d.height} {d.unitLabel}
                            </span>
                          </div>

                          {d.change !== 0 && (
                            <p className="text-[10px] text-emerald-300 font-medium">
                              +{d.change} {d.unitLabel} growth extension
                            </p>
                          )}

                          {d.note && (
                            <p className="text-[10px] text-slate-300 italic pt-0.5 max-w-[180px] leading-tight">
                              "{d.note}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="height" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fill="url(#growthAreaGradient)"
                  dot={{ fill: '#10b981', r: 3.5, stroke: '#06130d', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Current Top Reading Floating Badge */}
            <div className="absolute top-1 right-1 px-2 py-0.5 rounded-lg bg-[#071610]/95 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold text-center shadow-lg backdrop-blur-sm">
              <span className="block text-xs font-mono font-extrabold text-emerald-400">
                {formatHeight(stats.currentCm, unit)}
              </span>
              <span className="text-[9px] text-slate-400">Latest</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <Ruler className="w-6 h-6 text-emerald-400/40 mx-auto" />
            <p className="text-xs font-bold text-slate-300">No Height Measurements Logged</p>
            <p className="text-[11px] text-slate-500">Record stem or leaf height over time to generate a vegetative progress curve.</p>
          </div>
        )}
      </div>

      {/* Visual Timeline Milestones List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            Milestone Chronology ({measurements.length})
          </span>
        </div>

        {/* Milestone Cards Feed */}
        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
          {measurements.slice().reverse().map((item, revIdx) => {
            const actualIdx = measurements.length - 1 - revIdx;
            const prevItem = actualIdx > 0 ? measurements[actualIdx - 1] : null;
            const delta = prevItem ? Number((item.heightCm - prevItem.heightCm).toFixed(1)) : null;

            return (
              <div 
                key={item.id} 
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-emerald-950/20 px-2 rounded-xl transition-colors group/item"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Ruler className="w-3 h-3" />
                  </div>
                  
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {formatHeight(item.heightCm, unit)}
                      </span>

                      {delta !== null && delta > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-bold font-mono">
                          +{formatHeight(delta, unit)}
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-slate-300 truncate">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete measurement"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Success Feedback Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
