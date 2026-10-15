import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName: string;
  images: string[];
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  plantName,
  images
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0b1f16] border border-emerald-500/25 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                {plantName} Gallery ({activeIdx + 1}/{images.length})
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Active Image with Controls */}
          <div className="relative flex-1 min-h-[350px] md:min-h-[450px] my-4 rounded-xl overflow-hidden bg-black/60 border border-emerald-500/10 flex items-center justify-center">
            <img 
              src={images[activeIdx]} 
              alt={`${plantName} photo ${activeIdx + 1}`}
              className="max-h-[500px] w-full object-contain rounded-xl"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-emerald-950/90 text-white border border-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-emerald-950/90 text-white border border-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails row */}
          <div className="flex items-center gap-3 overflow-x-auto py-2 hide-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeIdx === idx 
                    ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : 'border-emerald-500/15 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
