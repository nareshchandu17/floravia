import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Heart, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { COMMUNITY_GUIDELINES } from '../../utils/moderation';

interface CommunityGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityGuidelinesModal: React.FC<CommunityGuidelinesModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0d1f17] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Floravia Botanical Sanctuary Guidelines</h3>
                <p className="text-xs text-emerald-400/80">Fostering a positive, collaborative gardening community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guidelines Body */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to Floravia Community! Whether you are nurturing your first succulent or managing an orchard, our forum is a welcoming greenhouse where gardeners inspire and help one another.
              </p>
            </div>

            <div className="space-y-3">
              {COMMUNITY_GUIDELINES.map((item, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-start gap-3 mt-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wide">Community Moderation System</h5>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Our automated filter scans for toxic terminology and spam. Members can report improper posts for immediate review by botanical moderators. Content violating safety rules will be hidden or removed.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-emerald-900/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              I Understand & Agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
