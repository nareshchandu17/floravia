import React, { useState } from 'react';
import { 
  Cloud, 
  Sun, 
  Droplets, 
  Wind, 
  Thermometer, 
  Gauge, 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WeatherData, 
  POPULAR_CITY_WEATHER, 
  getMicroclimateTailoredAdvice,
  MicroclimateAdvice 
} from '../services/weather';

interface MicroclimateCardProps {
  weather?: WeatherData;
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  plantName?: string;
  onQuickMist?: () => void;
  isMisting?: boolean;
}

export const MicroclimateCard: React.FC<MicroclimateCardProps> = ({
  weather,
  selectedCity = 'Bhimavaram',
  onChangeCity,
  plantName = 'your plant',
  onQuickMist,
  isMisting = false
}) => {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [localMisted, setLocalMisted] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Resolve current active weather data:
  // Prefer provided weather object, fallback to POPULAR_CITY_WEATHER, or default to Bhimavaram
  const activeWeather: WeatherData = weather || POPULAR_CITY_WEATHER[selectedCity] || {
    city: selectedCity,
    temp: 29,
    humidity: 73,
    condition: 'Clouds Conditions',
    icon: '04d'
  };

  const advice: MicroclimateAdvice = getMicroclimateTailoredAdvice(activeWeather, plantName);

  const popularCityList = Object.keys(POPULAR_CITY_WEATHER);

  const handleSelectCity = (city: string) => {
    if (onChangeCity) {
      onChangeCity(city);
    }
    setShowCityDropdown(false);
  };

  const handleMistClick = () => {
    if (onQuickMist) {
      onQuickMist();
    } else {
      setLocalMisted(true);
      setTimeout(() => setLocalMisted(false), 2500);
    }
    setActionFeedback("Foliar turgor restored via localized misting.");
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleVentilationAction = () => {
    setActionFeedback("Ventilation protocol acknowledged. Ensure 15–20 cm space between plant pots.");
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const isHighHumidity = activeWeather.humidity >= 70;
  const isHighHeat = activeWeather.temp >= 30;

  return (
    <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute -right-16 -top-16 w-52 h-52 rounded-full blur-[80px] pointer-events-none bg-emerald-500/15" 
      />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-white tracking-tight">
                Micro-climate
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold uppercase">
                Live Sensor Telemetry
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-ui mt-0.5">
              Atmospheric guidance tailored to your local environment
            </p>
          </div>
        </div>

        {/* City Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#071610] hover:bg-[#0c261b] border border-emerald-500/25 text-xs font-semibold text-emerald-200 transition-all cursor-pointer shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[130px]">{activeWeather.city}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* City Selection Dropdown */}
          <AnimatePresence>
            {showCityDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-64 bg-[#0b1f16] border border-emerald-500/30 rounded-2xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto"
              >
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider border-b border-emerald-500/15 mb-1 flex items-center justify-between">
                  <span>Select Micro-climate Location</span>
                  <X 
                    className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-white" 
                    onClick={() => setShowCityDropdown(false)} 
                  />
                </div>
                <div className="space-y-1">
                  {popularCityList.map((c) => {
                    const cData = POPULAR_CITY_WEATHER[c];
                    const isSelected = c === activeWeather.city;
                    return (
                      <button
                        key={c}
                        onClick={() => handleSelectCity(c)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/35'
                            : 'text-slate-300 hover:bg-emerald-500/15 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block truncate">{c}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {cData.condition}
                          </span>
                        </div>
                        <div className="text-right shrink-0 font-mono text-[11px]">
                          <span className="text-white">{cData.temp}°C</span>
                          <span className="text-emerald-300 ml-1.5">{cData.humidity}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Prominent Tailored Advice Hero Banner */}
      <div 
        className="p-4 rounded-2xl border mb-4 relative overflow-hidden transition-all bg-gradient-to-r from-[#0c2419] to-[#0b291d] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
      >
        <div className="flex items-start gap-3.5">
          <div 
            className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          >
            {isHighHeat ? (
              <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : isHighHumidity ? (
              <Wind className="w-5 h-5 text-emerald-300 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm md:text-base font-display font-bold text-white tracking-wide">
                {advice.headline}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                advice.urgencyLevel === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {advice.urgencyLevel === 'warning' ? 'Immediate Advisory' : 'Microclimate Alert'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-ui">
              {advice.secondaryAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Atmospheric Telemetry Dials Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Temperature */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Ambient Temp</span>
          </div>
          <p className="text-base font-mono font-bold text-white">
            {activeWeather.temp}°C
          </p>
          <span className={`text-[9px] font-bold block truncate uppercase ${
            isHighHeat ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isHighHeat ? 'Elevated Heat' : 'Comfort Range'}
          </span>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-emerald-400" />
            <span>Relative Humidity</span>
          </div>
          <p className="text-base font-mono font-bold text-emerald-300">
            {activeWeather.humidity}%
          </p>
          <span className={`text-[9px] font-bold block truncate uppercase ${
            isHighHumidity ? 'text-emerald-300' : activeWeather.humidity < 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isHighHumidity ? 'High Moisture' : activeWeather.humidity < 40 ? 'Arid Air' : 'Balanced RH'}
          </span>
        </div>

        {/* Vapor Pressure Deficit */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>VPD Index</span>
          </div>
          <p className="text-base font-mono font-bold text-emerald-200">
            {advice.vpdIndex}
          </p>
          <span className={`text-[9px] font-bold block truncate uppercase ${
            advice.vpdStatus === 'optimal' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {advice.vpdStatus === 'optimal' ? 'Optimal Transpiration' : advice.vpdStatus === 'low' ? 'Sluggish Gas Exchange' : 'Evaporative Tension'}
          </span>
        </div>

        {/* Solar Radiation */}
        <div className="p-3 rounded-xl bg-[#071610] border border-emerald-500/15 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Solar Intensity</span>
          </div>
          <p className="text-xs font-mono font-bold text-white pt-0.5 truncate">
            {isHighHeat ? 'High Irradiance' : 'Filtered / Mild'}
          </p>
          <span className={`text-[9px] font-bold block truncate uppercase ${
            isHighHeat ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isHighHeat ? 'Avoid Direct Light' : 'Diffused Light'}
          </span>
        </div>
      </div>

      {/* Tailored Action Recommendations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {advice.actionItems.map((item, idx) => {
          const isSunlight = item.category === 'Sunlight';
          const isVentilation = item.category === 'Ventilation';

          return (
            <div 
              key={idx} 
              className="p-3.5 rounded-xl border transition-all bg-[#071610] border-emerald-500/15"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {isSunlight ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : isVentilation ? (
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  ) : item.category === 'Hydration' ? (
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {item.category} Protocol
                  </span>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  item.isWarning 
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                }`}>
                  {item.badge}
                </span>
              </div>

              <p className="text-xs font-semibold text-white mb-1">
                {item.headline}
              </p>
              
              <p className="text-[11px] text-slate-400 leading-relaxed font-ui">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Actionable Execution Bar & Feedback */}
      <div className="pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400">
            Synchronized with <span className="text-emerald-400 font-semibold">{activeWeather.city}</span> ambient conditions
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isHighHumidity && (
            <button
              type="button"
              onClick={handleVentilationAction}
              className="px-3 py-1.5 rounded-xl bg-[#071610] hover:bg-[#0c261b] border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acknowledge Airflow</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleMistClick}
            disabled={isMisting}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              localMisted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            <Droplets className={`w-3.5 h-3.5 ${isMisting ? 'animate-bounce' : ''}`} />
            <span>{localMisted ? 'Foliage Misted ✓' : 'Quick Mist Foliage'}</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-2.5 rounded-xl bg-[#071610] border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-ui">{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
