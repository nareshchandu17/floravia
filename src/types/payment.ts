/**
 * Payment & Subscription Type Definitions
 * Enforces strict compile-time types across Razorpay checkout, verification, and Firestore auditing.
 */

export type PaymentStatus = 'captured' | 'failed' | 'refunded' | 'pending' | 'success';

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentCurrency = 'INR' | 'USD';

export type PaymentMethodType = 
  | 'CARD' 
  | 'UPI' 
  | 'NETBANKING' 
  | 'WALLET' 
  | 'RAZORPAY_CHECKOUT';

export type PlanTier = 'free' | 'pro';

export interface GstTaxBreakdown {
  netAmount: number;
  igstRate: number;      // e.g. 0.18 for 18%
  igstAmount: number;
  totalAmount: number;
  currency: PaymentCurrency;
  sacCode: string;        // HSN/SAC code 998434 for digital SaaS / cloud services
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

export interface ActiveSubscriptionState {
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  paymentId: string;
  orderId?: string;
  subscribedAt: string;
  expiresAt: string;
  signatureHash?: string;
  tamperVerified: boolean;
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
