import React from 'react';
import { motion } from 'motion/react';
import { 
  Droplets, 
  Activity, 
  AlertTriangle, 
  Smile, 
  Meh, 
  Frown, 
  Zap,
  Leaf,
  BrainCircuit
} from 'lucide-react';

interface PlantHealthMetricsProps {
  healthScore: number;
  mood: string;
  indicators: {
    hydration: string;
    diseaseRisk: string;
    stressLevel: string;
  };
}

export const PlantHealthMetrics: React.FC<PlantHealthMetricsProps> = ({ healthScore, mood, indicators }) => {
  const getMoodIcon = (moodStr: string) => {
    const m = moodStr.toLowerCase();
    if (m.includes('thriving') || m.includes('happy') || m.includes('excellent')) return <Smile className="w-5 h-5 text-green-400" />;
    if (m.includes('needs attention') || m.includes('stressed') || m.includes('frown')) return <Frown className="w-5 h-5 text-red-400" />;
    return <Meh className="w-5 h-5 text-yellow-400" />;
  };

  const getHydrationColor = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('excellent') || v.includes('optimal')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (v.includes('dry') || v.includes('low')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  };

  const getRiskColor = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('low') || v.includes('minimal')) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (v.includes('high') || v.includes('severe')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  const getStressColor = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('minimal') || v.includes('none')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (v.includes('high') || v.includes('moderate')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden group shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <BrainCircuit className="w-24 h-24 text-emerald-400" />
      </div>

      <div className="flex items-center justify-between gap-6 relative z-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-[#071610]"
            />
            <motion.circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={301.6}
              initial={{ strokeDashoffset: 301.6 }}
              animate={{ strokeDashoffset: 301.6 - (301.6 * healthScore) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className={healthScore > 80 ? "text-emerald-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]" : healthScore > 40 ? "text-amber-400" : "text-rose-400"}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-black text-white leading-none">{healthScore}%</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Vigor Index</span>
          </div>
        </div>

        <div className="flex-1 space-y-3 text-right">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">AI Assessment: Mood</div>
            <div className="flex items-center justify-end gap-2 px-3 py-1.5 rounded-xl bg-[#071610] border border-emerald-500/15">
              <span className="text-xl md:text-2xl font-display font-bold text-white">
                {mood}
              </span>
              {getMoodIcon(mood)}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-slate-400 uppercase">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            Live Biometric Sync
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-emerald-500/10 pt-6">
        <div className={`p-3 rounded-2xl border transition-all hover:scale-105 flex flex-col gap-2 ${getHydrationColor(indicators.hydration)}`}>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest font-black opacity-60">Hydration</span>
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-tight">{indicators.hydration}</span>
        </div>

        <div className={`p-3 rounded-2xl border transition-all hover:scale-105 flex flex-col gap-2 ${getRiskColor(indicators.diseaseRisk)}`}>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest font-black opacity-60">Pathology</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-tight">{indicators.diseaseRisk} Risk</span>
        </div>

        <div className={`p-3 rounded-2xl border transition-all hover:scale-105 flex flex-col gap-2 ${getStressColor(indicators.stressLevel)}`}>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-widest font-black opacity-60">Neural Stress</span>
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-tight">{indicators.stressLevel}</span>
        </div>
      </div>
    </div>
  );
};
