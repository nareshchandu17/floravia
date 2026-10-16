import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { submitFeedback, signIn, parseFirestoreError } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackWidgetProps {
  analysisType: 'identify' | 'diagnose';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ analysisType }) => {
  const { user, isEmailVerified, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedback = async (isPositive: boolean) => {
    if (submitting) return;
    setError(null);

    try {
      if (!user) {
        try {
          await signIn();
        } catch (signInErr: any) {
          if (signInErr?.code === 'auth/popup-closed-by-user' || signInErr?.code === 'auth/cancelled-popup-request') {
            return;
          }
          setError("You must sign in to submit feedback.");
          return;
        }
      }

      setSubmitting(true);
      await submitFeedback({ analysisType, isPositive });
      setSubmitted(true);
      
    } catch (err: any) {
      console.error(err);
      const parsed = parseFirestoreError(err);
      setError(parsed.userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mt-8 border-t border-emerald-500/10 pt-6">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="feedback-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <p className="text-sm font-semibold text-slate-300 font-ui">How accurate was this result?</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleFeedback(true)}
                disabled={submitting}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0b1f16] hover:bg-[#0c2419] text-slate-400 hover:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={submitting}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0b1f16] hover:bg-[#0c2419] text-slate-400 hover:text-rose-400 border border-emerald-500/20 hover:border-rose-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="text-xs text-amber-300 font-ui mt-2 font-medium bg-amber-950/70 border border-amber-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 max-w-md text-center">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {submitting && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-2 font-ui">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> Saving feedback...
              </p>
            )}
            {!user && !submitting && (
              <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1 font-semibold">
                <LogIn className="w-3 h-3 text-emerald-400" /> Sign in required
              </p>
            )}
            {user && !isEmailVerified && !submitting && !error && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> Email verification required to log ratings
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="feedback-thanks"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 bg-[#0b1f16] border border-emerald-500/20 shadow-lg rounded-2xl"
          >
            <p className="font-bold text-emerald-400 font-ui text-lg">Thank you for your feedback!</p>
            <p className="text-sm text-emerald-300/80 mt-1 font-ui">This helps us continually calibrate botanical precision.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
