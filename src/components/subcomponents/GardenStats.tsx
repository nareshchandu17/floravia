import React from 'react';
import { motion } from 'motion/react';

interface GardenStatsProps {
  stats: {
    avgHealth: number;
    mood: string;
  } | null;
  count: number;
}

export const GardenStats: React.FC<GardenStatsProps> = ({ stats, count }) => {
  if (!stats) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
    >
      <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Avg. Health</div>
        <div className={`text-3xl font-display font-bold ${stats.avgHealth > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {stats.avgHealth}%
        </div>
        <div className="w-full h-1.5 bg-[#071610] rounded-full overflow-hidden mt-1 border border-emerald-500/15">
          <div className="h-full bg-emerald-500 shadow-glow-green" style={{ width: `${stats.avgHealth}%` }} />
        </div>
      </div>
      <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">General Mood</div>
        <div className="text-2xl font-display font-bold text-emerald-400">
          {stats.mood}
        </div>
        <p className="text-[10px] text-slate-400 font-ui">Based on {count} plants</p>
      </div>
      <div className="hidden md:flex bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Care Horizon</div>
        <div className="text-2xl font-display font-bold text-emerald-300">
          3 Tasks
        </div>
        <p className="text-[10px] text-slate-400 font-ui">Next 48 hours</p>
      </div>
    </motion.div>
  );
};
