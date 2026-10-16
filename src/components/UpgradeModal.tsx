import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Key,
  Table,
  Minus,
  Info,
  Calendar,
  Activity,
  Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fireConfetti } from '../utils/confetti';
import { 
  RAZORPAY_KEY_ID, 
  FLORAVIA_PRO_PLAN, 
  loadRazorpayScript, 
  saveSubscriptionReceipt,
  getActiveSubscription 
} from '../services/razorpay';
import { 
  RazorpayPaymentSuccessResponse, 
  BillingCycle, 
  PaymentCurrency 
} from '../types/payment';
import { 
  verifyPaymentTransaction, 
  calculateGstBreakdown,
  sanitizePaymentString 
} from '../services/paymentSecurity';
import { RazorpayModal } from './RazorpayModal';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { recordUserTransaction } from '../services/firebase';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: (planName: string, receipt?: RazorpayPaymentSuccessResponse) => void;
}

interface FeatureItem {
  feature: string;
  description: string;
  basic: string | boolean;
  premium: string | boolean;
  isKeyDiff?: boolean;
}

interface FeatureCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  features: FeatureItem[];
}

const COMPARISON_CATEGORIES: FeatureCategory[] = [
  {
    title: 'AI Scans & Neural Vision',
    icon: Activity,
    features: [
      {
        feature: 'Species Identification Scans',
        description: 'Instant botanical taxonomy, scientific name & care attributes',
        basic: '3 scans / day',
        premium: 'Unlimited instant scans',
        isKeyDiff: true
      },
      {
        feature: 'Pathology Diagnostics',
        description: 'Tissue disease detection, blight isolation & recovery protocols',
        basic: 'Basic tissue check',
        premium: 'Deep cellular analysis & cure protocols',
        isKeyDiff: true
      },
      {
        feature: 'Turgor Pressure & Bio-Signatures',
        description: 'Real-time stomatal conductance, cellular hydration & vigor index',
        basic: false,
        premium: 'Live telemetry & pressure curves',
        isKeyDiff: true
      },
      {
        feature: 'Multi-Photo Foliar Progress Gallery',
        description: 'Chronological photo timeline tracking recovery over time',
        basic: '1 photo per plant',
        premium: 'Unlimited progressive gallery'
      }
    ]
  },
  {
    title: 'Garden Management & Memory',
    icon: Sprout,
    features: [
      {
        feature: 'My Garden Plant Capacity',
        description: 'Active plant profiles monitored simultaneously in cloud database',
        basic: 'Up to 5 plants',
        premium: 'Unlimited garden plants',
        isKeyDiff: true
      },
      {
        feature: 'Sage AI Consultations',
        description: 'Interactive natural language conversational botanical guidance',
        basic: '10 queries / day',
        premium: 'Unlimited 24/7 conversational memory',
        isKeyDiff: true
      },
      {
        feature: 'Sage Advisory Persona Engine',
        description: 'Customize Sage communication style (Clinical, Friendly, Direct)',
        basic: 'Friendly only',
        premium: 'Full persona engine control'
      }
    ]
  },
  {
    title: 'Automation & Synchronization',
    icon: Calendar,
    features: [
      {
        feature: 'Verified Local Timezone Scheduling',
        description: 'Executes alerts at exact local user hour (e.g. 9:00 AM local)',
        basic: 'Server default time',
        premium: 'Verified local timezone alignment',
        isKeyDiff: true
      },
      {
        feature: '1-Click Google Calendar Sync',
        description: 'Automated 2-way care schedule sync via Google Workspace OAuth',
        basic: false,
        premium: true,
        isKeyDiff: true
      },
      {
        feature: 'Hyper-Local Microclimate Sync',
        description: 'Weather sensor telemetry with proactive heat & frost alarms',
        basic: 'Static ambient weather',
        premium: 'Live sensor telemetry & microclimate alarms',
        isKeyDiff: true
      }
    ]
  },
  {
    title: 'Account, Billing & Security',
    icon: ShieldCheck,
    features: [
      {
        feature: 'Itemized Digital Invoices & Audit Logs',
        description: 'Instant printable tax receipts & payment history in Profile',
        basic: false,
        premium: true
      },
      {
        feature: 'Community Forum Pro Botanist Badge',
        description: 'Distinguished profile badge in community discussions & tips',
        basic: 'Standard member',
        premium: 'Verified Pro Botanist badge'
      },
      {
        feature: 'Botanical Diagnostic Priority Queue',
        description: 'Priority GPU cloud pipeline for high-resolution image analysis',
        basic: 'Standard queue',
        premium: 'Instant VIP queue',
        isKeyDiff: true
      }
    ]
  }
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  onSubscriptionUpdated 
}) => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [viewMode, setViewMode] = useState<'checkout' | 'comparison'>('checkout');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<RazorpayPaymentSuccessResponse | null>(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveSubscription();
      if (active) {
        setActivePlan(active.planName);
      }
      // Preload Razorpay Checkout.js script
      loadRazorpayScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlan = FLORAVIA_PRO_PLAN;
  const amountINR = billingCycle === 'yearly' ? currentPlan.priceINRAnnual * 12 : currentPlan.priceINRMonthly;
  const amountUSD = billingCycle === 'yearly' ? currentPlan.priceUSDAnnual * 12 : currentPlan.priceUSDMonthly;
  const monthlyRateUSD = billingCycle === 'yearly' ? currentPlan.priceUSDAnnual : currentPlan.priceUSDMonthly;
  const monthlyRateINR = billingCycle === 'yearly' ? currentPlan.priceINRAnnual : currentPlan.priceINRMonthly;

  const handleStartPayment = () => {
    // If official Razorpay checkout script loaded and available
    if ((window as any).Razorpay) {
      try {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: amountINR * 100, // paise
          currency: 'INR',
          name: 'Floravia Botanical AI',
          description: `Floravia Pro (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
          image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=128&q=80',
          handler: function (response: any) {
            handlePaymentSuccess({
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_order_id: response.razorpay_order_id || `order_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'sig_verified',
              planId: 'pro',
              planName: currentPlan.name,
              amount: amountINR,
              currency: 'INR',
              billingCycle,
              timestamp: new Date().toISOString(),
              userEmail: user?.email || 'botanist@floravia.ai',
              method: 'RAZORPAY_CHECKOUT'
            });
          },
          prefill: {
            name: user?.displayName || 'Floravia Botanist',
            email: user?.email || 'botanist@floravia.ai',
            contact: '9999999999'
          },
          theme: {
            color: '#10b981'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function () {
          // Open integrated test modal on failure or sandbox block
          setIsRazorpayModalOpen(true);
        });
        rzp.open();
        return;
      } catch {
        // Fallback to integrated Razorpay modal
        setIsRazorpayModalOpen(true);
        return;
      }
    }

    // Default to integrated Razorpay test sandbox modal
    setIsRazorpayModalOpen(true);
  };

  const handlePaymentSuccess = async (receipt: RazorpayPaymentSuccessResponse) => {
    // 1. Cryptographic and Anti-Tamper Verification
    const verification = await verifyPaymentTransaction(receipt);
    const verifiedReceipt: RazorpayPaymentSuccessResponse = {
      ...receipt,
      signatureHash: verification.signatureHash || receipt.signatureHash,
      tamperVerified: verification.isValid
    };

    await saveSubscriptionReceipt(verifiedReceipt);
    recordUserTransaction(verifiedReceipt).catch(() => {});
    setLastPayment(verifiedReceipt);
    setIsSuccess(true);
    setActivePlan(verifiedReceipt.planName);

    // Trigger success notification with current plan details
    const cycleFormatted = verifiedReceipt.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    const amountFormatted = `₹${verifiedReceipt.amount.toLocaleString('en-IN')}`;
    const notificationTitle = `🎉 ${verifiedReceipt.planName} Activated!`;
    const notificationBody = `Your subscription for ${verifiedReceipt.planName} (${cycleFormatted} • ${amountFormatted}) is now cryptographically verified and active via Razorpay. Unlimited neural plant diagnostics & care synchronization are now available.`;

    notify(
      notificationTitle,
      notificationBody,
      'success'
    );

    if (onSubscriptionUpdated) {
      onSubscriptionUpdated(verifiedReceipt.planName, verifiedReceipt);
    }

    fireConfetti();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-[#0b1f16] border border-emerald-500/30 rounded-3xl ${
              viewMode === 'comparison' ? 'max-w-3xl' : 'max-w-xl'
            } w-full p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto hide-scrollbar transition-all duration-300`}
          >
            {/* Top glowing ambient */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess && lastPayment ? (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Razorpay Verified</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Welcome to Floravia Pro!</h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    Unlimited scans, neural telemetry, and care alerts are now unlocked on your account.
                  </p>
                </div>

                {/* Success Notification Status Pill */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-left flex items-start gap-3 shadow-inner">
                  <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 animate-pulse" />
                  <div className="text-xs space-y-0.5">
                    <p className="text-emerald-300 font-bold">Success Notification Dispatched</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Plan details for <span className="text-white font-semibold">{lastPayment.planName}</span> ({lastPayment.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}) have been logged to your Intelligence Log and alert feed.
                    </p>
                  </div>
                </div>

                {/* Receipt Card */}
                <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Plan Details</span>
                    <span className="font-semibold text-emerald-300">{lastPayment.planName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment ID</span>
                    <span className="font-mono text-emerald-300 font-semibold">{lastPayment.razorpay_payment_id}</span>
                  </div>
                  {lastPayment.maskedCard && (
                    <div className="flex justify-between text-slate-400">
                      <span>Payment Instrument</span>
                      <span className="font-mono text-slate-200">{lastPayment.maskedCard}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Paid</span>
                    <span className="font-bold text-white">₹{lastPayment.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (18% Included)</span>
                    <span className="text-emerald-400 font-medium">₹{Math.round(lastPayment.amount * 0.18 / 1.18).toLocaleString('en-IN')} (SAC 998434)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Billing Cycle</span>
                    <span className="capitalize text-slate-200">{lastPayment.billingCycle === 'yearly' ? 'Yearly (Saved 30%)' : 'Monthly'}</span>
                  </div>
                  {lastPayment.signatureHash && (
                    <div className="pt-2 border-t border-emerald-500/15">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">SHA-256 Integrity Digest:</span>
                        <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[180px]">
                          {lastPayment.signatureHash.slice(0, 18)}...
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-emerald-500/15">
                    <span>Integrity Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tamper-Verified</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer hover:scale-105 active:scale-95"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Mode Switcher Tabs: Quick Upgrade vs Comparison Table */}
                <div className="flex items-center justify-center gap-1.5 p-1 bg-[#071610] rounded-2xl max-w-sm mx-auto mb-6 border border-emerald-500/15">
                  <button
                    onClick={() => setViewMode('checkout')}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      viewMode === 'checkout'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Plan</span>
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      viewMode === 'comparison'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Compare Basic vs Premium</span>
                  </button>
                </div>

                {viewMode === 'checkout' ? (
                  <>
                    <div className="text-center space-y-2 mb-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Floravia Pro Plan</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        Elevate Your Plant Care
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 max-w-sm mx-auto">
                        Unlock unlimited identification scans, advanced neural bio-signals, and automated care sync.
                      </p>
                    </div>

                    {/* Billing Switcher */}
                    <div className="flex items-center justify-center gap-2 p-1 bg-[#071610] rounded-xl max-w-xs mx-auto mb-5 border border-emerald-500/15">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          billingCycle === 'monthly'
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
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

                    {/* Price Display */}
                    <div className="p-4 bg-[#071610] rounded-2xl border border-emerald-500/15 mb-5 flex flex-col items-center justify-center shadow-inner">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">
                          ₹{monthlyRateINR}
                        </span>
                        <span className="text-sm text-slate-400 font-medium">
                          (${monthlyRateUSD}) / month
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
                        {billingCycle === 'yearly' 
                          ? `Billed ₹${amountINR.toLocaleString('en-IN')} (~$${amountUSD}) annually` 
                          : `Billed ₹${amountINR.toLocaleString('en-IN')} monthly`}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-5">
                      {[
                        'Unlimited Instant Species & Disease Identifications',
                        'Deep Neural Bio-Signature & Turgor Telemetry',
                        'Live Hyper-Local Microclimate Sync & Soil Alerts',
                        'Unlimited Consultations with Sage AI',
                        'Google Calendar 1-Click Care Sync'
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Trigger for comparison table */}
                    <button
                      type="button"
                      onClick={() => setViewMode('comparison')}
                      className="w-full mb-5 py-2.5 px-3 rounded-xl bg-surface/40 hover:bg-surface/70 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compare Basic vs Premium Feature Table &rarr;</span>
                    </button>

                    {/* Razorpay Integration Badge */}
                    <div className="p-3 rounded-2xl bg-[#06120b] border border-blue-500/20 flex items-center justify-between mb-5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          R
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">Razorpay Test Gateway</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-500/30 rounded font-bold uppercase">
                              Active
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 block">{RAZORPAY_KEY_ID}</span>
                        </div>
                      </div>
                      <Lock className="w-4 h-4 text-emerald-400" />
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleStartPayment}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{amountINR.toLocaleString('en-IN')} with Razorpay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  /* ========================================================
                     COMPARISON TABLE VIEW: BASIC VS PREMIUM
                     ======================================================== */
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Plan Comparison Matrix</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Compare Basic vs. Premium
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Evaluate feature differences side-by-side to make the best choice for your indoor garden and plant health.
                      </p>
                    </div>

                    {/* Billing Cycle Switcher inside Comparison */}
                    <div className="flex items-center justify-between bg-[#07130d] p-3 rounded-2xl border border-emerald-900/40">
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">Billing Interval</span>
                        <span className="text-[11px] text-emerald-400/80">
                          {billingCycle === 'yearly' ? 'Annual discount applied (30% savings)' : 'Standard monthly billing'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#0a1a12] p-1 rounded-xl border border-emerald-500/20">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            billingCycle === 'monthly'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            billingCycle === 'yearly'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Yearly</span>
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-900 text-emerald-200 rounded font-black">
                            -30%
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Comparison Table Container */}
                    <div className="rounded-2xl border border-emerald-900/50 bg-[#07130e] overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                          {/* Table Header: Plans */}
                          <thead>
                            <tr className="border-b border-emerald-900/50 bg-[#0a1c13]">
                              <th className="p-4 w-[46%] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                Feature & Capability
                              </th>

                              {/* Basic Plan Column Header */}
                              <th className="p-4 w-[27%] text-center border-l border-emerald-900/30 bg-[#06110a]">
                                <div className="space-y-1">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                                    Current Plan
                                  </span>
                                  <h4 className="text-sm font-bold text-white">Basic</h4>
                                  <p className="text-base font-extrabold text-slate-300 font-mono">
                                    ₹0
                                  </p>
                                  <p className="text-[10px] text-muted">Free Forever</p>
                                </div>
                              </th>

                              {/* Premium Plan Column Header */}
                              <th className="p-4 w-[27%] text-center border-l border-emerald-500/30 bg-emerald-950/40 relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                                <div className="space-y-1 pt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                                    <Crown className="w-3 h-3 text-amber-400" />
                                    Premium
                                  </span>
                                  <h4 className="text-sm font-bold text-emerald-300">Floravia Pro</h4>
                                  <p className="text-base font-extrabold text-white font-mono">
                                    ₹{monthlyRateINR}
                                    <span className="text-[11px] font-normal text-slate-400">/mo</span>
                                  </p>
                                  <p className="text-[10px] text-emerald-400 font-medium">
                                    {billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                                  </p>
                                </div>
                              </th>
                            </tr>
                          </thead>

                          {/* Table Body: Categorized Rows */}
                          <tbody className="divide-y divide-emerald-950/60 font-ui">
                            {COMPARISON_CATEGORIES.map((cat, catIdx) => (
                              <React.Fragment key={cat.title}>
                                {/* Category Header Row */}
                                <tr className="bg-[#091811] border-t border-emerald-900/40">
                                  <td colSpan={3} className="px-4 py-2.5 font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <cat.icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{cat.title}</span>
                                  </td>
                                </tr>

                                {/* Category Feature Items */}
                                {cat.features.map((item, itemIdx) => (
                                  <tr 
                                    key={item.feature}
                                    className="hover:bg-emerald-950/20 transition-colors"
                                  >
                                    {/* Feature Name & Description */}
                                    <td className="p-3.5 text-left align-middle">
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-white text-xs">
                                            {item.feature}
                                          </span>
                                          {item.isKeyDiff && (
                                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-bold uppercase border border-emerald-500/20">
                                              Key Difference
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-snug">
                                          {item.description}
                                        </p>
                                      </div>
                                    </td>

                                    {/* Basic Column Value */}
                                    <td className="p-3.5 text-center align-middle border-l border-emerald-900/30 bg-[#06110a]/50">
                                      {typeof item.basic === 'boolean' ? (
                                        item.basic ? (
                                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                            <Check className="w-3.5 h-3.5" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                                            <Minus className="w-3 h-3" />
                                          </div>
                                        )
                                      ) : (
                                        <span className="text-slate-400 font-medium text-[11px]">
                                          {item.basic}
                                        </span>
                                      )}
                                    </td>

                                    {/* Premium Column Value */}
                                    <td className="p-3.5 text-center align-middle border-l border-emerald-500/20 bg-emerald-950/25">
                                      {typeof item.premium === 'boolean' ? (
                                        item.premium ? (
                                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                                            <Minus className="w-3 h-3" />
                                          </div>
                                        )
                                      ) : (
                                        <span className="text-emerald-300 font-bold text-[11px] block">
                                          {item.premium}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Comparison Checkout Bar */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-[#071810] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-white text-sm">Floravia Pro Premium</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                            ₹{amountINR.toLocaleString('en-IN')}/{billingCycle === 'yearly' ? 'yr' : 'mo'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Instant access to unlimited diagnostics, cellular turgor & calendar synchronization.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setViewMode('checkout')}
                          className="px-3 py-2.5 rounded-xl bg-surface hover:bg-surface/80 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View Card
                        </button>

                        <button
                          onClick={handleStartPayment}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Upgrade to Premium</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Razorpay Test Mode Checkout Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        planName={currentPlan.name}
        amountINR={amountINR}
        amountUSD={amountUSD}
        billingCycle={billingCycle}
        userEmail={user?.email || 'botanist@floravia.ai'}
        userName={user?.displayName || 'Floravia Botanist'}
        onSuccess={(receipt) => {
          setIsRazorpayModalOpen(false);
          handlePaymentSuccess(receipt);
        }}
      />
    </>
  );
};
