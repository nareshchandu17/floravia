import React from 'react';
import { motion } from 'motion/react';
import { Sprout, Plus, Activity, CloudRain, History, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { EmptyState } from '../EmptyState';

interface EmptyGardenProps {
  onNavigateToTab?: (tab: string) => void;
  onLoadDemoPlants?: () => void;
}

export const EmptyGarden: React.FC<EmptyGardenProps> = ({ 
  onNavigateToTab,
  onLoadDemoPlants 
}) => {
  return (
    <div className="max-w-3xl mx-auto py-4 px-4 space-y-8">
      <EmptyState
        variant="hero"
        icon={Sprout}
        badge="Botanical Sanctuary"
        title="Your Garden is Empty"
        description="You haven't added or scanned any botanical specimens yet. Identify your first houseplant or flower using AI camera vision to start building your personal sanctuary with automated care schedules."
        action={{
          label: "Scan & Identify Plant",
          onClick: () => onNavigateToTab ? onNavigateToTab('identify') : (window.location.hash = '#identify'),
          icon: Plus
        }}
        secondaryAction={{
          label: "Browse Care Guides",
          onClick: () => onNavigateToTab ? onNavigateToTab('care') : (window.location.hash = '#care'),
          icon: BookOpen
        }}
        actions={
          onLoadDemoPlants ? (
            <button 
              onClick={onLoadDemoPlants}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20 hover:border-emerald-400/40 text-emerald-300 font-medium text-xs sm:text-sm transition-all cursor-pointer hover:bg-emerald-900/30 flex items-center gap-1.5"
              title="Populate with sample botanical collection to explore the UI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Plants</span>
            </button>
          ) : undefined
        }
      >
        <div className="grid gap-3.5 sm:grid-cols-2 pt-6 text-left">
          {[
            { 
              icon: Activity, 
              title: "Bio-Signature Monitoring", 
              desc: "Track health vigor, hydration status, and leaf stress indices over time with Gemini neural vision.",
              color: "text-cyan-400",
              bg: "bg-cyan-950/20 border-cyan-500/20"
            },
            { 
              icon: CloudRain, 
              title: "Atmospheric Sync", 
              desc: "Real-time watering intervals dynamically adjusted based on your local microclimate temperature and humidity.",
              color: "text-teal-400",
              bg: "bg-teal-950/20 border-teal-500/20"
            },
            { 
              icon: History, 
              title: "Temporal Care Logs", 
              desc: "Keep precise historical records of every hydration, misting, and nutrient feeding event.",
              color: "text-amber-400",
              bg: "bg-amber-950/20 border-amber-500/20"
            },
            { 
              icon: TrendingUp, 
              title: "Vitality Forecasting", 
              desc: "Predict upcoming watering and repotting dates based on seasonal shifts and light availability.",
              color: "text-emerald-400",
              bg: "bg-emerald-950/20 border-emerald-500/20"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + (i * 0.08) }}
              className={`p-4 rounded-2xl border flex gap-3.5 hover:border-emerald-500/30 transition-all ${feature.bg}`}
            >
              <div className={`p-2.5 rounded-xl bg-[#06100b] border border-white/5 h-fit ${feature.color}`}>
                <feature.icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white tracking-wide">{feature.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-ui">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </EmptyState>
    </div>
  );
};

