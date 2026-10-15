/**
 * Razorpay Payment Integration Service
 * Configured with Test Mode Keys from environment.
 */

export const RAZORPAY_KEY_ID = 
  process.env.RAZORPAY_KEY_ID || 
  'rzp_test_SYbbQQ7d2pv0ks';

export interface RazorpayPlan {
  id: 'pro';
  name: string;
  tagline: string;
  priceINRMonthly: number;
  priceINRAnnual: number;
  priceUSDMonthly: number;
  priceUSDAnnual: number;
  description: string;
}

export const FLORAVIA_PRO_PLAN: RazorpayPlan = {
  id: 'pro',
  name: 'Floravia Pro Plan',
  tagline: 'Unlimited neural diagnostics, turgor telemetry, and microclimate sync',
  priceINRMonthly: 649, // ~$7.99
  priceINRAnnual: 419,  // ~$4.99/mo, billed annually ~₹5,028
  priceUSDMonthly: 7.99,
  priceUSDAnnual: 4.99,
  description: 'Unlock unlimited plant scans, neural bio-signatures, and automated care sync'
};

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  timestamp: string;
  userEmail?: string;
  method?: string;
}

/**
 * Loads the official Razorpay checkout script (checkout.razorpay.com/v1/checkout.js)
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load external Razorpay script CDN, fallback mode active.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Persists payment receipt in localStorage for audit & receipt viewing.
 */
export const saveSubscriptionReceipt = (receipt: RazorpayPaymentSuccessResponse) => {
  try {
    const existingRaw = localStorage.getItem('floravia_subscription_receipts');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(receipt);
    localStorage.setItem('floravia_subscription_receipts', JSON.stringify(existing));
    localStorage.setItem('floravia_current_plan', JSON.stringify({
      planId: receipt.planId,
      planName: receipt.planName,
      billingCycle: receipt.billingCycle,
      paymentId: receipt.razorpay_payment_id,
      subscribedAt: receipt.timestamp,
      expiresAt: new Date(Date.now() + (receipt.billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString()
    }));
    // Dispatch storage event for same-window components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('floravia_transactions_updated', { detail: receipt }));
  } catch (e) {
    console.error('Error saving subscription receipt:', e);
  }
};

/**
 * Retrieves all stored subscription receipts from localStorage.
 */
export const getLocalSubscriptionReceipts = (): RazorpayPaymentSuccessResponse[] => {
  try {
    const existingRaw = localStorage.getItem('floravia_subscription_receipts');
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    return [];
  }
};

/**
 * Retrieves the current active subscription from localStorage.
 */
export const getActiveSubscription = () => {
  try {
    const saved = localStorage.getItem('floravia_current_plan');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Generates a realistic Razorpay test payment ID (e.g. pay_test_SYbb...)
 */
export const generateTestPaymentId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${rand}`;
};
