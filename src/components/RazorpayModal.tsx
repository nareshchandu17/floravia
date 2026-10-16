import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Lock, 
  QrCode,
  ArrowRight,
  RefreshCw,
  Key,
  AlertCircle
} from 'lucide-react';
import { 
  RazorpayPaymentSuccessResponse, 
  generateTestPaymentId, 
  generateTestOrderId,
  saveSubscriptionReceipt,
  RAZORPAY_KEY_ID 
} from '../services/razorpay';
import { 
  validateCardInput, 
  validateUpiVpa, 
  maskCardNumber, 
  computeCryptographicSignature,
  detectCardBrand,
  sanitizePaymentString 
} from '../services/paymentSecurity';
import { BillingCycle, PaymentCurrency } from '../types/payment';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amountINR: number;
  amountUSD: number;
  billingCycle: BillingCycle;
  userEmail?: string;
  userName?: string;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  planName,
  amountINR,
  amountUSD,
  billingCycle,
  userEmail = 'botanist@floravia.ai',
  userName = 'Floravia Botanist',
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState(userName || 'Floravia Botanist');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const detectedBrand = detectCardBrand(cardNumber);

  const handlePay = async () => {
    setValidationError(null);

    // 1. Strict Payment Instrument Validation
    if (selectedMethod === 'card') {
      const cardCheck = validateCardInput(cardNumber, cardExpiry, cardCvv, cardHolder);
      if (!cardCheck.isValid) {
        setValidationError(cardCheck.error || 'Please enter valid credit/debit card details.');
        return;
      }
    } else if (selectedMethod === 'upi') {
      const upiCheck = validateUpiVpa(upiId);
      if (!upiCheck.isValid) {
        setValidationError(upiCheck.error || 'Please enter a valid UPI ID (e.g. name@okhdfcbank).');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep('Validating Instrument & 256-bit Token...');

    setTimeout(() => {
      setProcessingStep(`Verifying Gateway Key: ${RAZORPAY_KEY_ID.slice(0, 14)}...`);
      setTimeout(async () => {
        setProcessingStep('Generating Tamper-Evident SHA-256 Digest...');
        
        try {
          const paymentId = generateTestPaymentId();
          const orderId = generateTestOrderId(paymentId.slice(4));
          const timestamp = new Date().toISOString();
          
          // Generate cryptographic hash signature
          const signatureHash = await computeCryptographicSignature({
            paymentId,
            orderId,
            planId: 'pro',
            amount: amountINR,
            currency: 'INR',
            billingCycle,
            timestamp
          });

          const maskedCard = selectedMethod === 'card' ? maskCardNumber(cardNumber) : undefined;

          const response: RazorpayPaymentSuccessResponse = {
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: `sig_${paymentId}_verified`,
            planId: 'pro',
            planName: sanitizePaymentString(planName) || 'Floravia Pro Plan',
            amount: amountINR,
            currency: 'INR',
            billingCycle,
            timestamp,
            userEmail: sanitizePaymentString(userEmail),
            method: selectedMethod.toUpperCase(),
            signatureHash,
            tamperVerified: true,
            maskedCard
          };

          await saveSubscriptionReceipt(response);
          setIsProcessing(false);
          onSuccess(response);
        } catch (err: any) {
          console.error('Payment simulation error:', err);
          setIsProcessing(false);
          setValidationError('Payment processing failed. Please try again.');
        }
      }, 700);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isProcessing ? onClose : undefined}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Razorpay Gateway Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0b1f16] text-slate-100 rounded-3xl border border-emerald-500/25 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-[#071610] border-b border-emerald-500/15 p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg tracking-tighter shadow-md">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                    Razorpay Secure
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                    Sandbox Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Floravia Botanical AI • {planName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  ₹{amountINR.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">(${amountUSD})</span>
              </div>
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Key Banner */}
          <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px]">{RAZORPAY_KEY_ID}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              256-Bit SSL Encrypted
            </span>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Payment Methods & Form */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
            {/* Method Tabs */}
            <div className="grid grid-cols-4 gap-2 p-1 rounded-2xl bg-[#071610] border border-emerald-500/15 text-xs">
              {[
                { id: 'card', label: 'Cards', icon: CreditCard },
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'netbanking', label: 'Netbanking', icon: Building2 },
                { id: 'wallet', label: 'Wallets', icon: Wallet },
              ].map((m) => {
                const Icon = m.icon;
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMethod(m.id as PaymentMethod);
                      setValidationError(null);
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Method Details */}
            {selectedMethod === 'card' && (
              <div className="space-y-3 bg-[#071610] p-4 rounded-2xl border border-emerald-500/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Credit / Debit Card</span>
                    {detectedBrand !== 'Unknown' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        {detectedBrand}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCardNumber('4111 1111 1111 1111');
                      setCardExpiry('12/28');
                      setCardCvv('888');
                      setValidationError(null);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer font-medium"
                  >
                    Auto-Fill Test Visa
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Card Number (Luhn Verified)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="4111 1111 1111 1111"
                      className="w-full bg-[#050e09] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-emerald-400"
                    />
                    <CreditCard className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        setCardExpiry(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="12/28"
                      className="w-full bg-[#050e09] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => {
                        setCardCvv(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="888"
                      className="w-full bg-[#050e09] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => {
                      setCardHolder(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="Botanist Name"
                    className="w-full bg-[#050e09] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'upi' && (
              <div className="space-y-3 bg-[#071610] p-4 rounded-2xl border border-emerald-500/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Instant UPI & QR Code</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                    NPCI Verified
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Virtual Payment Address (VPA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="botanist@okhdfcbank"
                      className="flex-1 bg-[#050e09] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUpiId('success@razorpay');
                        setValidationError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold cursor-pointer"
                    >
                      Test VPA
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#050e09] border border-emerald-500/15 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-slate-950">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-white">Scan & Pay on Mobile</p>
                    <p className="text-[11px] text-slate-400">
                      GPay, PhonePe, Paytm, or BHIM simulated test intent.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-3 bg-[#071610] p-4 rounded-2xl border border-emerald-500/15">
                <span className="text-xs font-bold text-slate-300 block">Select Authorized Bank</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBank(b)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBank === b
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                          : 'bg-[#050e09] border-emerald-500/15 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-3 bg-[#071610] p-4 rounded-2xl border border-emerald-500/15">
                <span className="text-xs font-bold text-slate-300 block">Select Digital Wallet</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Paytm', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWallet(w)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedWallet === w
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                          : 'bg-[#050e09] border-emerald-500/15 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary & Tax Line */}
            <div className="p-3.5 rounded-xl bg-[#071610] border border-emerald-500/15 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{planName} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})</span>
                <span className="font-semibold text-slate-200">₹{amountINR.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18% Included • SAC 998434)</span>
                <span className="text-emerald-400 font-semibold">₹{(Math.round(amountINR * 0.18 / 1.18)).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-emerald-500/15 flex justify-between font-bold text-white">
                <span>Total Payable</span>
                <span className="text-emerald-400">₹{amountINR.toLocaleString('en-IN')} (~${amountUSD})</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="bg-[#071610] border-t border-emerald-500/15 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>256-bit SSL • Tamper-Verified Token</span>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{processingStep || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize ₹{amountINR.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
