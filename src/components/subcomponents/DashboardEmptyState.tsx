import React from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  Stethoscope, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  ArrowRight, 
  Droplets, 
  Sun, 
  ShieldCheck,
  Sparkles,
  Heart
} from 'lucide-react';

interface DashboardEmptyStateProps {
  onNavigateToTab: (tab: any) => void;
  onLoadStarterPlants?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onNavigateToTab
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto pb-16 px-4 md:px-6 space-y-8">
      {/* 1. Hero Welcome Banner (Modern, Clean Neutral Dark with Refined Accent) */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121926] via-[#0f1520] to-[#141d2b] border border-slate-700/60 p-6 md:p-10 shadow-xl"
      >
        {/* Soft background ambient glow (warm slate & subtle mint) */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Welcome to Floravia</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Bring your plants to life
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Keep your house and garden plants healthy, thriving, and on schedule. Add your first plant to get personalized care routines, watering reminders, and health tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab('identify')}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <Camera className="w-4 h-4" />
              <span>Add Your First Plant</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onNavigateToTab('diagnose')}
              className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-rose-400" />
              <span>Diagnose a Sick Plant</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Action Cards Grid (High contrast, distinct color roles, zero fluff) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card A: Scan & Identify */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          onClick={() => onNavigateToTab('identify')}
          className="group relative p-6 rounded-2xl bg-[#141b26] border border-slate-700/70 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-emerald-950/30"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Scan & Identify
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Take or upload a photo of any leaf, flower, or succulent. Get the exact species name, care needs, and light requirements in seconds.
            </p>
          </div>

          <div className="pt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Scan a photo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Card B: Plant Doctor */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          onClick={() => onNavigateToTab('diagnose')}
          className="group relative p-6 rounded-2xl bg-[#141b26] border border-slate-700/70 hover:border-rose-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-rose-950/20"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
              Plant Doctor & Health Check
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Notice yellowing leaves, brown tips, or sudden wilting? Upload a close-up photo to check for root rot, pests, or nutrient deficiencies with treatment steps.
            </p>
          </div>

          <div className="pt-5 flex items-center gap-1.5 text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
            <span>Check symptoms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>
      </div>

      {/* 3. Helpful Tools & Resources (Warm, functional, clean) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Helpful Plant Tools
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => onNavigateToTab('guide')}
            className="p-4 rounded-xl bg-[#111722] hover:bg-[#161f2e] border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                Plant Care Library
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Browse detailed watering, soil, and light specs for 50+ species.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('calendar')}
            className="p-4 rounded-xl bg-[#111722] hover:bg-[#161f2e] border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-lg bg-sky-500/15 text-sky-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                Care Calendar
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                View your upcoming watering and feeding schedule in one place.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('chat')}
            className="p-4 rounded-xl bg-[#111722] hover:bg-[#161f2e] border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Gardening Assistant
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Ask any question about repotting, pruning, sunlight, or fertilizers.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Common Houseplant Care Quick Tips (Provides instant visual value) */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#111722] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              Quick Houseplant Care Essentials
            </h4>
          </div>
          <button 
            onClick={() => onNavigateToTab('guide')}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>View all guides</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#161e2c]/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Watering Rule of Thumb</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When in doubt, wait one more day. Most indoor plants recover faster from slight dryness than from soggy root rot.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161e2c]/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Bright Indirect Light</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Position plants within 3–5 feet of an east or south window protected by sheer curtains to prevent leaf sunburn.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161e2c]/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Proper Drainage</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Always use pots with drainage holes and empty decorative drip saucers 20 minutes after watering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
