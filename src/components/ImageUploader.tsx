import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle2, Circle, Zap, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, CompressionResult } from '../utils/imageCompressor';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  loadingText?: string;
  loadingSubtext?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  isLoading,
  title = "Identify a Plant",
  subtitle = "Take a photo or drag & drop an image",
  loadingText = "Analyzing your plant...",
  loadingSubtext = "Our AI expert is identifying the species"
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [compressError, setCompressError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          if (p < 30) return p + 1.5; // Compressing & Uploading
          if (p < 60) return p + 0.8; // AI Vision Scan
          if (p < 85) return p + 0.4; // Database cross-reference
          if (p < 98) return p + 0.1; // Generating insights
          return p;
        });
      }, 50);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCompressError('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    setCompressError(null);
    setIsCompressing(true);

    try {
      // 1. Compress & downsample to max 1600px, target ~800KB
      const result = await compressImage(file, {
        maxDimension: 1600,
        targetMaxSizeBytes: 800 * 1024,
        initialQuality: 0.85,
        minQuality: 0.65
      });

      setCompressionStats(result);
      setPreview(result.base64);
      onImageSelected(result.base64);
    } catch (err) {
      console.warn('Image compression fallback:', err);
      // Graceful fallback to FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0];
    } else {
      file = e.target.files?.[0];
    }

    if (file) {
      processFile(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setCompressionStats(null);
    setCompressError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const steps = [
    { threshold: 0, text: compressionStats ? `Optimized (${compressionStats.formattedCompressedSize})` : "Optimizing image (~1600px)" },
    { threshold: 30, text: "AI neural vision scanning foliage" },
    { threshold: 60, text: "Cross-referencing botanical pathology library" },
    { threshold: 85, text: "Compiling physiological health report" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload-prompt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isDragging ? 1.02 : 1,
              borderColor: isDragging ? 'rgba(74, 222, 128, 0.6)' : 'rgba(74, 222, 128, 0.3)'
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e: any) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleFileChange}
            className={`border-2 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 group shadow-[inset_0_0_40px_rgba(34,197,94,0.03)] hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] ${isDragging ? 'bg-green-500/10' : 'bg-[#0b1812]/50 hover:bg-[#0e2118]/80 backdrop-blur-sm'}`}
          >
            <motion.div 
              animate={{ y: isDragging ? -10 : 0 }}
              className="bg-emerald-950/60 border border-emerald-500/30 p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-emerald-400 relative z-10" />
              <div className="absolute inset-0 bg-emerald-500/15 rounded-2xl scale-0 group-hover:scale-150 transition-transform opacity-0 group-hover:opacity-100 duration-500" />
            </motion.div>
            
            <div className="text-center space-y-1">
              <p className="text-lg font-ui font-bold text-white">{title}</p>
              <p className="text-xs md:text-sm text-emerald-200/70">{subtitle}</p>
            </div>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Dual Action Buttons: Instant Camera & Gallery Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full max-w-sm">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#12271d] hover:bg-[#183527] border border-emerald-500/30 text-emerald-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Compression Engine Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300/80">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Auto-optimized to ~1600px &lt;800KB for sub-2s neural processing</span>
            </div>

            {compressError && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{compressError}</p>
            )}

            {isCompressing && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compressing & downsampling photo...</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-square md:aspect-video bg-[#050b08] border border-emerald-500/30"
          >
            <img 
              src={preview} 
              alt="Plant preview" 
              className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'scale-105 brightness-50' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            
            {!isLoading && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />}
            
            {/* Compression Stats Badge */}
            {compressionStats && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 sm:right-auto bg-[#07130d]/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs shadow-xl z-20"
              >
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-emerald-300 font-bold">Optimized for AI:</span>
                  <span className="text-slate-300">
                    {compressionStats.formattedOriginalSize} → <strong className="text-cyan-400">{compressionStats.formattedCompressedSize}</strong>
                  </span>
                  {compressionStats.compressionRatio > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                      -{compressionStats.compressionRatio}% in {compressionStats.durationMs}ms
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            <button
              onClick={clearPreview}
              disabled={isLoading}
              className="absolute top-4 right-4 bg-[#07130d]/80 hover:bg-rose-950/80 backdrop-blur-md p-2.5 rounded-full text-slate-300 hover:text-white border border-white/10 hover:border-rose-500/40 transition-colors shadow-lg disabled:opacity-0 z-50 cursor-pointer"
              title="Remove photo and upload new"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoading && (
              <>
                {/* Simulated AI Laser Scanner Overlay */}
                <motion.div 
                  className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_30px_5px_rgba(74,222,128,0.8)] z-10"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                >
                   <div className="absolute inset-0 bg-emerald-400/20 blur-sm h-12 -top-6" />
                </motion.div>
                
                {/* Targeting reticles */}
                <div className="absolute inset-8 border border-emerald-500/20 rounded-xl pointer-events-none z-0">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
                  <div className="bg-[#050b08]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/40 text-white min-w-[280px] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center justify-between mb-4 border-b border-emerald-900/40 pb-3">
                      <span className="text-emerald-400 font-mono text-2xl font-bold">
                        {Math.round(progress)}%
                      </span>
                      <span className="text-xs uppercase tracking-[0.15em] text-emerald-400/80 font-bold">
                        Processing
                      </span>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, idx) => {
                        const isActive = progress >= step.threshold && (idx === steps.length - 1 || progress < steps[idx + 1].threshold);
                        const isComplete = idx < steps.length - 1 && progress >= steps[idx + 1].threshold;
                        
                        return (
                          <div key={idx} className={`flex items-center gap-3 text-xs transition-all duration-300 ${isActive ? 'text-white translate-x-2' : isComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : isActive ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="shrink-0"
                              >
                                <Circle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                              </motion.div>
                            ) : (
                              <Circle className="w-4 h-4 shrink-0" />
                            )}
                            <span className={isActive ? 'font-bold text-emerald-300' : ''}>{step.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

