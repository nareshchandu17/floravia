import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, Sun, Thermometer, Droplets, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { getCurrentWeather, WeatherData, getWateringAdvice } from '../services/weather';

interface WeatherWidgetProps {
  plantName: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ plantName }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const data = await getCurrentWeather(latitude, longitude);
            if (mounted) {
              setWeather(data);
              setLoading(false);
            }
          } catch (err) {
            if (mounted) {
              setError(err instanceof Error ? err.message : 'Weather sync failed');
              setLoading(false);
            }
          }
        },
        (err) => {
          if (mounted) {
            setError('Location access denied. Please enable location for weather-based advice.');
            setLoading(false);
          }
        }
      );
    };

    fetchWeather();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-blue-500/10 min-h-[160px]">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Syncing Local Atmosphere...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-red-500/10 min-h-[160px]">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <span className="text-xs text-secondary text-center font-ui">{error}</span>
      </div>
    );
  }

  if (!weather) return null;

  const advice = getWateringAdvice(weather, plantName);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border-blue-500/20 relative overflow-hidden group"
    >
      {/* Background Atmosphere Effect */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-colors duration-1000 ${
        weather.condition.toLowerCase().includes('rain') ? 'bg-blue-500' : 'bg-yellow-500'
      }`} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{weather.city}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface/50 border border-white/5">
            <Thermometer className="w-3 h-3 text-red-400" />
            <span className="text-xs font-bold text-primary">{weather.temp}°C</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface/50 border border-white/5">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-bold text-primary">{weather.humidity}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            {weather.condition.toLowerCase().includes('rain') ? (
              <CloudRain className="w-8 h-8 text-blue-400" />
            ) : (
              <Sun className="w-8 h-8 text-yellow-400 shadow-glow-yellow" />
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted font-bold">Weather Intelligence</div>
            <div className="text-xl font-display text-primary leading-tight">{weather.condition} Conditions</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          advice.intensity === 'high' 
            ? 'bg-red-500/10 border-red-500/20 text-red-200' 
            : advice.intensity === 'medium'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
            : 'bg-green-500/10 border-green-500/20 text-green-200'
        }`}>
          <div className="flex gap-3 items-start">
            <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
              advice.intensity === 'high' ? 'text-red-400' : 'text-blue-400'
            }`} />
            <p className="text-xs font-ui leading-relaxed">
              {advice.advice}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
