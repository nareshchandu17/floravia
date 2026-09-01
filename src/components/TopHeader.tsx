import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  Cloud, 
  Droplets, 
  Bell, 
  Menu, 
  X, 
  Mic, 
  MicOff, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Check,
  Sprout,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useVoice } from '../hooks/useVoice';
import { DashboardPlant } from '../types/botanical';

interface TopHeaderProps {
  onSearch: (query: string) => void;
  selectedCity: string;
  onChangeCity: (city: string) => void;
  weatherTemp: number;
  weatherHumidity: number;
  onOpenNotifications: () => void;
  onToggleMobileSidebar?: () => void;
  gardenPlants?: DashboardPlant[];
  onSelectPlant?: (plant: DashboardPlant) => void;
  onOpenAuthModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onSearch,
  selectedCity,
  onChangeCity,
  weatherTemp,
  weatherHumidity,
  onOpenNotifications,
  onToggleMobileSidebar,
  gardenPlants = [],
  onSelectPlant,
  onOpenAuthModal
}) => {
  const { user, isEmailVerified } = useAuth();
  const { notifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [lastVoiceMatch, setLastVoiceMatch] = useState<DashboardPlant | null>(null);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const {
    isRecording,
    isTranscribing,
    recordingDuration,
    audioLevel,
    interimTranscript,
    voiceError,
    setVoiceError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoice();

  const unreadCount = notifications.filter(n => !n.read).length;

  const popularCities = [
    'Bhimavaram',
    'Phoenix (Arid Desert)',
    'Denver (Low Humidity)',
    'Dubai (Dry Heat)',
    'Hyderabad',
    'Bangalore',
    'San Francisco',
    'London',
    'Tokyo',
    'Singapore',
    'Sydney'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceTrigger = async () => {
    if (isRecording) {
      await handleStopVoiceSearch();
    } else {
      setVoiceError(null);
      setLastVoiceMatch(null);
      await startRecording();
    }
  };

  const handleStopVoiceSearch = async () => {
    const transcribedText = await stopRecording();
    if (transcribedText && transcribedText.trim()) {
      const cleanQuery = transcribedText.trim();
      setSearchQuery(cleanQuery);
      onSearch(cleanQuery);

      // Try matching against saved garden plants
      const match = gardenPlants.find(p => 
        p.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        p.scientificName.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        (p.nickname && p.nickname.toLowerCase().includes(cleanQuery.toLowerCase()))
      );

      if (match) {
        setLastVoiceMatch(match);
        setVoiceToast(`Found "${match.name}" in your garden`);
        if (onSelectPlant) {
          onSelectPlant(match);
        }
      } else {
        setVoiceToast(`Searched for "${cleanQuery}"`);
      }

      setTimeout(() => {
        setVoiceToast(null);
        setLastVoiceMatch(null);
      }, 4000);
    }
  };

  const handleCancelVoice = () => {
    cancelRecording();
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-[#070f0b]/90 backdrop-blur-md border-b border-emerald-900/20 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Menu Trigger + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl relative">
        {onToggleMobileSidebar && (
          <button 
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-950/40 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* ACTIVE VOICE RECORDING SEARCH BAR */}
        {isRecording ? (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-[#0b1f16] border border-cyan-500/50 rounded-full px-3.5 py-1.5 flex items-center justify-between gap-2 shadow-[0_0_25px_rgba(6,182,212,0.25)] relative overflow-hidden"
          >
            {/* Pulsing Recording Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-mono font-bold text-red-400">
                {formatDuration(recordingDuration)}
              </span>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-0.5 h-4 px-1 shrink-0">
              {[0.6, 1.3, 0.9, 1.8, 1.2, 0.7].map((factor, idx) => {
                const height = Math.max(4, Math.min(16, (audioLevel / 5) * factor + 3));
                return (
                  <motion.div
                    key={idx}
                    animate={{ height }}
                    transition={{ duration: 0.1 }}
                    className="w-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                  />
                );
              })}
            </div>

            {/* Spoken Text / Placeholder */}
            <div className="flex-1 min-w-0 px-2 text-left">
              <p className="text-xs text-cyan-200 truncate italic">
                {interimTranscript ? `"${interimTranscript}"` : "Listening... Speak a plant name (e.g., 'Monstera')"}
              </p>
            </div>

            {/* Voice Actions: Cancel & Search */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCancelVoice}
                className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                title="Cancel voice search"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleStopVoiceSearch}
                className="px-2.5 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                title="Search spoken query"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* STANDARD SEARCH INPUT WITH VOICE SEARCH TRIGGER BUTTON */
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search plants, symptoms, or click mic to speak..."
              className="w-full bg-[#0d1c15] border border-emerald-900/40 rounded-full pl-10 pr-16 py-2 text-xs md:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Clear Query Button */}
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); onSearch(''); }}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* VOICE SEARCH MIC TRIGGER BUTTON */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handleVoiceTrigger}
                className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  isTranscribing 
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/50' 
                    : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20'
                }`}
                title="Voice Search (Speak plant name)"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </form>
        )}

        {/* VOICE TRANSCRIBING OVERLAY / FEEDBACK TOAST */}
        <AnimatePresence>
          {isTranscribing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full left-0 mt-2 z-50 px-3 py-1.5 bg-[#0b1f16] border border-cyan-500/40 rounded-xl shadow-xl flex items-center gap-2 text-cyan-200 text-xs"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Transcribing voice query with Gemini AI...</span>
            </motion.div>
          )}

          {voiceToast && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full left-0 mt-2 z-50 px-3.5 py-2 bg-[#091a12] border border-emerald-500/40 rounded-xl shadow-2xl flex items-center gap-2 text-emerald-200 text-xs backdrop-blur-md"
            >
              <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{voiceToast}</span>
              {lastVoiceMatch && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold ml-1">
                  Matched
                </span>
              )}
            </motion.div>
          )}

          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full left-0 mt-2 z-50 px-3.5 py-2 bg-red-950/90 border border-red-500/40 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-red-300 text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{voiceError}</span>
              </div>
              <button 
                onClick={() => setVoiceError(null)}
                className="p-1 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Location, Weather, Notifications, Profile Avatar */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        {/* Location Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-950/30 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[100px]">{selectedCity}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showCityPicker && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-[#0e1d16] border border-emerald-800/40 rounded-xl shadow-2xl p-2 z-50">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 py-1">
                Select Location
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onChangeCity(city);
                      setShowCityPicker(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      selectedCity === city 
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold' 
                        : 'text-slate-300 hover:bg-emerald-950/40'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weather Indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-300 bg-[#0d1c15] px-3 py-1.5 rounded-full border border-emerald-900/30">
          <div className="flex items-center gap-1 text-slate-200">
            <Cloud className="w-3.5 h-3.5 text-slate-300" />
            <span>{weatherTemp}°C</span>
          </div>
          <div className="w-px h-3 bg-emerald-900/50" />
          <div className="flex items-center gap-1 text-cyan-400">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{weatherHumidity}%</span>
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button 
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-[#0d1c15] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#070f0b] ring-1 ring-rose-400 animate-pulse" />
          )}
        </button>

        {/* Header Avatar / Auth Trigger */}
        <div className="shrink-0">
          {user ? (
            <button
              onClick={onOpenAuthModal}
              className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              title={isEmailVerified ? `${user.displayName || user.email} (Verified)` : 'Click to complete email verification'}
            >
              <img 
                src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                alt="User avatar" 
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              />
              {!isEmailVerified && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 border-2 border-[#070f0b] rounded-full" />
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
