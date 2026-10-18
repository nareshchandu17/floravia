/**
 * Floravia Razorpay Client Integration Service
 * Type-safe frontend client for backend-mediated payment processing,
 * official Razorpay Checkout launcher, and offline receipt caching.
 */

import { 
  RazorpayPlan, 
  RazorpayPaymentSuccessResponse, 
  ActiveSubscriptionState,
  UserSubscriptionState,
  ServerTransaction,
  GstTaxBreakdown,
  BillingCycle,
  PaymentCurrency,
  CreateOrderSuccessResponse,
  VerifyPaymentSuccessResponse,
  RazorpayCheckoutOptions
} from '../types/payment';
import { 
  CANONICAL_PRO_PLAN, 
  calculateGstBreakdown, 
  sanitizePaymentString 
} from './paymentSecurity';

export const RAZORPAY_KEY_ID = 
  process.env.RAZORPAY_KEY_ID || 
  (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 
  '';

export const FLORAVIA_PRO_PLAN: RazorpayPlan = {
  id: CANONICAL_PRO_PLAN.id,
  name: CANONICAL_PRO_PLAN.name,
  tagline: CANONICAL_PRO_PLAN.tagline,
  priceINRMonthly: CANONICAL_PRO_PLAN.priceINRMonthly,
  priceINRAnnual: CANONICAL_PRO_PLAN.priceINRAnnual,
  priceUSDMonthly: CANONICAL_PRO_PLAN.priceUSDMonthly,
  priceUSDAnnual: CANONICAL_PRO_PLAN.priceUSDAnnual,
  description: 'Unlock unlimited plant scans, neural bio-signatures, and automated care sync',
  features: [
    'Unlimited Neural Vision Species Identification',
    'Deep Cellular Diagnostics & Pathology Cures',
    'Live Turgor Pressure & Conductance Telemetry',
    'Full Foliar Progress Timeline Gallery',
    'Unlimited Garden Plant Cloud Sync',
    '24/7 Sage AI Botanical Persona Memory',
    'Automated 2-way Google Calendar Schedule Push'
  ]
};

// Re-export types
export type { 
  RazorpayPlan, 
  RazorpayPaymentSuccessResponse, 
  ActiveSubscriptionState, 
  UserSubscriptionState,
  GstTaxBreakdown 
};

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
      console.error('Could not load official Razorpay script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiates order creation on the trusted backend with the user's auth token.
 */
export async function createBackendOrder(params: {
  planId: 'pro';
  billingCycle: BillingCycle;
  token: string;
}): Promise<CreateOrderSuccessResponse> {
  const response = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.token}`
    },
    body: JSON.stringify({
      planId: params.planId,
      billingCycle: params.billingCycle
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to initiate checkout order on server.');
  }

  return data as CreateOrderSuccessResponse;
}

/**
 * Submits returned Razorpay payment signature to the server for cryptographic verification.
 */
export async function verifyBackendPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  token: string;
}): Promise<VerifyPaymentSuccessResponse> {
  const response = await fetch('/api/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.token}`
    },
    body: JSON.stringify({
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Payment signature could not be verified by server.');
  }

  return data as VerifyPaymentSuccessResponse;
}

/**
 * Fetches server-authoritative subscription state for the authenticated user.
 */
export async function fetchSubscriptionStatus(token: string): Promise<UserSubscriptionState> {
  const response = await fetch('/api/subscription/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve subscription status from backend.');
  }

  const data = await response.json();
  return data.subscription as UserSubscriptionState;
}

/**
 * Fetches server-authoritative transaction history for the authenticated user.
 */
export async function fetchUserTransactions(token: string): Promise<ServerTransaction[]> {
  const response = await fetch('/api/subscription/transactions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve user transactions from backend.');
  }

  const data = await response.json();
  return data.transactions as ServerTransaction[];
}

/**
 * Opens official Razorpay modal with server order configuration.
 */
export async function launchRazorpayCheckout(options: {
  order: CreateOrderSuccessResponse;
  userEmail?: string;
  userName?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    const err = new Error('Razorpay Checkout SDK is unavailable or blocked by browser.');
    if (options.onError) options.onError(err);
    else throw err;
    return;
  }

  const checkoutOptions: RazorpayCheckoutOptions = {
    key: options.order.keyId || RAZORPAY_KEY_ID,
    amount: options.order.amount,
    currency: options.order.currency,
    name: 'Floravia Botanical AI',
    description: `Floravia Pro Plan (${options.order.billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
    order_id: options.order.orderId,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=128&q=80',
    handler: (res) => {
      options.onSuccess(res);
    },
    prefill: {
      name: options.userName || 'Floravia Botanist',
      email: options.userEmail || 'botanist@floravia.ai'
    },
    theme: {
      color: '#10b981'
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      }
    }
  };

  const rzp = new (window as any).Razorpay(checkoutOptions);
  rzp.on('payment.failed', (failRes: any) => {
    const errMessage = failRes?.error?.description || 'Payment was declined or cancelled.';
    if (options.onError) {
      options.onError(new Error(errMessage));
    }
  });

  rzp.open();
}

/**
 * Calculates official itemized GST breakdown for a subscription invoice.
 */
export const getSubscriptionGstInvoice = (
  amount: number, 
  currency: PaymentCurrency = 'INR'
): GstTaxBreakdown => {
  return calculateGstBreakdown(amount, currency);
};

/**
 * Caches verified payment receipt locally for instant audit history view.
 */
export const saveSubscriptionReceipt = async (
  receipt: RazorpayPaymentSuccessResponse
): Promise<{ success: boolean; signatureHash?: string }> => {
  try {
    const cleanReceipt: RazorpayPaymentSuccessResponse = {
      ...receipt,
      planId: receipt.planId || 'pro',
      planName: sanitizePaymentString(receipt.planName) || FLORAVIA_PRO_PLAN.name,
      userEmail: sanitizePaymentString(receipt.userEmail),
      tamperVerified: true
    };

    const existingRaw = typeof window !== 'undefined' ? localStorage.getItem('floravia_subscription_receipts') : null;
    const existing: RazorpayPaymentSuccessResponse[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    const filtered = existing.filter(item => item.razorpay_payment_id !== cleanReceipt.razorpay_payment_id);
    filtered.unshift(cleanReceipt);
    if (typeof window !== 'undefined') {
      localStorage.setItem('floravia_subscription_receipts', JSON.stringify(filtered.slice(0, 50)));
      window.dispatchEvent(new Event('storage'));
    }

    return { success: true };
  } catch (e) {
    console.error('Error saving subscription receipt locally:', e);
    return { success: false };
  }
};

/**
 * Retrieves all stored subscription receipts from localStorage cache.
 */
export const getLocalSubscriptionReceipts = (): RazorpayPaymentSuccessResponse[] => {
  try {
    if (typeof window === 'undefined') return [];
    const existingRaw = localStorage.getItem('floravia_subscription_receipts');
    if (!existingRaw) return [];
    const parsed = JSON.parse(existingRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Fallback read of active subscription (secondary to reactive useSubscription hook).
 */
export const getActiveSubscription = (): ActiveSubscriptionState | null => {
  try {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('floravia_current_plan');
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    if (!parsed || !parsed.expiresAt || !parsed.paymentId) {
      return null;
    }

    const expiryTime = new Date(parsed.expiresAt).getTime();
    if (isNaN(expiryTime) || expiryTime < Date.now()) {
      return null;
    }

    return parsed as ActiveSubscriptionState;
  } catch {
    return null;
  }
};
