import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Calendar, 
  Droplets, 
  Leaf, 
  History, 
  TrendingUp, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Scissors, 
  Zap,
  CalendarPlus,
  Activity
} from 'lucide-react';
import { SavedPlant, PlantReminder, CareLog, HealthHistoryEntry } from '../../services/firebase';
import { PlantHealthChart } from './PlantHealthChart';

interface PlantCardProps {
  plant: SavedPlant;
  index: number;
  reminders: PlantReminder[];
  careLogs: CareLog[];
  healthHistory: HealthHistoryEntry[];
  onAddReminder: (plantId: string, type: string, days: string) => Promise<void>;
  onCompleteReminder: (reminderId: string, plantId: string, type: string) => Promise<void>;
  onManualLog: (plantId: string, type: string) => Promise<void>;
  onPulseCheck: (plantId: string, score: number, mood: string, note: string) => Promise<void>;
  onUpdateNickname: (plantId: string, nickname: string) => Promise<void>;
  onTabChange: (plantId: string, tab: 'reminders' | 'history' | 'trends') => void;
  activeTab: 'reminders' | 'history' | 'trends';
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  index,
  reminders,
  careLogs,
  healthHistory,
  onAddReminder,
  onCompleteReminder,
  onManualLog,
  onPulseCheck,
  onUpdateNickname,
  onTabChange,
  activeTab
}) => {
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(plant.nickname || plant.name);
  const [addingReminder, setAddingReminder] = useState(false);
  const [remType, setRemType] = useState('water');
  const [remDays, setRemDays] = useState('3');
  
  const [pulseMode, setPulseMode] = useState(false);
  const [pulseScore, setPulseScore] = useState(plant.healthScore || 85);
  const [pulseMood, setPulseMood] = useState(plant.mood || 'Vibrant');
  const [pulseNote, setPulseNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateNickname = async () => {
    setIsUpdating(true);
    await onUpdateNickname(plant.id!, tempNickname);
    setEditingNickname(false);
    setIsUpdating(false);
  };

  const handleAddReminder = async () => {
    await onAddReminder(plant.id!, remType, remDays);
    setAddingReminder(false);
  };

  const handlePulseCheck = async () => {
    setIsUpdating(true);
    await onPulseCheck(plant.id!, pulseScore, pulseMood, pulseNote);
    setPulseMode(false);
    setPulseNote('');
    setIsUpdating(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="glass-card overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]"
    >
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {editingNickname ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="bg-surface border border-blue-500/30 rounded px-2 py-1 text-sm font-display font-bold text-primary focus:outline-none focus:border-blue-500 w-full max-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateNickname();
                    if (e.key === 'Escape') setEditingNickname(false);
                  }}
                />
                <button 
                  onClick={handleUpdateNickname}
                  className="p-1 hover:bg-green-500/10 text-green-400 rounded transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h3 className="text-2xl font-display font-bold text-primary">
                  {plant.nickname || plant.name}
                </h3>
                <button 
                  onClick={() => {
                    setEditingNickname(true);
                    setTempNickname(plant.nickname || plant.name);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5 rounded text-muted"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {plant.nickname && (
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted tracking-widest mb-1">
                <Leaf className="w-3 h-3" /> {plant.name}
              </div>
            )}
            <p className="text-sm italic text-secondary font-display">{plant.scientificName}</p>
            {plant.mood && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-400 uppercase tracking-widest border border-green-500/20">
                {plant.mood}
              </div>
            )}
          </div>
          {plant.healthScore !== undefined && (
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface" />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={125.6}
                    initial={{ strokeDashoffset: 125.6 }}
                    animate={{ strokeDashoffset: 125.6 - (125.6 * plant.healthScore) / 100 }}
                    className={plant.healthScore > 70 ? 'text-green-400' : 'text-amber-400'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                  {plant.healthScore}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex border-b border-white/5 mb-4 font-ui">
          <button 
            onClick={() => onTabChange(plant.id!, 'reminders')}
            className={`relative flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'reminders' ? 'text-green-400' : 'text-muted hover:text-secondary'}`}
          >
            <div className="flex items-center justify-center gap-1.5 relative z-10">
              <Calendar className="w-4 h-4" /> Reminders
            </div>
            {activeTab === 'reminders' && (
              <motion.div layoutId={`tab-${plant.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            )}
          </button>
          <button 
            onClick={() => onTabChange(plant.id!, 'history')}
            className={`relative flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-teal-400' : 'text-muted hover:text-secondary'}`}
          >
            <div className="flex items-center justify-center gap-1.5 relative z-10">
              <History className="w-4 h-4" /> Care
            </div>
            {activeTab === 'history' && (
              <motion.div layoutId={`tab-${plant.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
            )}
          </button>
          <button 
            onClick={() => onTabChange(plant.id!, 'trends')}
            className={`relative flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'trends' ? 'text-blue-400' : 'text-muted hover:text-secondary'}`}
          >
            <div className="flex items-center justify-center gap-1.5 relative z-10">
              <TrendingUp className="w-4 h-4" /> Health
            </div>
            {activeTab === 'trends' && (
              <motion.div layoutId={`tab-${plant.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 px-6 pb-6 space-y-3">
        {activeTab === 'reminders' && (
          <>
            {reminders?.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {reminders.map(rem => {
                    const isOverdue = rem.dueDate.toDate() < new Date();
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={rem.id} 
                        className={`flex items-center justify-between p-3 rounded-2xl border ${isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-surface/50 border-white/5'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-sm font-semibold text-primary font-ui">{rem.type}</span>
                          <span className={`text-xs ${isOverdue ? 'text-red-400 font-bold' : 'text-muted'}`}>
                            • {rem.dueDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                        <button 
                          onClick={() => onCompleteReminder(rem.id!, plant.id!, rem.type)}
                          className="bg-surface border border-white/10 p-1.5 rounded-full text-secondary hover:text-green-400 hover:border-green-400 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-glow-green"
                          title="Mark completed"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No active reminders.</p>
            )}
            
            {addingReminder ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl space-y-3 mt-3 shadow-inner"
              >
                <div className="flex gap-2">
                  <select 
                    value={remType}
                    onChange={(e) => setRemType(e.target.value)}
                    className="flex-1 text-sm bg-surface border border-white/10 text-primary rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500"
                  >
                    <option value="water" className="bg-elevated text-primary">Water</option>
                    <option value="fertilize" className="bg-elevated text-primary">Fertilize</option>
                    <option value="prune" className="bg-elevated text-primary">Prune</option>
                    <option value="other" className="bg-elevated text-primary">Other</option>
                  </select>
                  <select 
                    value={remDays}
                    onChange={(e) => setRemDays(e.target.value)}
                    className="flex-1 text-sm bg-surface border border-white/10 text-primary rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500"
                  >
                    <option value="1" className="bg-elevated text-primary">Tomorrow</option>
                    <option value="3" className="bg-elevated text-primary">In 3 days</option>
                    <option value="7" className="bg-elevated text-primary">In 1 week</option>
                    <option value="14" className="bg-elevated text-primary">In 2 weeks</option>
                    <option value="30" className="bg-elevated text-primary">In 1 month</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setAddingReminder(false)}
                    className="text-xs text-muted px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddReminder}
                    className="text-xs font-bold bg-gradient-to-r from-green-500 to-teal-500 text-void px-4 py-1.5 rounded-lg hover:from-green-400 hover:to-teal-400 transition-colors shadow-glow-green"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setAddingReminder(true)}
                className="mt-2 text-xs font-bold text-green-400 flex items-center gap-1 hover:text-green-300 transition-colors font-ui"
              >
                <CalendarPlus className="w-3 h-3" />
                Add Reminder
              </button>
            )}
          </>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            <PlantHealthChart healthHistory={healthHistory} />

            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-white/5 pb-2 mb-2">Diagnostic Timeline</h4>
              {healthHistory?.length > 0 ? (
                [...healthHistory].reverse().map((entry) => (
                  <div key={entry.id} className="p-3 bg-surface/30 border border-white/5 rounded-xl space-y-1 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-primary">
                        {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'Initial'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${entry.healthScore > 70 ? 'text-green-400' : 'text-amber-400'}`}>
                          {entry.healthScore}%
                        </span>
                        <div className="w-12 h-1.5 bg-void rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${entry.healthScore > 70 ? 'bg-green-500 shadow-glow-green' : 'bg-amber-500 shadow-glow-amber'}`} 
                            style={{ width: `${entry.healthScore}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest">
                      <span className="text-teal-400">{entry.mood}</span>
                    </div>
                    {entry.note && (
                      <p className="text-[10px] text-secondary italic leading-relaxed pt-1 mt-1 border-t border-white/5">
                        "{entry.note}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-center text-muted italic py-4">No diagnostic history logged yet.</p>
              )}
            </div>

            {pulseMode ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Record Pulse Check
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold block">HEALTH {pulseScore}%</label>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={pulseScore} 
                      onChange={(e) => setPulseScore(parseInt(e.target.value))}
                      className="w-full accent-green-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold block">MOOD</label>
                    <select 
                      value={pulseMood}
                      onChange={(e) => setPulseMood(e.target.value)}
                      className="w-full text-xs bg-surface border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Vibrant">Vibrant</option>
                      <option value="Happy">Happy</option>
                      <option value="Thirsty">Thirsty</option>
                      <option value="Thirsty">Droopy</option>
                      <option value="Recovering">Recovering</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block">SESSION NOTE</label>
                  <textarea 
                    placeholder="How does it look today?"
                    value={pulseNote}
                    onChange={(e) => setPulseNote(e.target.value)}
                    className="w-full text-xs bg-surface border border-white/10 rounded-lg px-3 py-2 h-16 focus:outline-none focus:border-blue-500 resize-none text-primary"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setPulseMode(false)}
                    className="text-[10px] font-bold text-muted px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePulseCheck}
                    disabled={isUpdating}
                    className="text-[10px] font-black bg-blue-500 text-void px-4 py-1.5 rounded-lg hover:bg-blue-400 transition-colors shadow-glow-blue uppercase disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Submit Update'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => {
                  setPulseMode(true);
                  setPulseScore(plant.healthScore || 85);
                  setPulseMood(plant.mood || 'Vibrant');
                }}
                className="w-full py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all font-ui shadow-[0_0_15px_rgba(59,130,246,0.05)]"
              >
                <Plus className="w-4 h-4" /> Record Pulse Check
              </button>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex gap-2 font-ui">
              <button 
                onClick={() => onManualLog(plant.id!, 'water')} 
                className="flex-1 text-[10px] py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg font-bold transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Droplets className="w-3 h-3" /> Watered
              </button>
              <button 
                onClick={() => onManualLog(plant.id!, 'fertilize')} 
                className="flex-1 text-[10px] py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg font-bold transition-all border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3 h-3" /> Fertilized
              </button>
              <button 
                onClick={() => onManualLog(plant.id!, 'prune')} 
                className="flex-1 text-[10px] py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg font-bold transition-all border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Scissors className="w-3 h-3" /> Pruned
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 hide-scrollbar font-ui">
              {careLogs?.length > 0 ? (
                careLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-none">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <div>
                      <p className="text-sm font-semibold text-primary capitalize leading-snug">{log.type}</p>
                      <p className="text-xs text-secondary mt-0.5">
                        {log.createdAt ? (
                          `${log.createdAt.toDate().toLocaleDateString(undefined, {month:'short', day: 'numeric'})} at ${log.createdAt.toDate().toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'})}`
                        ) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 italic text-center py-4">No care history yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
