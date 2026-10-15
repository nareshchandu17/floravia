import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Sprout, 
  ShieldCheck, 
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  resendVerificationEmail, 
  reloadCurrentUser, 
  sendPasswordReset,
  signOut,
  auth
} from '../services/firebase';

export type AuthMode = 'login' | 'signup' | 'verify-email' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification resend cooldown state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setVerificationSuccess(false);

      if (auth.currentUser && !auth.currentUser.emailVerified) {
        setMode('verify-email');
        setEmail(auth.currentUser.email || '');
      } else {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialMode]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-check verification on tab focus
  useEffect(() => {
    if (!isOpen || mode !== 'verify-email') return;

    const handleWindowFocus = async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
          const user = await reloadCurrentUser();
          if (user?.emailVerified) {
            setVerificationSuccess(true);
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1200);
          }
        } catch {
          // Silent fallback on background focus
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isOpen, mode, onSuccess, onClose]);

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your details.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again or use Forgot Password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment before trying again.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-in was dismissed.';
      default:
        return err?.message || 'Authentication encountered an issue. Please try again.';
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
      setMode('verify-email');
      setResendCooldown(60);
      setSuccessMsg('Account created! A verification link has been sent to your email.');
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      if (user && !user.emailVerified) {
        setMode('verify-email');
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user && !user.emailVerified) {
        setMode('verify-email');
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await resendVerificationEmail();
      setResendCooldown(60);
      setSuccessMsg(`Verification email resent to ${auth.currentUser?.email || email}. Check your spam/promotions tab if needed.`);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setError(null);
    setIsCheckingStatus(true);
    try {
      const refreshedUser = await reloadCurrentUser();
      if (refreshedUser?.emailVerified) {
        setVerificationSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setError("Email not verified yet. Please click the link sent to your email inbox, then click here again.");
      }
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset instructions sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    setMode('login');
    setError(null);
    setSuccessMsg(null);
  };

  const getWebmailUrl = (emailAddress: string): { name: string; url: string } | null => {
    const lower = emailAddress.toLowerCase();
    if (lower.includes('@gmail.com') || lower.includes('@googlemail.com')) {
      return { name: 'Open Gmail', url: 'https://mail.google.com' };
    }
    if (lower.includes('@outlook.com') || lower.includes('@hotmail.com') || lower.includes('@live.com')) {
      return { name: 'Open Outlook', url: 'https://outlook.live.com' };
    }
    if (lower.includes('@yahoo.com') || lower.includes('@ymail.com')) {
      return { name: 'Open Yahoo Mail', url: 'https://mail.yahoo.com' };
    }
    if (lower.includes('@icloud.com') || lower.includes('@me.com')) {
      return { name: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' };
    }
    return null;
  };

  const currentEmail = auth.currentUser?.email || email;
  const webmailLink = currentEmail ? getWebmailUrl(currentEmail) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="auth-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="bg-[#0b1f16] border border-emerald-500/25 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {mode === 'verify-email' && 'Email Verification Required'}
                    {mode === 'signup' && 'Create Your Account'}
                    {mode === 'login' && 'Sign In to Floravia'}
                    {mode === 'forgot-password' && 'Reset Password'}
                  </h3>
                  <p className="text-xs text-emerald-400/80">
                    Botanical Intelligence Platform
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Success View */}
            {verificationSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Email Verified Successfully!</h4>
                <p className="text-xs text-emerald-300">
                  Cloud database synchronization unlocked. Entering your sanctuary...
                </p>
              </motion.div>
            ) : mode === 'verify-email' ? (
              /* --- VERIFY EMAIL SCREEN --- */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <Mail className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Verification Link Sent</h4>
                    <p className="text-xs text-emerald-200/80 mt-1">
                      We sent a confirmation link to:
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5 break-all">
                      {currentEmail}
                    </p>
                  </div>

                  {webmailLink && (
                    <a
                      href={webmailLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>{webmailLink.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="text-[11px] text-slate-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/15 leading-relaxed text-left">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline mr-1 -mt-0.5" />
                    <strong>Why is this required?</strong> Firestore database security rules require verified email status before writing plant health telemetry, creating custom reminders, or sharing community protocols.
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isCheckingStatus}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking Status...</span>
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
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#071610] hover:bg-[#0c2419] border border-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {resendCooldown > 0 
                        ? `Resend link in ${resendCooldown}s` 
                        : 'Resend Verification Email'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11px]"
                  >
                    Continue in Guest Mode
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer text-[11px]"
                  >
                    Switch Account / Sign Out
                  </button>
                </div>
              </div>
            ) : mode === 'forgot-password' ? (
              /* --- FORGOT PASSWORD SCREEN --- */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Enter your account email and we'll send you instructions to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@floravia.botany"
                      required
                      className="w-full bg-[#071610] border border-emerald-500/20 focus:border-emerald-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* --- SIGN IN / SIGN UP FORMS --- */
              <div className="space-y-5">
                {/* Google 1-Click Fast Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#071610] hover:bg-[#0c2419] border border-emerald-500/20 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-[1px] bg-emerald-500/20 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-emerald-400/70 tracking-widest">
                    Or with email
                  </span>
                  <div className="h-[1px] bg-emerald-500/20 flex-1" />
                </div>

                <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-3.5">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Your Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Dr. Maya Lin"
                          className="w-full bg-[#071610] border border-emerald-500/20 focus:border-emerald-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="maya@floravia.botany"
                        required
                        className="w-full bg-[#071610] border border-emerald-500/20 focus:border-emerald-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-password');
                            setError(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#071610] border border-emerald-500/20 focus:border-emerald-400 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{mode === 'signup' ? 'Create Account & Send Link' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch Login / Signup */}
                <div className="pt-2 text-center text-xs text-slate-400">
                  {mode === 'signup' ? (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don't have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
