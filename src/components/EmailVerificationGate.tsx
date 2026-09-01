import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  LogOut, 
  Sprout,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface EmailVerificationGateProps {
  featureName?: string;
  onVerified?: () => void;
}

export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({
  featureName = 'My Garden',
  onVerified
}) => {
  const { user, reloadUser, resendVerification, signOut } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsChecking(true);

    try {
      const verified = await reloadUser();
      if (verified) {
        setJustVerified(true);
        setSuccessMsg("Email verified successfully! Unlocking your cloud database...");
        setTimeout(() => {
          onVerified?.();
        }, 1200);
      } else {
        setErrorMsg("Email not verified yet. Please click the link sent to your email inbox, then check again.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to check status. Please check your internet connection.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      await resendVerification();
      setCooldown(60);
      setSuccessMsg(`Verification email resent to ${user?.email}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      setErrorMsg("Could not resend email. Please try again in a few minutes.");
    } finally {
      setResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0b1812]/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
      >
        {/* Glow accents */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Botanical Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          {justVerified ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : (
            <Mail className="w-8 h-8 text-emerald-400 animate-pulse" />
          )}
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Email Verification Required</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Check Your Email to Enter {featureName}
          </h2>
          <p className="text-xs md:text-sm text-emerald-200/70 max-w-md mx-auto leading-relaxed">
            We sent a verification link to <strong className="text-cyan-300 font-mono">{user.email}</strong>. Please confirm your email address to unlock your cloud garden, telemetry logs, and plant reminders.
          </p>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 text-left"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking || justVerified}
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Status...</span>
              </>
            ) : justVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified! Loading Garden...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>I've Clicked the Link • Enter Garden</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0e2118] hover:bg-[#143023] border border-emerald-800/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {cooldown > 0 ? `Resend Link (${cooldown}s)` : 'Resend Verification Email'}
            </span>
          </button>
        </div>

        {/* Footer info & sign out */}
        <div className="pt-4 border-t border-emerald-900/30 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Automatic refresh on tab focus
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
