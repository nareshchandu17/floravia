import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, AlertTriangle, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { ReportReason } from '../../types/forum';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  targetTitle?: string;
  targetContentSnippet?: string;
  onSubmitReport: (data: {
    targetType: 'post' | 'comment';
    targetId: string;
    postId: string;
    targetTitle?: string;
    targetContentSnippet?: string;
    reason: ReportReason;
    details?: string;
  }) => Promise<void>;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  { 
    id: 'spam', 
    label: 'Spam / Commercial Promotion', 
    desc: 'Unsolicited advertising, affiliate links, or repetitive bot posts' 
  },
  { 
    id: 'harassment', 
    label: 'Harassment or Offensive Language', 
    desc: 'Abusive remarks, slurs, attacks, or hostile conduct toward members' 
  },
  { 
    id: 'misleading', 
    label: 'Dangerous / Harmful Botanical Advice', 
    desc: 'Advice that risks severe plant damage, toxic poisoning, or invasive spreading' 
  },
  { 
    id: 'inappropriate', 
    label: 'Inappropriate Media / Content', 
    desc: 'Non-gardening media, graphic imagery, or content violating terms' 
  },
  { 
    id: 'other', 
    label: 'Other Concern', 
    desc: 'Any other issue requiring moderator attention' 
  }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  postId,
  targetTitle,
  targetContentSnippet,
  onSubmitReport
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmitReport({
        targetType,
        targetId,
        postId,
        targetTitle,
        targetContentSnippet,
        reason: selectedReason,
        details: details.trim() || undefined
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0e1913] border border-amber-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Report {targetType === 'post' ? 'Post' : 'Response'}</h3>
                <p className="text-xs text-amber-400/80">Help keep Floravia positive and trustworthy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Report Received</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Thank you for notifying our botanical moderation team. We will review this content swiftly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              {/* Target Snippet */}
              {targetTitle && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">Subject:</span>
                  <span className="text-white font-medium line-clamp-1">{targetTitle}</span>
                </div>
              )}

              {/* Reasons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select a reason for reporting:
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedReason(r.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedReason === r.id
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === r.id}
                        onChange={() => setSelectedReason(r.id)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-500/20 bg-slate-900 border-slate-700"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-white">{r.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional details */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any context that will assist moderators..."
                  rows={2}
                  maxLength={400}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
