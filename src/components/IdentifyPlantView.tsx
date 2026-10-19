import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  UploadCloud, 
  Upload, 
  Sparkles, 
  Leaf, 
  BookOpen, 
  Calendar, 
  Check, 
  X, 
  ChevronRight, 
  ArrowRight,
  Loader2,
  Lock,
  Image as ImageIcon
} from 'lucide-react';
import { compressImage, CompressionResult } from '../utils/imageCompressor';

interface IdentifyPlantViewProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
  isAuthenticated?: boolean;
  onUnauthorized?: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const IdentifyPlantView: React.FC<IdentifyPlantViewProps> = ({
  onImageSelected,
  isLoading,
  isAuthenticated = true,
  onUnauthorized,
  onNavigateToTab
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          if (p < 30) return p + 2;
          if (p < 60) return p + 1;
          if (p < 85) return p + 0.5;
          if (p < 96) return p + 0.2;
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
      setCompressError('Please upload a valid image file (JPG, PNG, or HEIC).');
      return;
    }

    setCompressError(null);
    setIsCompressing(true);

    try {
      const result = await compressImage(file, {
        maxDimension: 1600,
        targetMaxSizeBytes: 800 * 1024,
        initialQuality: 0.85,
        minQuality: 0.65
      });
      setPreview(result.base64);
      onImageSelected(result.base64);
    } catch (err) {
      console.warn('Compression fallback:', err);
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

  const handleTriggerUpload = (type: 'file' | 'camera') => {
    if (!isAuthenticated) {
      onUnauthorized?.();
      return;
    }
    if (type === 'camera') {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isAuthenticated) {
      onUnauthorized?.();
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Convert remote sample image to base64 so user can test-identify with one click
  const handleSampleSelect = async (imageUrl: string) => {
    if (!isAuthenticated) {
      onUnauthorized?.();
      return;
    }
    try {
      setIsCompressing(true);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'sample-plant.jpg', { type: 'image/jpeg' });
      await processFile(file);
    } catch (e) {
      console.error('Failed to load sample plant image:', e);
    } finally {
      setIsCompressing(false);
    }
  };

  const commonPlants = [
    {
      name: 'Monstera deliciosa',
      tag: 'Iconic Tropical',
      image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Snake Plant',
      tag: 'Hardy • Low Light',
      image: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Golden Pothos',
      tag: 'Trailing Vine',
      image: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Peace Lily',
      tag: 'Flowering Indoor',
      image: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Rubber Tree',
      tag: 'Glossy Foliage',
      image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Spider Plant',
      tag: 'Pet Safe',
      image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Fiddle Leaf Fig',
      tag: 'Dramatic Trees',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Jade Plant',
      tag: 'Succulent',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Hidden Native Inputs */}
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

      {/* ======================================================== */}
      {/* 1. HERO SECTION: Title, Feature Badges, Plant Hero & Upload Box */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column (Heading + Badges + Plant Image) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span>PLANT IDENTIFICATION</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          {/* Headline (Serif & Elegant, exactly matching screenshot) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.15]">
            Identify plants. <br />
            <span className="text-[#a7f3d0]">Understand their needs.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Upload a photo of any leaf, flower, or whole plant. Floravia will identify the likely species and give you simple care guidance to help it thrive.
          </p>

          {/* 4 Feature Pills Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0d2218] border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300 leading-tight">
                Likely plant identification
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0d2218] border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300 leading-tight">
                Easy care instructions
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0d2218] border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300 leading-tight">
                Add to your garden & reminders
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0d2218] border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300 leading-tight">
                Powered by advanced AI
              </span>
            </div>
          </div>

          {/* Left Plant Hero Photo with Handwritten Annotation */}
          <div className="relative pt-4">
            <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-gradient-to-t from-black/80 to-transparent shadow-2xl border border-emerald-500/20 group">
              <img 
                src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1200&q=85" 
                alt="Lush Monstera Plant"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06140e] via-transparent to-black/20 pointer-events-none" />

              {/* Handwritten note & arrow overlay (matching screenshot) */}
              <div className="absolute top-6 right-8 pointer-events-none select-none text-right">
                <p className="font-serif italic text-emerald-200 text-sm sm:text-base drop-shadow-md tracking-wide">
                  A clearer photo <br />
                  gets better results
                </p>
                {/* Curved Arrow SVG pointing towards the leaves */}
                <svg 
                  className="w-12 h-12 text-emerald-300/80 ml-auto mt-1 transform rotate-12 drop-shadow" 
                  viewBox="0 0 50 50" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M 38 10 C 25 15, 15 25, 18 40" />
                  <polyline points="12,34 18,40 24,35" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Card */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md ${
              isDragging 
                ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]' 
                : 'border-emerald-500/30 bg-[#091a13]/80 hover:border-emerald-400/50 hover:bg-[#0c221a]/90'
            }`}
          >
            {/* Center Upload Cloud Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#102d20] border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-5 shadow-lg group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            {/* Title & Drag prompt */}
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Upload a plant photo
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Drag and drop an image here, or{' '}
              <button 
                type="button"
                onClick={() => handleTriggerUpload('file')}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
              >
                choose a file
              </button>
            </p>

            {/* Action Buttons: Choose a photo (mint solid) & Use camera (outlined dark) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs mb-5">
              <button
                type="button"
                onClick={() => handleTriggerUpload('file')}
                disabled={isCompressing || isLoading}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#6ee7b7] hover:bg-[#34d399] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>Choose a photo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerUpload('camera')}
                disabled={isCompressing || isLoading}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0d2218] hover:bg-[#133324] border border-emerald-500/40 text-emerald-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Use camera</span>
              </button>
            </div>

            {/* Supported formats footnote */}
            <p className="text-[11px] text-slate-400 tracking-wide">
              JPG, PNG, or HEIC • Max 10MB
            </p>

            {/* Auth Notice if not logged in */}
            {!isAuthenticated && (
              <div 
                onClick={() => onUnauthorized?.()}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-500/25 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign in recommended to save to My Garden</span>
              </div>
            )}

            {/* Error Message */}
            {compressError && (
              <p className="text-xs text-rose-400 mt-3 font-medium bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-500/30">
                {compressError}
              </p>
            )}

            {/* Live Loading Overlay while scanning */}
            <AnimatePresence>
              {(isCompressing || isLoading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#071710]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center justify-center z-20 space-y-4"
                >
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                      <Leaf className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-white">
                      {isCompressing ? 'Preparing Image...' : 'Analyzing Botanical Signature...'}
                    </p>
                    <p className="text-xs text-emerald-300/80">
                      Identifying species, health indicators, and care essentials
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className="bg-emerald-400 h-full rounded-full" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TIPS FOR THE BEST RESULTS (4 Cards with Green/Red Badges) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Tips for the best results
            </h3>
          </div>
          <button 
            onClick={() => onNavigateToTab('guide')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View full guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tip 1: Clear leaf */}
          <div className="group rounded-2xl bg-[#091a12] border border-emerald-500/20 overflow-hidden hover:border-emerald-500/40 transition-all shadow-md">
            <div className="relative h-28 sm:h-36 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80" 
                alt="Clear, well-lit leaf"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <div className="p-3.5 space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white">Clear, well-lit leaf</h4>
              <p className="text-[11px] text-slate-400">Shows shape and details</p>
            </div>
          </div>

          {/* Tip 2: Include flowers */}
          <div className="group rounded-2xl bg-[#091a12] border border-emerald-500/20 overflow-hidden hover:border-emerald-500/40 transition-all shadow-md">
            <div className="relative h-28 sm:h-36 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80" 
                alt="Include flowers if possible"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <div className="p-3.5 space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white">Include flowers if possible</h4>
              <p className="text-[11px] text-slate-400">Helps with accurate ID</p>
            </div>
          </div>

          {/* Tip 3: Whole plant */}
          <div className="group rounded-2xl bg-[#091a12] border border-emerald-500/20 overflow-hidden hover:border-emerald-500/40 transition-all shadow-md">
            <div className="relative h-28 sm:h-36 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80" 
                alt="Whole plant photo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <div className="p-3.5 space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white">Whole plant photo</h4>
              <p className="text-[11px] text-slate-400">Gives more context</p>
            </div>
          </div>

          {/* Tip 4: Avoid blurry (Red X badge) */}
          <div className="group rounded-2xl bg-[#091a12] border border-rose-500/20 overflow-hidden hover:border-rose-500/40 transition-all shadow-md">
            <div className="relative h-28 sm:h-36 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=40" 
                alt="Avoid blurry or dark photos"
                className="w-full h-full object-cover blur-[2px] opacity-75 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <div className="p-3.5 space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white">Avoid blurry or dark photos</h4>
              <p className="text-[11px] text-slate-400">Harder to identify</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. RECENTLY IDENTIFIED (3 Horizontal Cards) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Recently Identified
            </h3>
          </div>
          <button 
            onClick={() => onNavigateToTab('garden')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Recent Card 1 */}
          <div 
            onClick={() => onNavigateToTab('home')}
            className="p-3 rounded-2xl bg-[#091a13] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=120&q=80" 
                alt="Monstera deliciosa"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-500/30"
              />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  Monstera deliciosa
                </h4>
                <p className="text-[11px] text-slate-400 truncate">Identified 2 days ago</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#0e271c] flex items-center justify-center text-slate-400 group-hover:text-white shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Recent Card 2 */}
          <div 
            onClick={() => onNavigateToTab('home')}
            className="p-3 rounded-2xl bg-[#091a13] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=120&q=80" 
                alt="Snake Plant"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=120&q=80';
                }}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-500/30"
              />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  Snake Plant
                </h4>
                <p className="text-[11px] text-slate-400 truncate">Identified 5 days ago</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#0e271c] flex items-center justify-center text-slate-400 group-hover:text-white shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Recent Card 3 */}
          <div 
            onClick={() => onNavigateToTab('home')}
            className="p-3 rounded-2xl bg-[#091a13] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=120&q=80" 
                alt="Pothos"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-500/30"
              />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  Pothos
                </h4>
                <p className="text-[11px] text-slate-400 truncate">Identified 1 week ago</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#0e271c] flex items-center justify-center text-slate-400 group-hover:text-white shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. COMMON PLANTS YOU CAN TRY (Horizontal Gallery) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🌿</span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Common Plants You Can Try
            </h3>
          </div>
          <button 
            onClick={() => onNavigateToTab('guide')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all plants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {commonPlants.map((plant, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3 }}
              onClick={() => handleSampleSelect(plant.image)}
              title={`Click to analyze ${plant.name}`}
              className="group rounded-2xl bg-[#091a13] border border-emerald-500/20 overflow-hidden hover:border-emerald-400/50 transition-all cursor-pointer shadow-md flex flex-col"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                <img 
                  src={plant.image} 
                  alt={plant.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-2 text-center">
                <h5 className="text-[11px] font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                  {plant.name}
                </h5>
                <span className="text-[9px] text-slate-400 truncate block mt-0.5">
                  {plant.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
