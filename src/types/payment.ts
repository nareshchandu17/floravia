/**
 * Floravia Payment & Subscription Types
 * Production-grade, strictly typed definitions for Razorpay checkout, server-side
 * order management, cryptographic HMAC verification, and user entitlement auditing.
 */

export type PaymentStatus = 
  | 'created' 
  | 'pending' 
  | 'captured' 
  | 'failed' 
  | 'refunded';

export type BillingCycle = 'monthly' | 'yearly';

export type PlanTier = 'free' | 'pro';

export type PaymentCurrency = 'INR' | 'USD';

export type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'none';

export interface GstTaxBreakdown {
  netAmount: number;
  igstRate: number;      // e.g. 0.18 for 18%
  igstAmount: number;
  totalAmount: number;
  currency: PaymentCurrency;
  sacCode: string;       // HSN/SAC code 998434 for digital SaaS / cloud services
}

export interface CanonicalPlanConfig {
  id: 'pro';
  name: string;
  tagline: string;
  description: string;
  features: string[];
  pricing: {
    monthly: {
      amountINR: number;       // 649
      amountPaiseINR: number;  // 64900
      amountUSD: number;       // 7.99
      periodDays: number;      // 30
    };
    yearly: {
      amountINR: number;       // 5028
      amountPaiseINR: number;  // 502800
      amountUSD: number;       // 59.88
      periodDays: number;      // 365
    };
  };
}

export interface RazorpayPlan {
  id: PlanTier;
  name: string;
  tagline: string;
  priceINRMonthly: number;
  priceINRAnnual: number;
  priceUSDMonthly: number;
  priceUSDAnnual: number;
  description: string;
  features: string[];
}

export interface UserSubscriptionState {
  status: SubscriptionStatus;
  planId: PlanTier;
  planName: string;
  billingCycle?: BillingCycle;
  paymentId?: string;
  orderId?: string;
  subscribedAt?: string;
  expiresAt?: string;
  isPro: boolean;
}

export interface ServerTransaction {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  planId: PlanTier;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;         // in major currency units (e.g. 649)
  amountPaise: number;    // in paise (e.g. 64900)
  currency: PaymentCurrency;
  status: PaymentStatus;
  method?: string;
  createdAt: string;
  verifiedAt?: string;
  failureReason?: string;
  refundId?: string;
}

export interface CreateOrderRequestPayload {
  planId: 'pro';
  billingCycle: BillingCycle;
}

export interface CreateOrderSuccessResponse {
  orderId: string;
  amount: number;       // In paise for Razorpay Checkout
  currency: 'INR';
  keyId: string;
  planId: 'pro';
  billingCycle: BillingCycle;
  notes: {
    userId: string;
    planId: string;
    billingCycle: string;
  };
}

export interface VerifyPaymentRequestPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentSuccessResponse {
  success: boolean;
  status: PaymentStatus;
  subscription: UserSubscriptionState;
  paymentId: string;
  orderId: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

// Retain compatibility interface for local receipt display
export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: PaymentCurrency;
  billingCycle: BillingCycle;
  timestamp: string;
  userEmail?: string;
  method?: string;
  signatureHash?: string;
  tamperVerified?: boolean;
  maskedCard?: string;
}

export interface ActiveSubscriptionState extends UserSubscriptionState {
  signatureHash?: string;
  tamperVerified?: boolean;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  errors: string[];
  signatureHash?: string;
  verifiedAt: string;
}

export interface CardValidationResult {
  isValid: boolean;
  error?: string;
  brand?: 'Visa' | 'MasterCard' | 'RuPay' | 'Amex' | 'Unknown';
}

export interface UpiValidationResult {
  isValid: boolean;
  error?: string;
}
