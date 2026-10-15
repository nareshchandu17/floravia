import React from 'react';
import { Sparkles, Droplets, Sun } from 'lucide-react';

interface PlantInsightsProps {
  insights: string[];
  predictedNeeds: {
    watering: string;
    light: string;
  };
}

export const PlantInsights: React.FC<PlantInsightsProps> = ({ insights, predictedNeeds }) => {
  return (
    <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Neural Insights</div>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 items-start group">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] group-hover:scale-150 transition-transform shrink-0" />
              <p className="text-xs text-slate-300 font-ui leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-emerald-500/10">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Priority Adjustments</div>
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2 bg-[#071610] border border-emerald-500/15 rounded-xl text-[10px] font-bold text-white flex items-center justify-between group overflow-hidden">
            <div className="flex items-center gap-2">
              <button className="cursor-pointer"><Droplets className="w-3.5 h-3.5 text-cyan-400" /></button>
              <span className="text-slate-400">Soil Hydro</span>
            </div>
            <span className="text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg truncate max-w-[100px]">
              {predictedNeeds.watering}
            </span>
          </div>
          <div className="px-3 py-2 bg-[#071610] border border-emerald-500/15 rounded-xl text-[10px] font-bold text-white flex items-center justify-between group overflow-hidden">
            <div className="flex items-center gap-2">
              <button className="cursor-pointer"><Sun className="w-3.5 h-3.5 text-amber-400" /></button>
              <span className="text-slate-400">Luminance</span>
            </div>
            <span className="text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg truncate max-w-[100px]">
              {predictedNeeds.light}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
