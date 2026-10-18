import React from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Camera, 
  Stethoscope, 
  Droplets, 
  Activity, 
  Sparkles, 
  Sun, 
  Calendar, 
  FlaskConical, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface DashboardEmptyStateProps {
  onNavigateToTab: (tab: any) => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onNavigateToTab
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto pb-16 px-4 md:px-6 space-y-10">
      {/* Hero Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#081711] via-[#05110c] to-[#0a1f16] border border-emerald-500/30 p-6 md:p-10 shadow-2xl"
      >
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Botanical Intelligence Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Welcome to Your Botanical Intelligence Dashboard
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-ui">
            No plant is currently active or scanned. Floravia combines Gemini 2.5 multimodal vision with live microclimate weather telemetry to deliver real-time physiological diagnostics, foliar hydration metrics, and tailored care routines for your plants.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-3.5 pt-3">
            <button
              onClick={() => onNavigateToTab('identify')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Identify Your First Plant</span>
            </button>

            <button
              onClick={() => onNavigateToTab('diagnose')}
              className="px-6 py-3.5 rounded-xl bg-[#091b13] hover:bg-[#0e271c] border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Diagnose Leaf Disease</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Explanatory Section: What Appears Once Scanned */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
              What Appears in Your Dashboard Once a Plant is Active
            </h3>
            <p className="text-xs text-slate-400">
              Each section provides dedicated physiological tracking calculated specifically for your botanical specimen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Camera,
              title: "Neural Species Identification",
              badge: "Gemini 2.5 Vision",
              description: "High-precision Latin taxonomy, botanical family, native habitat climate zone, and genetic identification confidence percentage.",
              color: "text-emerald-400",
              border: "border-emerald-500/20",
              bg: "bg-emerald-950/15"
            },
            {
              icon: Activity,
              title: "Physiological Health & Vigor",
              badge: "Vitality Index",
              description: "Continuous 0–100 health assessment evaluating foliar chlorosis, cellular turgor, leaf firmness, and light stress symptoms.",
              color: "text-cyan-400",
              border: "border-cyan-500/20",
              bg: "bg-cyan-950/15"
            },
            {
              icon: Droplets,
              title: "Atmospheric-Adapted Watering",
              badge: "Weather Synced",
              description: "Dynamic irrigation countdowns that adjust automatically when ambient temperature spikes or local humidity drops below 40%.",
              color: "text-teal-400",
              border: "border-teal-500/20",
              bg: "bg-teal-950/15"
            },
            {
              icon: FlaskConical,
              title: "Precision Nutrition Prescriptions",
              badge: "NPK Ratio Engine",
              description: "Stage-dependent fertilizer dilution recipes (seedling, vegetative, blooming, or dormant) to prevent root salt burn.",
              color: "text-amber-400",
              border: "border-amber-500/20",
              bg: "bg-amber-950/15"
            },
            {
              icon: ShieldAlert,
              title: "Pathology & Pest Diagnostics",
              badge: "Organic Regimens",
              description: "Early detection of powdery mildew, root rot, spider mites, or thrips with step-by-step biological and chemical recovery protocols.",
              color: "text-rose-400",
              border: "border-rose-500/20",
              bg: "bg-rose-950/15"
            },
            {
              icon: Calendar,
              title: "Google Calendar Synchronization",
              badge: "Timezone Aligned",
              description: "1-click push synchronization of watering and feeding alerts directly into your personal Google Calendar with customizable notifications.",
              color: "text-purple-400",
              border: "border-purple-500/20",
              bg: "bg-purple-950/15"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.06 }}
              className={`p-5 rounded-2xl border ${item.border} ${item.bg} flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-all`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-[#06120c] border border-white/5 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-ui">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Footer Strip */}
      <div className="p-5 rounded-2xl bg-[#07140e] border border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Need help getting started? Explore our specialized botanical tools:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToTab('calculator')}
            className="px-3 py-1.5 rounded-lg bg-[#0b1b13] border border-emerald-900/50 hover:border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            Fertilizer Calculator
          </button>
          <button
            onClick={() => onNavigateToTab('calendar')}
            className="px-3 py-1.5 rounded-lg bg-[#0b1b13] border border-emerald-900/50 hover:border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            Care Calendar
          </button>
          <button
            onClick={() => onNavigateToTab('care')}
            className="px-3 py-1.5 rounded-lg bg-[#0b1b13] border border-emerald-900/50 hover:border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            Plant Care Guides
          </button>
        </div>
      </div>
    </div>
  );
};
