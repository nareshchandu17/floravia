import React, { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles, Shield, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0c1a13] border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top glowing ambient */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Welcome to Floravia Pro!</h3>
              <p className="text-sm text-emerald-300">
                Unlimited scans and AI diagnostics are now unlocked.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Floravia Pro Plan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Elevate Your Plant Care
                </h3>
                <p className="text-xs md:text-sm text-slate-400 max-w-sm mx-auto">
                  Unlock unlimited identification scans, advanced neural bio-signals, and automated care sync.
                </p>
              </div>

              {/* Billing Switcher */}
              <div className="flex items-center justify-center gap-2 p-1 bg-[#07110c] rounded-xl max-w-xs mx-auto mb-6 border border-emerald-900/40">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    billingCycle === 'yearly'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-900 text-emerald-300 rounded font-bold">
                    Save 30%
                  </span>
                </button>
              </div>

              {/* Price display */}
              <div className="p-4 bg-[#09150f] rounded-2xl border border-emerald-800/30 mb-6 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {billingCycle === 'yearly' ? '$4.99' : '$7.99'}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month, billed {billingCycle}</span>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                {[
                  'Unlimited Instant Species & Disease Identifications',
                  'Deep Neural Bio-Signature & Turgor Telemetry',
                  'Live Hyper-Local Microclimate Sync & Soil Alerts',
                  'Unlimited Voice Consultations with Sage AI',
                  'Priority Cloud Backup & Multi-Device Synchronization'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                Upgrade to Pro Now
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
