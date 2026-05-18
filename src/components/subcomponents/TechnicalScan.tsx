import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sliders, Activity } from 'lucide-react';

interface TechnicalScanProps {
  image: string;
  showTechnicalScan: boolean;
  setShowTechnicalScan: (show: boolean) => void;
}

export const TechnicalScan: React.FC<TechnicalScanProps> = ({ image, showTechnicalScan, setShowTechnicalScan }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative group cursor-crosshair overflow-hidden rounded-3xl border border-white/10 bg-void aspect-[4/3] max-w-lg mx-auto">
      <img src={image} className={`w-full h-full object-cover transition-all duration-700 ${showTechnicalScan ? 'brightness-50 grayscale contrast-125' : 'brightness-100 grayscale-0'}`} alt="Plant Scan" />
      
      <AnimatePresence>
        {showTechnicalScan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-1 bg-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.8)] z-20"
            />
            
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(34,197,94,0.1)_100%)] bg-[size:40px_40px] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(34,197,94,0.15) 1px, transparent 0)' }} />

            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.5 }} 
              className="absolute top-1/4 left-1/3 group/node cursor-help"
            >
              <div className="w-4 h-4 border border-green-400 rounded-full relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                <div className="absolute inset-0 bg-green-400/20 rounded-full" />
              </div>
              <div className="absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none">
                <div className="text-[10px] font-black text-green-400 whitespace-nowrap bg-void/90 px-2 py-1 rounded border border-green-400/30 shadow-glow-green">
                  CHLOROPHYLL_DENSITY: 84%
                </div>
                <div className="mt-1 w-48 opacity-0 group-hover/node:opacity-100 transition-opacity bg-void/90 border border-white/10 p-2 rounded-lg text-[9px] text-secondary leading-tight shadow-xl">
                  Photosynthetic efficiency remains high. No signs of chlorosis detected in primary leaf tissue.
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.8 }} 
              className="absolute bottom-1/3 right-1/4 group/node cursor-help"
            >
              <div className="w-4 h-4 border border-blue-400 rounded-full relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75" />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full" />
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none text-right flex flex-col items-end">
                <div className="text-[10px] font-black text-blue-400 whitespace-nowrap bg-void/90 px-2 py-1 rounded border border-blue-400/30 shadow-glow-blue">
                  HYDRATION_INDEX: OPTIMAL
                </div>
                <div className="mt-1 w-48 opacity-0 group-hover/node:opacity-100 transition-opacity bg-void/90 border border-white/10 p-2 rounded-lg text-[9px] text-secondary leading-tight text-left shadow-xl">
                  Stomatal conductance indicates efficient transpiration. Root pressure matches environmental demand.
                </div>
              </div>
            </motion.div>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-green-400 tracking-[0.2em]">
                  <Activity className="w-3 h-3 animate-pulse" /> BIO_DATA_SYNCRONIZATION...
                </div>
                <div className="w-32 h-1.5 bg-green-900/40 rounded-full overflow-hidden border border-green-500/20">
                  <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-green-400 shadow-glow-green" />
                </div>
              </div>
              <div className="text-[10px] font-mono text-green-500/60 leading-none text-right">
                VER: FLORAVIA_v4.2<br />
                ENGINE: BOTANICAL_CORE<br />
                UID: {Math.random().toString(36).substring(7).toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setShowTechnicalScan(!showTechnicalScan)}
        className="absolute top-6 right-6 z-30 p-3 rounded-2xl bg-void/80 border border-white/10 text-primary hover:bg-void transition-all hover:scale-110 group/btn"
      >
        {showTechnicalScan ? <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20 shadow-glow-yellow" /> : <Sliders className="w-5 h-5 group-hover/btn:text-green-400" />}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-void/90 border border-white/10 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
          {showTechnicalScan ? 'Exit Technical Mode' : 'Analyze Bio-Signature'}
        </span>
      </button>
    </motion.div>
  );
};
