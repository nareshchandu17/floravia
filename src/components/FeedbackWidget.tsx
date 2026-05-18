import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, LogIn, Loader2 } from 'lucide-react';
import { submitFeedback, signIn } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackWidgetProps {
  analysisType: 'identify' | 'diagnose';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ analysisType }) => {
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedback = async (isPositive: boolean) => {
    if (submitting) return;
    setError(null);

    try {
      if (!user) {
        // Prompt login then submit
        try {
          await signIn();
          // Auth state updates asynchronously; since signInWithPopup completes, 
          // we can assume the user is logging in. Wait brief moment to sync.
          // Note: the component might re-render, but we continue Execution
        } catch (signInErr) {
          setError("You must sign in to leave feedback.");
          return;
        }
      }

      setSubmitting(true);
      await submitFeedback({ analysisType, isPositive });
      setSubmitted(true);
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="feedback-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <p className="text-sm font-semibold text-secondary font-ui">How accurate was this result?</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleFeedback(true)}
                disabled={submitting}
                className="flex items-center justify-center w-12 h-12 rounded-full glass-card hover:bg-green-500/20 text-muted hover:text-green-400 border border-white/5 hover:border-green-500/30 transition-all disabled:opacity-50 hover:shadow-glow-green"
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={submitting}
                className="flex items-center justify-center w-12 h-12 rounded-full glass-card hover:bg-red-500/20 text-muted hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
            {error && <p className="text-xs text-red-400 font-ui mt-2 font-medium bg-red-500/10 px-3 py-1 rounded-full">{error}</p>}
            {submitting && (
              <p className="text-xs text-secondary flex items-center gap-1 mt-2 font-ui">
                <Loader2 className="w-3 h-3 animate-spin text-green-400" /> Saving...
              </p>
            )}
            {!user && !submitting && (
              <p className="text-[10px] text-muted uppercase tracking-widest flex items-center gap-1 font-semibold">
                <LogIn className="w-3 h-3" /> Sign in required
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="feedback-thanks"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 glass-card border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] rounded-2xl"
          >
            <p className="font-bold text-green-400 font-ui text-lg">Thank you for your feedback!</p>
            <p className="text-sm text-green-400/80 mt-1 font-ui">This helps us improve our accuracy.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
