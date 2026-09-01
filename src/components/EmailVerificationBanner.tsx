import React, { useState } from 'react';
import { Mail, AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface EmailVerificationBannerProps {
  onOpenVerificationModal: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  onOpenVerificationModal
}) => {
  const { user, isEmailVerified, resendVerification } = useAuth();
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!user || isEmailVerified) {
    return null;
  }

  const handleQuickResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setResendStatus('sending');
    try {
      await resendVerification();
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err) {
      console.warn('Banner resend failed:', err);
      setResendStatus('idle');
    }
  };

  return (
    <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Email verification required for <strong className="text-white font-mono">{user.email}</strong> to sync Garden data.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {resendStatus === 'sent' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Link sent!
            </span>
          ) : (
            <button
              onClick={handleQuickResend}
              disabled={resendStatus === 'sending'}
              className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 hover:text-white transition-colors text-[11px] font-medium cursor-pointer"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Resend Link'}
            </button>
          )}

          <button
            onClick={onOpenVerificationModal}
            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Verify Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
