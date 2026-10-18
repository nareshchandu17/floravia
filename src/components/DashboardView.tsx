import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Sparkles, 
  Atom, 
  Droplets, 
  ShieldCheck, 
  BrainCircuit, 
  ChevronDown, 
  ChevronRight, 
  Smile, 
  Sun, 
  Cloud, 
  Thermometer, 
  Wind, 
  Leaf, 
  ThumbsUp, 
  Star, 
  ArrowUpRight, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Image as ImageIcon,
  Sprout,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Waves,
  X,
  Gauge
} from 'lucide-react';
import { DashboardPlant } from '../types/botanical';
import { FertilizerScheduleTracker } from './subcomponents/FertilizerScheduleTracker';
import { calculateDynamicCareEssentials } from '../utils/weatherCareIntegration';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { savePlantToGarden, signIn } from '../services/firebase';
import { SeasonalAdviceWidget } from './SeasonalAdviceWidget';
import { DashboardEmptyState } from './subcomponents/DashboardEmptyState';
import { MicroclimateCard } from './MicroclimateCard';
import { GrowthTimelineTracker } from './GrowthTimelineTracker';
import { POPULAR_CITY_WEATHER } from '../services/weather';
import { GrowthMeasurement } from '../types/botanical';

interface DashboardViewProps {
  currentPlant: DashboardPlant | null;
  gardenPlants: DashboardPlant[];
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  weatherTemp?: number;
  weatherHumidity?: number;
  onSelectPlant: (plant: DashboardPlant) => void;
  onOpenBioSignature: () => void;
  onOpenGallery: (plant: DashboardPlant) => void;
  onNavigateToTab: (tab: any) => void;
  onWaterPlant?: (plantId: string) => void;
  onFertilizePlant?: (plantId: string, details?: { fertilizerType: string; date: string; notes?: string }) => void;
  onOpenChatWithTopic?: (topic: string) => void;
  onGrowthUpdated?: (plantId: string, measurements: GrowthMeasurement[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentPlant,
  gardenPlants,
  selectedCity,
  onChangeCity,
  weatherTemp,
  weatherHumidity,
  onSelectPlant,
  onOpenBioSignature,
  onOpenGallery,
  onNavigateToTab,
  onWaterPlant,
  onFertilizePlant,
  onOpenChatWithTopic,
  onGrowthUpdated
}) => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState(currentPlant?.nickname || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(currentPlant?.careEssentials?.userRating || 4);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('This Week');
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [waterAnimKey, setWaterAnimKey] = useState(0);
  const [isWateredJustNow, setIsWateredJustNow] = useState(false);
  const [isMistingPromptDismissed, setIsMistingPromptDismissed] = useState(false);
  const [isMistingActive, setIsMistingActive] = useState(false);
  const [mistedSuccess, setMistedSuccess] = useState(false);

  // Sync nickname when active plant changes
  React.useEffect(() => {
    if (currentPlant) {
      setNickname(currentPlant.nickname || '');
      setIsSaved(false);
      setIsWateredJustNow(false);
      setIsMistingPromptDismissed(false);
      setMistedSuccess(false);
    }
  }, [currentPlant?.id, currentPlant?.weatherInsight?.humidity]);

  if (!currentPlant) {
    return (
      <DashboardEmptyState 
        onNavigateToTab={onNavigateToTab}
      />
    );
  }

  // Dynamically calculate weather-adapted Care Essentials
  const dynamicCare = calculateDynamicCareEssentials(currentPlant, currentPlant.weatherInsight);

  const handleQuickMist = () => {
    setIsMistingActive(true);
    setTimeout(() => {
      setIsMistingActive(false);
      setMistedSuccess(true);
      if (onWaterPlant) {
        onWaterPlant(currentPlant.id);
      }
    }, 1800);
  };

  const handleMarkAsWatered = () => {
    setIsWatering(true);
    setWaterAnimKey((prev) => prev + 1);
    setIsWateredJustNow(true);

    if (onWaterPlant) {
      onWaterPlant(currentPlant.id);
    }

    // Auto dismiss water animation after 2.4s
    setTimeout(() => {
      setIsWatering(false);
    }, 2400);
  };

  const handleSaveToGarden = async () => {
    if (!user) {
      try {
        await signIn();
      } catch (e) {
        return;
      }
    }
    setIsSaving(true);
    try {
      await savePlantToGarden({
        name: currentPlant.name,
        nickname: nickname.trim() || undefined,
        scientificName: currentPlant.scientificName,
        healthScore: currentPlant.healthScore,
        mood: currentPlant.mood,
        predictedNeeds: {
          watering: currentPlant.priorityAdjustments.soilHydro,
          light: currentPlant.priorityAdjustments.luminance,
          fertilizing: 'Every 4-6 weeks with balanced rose organic food'
        }
      });
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Floravia | ${currentPlant.name}`,
      text: `Check out this botanical report for ${currentPlant.name} (${currentPlant.scientificName}) with a ${currentPlant.healthScore}% vigor score! 🌿`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // SVG Radial Ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentPlant.healthScore / 100) * circumference;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      {/* AUTOMATED LOW HUMIDITY / MISTING PROMPT BANNER */}
      <AnimatePresence>
        {dynamicCare.isLowHumidity && !isMistingPromptDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl p-4 md:p-5 border shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md ${
              dynamicCare.urgencyLevel === 'critical'
                ? 'bg-gradient-to-r from-amber-950/70 via-[#181109]/90 to-red-950/60 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                : 'bg-gradient-to-r from-[#0c2419] via-[#091d14] to-[#0b291d] border-emerald-500/35 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
            }`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-[50px] opacity-25 bg-emerald-400 pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              <div className={`p-3 rounded-2xl shrink-0 border mt-0.5 ${
                dynamicCare.urgencyLevel === 'critical'
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
              }`}>
                <Waves className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-emerald-400" />
                    Automated Climate Prompt • Low Humidity Alert
                  </span>
                  <span className="text-xs text-slate-300">
                    Local RH: <strong className="text-emerald-300">{currentPlant.weatherInsight.humidity}%</strong> (below 40% threshold)
                  </span>
                </div>
                <h4 className="text-base font-display font-bold text-white leading-snug">
                  Arid Microclimate in {currentPlant.weatherInsight.city}: Increase Plant Misting
                </h4>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-ui">
                  {dynamicCare.mistingRecommendation}
                </p>
              </div>
            </div>

            {/* Banner Actions */}
            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 relative z-10 w-full sm:w-auto justify-end">
              <button
                onClick={handleQuickMist}
                disabled={isMistingActive}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  mistedSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 active:scale-95'
                }`}
                title="Execute immediate foliar misting"
              >
                <Droplets className={`w-3.5 h-3.5 ${isMistingActive ? 'animate-spin' : ''}`} />
                <span>
                  {isMistingActive ? 'Misting Foliage...' : mistedSuccess ? 'Misted & Hydrated ✓' : 'Quick Mist Now'}
                </span>
              </button>

              <button
                onClick={() => setIsMistingPromptDismissed(true)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botanical Specimen Switcher Bar */}
      <div className="bg-[#0b1f16]/95 border border-emerald-500/20 rounded-2xl p-3 md:p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/90 font-ui">
              Botanical Specimens ({gardenPlants.length} active)
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('identify')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>+ Scan New Specimen</span>
          </button>
        </div>

        {/* Specimen Switcher Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {gardenPlants.map((plant) => {
            const isSelected = plant.id === currentPlant.id;
            return (
              <button
                key={plant.id}
                onClick={() => onSelectPlant(plant)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
                    : 'bg-[#071610]/80 border-emerald-500/15 hover:border-emerald-500/40 hover:bg-[#0c2419]'
                }`}
              >
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-10 h-10 rounded-lg object-cover border border-emerald-500/25 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {plant.nickname || plant.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate italic font-serif">
                    {plant.scientificName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                      {plant.healthScore}% Vigor
                    </span>
                    <span className="text-[9px] text-slate-500">·</span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {plant.mood}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ================= COLUMN 1: Identification & Plant Health ================= */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Main Identification Hero Card */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            {/* Top Plant Image with Gallery & Bookmark buttons & Water Animation */}
            <div className="relative w-full h-64 md:h-72 rounded-xl overflow-hidden mb-4 group bg-black/40">
              <img 
                src={currentPlant.imageUrl} 
                alt={currentPlant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
              
              {/* Quick Water Button on Image */}
              <button 
                onClick={handleMarkAsWatered}
                title="Mark Plant as Watered"
                className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06180f]/85 hover:bg-[#0c2b1a]/95 backdrop-blur-md text-emerald-300 border border-emerald-500/35 transition-all hover:scale-105 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <Droplets className={`w-4 h-4 text-emerald-400 ${isWatering ? 'animate-bounce' : ''}`} />
                <span className="text-xs font-bold">{isWateredJustNow ? 'Watered' : 'Water Plant'}</span>
              </button>

              {/* Bookmark Button */}
              <button 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                ) : (
                  <Bookmark className="w-4 h-4 text-slate-300" />
                )}
              </button>

              {/* View Gallery Button */}
              <button 
                onClick={() => onOpenGallery(currentPlant)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-semibold text-white border border-white/15 transition-all hover:scale-105 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Gallery</span>
              </button>

              {/* MOTION-BASED WATER DROP ANIMATION OVERLAY */}
              <AnimatePresence>
                {isWatering && (
                  <motion.div
                    key={`water-overlay-${waterAnimKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-cyan-950/50 backdrop-blur-[3px] pointer-events-none select-none"
                  >
                    {/* Concentric Expanding Water Ripples */}
                    <motion.div
                      initial={{ scale: 0.2, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 1.6, ease: "easeOut" }}
                      className="absolute w-36 h-36 rounded-full border-2 border-cyan-300/80 bg-cyan-400/15 shadow-[0_0_40px_rgba(6,182,212,0.7)]"
                    />
                    <motion.div
                      initial={{ scale: 0.2, opacity: 0.7 }}
                      animate={{ scale: 1.9, opacity: 0 }}
                      transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
                      className="absolute w-52 h-52 rounded-full border border-cyan-400/50 bg-cyan-500/10"
                    />
                    <motion.div
                      initial={{ scale: 0.1, opacity: 0.5 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                      className="absolute w-64 h-64 rounded-full border border-blue-400/30"
                    />

                    {/* Central Descending & Pulsing Water Droplet Card */}
                    <motion.div
                      initial={{ y: -70, scale: 0.4, opacity: 0 }}
                      animate={{ 
                        y: [-70, 0, -10, 0],
                        scale: [0.4, 1.2, 1.05, 1],
                        opacity: [0, 1, 1, 1]
                      }}
                      exit={{ y: 20, scale: 0.8, opacity: 0 }}
                      transition={{ 
                        duration: 0.7, 
                        times: [0, 0.6, 0.8, 1],
                        ease: [0.34, 1.56, 0.64, 1] 
                      }}
                      className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_45px_rgba(6,182,212,0.85)] border-2 border-cyan-100/60"
                    >
                      <Droplets className="w-10 h-10 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-pulse" />

                      {/* Radial Splash Droplet Particles */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                        <motion.span
                          key={i}
                          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos((deg * Math.PI) / 180) * 44,
                            y: Math.sin((deg * Math.PI) / 180) * 44,
                            scale: [0, 1.2, 0],
                            opacity: [1, 0.9, 0],
                          }}
                          transition={{ duration: 0.9, delay: 0.35 + i * 0.03, ease: "easeOut" }}
                          className="absolute w-2.5 h-2.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,1)]"
                        />
                      ))}
                    </motion.div>

                    {/* Animated "Watered & Hydrated" Badge Pill */}
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="mt-4 px-4 py-1.5 rounded-full bg-cyan-900/90 border border-cyan-400/60 backdrop-blur-md shadow-xl flex items-center gap-2 z-10"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-100">
                        Marked as Watered!
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Identification Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                IDENTIFICATION RESULT
              </p>
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {currentPlant.name}
                </h2>
                <p className="text-sm italic text-slate-400 font-serif mt-0.5">
                  {currentPlant.scientificName}
                </p>
              </div>

              {/* Clean Unboxed Taxonomy & Confidence */}
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                <span className="font-mono font-bold text-emerald-400 tabular-nums">{currentPlant.matchScore}% Match</span>
                <span className="text-emerald-500/40" aria-hidden="true">·</span>
                <span className="text-emerald-300 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {currentPlant.confidence}
                </span>
                <span className="text-emerald-500/40" aria-hidden="true">·</span>
                <span className="text-slate-400 font-medium">{currentPlant.careEssentials.light}</span>
              </div>

              {/* Nickname Input */}
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Give it a nickname (Optional)
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. My Sunshine"
                    className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-200 placeholder:text-emerald-500/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                  />
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  onClick={handleSaveToGarden}
                  disabled={isSaving || isSaved}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer ${
                    isSaved
                      ? 'bg-[#071610] text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  <Sprout className="w-4 h-4" />
                  <span>{isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save to Garden'}</span>
                </button>

                <button
                  onClick={handleMarkAsWatered}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95 ${
                    isWateredJustNow
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/35 hover:border-emerald-400'
                  }`}
                  title="Trigger watering animation and log care"
                >
                  <Droplets className={`w-4 h-4 text-emerald-400 ${isWatering ? 'animate-bounce' : ''}`} />
                  <span>{isWateredJustNow ? 'Watered!' : 'Water'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 rounded-xl bg-[#071610] hover:bg-[#0c261b] border border-emerald-500/20 text-emerald-200 hover:text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analyze Bio-Signature Action Banner */}
          <button
            onClick={onOpenBioSignature}
            className="w-full flex items-center justify-between p-3.5 bg-[#0b1f16] hover:bg-[#0f2a1e] border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25 group-hover:scale-110 transition-transform">
                <Atom className="w-4 h-4" />
              </div>
              <span className="text-xs md:text-sm font-bold text-slate-200 group-hover:text-emerald-300">
                Analyze Bio-Signature
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400/80 group-hover:text-emerald-300">
              <span>AI</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Plant Health Gauge Card */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Plant Health</h3>
            
            <div className="flex items-center justify-between gap-4">
              {/* Radial Gauge Left */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      stroke="rgba(52, 211, 153, 0.1)"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      stroke="#10b981"
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-emerald-400 font-sans">
                      {currentPlant.healthScore}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {currentPlant.vigorIndexLabel}
                  </p>
                </div>
              </div>

              {/* Stacked Health Metrics Right */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Hydration</span>
                    <span className="font-bold text-emerald-300">{currentPlant.hydrationStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Pathology</span>
                    <span className="font-bold text-emerald-400">{currentPlant.pathologyRisk}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-emerald-300" />
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Neural Stress</span>
                    <span className="font-bold text-emerald-300">{currentPlant.neuralStress}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: AI Assessment & Care Essentials ================= */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* AI Assessment Card */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <div 
              onClick={() => setIsAssessmentOpen(!isAssessmentOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <h3 className="text-sm font-bold text-slate-200">AI Assessment</h3>
              <ChevronDown className={`w-4 h-4 text-emerald-400/70 transition-transform duration-200 ${isAssessmentOpen ? '' : '-rotate-90'}`} />
            </div>

            {isAssessmentOpen && (
              <div className="mt-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Mood:</span>
                  <span className="text-emerald-400 font-bold">{currentPlant.aiAssessment.mood}</span>
                </div>

                <div className="space-y-2 pt-1">
                  {currentPlant.aiAssessment.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="text-emerald-400 text-sm leading-none mt-0.5">
                        {idx === 0 ? '🌸' : idx === 1 ? '💧' : '🌿'}
                      </span>
                      <span className="leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Priority Adjustments Card */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 mb-3.5">Priority Adjustments</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Soil Hydro */}
              <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Soil Hydro</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentPlant.priorityAdjustments.soilHydro}
                </p>
              </div>

              {/* Luminance */}
              <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Luminance</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentPlant.priorityAdjustments.luminance}
                </p>
              </div>
            </div>
          </div>

          {/* Micro-climate Dashboard Card */}
          <MicroclimateCard
            selectedCity={selectedCity || currentPlant.weatherInsight.city}
            onChangeCity={onChangeCity}
            weather={
              selectedCity && POPULAR_CITY_WEATHER[selectedCity]
                ? POPULAR_CITY_WEATHER[selectedCity]
                : {
                    city: selectedCity || currentPlant.weatherInsight.city,
                    temp: weatherTemp !== undefined ? weatherTemp : currentPlant.weatherInsight.temp,
                    humidity: weatherHumidity !== undefined ? weatherHumidity : currentPlant.weatherInsight.humidity,
                    condition: currentPlant.weatherInsight.condition || 'Pleasant Microclimate',
                    icon: '04d'
                  }
            }
            plantName={currentPlant.name}
            onQuickMist={handleQuickMist}
            isMisting={isMistingActive}
          />

          {/* Care Essentials Card (Weather-Integrated) */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-200">Care Essentials</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                dynamicCare.isLowHumidity
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
              }`}>
                <Activity className="w-3 h-3" />
                {dynamicCare.isLowHumidity ? 'Weather-Adapted (Arid)' : 'Weather-Synchronized'}
              </span>
            </div>

            {/* 4 Stat Badges with Dynamic Weather Overrides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
              {[
                { label: 'Water', val: dynamicCare.waterAdvice, icon: Droplets, color: 'text-emerald-400', isAlert: dynamicCare.isLowHumidity },
                { label: 'Light', val: dynamicCare.lightAdvice, icon: Sun, color: 'text-amber-400', isAlert: false },
                { label: 'Temp', val: dynamicCare.tempAdvice, icon: Thermometer, color: 'text-rose-400', isAlert: false },
                { label: 'Air / RH', val: dynamicCare.airAdvice, icon: Wind, color: 'text-emerald-400', isAlert: dynamicCare.isLowHumidity }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      item.isAlert 
                        ? 'bg-amber-950/20 border-amber-500/30' 
                        : 'bg-[#071610] border-emerald-500/15'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{item.label}</p>
                    <p className="text-[11px] font-bold text-slate-200 truncate" title={item.val}>{item.val}</p>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Misting Recommendation Tag if <40% RH */}
            {dynamicCare.isLowHumidity && (
              <div className="mb-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <Droplets className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    Dry air alert: Mist leaves 1-2x daily ({currentPlant.weatherInsight.humidity}% RH)
                  </span>
                </div>
                <button
                  onClick={handleQuickMist}
                  disabled={isMistingActive}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-transform active:scale-95 shrink-0 cursor-pointer"
                >
                  {isMistingActive ? 'Misting...' : mistedSuccess ? 'Done ✓' : 'Mist Now'}
                </button>
              </div>
            )}

            {/* Dynamic narrative summary */}
            <div className="p-3.5 bg-[#071610] border border-emerald-500/15 rounded-xl flex items-start gap-3 mb-3.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-ui">
                {dynamicCare.summary}
              </p>
            </div>

            {/* Feedback Rating Widget */}
            <div className="flex items-center justify-between pt-1 border-t border-emerald-900/20 text-xs">
              <span className="text-slate-400 text-[11px]">How accurate was this result?</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setHasLiked(!hasLiked)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    hasLiked 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setUserRating(star)}
                      className="cursor-pointer"
                    >
                      <Star 
                        className={`w-3.5 h-3.5 ${
                          star <= userRating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fertilizer Schedule Tracker */}
          <div id="fertilizer-schedule-tracker" className="transition-all duration-300 rounded-2xl">
            <FertilizerScheduleTracker
              plant={currentPlant}
              onFertilize={onFertilizePlant}
            />
          </div>
        </div>

        {/* ================= COLUMN 3: My Garden, Health Overview & Care Timeline ================= */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* My Garden Horizontal Thumbnails Carousel */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-200">My Garden</h3>
              <button 
                onClick={() => onNavigateToTab('garden')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Horizontal scroll cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
              {gardenPlants.map((plant) => {
                const isCurrent = plant.id === currentPlant.id;
                return (
                  <div
                    key={plant.id}
                    onClick={() => onSelectPlant(plant)}
                    className={`w-28 shrink-0 p-2 rounded-xl bg-[#071610] border cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-emerald-400 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'border-emerald-500/20 opacity-75 hover:opacity-100 hover:border-emerald-400/40'
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg overflow-hidden mb-1.5 bg-black/40">
                      <img 
                        src={plant.imageUrl} 
                        alt={plant.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {plant.nickname || plant.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {plant.scientificName}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Overview Line Chart */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg space-y-3">
            {/* Header with Title and Period Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 leading-none">Health Overview</h3>
                  <span className="text-[10px] text-slate-400">Vigor Score Trend Analysis</span>
                </div>
              </div>

              {/* Period Filter Dropdown / Pills */}
              <div className="flex items-center bg-[#071610] border border-emerald-500/25 rounded-lg p-0.5 text-[11px]">
                {['All History', 'Recent'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                      selectedPeriod === period
                        ? 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/35'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const fullTrend = currentPlant.healthOverview?.trend || [];
              const displayTrend = selectedPeriod === 'Recent' && fullTrend.length > 3 
                ? fullTrend.slice(-3) 
                : fullTrend;

              const latestEntry = fullTrend.length > 0 
                ? fullTrend[fullTrend.length - 1] 
                : { date: 'Today', score: currentPlant.healthScore, mood: currentPlant.mood };
              
              const firstEntry = fullTrend.length > 0 ? fullTrend[0] : latestEntry;
              const netChange = latestEntry.score - firstEntry.score;
              const isPositive = netChange >= 0;
              const peakScore = fullTrend.length > 0 ? Math.max(...fullTrend.map(d => d.score)) : currentPlant.healthScore;
              const avgScore = fullTrend.length > 0 
                ? Math.round(fullTrend.reduce((acc, cur) => acc + cur.score, 0) / fullTrend.length) 
                : currentPlant.healthScore;

              return (
                <>
                  {/* Micro stats banner */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#071610] border border-emerald-500/15 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5">
                      {isPositive ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{netChange}% Growth</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>{netChange}% Shift</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500">since {firstEntry.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>Peak: <strong className="text-emerald-400">{peakScore}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Avg: <strong className="text-slate-200">{avgScore}</strong></span>
                    </div>
                  </div>

                  {/* Recharts Curve with glowing gradient and dynamic highlight badge */}
                  <div className="h-44 w-full relative pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={displayTrend} 
                        margin={{ top: 15, right: 15, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="plantHealthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.06)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#5e8770" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          stroke="#5e8770" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              const prevIdx = displayTrend.findIndex(item => item.date === d.date) - 1;
                              const prevScore = prevIdx >= 0 ? displayTrend[prevIdx].score : null;
                              const diff = prevScore !== null ? d.score - prevScore : null;

                              return (
                                <div className="p-2.5 bg-[#0b1f16] border border-emerald-500/40 rounded-xl text-xs shadow-2xl space-y-1 z-50 backdrop-blur-md">
                                  <div className="flex items-center justify-between gap-4 border-b border-emerald-500/20 pb-1">
                                    <span className="font-bold text-slate-200">{d.date}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                      {d.mood || currentPlant.mood}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between gap-3 pt-0.5">
                                    <span className="text-slate-400 text-[11px]">Vigor Score:</span>
                                    <span className="text-emerald-400 font-extrabold text-sm">{d.score} / 100</span>
                                  </div>
                                  {diff !== null && (
                                    <p className="text-[10px] text-slate-400">
                                      {diff > 0 ? (
                                        <span className="text-emerald-400">+{diff} pts vs prior check</span>
                                      ) : diff < 0 ? (
                                        <span className="text-rose-400">{diff} pts vs prior check</span>
                                      ) : (
                                        <span className="text-slate-400">Unchanged vs prior check</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          fill="url(#plantHealthGradient)"
                          dot={{ fill: '#10b981', r: 3.5, stroke: '#06130d', strokeWidth: 1.5 }}
                          activeDot={{ r: 5.5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={800}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Dynamic Latest / Peak Reading Highlight Badge */}
                    <div className="absolute top-1 right-1 px-2.5 py-1 rounded-xl bg-[#071610]/95 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold text-center shadow-lg backdrop-blur-sm">
                      <span className="block text-xs font-extrabold text-emerald-400">{latestEntry.score}%</span>
                      <span className="text-[9px] text-slate-400 font-medium">{latestEntry.date}</span>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* 4 Status Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-500/15 text-center">
              <button
                onClick={handleMarkAsWatered}
                className="p-1.5 -m-1 rounded-xl hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer group text-center"
                title="Click to water and trigger water drop transition"
              >
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-emerald-300">
                  <Droplets className={`w-3 h-3 text-emerald-400 ${isWatering ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                  <span>Watered</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-200 transition-colors">
                  {isWateredJustNow ? 'Just now' : currentPlant.healthOverview.lastWatered}
                </p>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('fertilizer-schedule-tracker');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-emerald-500/60');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500/60'), 2200);
                  }
                }}
                className="p-1.5 -m-1 rounded-xl hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer group text-center"
                title="Click to inspect species fertilizer schedule"
              >
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-emerald-300">
                  <Sprout className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Fertilized</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-200 transition-colors">
                  {currentPlant.healthOverview.lastFertilized}
                </p>
              </button>

              <div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Next Watering</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200">{currentPlant.healthOverview.nextWatering}</p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  <span>Next Pruning</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200">{currentPlant.healthOverview.nextPruning}</p>
              </div>
            </div>
          </div>

          {/* Visual Growth Timeline Tracker */}
          <div id="growth-timeline-tracker" className="transition-all duration-300">
            <GrowthTimelineTracker
              plant={currentPlant}
              onGrowthUpdated={(measurements) => {
                if (onGrowthUpdated && currentPlant) {
                  onGrowthUpdated(currentPlant.id, measurements);
                }
              }}
            />
          </div>

          {/* Care Timeline & AI Tip for You */}
          <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-200">Care Timeline</h3>
              <button 
                onClick={() => onNavigateToTab('calendar')}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>View Calendar</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Timeline Steps Left */}
              <div className="space-y-2.5 text-xs font-medium">
                {currentPlant.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="text-slate-400 text-[11px] w-12 shrink-0">{item.date}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      item.color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                      item.color === 'amber' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                      'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
                    }`} />
                    <span className="text-slate-200">{item.action}</span>
                  </div>
                ))}
              </div>

              {/* AI Tip for You Card Right */}
              <div className="p-3.5 bg-[#071610] border border-emerald-500/15 rounded-xl space-y-2.5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-bold text-emerald-400 mb-1">AI Tip for You</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {currentPlant.aiTip.tip}
                  </p>
                </div>

                <button 
                  onClick={() => onNavigateToTab('guide')}
                  className="flex items-center justify-between w-full pt-2 border-t border-emerald-500/15 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
                >
                  <span>View Detailed Guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= SEASONAL GARDENING ADVICE WIDGET ================= */}
      <div id="seasonal-gardening-advice-widget" className="w-full">
        <SeasonalAdviceWidget
          currentPlant={currentPlant}
          gardenPlants={gardenPlants}
          onNavigateToTab={onNavigateToTab}
          onOpenChatWithTopic={onOpenChatWithTopic}
        />
      </div>

      {/* ================= BOTTOM FULL-WIDTH: Care Instructions ================= */}
      <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
            <Leaf className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Care Instructions</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Detailed Guide Paragraph */}
          <div className="lg:col-span-3 text-xs md:text-sm text-slate-300 leading-relaxed font-ui">
            <p>{currentPlant.careInstructions.detailedText}</p>
          </div>

          {/* 4 Care Icons on the right */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
            <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Water</span>
                <span className="text-xs font-bold text-slate-200">{currentPlant.careInstructions.water}</span>
              </div>
            </div>

            <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Light</span>
                <span className="text-xs font-bold text-slate-200">{currentPlant.careInstructions.light}</span>
              </div>
            </div>

            <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Temp</span>
                <span className="text-xs font-bold text-slate-200">{currentPlant.careInstructions.temp}</span>
              </div>
            </div>

            <div className="p-3 bg-[#071610] border border-emerald-500/15 rounded-xl flex items-center gap-2.5">
              <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Air</span>
                <span className="text-xs font-bold text-slate-200">{currentPlant.careInstructions.air}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
