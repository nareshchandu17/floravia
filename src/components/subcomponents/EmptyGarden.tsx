import React from 'react';
import { motion } from 'motion/react';
import { Sprout, Plus, Activity, CloudRain, History, TrendingUp } from 'lucide-react';

export const EmptyGarden: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
          <div className="glass-card p-6 relative z-10 border-green-500/20 shadow-glow-green inline-block rounded-3xl">
            <Sprout className="w-12 h-12 text-green-400" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-4xl font-display font-bold text-primary tracking-tight">Your Digital Sanctuary</h3>
          <p className="text-secondary font-ui leading-relaxed">
            Start building your garden by identifying your first plant. 
            Unlock advanced bio-tracking, local weather sync, and AI-powered care schedules.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button 
            onClick={() => window.location.hash = '#'} 
            className="px-8 py-3 rounded-2xl bg-green-500 text-void font-bold shadow-glow-green hover:bg-green-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Begin Identification
          </button>
          <button 
            onClick={() => window.location.hash = '#guide'} 
            className="px-8 py-3 rounded-2xl bg-surface border border-white/10 text-primary font-bold hover:bg-white/5 transition-all"
          >
            Browse Care Guides
          </button>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { 
            icon: Activity, 
            title: "Bio-Signature Monitoring", 
            desc: "Track health vigor and stress indices over time with neural analysis.",
            color: "text-blue-400",
            bg: "bg-blue-400/5"
          },
          { 
            icon: CloudRain, 
            title: "Atmospheric Sync", 
            desc: "Real-time watering adjustments based on your local micro-climate.",
            color: "text-teal-400",
            bg: "bg-teal-400/5"
          },
          { 
            icon: History, 
            title: "Temporal Care Logs", 
            desc: "Maintain precise records of every hydration and fertilization event.",
            color: "text-amber-400",
            bg: "bg-amber-400/5"
          },
          { 
            icon: TrendingUp, 
            title: "Vitality Forecasting", 
            desc: "Predict future needs using Gemini-powered growth trend models.",
            color: "text-green-400",
            bg: "bg-green-400/5"
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className={`glass-card p-4 border-white/5 flex gap-4 hover:border-white/10 transition-colors ${feature.bg}`}
          >
            <div className={`p-3 rounded-xl bg-void/50 border border-white/5 h-fit ${feature.color}`}>
              <feature.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary">{feature.title}</h4>
              <p className="text-[10px] sm:text-xs text-muted leading-relaxed font-ui">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
