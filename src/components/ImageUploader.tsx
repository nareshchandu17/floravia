import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files?.[0];
    } else {
      file = e.target.files?.[0];
    }

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const steps = [
    { threshold: 0, text: "Optimizing image" },
    { threshold: 30, text: "AI scanning foliage" },
    { threshold: 60, text: "Cross-referencing global database" },
    { threshold: 85, text: "Finalizing expert report" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
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
            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group shadow-[inset_0_0_40px_rgba(34,197,94,0.03)] hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] ${isDragging ? 'bg-green-500/10' : 'bg-surface/30 hover:bg-surface backdrop-blur-sm'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <motion.div 
              animate={{ y: isDragging ? -10 : 0 }}
              className="bg-elevated border border-green-500/20 p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative"
            >
              <Camera className="w-8 h-8 text-green-400 relative z-10" />
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl scale-0 group-hover:scale-150 transition-transform opacity-0 group-hover:opacity-100 duration-500" />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-ui font-semibold text-primary">{title}</p>
              <p className="text-sm text-secondary">{subtitle}</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button className="mt-4 bg-gradient-to-r from-green-500 to-teal-500 text-void px-6 py-3 rounded-xl font-semibold hover:from-green-400 hover:to-teal-400 transition-colors flex items-center gap-2 shadow-glow-green">
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-square md:aspect-video bg-void border border-green-500/20"
          >
            <img 
              src={preview} 
              alt="Plant preview" 
              className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'scale-105 brightness-50' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            
            {!isLoading && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />}
            
            <button
              onClick={clearPreview}
              disabled={isLoading}
              className="absolute top-4 right-4 bg-elevated/80 backdrop-blur-md p-2.5 rounded-full text-primary hover:bg-surface border border-white/10 transition-colors shadow-lg disabled:opacity-0 z-50"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoading && (
              <>
                {/* Simulated AI Laser Scanner Overlay */}
                <motion.div 
                  className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_30px_5px_rgba(74,222,128,0.8)] z-10"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                >
                   <div className="absolute inset-0 bg-green-400/20 blur-sm h-12 -top-6" />
                </motion.div>
                
                {/* Targeting reticles */}
                <div className="absolute inset-8 border border-green-500/20 rounded-xl pointer-events-none z-0">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-green-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-green-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-green-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-green-400 rounded-br-xl" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="bg-void/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30 text-primary min-w-[280px] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <span className="text-green-400 font-mono text-2xl font-bold">
                        {Math.round(progress)}%
                      </span>
                      <span className="text-xs font-ui uppercase tracking-[0.15em] text-secondary font-semibold">
                        Processing
                      </span>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, idx) => {
                        const isActive = progress >= step.threshold && (idx === steps.length - 1 || progress < steps[idx + 1].threshold);
                        const isComplete = idx < steps.length - 1 && progress >= steps[idx + 1].threshold;
                        
                        return (
                          <div key={idx} className={`flex items-center gap-3 text-sm transition-all duration-300 font-ui ${isActive ? 'text-primary translate-x-2' : isComplete ? 'text-green-400' : 'text-muted'}`}>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : isActive ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <Circle className="w-4 h-4 text-green-400 fill-green-400/20" />
                              </motion.div>
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                            <span className={isActive ? 'font-medium text-gradient' : ''}>{step.text}</span>
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
