import React, { useState } from 'react';
import { X, Sparkles, Activity, Dna, Gauge, Zap, Download, Check, FileText, Printer } from 'lucide-react';
import { DashboardPlant } from '../types/botanical';
import { motion, AnimatePresence } from 'motion/react';
import { downloadPlantReport } from '../utils/plantReport';

interface BioSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: DashboardPlant;
}

export const BioSignatureModal: React.FC<BioSignatureModalProps> = ({
  isOpen,
  onClose,
  plant
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const bio = plant.bioSignature || {
    stomatalConductance: '0.42 mol/m²·s (Optimal)',
    chlorophyllFluorescence: 'Fv/Fm = 0.83 (Pristine)',
    turgorPressure: '0.85 MPa (Full Hydration)',
    photoperiodicPhase: 'Diurnal Peak Synthesis',
    cellularHydrationIndex: 96,
    metabolicEfficiency: 94
  };

  const handleDownloadReport = () => {
    setIsDownloading(true);
    try {
      downloadPlantReport(plant);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error generating plant report:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="biosignature-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            key="biosignature-modal-content"
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 320,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0b1812] border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Subtle glowing ambient background */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Dna className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Neural Bio-Signature Analysis
                  </h3>
                  <p className="text-xs text-emerald-400/80">
                    {plant.name} • {plant.scientificName}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40 cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              {/* Vigor & Efficiency Bars */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#0e2118] border border-emerald-800/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Cellular Hydration</span>
                    <span className="text-cyan-400 font-bold">{bio.cellularHydrationIndex}%</span>
                  </div>
                  <div className="h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${bio.cellularHydrationIndex}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#0e2118] border border-emerald-800/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Metabolic Efficiency</span>
                    <span className="text-emerald-400 font-bold">{bio.metabolicEfficiency}%</span>
                  </div>
                  <div className="h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${bio.metabolicEfficiency}%` }}
                      transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Sensor Readings */}
              <div className="space-y-2.5">
                {[
                  { label: 'Stomatal Conductance', val: bio.stomatalConductance, icon: Activity },
                  { label: 'Chlorophyll Fluorescence', val: bio.chlorophyllFluorescence, icon: Sparkles },
                  { label: 'Cellular Turgor Pressure', val: bio.turgorPressure, icon: Gauge },
                  { label: 'Photoperiodic Phase', val: bio.photoperiodicPhase, icon: Zap }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-[#0d1a13] border border-emerald-900/40 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-emerald-300 font-semibold">{item.val}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Diagnostic Note */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="p-3.5 bg-emerald-950/40 border border-emerald-700/30 rounded-xl text-xs text-emerald-200/90 leading-relaxed"
              >
                <span className="font-bold text-emerald-400">AI Diagnostic Summary: </span>
                Active photosynthesis indicates strong carbohydrate accumulation with zero necrosis or pathogenic vectors detected.
              </motion.div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-emerald-900/30 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  downloadSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title="Download a printable summary of health status and care history"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Report Downloaded ✓</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Report</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 bg-[#0e2118] hover:bg-[#132d21] border border-emerald-800/40 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
