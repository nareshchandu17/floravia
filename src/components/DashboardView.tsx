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
  Thermometer, 
  Wind, 
  Leaf, 
  ThumbsUp, 
  Star, 
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
  Plus
} from 'lucide-react';
import { DashboardPlant, GrowthMeasurement } from '../types/botanical';
import { FertilizerScheduleTracker } from './subcomponents/FertilizerScheduleTracker';
import { calculateDynamicCareEssentials } from '../utils/weatherCareIntegration';
import { 
  ResponsiveContainer, 
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
  onLoadStarterPlants?: () => void;
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
  onGrowthUpdated,
  onLoadStarterPlants
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
  const [isWatering, setIsWatering] = useState(false);
  const [isWateredJustNow, setIsWateredJustNow] = useState(false);
  const [waterAnimKey, setWaterAnimKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMistingActive, setIsMistingActive] = useState(false);
  const [mistedSuccess, setMistedSuccess] = useState(false);
  const [isMistingPromptDismissed, setIsMistingPromptDismissed] = useState(false);

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
        onLoadStarterPlants={onLoadStarterPlants}
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
          watering: currentPlant.priorityAdjustments?.soilHydro || 'Water when topsoil is dry',
          light: currentPlant.priorityAdjustments?.luminance || 'Bright indirect light',
          fertilizing: 'Every 4-6 weeks with balanced organic plant food'
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
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-5 md:p-6 space-y-6 text-slate-100">
      
      {/* 1. AUTOMATED LOW HUMIDITY / MISTING ALERT BANNER */}
      <AnimatePresence>
        {dynamicCare.isLowHumidity && !isMistingPromptDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl p-4 md:p-5 border shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md ${
              dynamicCare.urgencyLevel === 'critical'
                ? 'bg-gradient-to-r from-amber-950/70 via-[#181109]/90 to-red-950/60 border-amber-500/40'
                : 'bg-gradient-to-r from-[#0c2419] via-[#091d14] to-[#0b291d] border-emerald-500/35'
            }`}
          >
            <div className="flex items-start gap-3.5 relative z-10">
              <div className={`p-2.5 rounded-xl shrink-0 border mt-0.5 ${
                dynamicCare.urgencyLevel === 'critical'
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
              }`}>
                <Waves className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Atmospheric Alert • Low Humidity ({currentPlant.weatherInsight.humidity}% RH)
                  </span>
                </div>
                <h4 className="text-sm md:text-base font-bold text-white leading-tight">
                  Dry Ambient Air in {currentPlant.weatherInsight.city}: Foliar Misting Recommended
                </h4>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {dynamicCare.mistingRecommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 relative z-10">
              <button
                onClick={handleQuickMist}
                disabled={isMistingActive}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  mistedSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 active:scale-95'
                }`}
              >
                <Droplets className={`w-3.5 h-3.5 ${isMistingActive ? 'animate-spin' : ''}`} />
                <span>
                  {isMistingActive ? 'Misting Foliage...' : mistedSuccess ? 'Misted ✓' : 'Quick Mist'}
                </span>
              </button>

              <button
                onClick={() => setIsMistingPromptDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SPECIMEN COMMAND RIBBON (Streamlined Switcher) */}
      <div className="bg-[#071710] border border-emerald-500/20 rounded-2xl p-3 md:p-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/90">
              Botanical Sanctuary ({gardenPlants.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
            {gardenPlants.map((plant) => {
              const isSelected = plant.id === currentPlant.id;
              return (
                <button
                  key={plant.id}
                  onClick={() => onSelectPlant(plant)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-white ring-1 ring-emerald-400/40'
                      : 'bg-[#091f15] border-emerald-500/15 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                  }`}
                >
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    className="w-6 h-6 rounded-lg object-cover border border-emerald-500/30 shrink-0"
                  />
                  <div className="min-w-0 max-w-[130px]">
                    <p className="text-xs font-bold truncate leading-tight">
                      {plant.nickname || plant.name}
                    </p>
                    <p className="text-[10px] text-emerald-400/80 font-mono truncate leading-none">
                      {plant.healthScore}% Vigor
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateToTab('identify')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan Plant</span>
            </button>
            <button
              onClick={() => onNavigateToTab('garden')}
              className="px-3 py-1.5 rounded-xl bg-[#091f15] hover:bg-[#0d2a1d] border border-emerald-500/25 text-emerald-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              All Plants
            </button>
          </div>
        </div>
      </div>

      {/* 3. HERO ACTIVE SPECIMEN & LIVE VITALS CARD (Primary Hierarchy Anchor) */}
      <div className="bg-[#081a12] border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle radial ambient backdrop */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Specimen Media Box (5 cols) */}
          <div className="lg:col-span-5 relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden group bg-black/50 shadow-inner">
            <img 
              src={currentPlant.imageUrl} 
              alt={currentPlant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Quick Water Button Overlay */}
            <button 
              onClick={handleMarkAsWatered}
              title="Mark Plant as Watered"
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06180f]/85 hover:bg-[#0c2b1a]/95 backdrop-blur-md text-emerald-300 border border-emerald-500/35 transition-all hover:scale-105 hover:border-emerald-400 shadow-md cursor-pointer"
            >
              <Droplets className={`w-4 h-4 text-emerald-400 ${isWatering ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold">{isWateredJustNow ? 'Watered' : 'Water Plant'}</span>
            </button>

            {/* Top Right Bookmark */}
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
              title="Bookmark specimen"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              ) : (
                <Bookmark className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Bottom Gallery Quick Button */}
            <button 
              onClick={() => onOpenGallery(currentPlant)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-xs font-semibold text-white border border-white/15 transition-all hover:scale-105 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gallery ({currentPlant.galleryImages?.length || 1})</span>
            </button>

            {/* WATER DROP OVERLAY ANIMATION */}
            <AnimatePresence>
              {isWatering && (
                <motion.div
                  key={`water-overlay-${waterAnimKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-cyan-950/60 backdrop-blur-[2px] pointer-events-none select-none"
                >
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0.9 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="absolute w-36 h-36 rounded-full border-2 border-cyan-300/80 bg-cyan-400/15"
                  />
                  <motion.div
                    initial={{ y: -50, scale: 0.5, opacity: 0 }}
                    animate={{ y: 0, scale: 1.1, opacity: 1 }}
                    exit={{ y: 15, opacity: 0 }}
                    className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-b from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl border-2 border-cyan-100/60"
                  >
                    <Droplets className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
                  </motion.div>
                  <span className="mt-3 px-3.5 py-1 rounded-full bg-cyan-900/90 border border-cyan-400/50 text-xs font-bold uppercase tracking-wider text-cyan-100 z-10">
                    Hydration Logged!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Specimen Taxonomy & Primary Vitals (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Header: Identification Badge, Title & Taxonomy */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  Neural Vision Identification
                </span>
                <span className="text-xs text-emerald-300 font-mono font-bold">
                  {currentPlant.matchScore}% Match
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {currentPlant.confidence}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                {currentPlant.name}
              </h2>
              <p className="text-sm italic text-slate-300 font-serif mt-0.5">
                {currentPlant.scientificName}
              </p>
            </div>

            {/* 4 Core Physiological Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Vigor Metric with Ring */}
              <div className="p-3 rounded-2xl bg-[#06140e] border border-emerald-500/20 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="rgba(52, 211, 153, 0.15)"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="#10b981"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={(2 * Math.PI * 18) - (currentPlant.healthScore / 100) * (2 * Math.PI * 18)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-emerald-300 font-mono">
                    {currentPlant.healthScore}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block leading-none">Vigor Index</span>
                  <span className="text-xs font-bold text-emerald-300 truncate block mt-0.5">{currentPlant.mood}</span>
                </div>
              </div>

              {/* Hydration */}
              <div className="p-3 rounded-2xl bg-[#06140e] border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block leading-none">Hydration</span>
                  <span className="text-xs font-bold text-cyan-300 truncate block mt-0.5">{currentPlant.hydrationStatus}</span>
                </div>
              </div>

              {/* Pathology Risk */}
              <div className="p-3 rounded-2xl bg-[#06140e] border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block leading-none">Pathology</span>
                  <span className="text-xs font-bold text-emerald-300 truncate block mt-0.5">{currentPlant.pathologyRisk}</span>
                </div>
              </div>

              {/* Neural Stress */}
              <div className="p-3 rounded-2xl bg-[#06140e] border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block leading-none">Cell Stress</span>
                  <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">{currentPlant.neuralStress}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Inline Nickname Editor */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <input 
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Give plant a nickname (e.g. My Sunshine)"
                  className="w-full bg-[#06140e] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-emerald-500/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                />
                <Edit3 className="w-3.5 h-3.5 text-emerald-400/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={handleSaveToGarden}
                disabled={isSaving || isSaved}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isSaved
                    ? 'bg-[#06140e] text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 active:scale-95'
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved to Sanctuary' : isSaving ? 'Saving...' : 'Save to Garden'}</span>
              </button>

              <button
                onClick={onOpenBioSignature}
                className="py-2 px-3.5 rounded-xl bg-[#0a2318] hover:bg-[#0e2f20] border border-emerald-500/25 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Atom className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bio-Signature</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-[#06140e] hover:bg-[#0a2318] border border-emerald-500/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Share botanical report"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 4. BALANCED 2-COLUMN RESPONSIVE MASTER GRID (No justify-between, items-start) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: Realtime Environmental Intelligence & Care (7 cols) ================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* Microclimate Card */}
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

          {/* Care Prescriptions & Schedule Card */}
          <div className="bg-[#081a12] border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span>Precision Care Prescriptions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time regimen customized for {currentPlant.name}
                </p>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                dynamicCare.isLowHumidity
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                <Activity className="w-3 h-3" />
                {dynamicCare.isLowHumidity ? 'Weather-Adapted (Arid)' : 'Weather-Synchronized'}
              </span>
            </div>

            {/* 4 Core Essential Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Water', val: dynamicCare.waterAdvice, icon: Droplets, color: 'text-cyan-400', isAlert: dynamicCare.isLowHumidity },
                { label: 'Light', val: dynamicCare.lightAdvice, icon: Sun, color: 'text-amber-400', isAlert: false },
                { label: 'Temp', val: dynamicCare.tempAdvice, icon: Thermometer, color: 'text-rose-400', isAlert: false },
                { label: 'Air / RH', val: dynamicCare.airAdvice, icon: Wind, color: 'text-teal-400', isAlert: dynamicCare.isLowHumidity }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl text-center border transition-all ${
                      item.isAlert 
                        ? 'bg-amber-950/25 border-amber-500/35' 
                        : 'bg-[#06140e] border-emerald-500/15'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{item.label}</p>
                    <p className="text-xs font-bold text-slate-200 truncate mt-0.5" title={item.val}>{item.val}</p>
                  </div>
                );
              })}
            </div>

            {/* Narrative Summary Callout */}
            <div className="p-4 bg-[#06140e] border border-emerald-500/15 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-ui">
                {dynamicCare.summary || currentPlant.careInstructions?.detailedText}
              </p>
            </div>

            {/* Fertilizer Schedule Tracker Embedded */}
            <div id="fertilizer-schedule-tracker" className="pt-2">
              <FertilizerScheduleTracker
                plant={currentPlant}
                onFertilize={onFertilizePlant}
              />
            </div>

            {/* Result Feedback Rating */}
            <div className="flex items-center justify-between pt-3 border-t border-emerald-500/15 text-xs">
              <span className="text-slate-400 text-xs">How accurate was this botanical analysis?</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setHasLiked(!hasLiked)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    hasLiked 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title="Helpful result"
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

          {/* Seasonal Gardening Advice Widget */}
          <div id="seasonal-gardening-advice-widget" className="w-full">
            <SeasonalAdviceWidget
              currentPlant={currentPlant}
              gardenPlants={gardenPlants}
              onNavigateToTab={onNavigateToTab}
              onOpenChatWithTopic={onOpenChatWithTopic}
            />
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Telemetry, Analytics & Growth Progress (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-6">

          {/* Health Telemetry & Vigor Trend Analytics */}
          <div className="bg-[#081a12] border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Health Overview</h3>
                  <span className="text-[10px] text-slate-400">Vigor Score Telemetry Trend</span>
                </div>
              </div>

              {/* Period Filter Dropdown / Pills */}
              <div className="flex items-center bg-[#06140e] border border-emerald-500/25 rounded-lg p-0.5 text-[11px]">
                {['All History', 'Recent'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
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
                <div className="space-y-3">
                  {/* Micro stats banner */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#06140e] border border-emerald-500/15 rounded-xl text-xs">
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

                  {/* Recharts Area Graph */}
                  <div className="h-44 w-full relative pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={displayTrend} 
                        margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="plantHealthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.08)" vertical={false} />
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
                              return (
                                <div className="p-2.5 bg-[#081a12] border border-emerald-500/40 rounded-xl text-xs shadow-2xl space-y-1 backdrop-blur-md">
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
                          dot={{ fill: '#10b981', r: 3.5, stroke: '#06140e', strokeWidth: 1.5 }}
                          activeDot={{ r: 5.5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={800}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    <div className="absolute top-1 right-1 px-2.5 py-0.5 rounded-lg bg-[#06140e]/95 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold text-center">
                      <span className="font-mono text-emerald-400">{latestEntry.score}%</span> · {latestEntry.date}
                    </div>
                  </div>

                  {/* 4 Actionable Milestone Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-500/15 text-center">
                    <button
                      onClick={handleMarkAsWatered}
                      className="p-2 rounded-xl bg-[#06140e] hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 transition-all cursor-pointer group text-center"
                      title="Click to water"
                    >
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-cyan-300">
                        <Droplets className={`w-3 h-3 text-cyan-400 ${isWatering ? 'animate-bounce' : ''}`} />
                        <span>Watered</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-200 mt-0.5">
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
                      className="p-2 rounded-xl bg-[#06140e] hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 transition-all cursor-pointer group text-center"
                      title="Inspect fertilizer tracker"
                    >
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-emerald-300">
                        <Sprout className="w-3 h-3 text-emerald-400" />
                        <span>Fertilized</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-200 mt-0.5">
                        {currentPlant.healthOverview.lastFertilized}
                      </p>
                    </button>

                    <div className="p-2 rounded-xl bg-[#06140e] border border-emerald-500/15 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Next Water</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">
                        {currentPlant.healthOverview.nextWatering}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-[#06140e] border border-emerald-500/15 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        <span>Next Prune</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">
                        {currentPlant.healthOverview.nextPruning}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* AI Physiological Assessment & Priority Adjustments Card */}
          <div className="bg-[#081a12] border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div 
              onClick={() => setIsAssessmentOpen(!isAssessmentOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Physiological Assessment</h3>
                  <span className="text-[10px] text-slate-400">Cellular & Morphological Findings</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-emerald-400/80 transition-transform duration-200 ${isAssessmentOpen ? '' : '-rotate-90'}`} />
            </div>

            {isAssessmentOpen && (
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between px-3 py-2 bg-[#06140e] border border-emerald-500/15 rounded-xl text-xs">
                  <span className="text-slate-300 font-medium">Biological State:</span>
                  <span className="text-emerald-400 font-bold">{currentPlant.aiAssessment.mood}</span>
                </div>

                <div className="space-y-2">
                  {currentPlant.aiAssessment.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-[#06140e]/60 border border-emerald-500/10">
                      <span className="text-emerald-400 text-sm leading-none mt-0.5">
                        {idx === 0 ? '🌸' : idx === 1 ? '💧' : '🌿'}
                      </span>
                      <span className="leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>

                {/* Priority Adjustments Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-[#06140e] border border-emerald-500/15 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Soil Hydro</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {currentPlant.priorityAdjustments?.soilHydro}
                    </p>
                  </div>

                  <div className="p-3 bg-[#06140e] border border-emerald-500/15 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Luminance</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {currentPlant.priorityAdjustments?.luminance}
                    </p>
                  </div>
                </div>
              </div>
            )}
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

          {/* Care Timeline & AI Tip Card */}
          <div className="bg-[#081a12] border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Care Milestones</h3>
                  <span className="text-[10px] text-slate-400">Recent Interventions & AI Advice</span>
                </div>
              </div>

              <button 
                onClick={() => onNavigateToTab('calendar')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Full Calendar →
              </button>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-2 text-xs font-medium bg-[#06140e] border border-emerald-500/15 rounded-2xl p-3.5">
              {currentPlant.timeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="text-slate-400 text-[11px] w-14 shrink-0 font-mono">{item.date}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    item.color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                    item.color === 'amber' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                    'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
                  }`} />
                  <span className="text-slate-200">{item.action}</span>
                </div>
              ))}
            </div>

            {/* AI Tip Callout */}
            <div className="p-4 bg-[#06140e] border border-emerald-500/15 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  AI Specialist Tip
                </span>
                <button 
                  onClick={() => onNavigateToTab('guide')}
                  className="text-[11px] font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Species Encyclopedia</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-ui">
                {currentPlant.aiTip.tip}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
