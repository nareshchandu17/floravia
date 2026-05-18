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
      <div className="glass-card p-5 border-green-500/20 flex flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-muted tracking-widest text-center">Avg. Health</div>
        <div className={`text-3xl font-display font-bold ${stats.avgHealth > 70 ? 'text-green-400' : 'text-amber-400'}`}>
          {stats.avgHealth}%
        </div>
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
          <div className="h-full bg-green-500 shadow-glow-green" style={{ width: `${stats.avgHealth}%` }} />
        </div>
      </div>
      <div className="glass-card p-5 border-teal-500/20 flex flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-muted tracking-widest text-center">General Mood</div>
        <div className="text-2xl font-display font-bold text-teal-400 animate-pulse">
          {stats.mood}
        </div>
        <p className="text-[10px] text-secondary font-ui">Based on {count} plants</p>
      </div>
      <div className="hidden md:flex glass-card p-5 border-blue-500/20 flex-col items-center justify-center gap-2">
        <div className="text-[10px] uppercase font-bold text-muted tracking-widest text-center">Care Horizon</div>
        <div className="text-2xl font-display font-bold text-blue-400">
          3 Tasks
        </div>
        <p className="text-[10px] text-secondary font-ui">Next 48 hours</p>
      </div>
    </motion.div>
  );
};
