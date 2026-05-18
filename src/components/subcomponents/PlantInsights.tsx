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
    <div className="glass-card p-6 border-teal-500/10 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase tracking-widest text-muted font-bold">Neural Insights</div>
          <Sparkles className="w-3 h-3 text-yellow-400" />
        </div>
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 items-start group">
              <div className="mt-1 w-1 h-1 rounded-full bg-teal-500 shadow-glow-teal group-hover:scale-150 transition-transform" />
              <p className="text-xs text-secondary font-ui leading-tight">{insight}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-3">Priority Adjustments</div>
        <div className="flex flex-col gap-2">
          <div className="px-3 py-1.5 bg-surface border border-white/10 rounded-xl text-[10px] font-bold text-primary flex items-center justify-between group overflow-hidden">
            <div className="flex items-center gap-2">
              <button className="cursor-pointer"><Droplets className="w-3 h-3 text-blue-400" /></button>
              <span className="text-muted">Soil Hydro</span>
            </div>
            <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg group-hover:bg-blue-400 group-hover:text-void transition-colors truncate max-w-[80px]">
              {predictedNeeds.watering}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-surface border border-white/10 rounded-xl text-[10px] font-bold text-primary flex items-center justify-between group overflow-hidden">
            <div className="flex items-center gap-2">
              <button className="cursor-pointer"><Sun className="w-3 h-3 text-yellow-400" /></button>
              <span className="text-muted">Luminance</span>
            </div>
            <span className="text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg group-hover:bg-yellow-400 group-hover:text-void transition-colors truncate max-w-[80px]">
              {predictedNeeds.light}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
