import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Sun, 
  Snowflake, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Sprout, 
  Scissors, 
  Shovel, 
  ShieldAlert, 
  Compass, 
  ChevronRight, 
  Layers, 
  RefreshCw,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  calculateSeasonalAdvice, 
  SeasonalAdviceData, 
  SeasonName,
  getHemisphere
} from '../utils/seasonalAdvice';
import { DashboardPlant } from '../types/botanical';
import { POPULAR_CITY_WEATHER, WeatherData, getCurrentWeather } from '../services/weather';

interface SeasonalAdviceWidgetProps {
  currentPlant?: DashboardPlant;
  gardenPlants?: DashboardPlant[];
  onNavigateToTab?: (tab: any) => void;
  onOpenChatWithTopic?: (topic: string) => void;
}

const STORAGE_KEY_CHECKED = 'floravia_seasonal_tasks_done';
const STORAGE_KEY_CUSTOM_LAT = 'floravia_custom_lat';
const STORAGE_KEY_CUSTOM_CITY = 'floravia_custom_city';

export const SeasonalAdviceWidget: React.FC<SeasonalAdviceWidgetProps> = ({
  currentPlant,
  gardenPlants = [],
  onNavigateToTab,
  onOpenChatWithTopic
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [latitude, setLatitude] = useState<number>(37.7749);
  const [cityName, setCityName] = useState<string>('San Francisco');
  const [currentTemp, setCurrentTemp] = useState<number | undefined>(22);
  const [humidity, setHumidity] = useState<number | undefined>(55);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeSeasonOverride, setActiveSeasonOverride] = useState<SeasonName | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [activePlantingTab, setActivePlantingTab] = useState<'all' | 'vegetable' | 'flower' | 'herb'>('all');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Load checked tasks from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKED);
      if (saved) {
        setCheckedTasks(JSON.parse(saved));
      }
      const savedLat = localStorage.getItem(STORAGE_KEY_CUSTOM_LAT);
      const savedCity = localStorage.getItem(STORAGE_KEY_CUSTOM_CITY);
      if (savedLat) setLatitude(parseFloat(savedLat));
      if (savedCity) setCityName(savedCity);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Sync with current plant weather insight if available
  useEffect(() => {
    if (currentPlant?.weatherInsight) {
      if (currentPlant.weatherInsight.temp !== undefined) {
        setCurrentTemp(currentPlant.weatherInsight.temp);
      }
      if (currentPlant.weatherInsight.humidity !== undefined) {
        setHumidity(currentPlant.weatherInsight.humidity);
      }
      if (currentPlant.weatherInsight.city && !localStorage.getItem(STORAGE_KEY_CUSTOM_CITY)) {
        setCityName(currentPlant.weatherInsight.city);
      }
    }
  }, [currentPlant?.weatherInsight]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        localStorage.setItem(STORAGE_KEY_CUSTOM_LAT, lat.toString());

        // Try getting live weather and city
        try {
          const data: WeatherData = await getCurrentWeather(lat, lon);
          setCityName(data.city);
          setCurrentTemp(data.temp);
          setHumidity(data.humidity);
          localStorage.setItem(STORAGE_KEY_CUSTOM_CITY, data.city);
        } catch {
          setCityName(lat < 0 ? 'Southern Hemisphere (Local)' : 'Northern Hemisphere (Local)');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleSelectPredefinedCity = (city: string, weatherData: WeatherData, lat: number) => {
    setCityName(city);
    setLatitude(lat);
    setCurrentTemp(weatherData.temp);
    setHumidity(weatherData.humidity);
    localStorage.setItem(STORAGE_KEY_CUSTOM_LAT, lat.toString());
    localStorage.setItem(STORAGE_KEY_CUSTOM_CITY, city);
    setIsLocationModalOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
    setCheckedTasks(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CHECKED, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  // Determine active date (allowing simulated seasons)
  let computationDate = new Date(currentDate);
  if (activeSeasonOverride) {
    const isNorth = getHemisphere(latitude) === 'northern';
    if (activeSeasonOverride === 'spring') {
      computationDate = new Date(currentDate.getFullYear(), isNorth ? 3 : 9, 15);
    } else if (activeSeasonOverride === 'summer') {
      computationDate = new Date(currentDate.getFullYear(), isNorth ? 6 : 0, 15);
    } else if (activeSeasonOverride === 'autumn') {
      computationDate = new Date(currentDate.getFullYear(), isNorth ? 9 : 3, 15);
    } else {
      computationDate = new Date(currentDate.getFullYear(), isNorth ? 0 : 6, 15);
    }
  }

  const advice: SeasonalAdviceData = calculateSeasonalAdvice(
    computationDate,
    latitude,
    currentTemp,
    humidity,
    cityName
  );

  const completedCount = advice.tasks.filter(t => checkedTasks[t.id]).length;
  const progressPercent = advice.tasks.length > 0 ? Math.round((completedCount / advice.tasks.length) * 100) : 0;

  // Filter planting matrix items
  const filteredPlanting = activePlantingTab === 'all'
    ? advice.plantingMatrix
    : advice.plantingMatrix.filter(item => item.type === activePlantingTab);

  // Seasonal Theme Styling
  const seasonColors = {
    spring: {
      accent: 'emerald',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/30',
      gradient: 'from-emerald-950/60 via-[#07170f]/90 to-teal-950/40',
      glow: 'bg-emerald-500',
      icon: Sprout
    },
    summer: {
      accent: 'amber',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/30',
      gradient: 'from-amber-950/50 via-[#161208]/90 to-emerald-950/40',
      glow: 'bg-amber-400',
      icon: Sun
    },
    autumn: {
      accent: 'orange',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300',
      badgeBorder: 'border-orange-500/30',
      gradient: 'from-amber-950/60 via-[#18110a]/90 to-rose-950/40',
      glow: 'bg-orange-400',
      icon: Scissors
    },
    winter: {
      accent: 'cyan',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300',
      badgeBorder: 'border-cyan-500/30',
      gradient: 'from-cyan-950/60 via-[#081318]/90 to-blue-950/50',
      glow: 'bg-cyan-400',
      icon: Snowflake
    }
  }[advice.season];

  const SeasonIcon = seasonColors.icon;

  return (
    <div className="w-full bg-[#0b1711] border border-emerald-900/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Background Atmosphere Blur Glow */}
      <div 
        className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-[90px] opacity-20 pointer-events-none transition-all duration-700 ${seasonColors.glow}`} 
      />

      {/* ================= HEADER: Season Header & Live Location Bar ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/30 pb-4 relative z-10">
        
        {/* Left: Season Badge, Title & Sub-phase */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 border ${seasonColors.badgeBg} ${seasonColors.badgeBorder} ${seasonColors.badgeText} shadow-md`}>
            <SeasonIcon className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${seasonColors.badgeBg} ${seasonColors.badgeText} ${seasonColors.badgeBorder} flex items-center gap-1.5`}>
                <Sparkles className="w-3 h-3" />
                Seasonal Botanical Guide
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {advice.monthName} • {advice.subSeasonPhase}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              {advice.seasonDisplayName}
              <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {advice.hemisphere === 'northern' ? 'North Hemisphere' : 'South Hemisphere'}
              </span>
            </h3>
          </div>
        </div>

        {/* Right: Location & Weather Pill + Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Location Chip */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08130d] hover:bg-[#0e2217] text-slate-300 hover:text-white border border-emerald-900/40 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm group"
            title="Change gardening location or climate zone"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{cityName}</span>
            <span className="text-[10px] text-slate-500">({latitude.toFixed(1)}°)</span>
          </button>

          {/* GPS Auto-detect button */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="p-1.5 rounded-xl bg-[#08130d] hover:bg-[#0e2217] text-slate-400 hover:text-emerald-300 border border-emerald-900/40 transition-all cursor-pointer"
            title="Auto-detect location from GPS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Temperature & Humidity Badges */}
          {currentTemp !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#08130d] border border-emerald-900/40 text-slate-200 font-bold">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTemp}°C</span>
            </div>
          )}

          {humidity !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#08130d] border border-emerald-900/40 text-cyan-300 font-bold">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>{humidity}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= SEASON SELECTOR / TIME MACHINE ================= */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 hide-scrollbar text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          Season View:
        </span>

        <div className="flex items-center gap-1.5 bg-[#07120c] p-1 rounded-xl border border-emerald-900/40">
          <button
            onClick={() => setActiveSeasonOverride(null)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeSeasonOverride === null
                ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌱 Current ({advice.monthName})
          </button>

          {(['spring', 'summer', 'autumn', 'winter'] as SeasonName[]).map((s) => {
            const isSel = activeSeasonOverride === s;
            const label = s.charAt(0).toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                onClick={() => setActiveSeasonOverride(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer capitalize ${
                  isSel
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= FROST ALERT & CLIMATE WARNING BANNER ================= */}
      {advice.frostRiskLevel !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 md:p-4 rounded-xl border flex items-start gap-3 relative overflow-hidden ${
            advice.frostRiskLevel === 'high'
              ? 'bg-gradient-to-r from-cyan-950/80 via-[#0a1820]/90 to-blue-950/70 border-cyan-500/50 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
              : 'bg-gradient-to-r from-amber-950/50 via-[#181308]/80 to-emerald-950/40 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            advice.frostRiskLevel === 'high' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            <Snowflake className="w-4 h-4 animate-spin" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                advice.frostRiskLevel === 'high' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-amber-500/30 text-amber-200'
              }`}>
                {advice.frostRiskLevel === 'high' ? 'Active Frost Warning' : 'Seasonal Transition Alert'}
              </span>
              <span className="text-xs font-semibold">
                {advice.frostRiskLevel === 'high' ? 'Protect vulnerable plants today' : 'Autumn / Cold Season preparation'}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-ui">
              {advice.frostRiskNote}
            </p>
          </div>
        </motion.div>
      )}

      {/* ================= PRIMARY ACTION HIGHLIGHTS (e.g. 'Prepare for frost' or 'Start seedlings') ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {advice.primaryHighlights.map((hl, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[#08140e] border border-emerald-900/30 hover:border-emerald-700/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  hl.urgency === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : hl.urgency === 'recommended'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {hl.tag}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{hl.urgency}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1">
                {hl.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-ui">
                {hl.description}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-emerald-900/20 flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span className="text-[11px] text-slate-400">Step {idx + 1} of 3</span>
              {onOpenChatWithTopic && (
                <button
                  onClick={() => onOpenChatWithTopic(`Give me detailed seasonal steps on how to ${hl.title.toLowerCase()} for my garden.`)}
                  className="hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <span>Ask AI Guide</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= 2-COLUMN SECTION: Checklist & What to Plant Matrix ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        
        {/* LEFT (7 Cols): Actionable Seasonal Checklist */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                {advice.monthName} Gardening Checklist
              </h4>
            </div>

            {/* Progress bar info */}
            <span className="text-xs font-semibold text-emerald-400">
              {completedCount}/{advice.tasks.length} Completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-emerald-900/30">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Task Items */}
          <div className="space-y-2">
            {advice.tasks.map((task) => {
              const isChecked = !!checkedTasks[task.id];
              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-900/30 opacity-70'
                      : 'bg-[#08130d] border-emerald-900/30 hover:border-emerald-600/40 hover:bg-[#0c1c14]'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-400 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/20 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                    )}
                  </button>

                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold leading-snug ${
                        isChecked ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}>
                        {task.title}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        task.urgency === 'high' 
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {task.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-ui">
                      {task.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Soil & Foliage Micro Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#08120c] border border-emerald-900/30 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Shovel className="w-3.5 h-3.5" />
                <span>Soil Conditioning Tip</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {advice.soilConditioningTip}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#08120c] border border-emerald-900/30 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Droplets className="w-3.5 h-3.5" />
                <span>Seasonal Foliage Advice</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {advice.foliageAdvice}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT (5 Cols): What to Plant This Month Matrix */}
        <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sprout className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">
                  What to Plant Now
                </h4>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center bg-[#07110c] border border-emerald-900/40 rounded-lg p-0.5 text-[10px]">
                {(['all', 'vegetable', 'flower', 'herb'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePlantingTab(tab)}
                    className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                      activePlantingTab === tab
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Planting Cards */}
            <div className="space-y-2">
              {filteredPlanting.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#08130d] border border-emerald-900/30 hover:border-emerald-800/50 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">({item.type})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-ui leading-relaxed">
                      {item.notes}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.action === 'Start Indoors' 
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                        : item.action === 'Direct Sow' 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : item.action === 'Overwinter'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}>
                      {item.action}
                    </span>
                    <span className="block text-[9px] text-slate-500 mt-0.5 font-medium">
                      {item.bestWeeks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plant-Specific Seasonal Highlight for active plant */}
          {currentPlant && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-[#071710] border border-emerald-800/30 mt-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-emerald-500/20">
                  <img src={currentPlant.imageUrl} alt={currentPlant.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-300">{currentPlant.name}</span>
                    <span className="text-[10px] text-slate-400">in {advice.season}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-ui leading-relaxed mt-0.5">
                    {advice.season === 'autumn'
                      ? `Prepare ${currentPlant.name} for the cooling autumn light. Scale back feeding and check drainage.`
                      : advice.season === 'winter'
                      ? `Keep ${currentPlant.name} away from freezing window drafts and heater vents.`
                      : advice.season === 'spring'
                      ? `Optimal spring vigor window for ${currentPlant.name}! Resume balanced nutrition and fresh potting mix.`
                      : `Peak summer growth phase. Monitor topsoil hydration and protect from extreme midday sun.`
                    }
                  </p>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('calendar')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shrink-0 transition-colors cursor-pointer"
                  title="View full plant care schedule in Calendar"
                >
                  Schedule
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= LOCATION / CITY SWITCHER MODAL ================= */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0b1711] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Select Climate Location</h3>
                </div>
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-ui">
                Seasonal recommendations automatically adjust whether you garden in the Northern or Southern hemisphere and according to local climate conditions.
              </p>

              {/* GPS Auto-detect option */}
              <button
                onClick={() => {
                  handleDetectLocation();
                  setIsLocationModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Use My Exact GPS Location</span>
              </button>

              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Or Choose Global Regional Profiles:
                </span>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {[
                    { name: 'San Francisco', lat: 37.77, weather: POPULAR_CITY_WEATHER['San Francisco'] },
                    { name: 'Denver (Low Humidity)', lat: 39.73, weather: POPULAR_CITY_WEATHER['Denver (Low Humidity)'] },
                    { name: 'Phoenix (Arid Desert)', lat: 33.44, weather: POPULAR_CITY_WEATHER['Phoenix (Arid Desert)'] },
                    { name: 'London (Maritime Temperate)', lat: 51.50, weather: POPULAR_CITY_WEATHER['London'] },
                    { name: 'Tokyo (East Asia)', lat: 35.67, weather: POPULAR_CITY_WEATHER['Tokyo'] },
                    { name: 'Hyderabad (Subtropical)', lat: 17.38, weather: POPULAR_CITY_WEATHER['Hyderabad'] },
                    { name: 'Bangalore (Plateau)', lat: 12.97, weather: POPULAR_CITY_WEATHER['Bangalore'] },
                    { name: 'Sydney (Southern Hemisphere)', lat: -33.86, weather: POPULAR_CITY_WEATHER['Sydney'] }
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleSelectPredefinedCity(item.name, item.weather, item.lat)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                        cityName === item.name
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 font-bold'
                          : 'bg-[#08130d] border-emerald-900/30 text-slate-300 hover:bg-[#0e2118] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.lat < 0 ? 'Southern (Winter now)' : 'Northern (Summer now)'} • {item.weather.temp}°C
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
