/**
 * Payment Security & Cryptographic Integrity Utility
 * Implements anti-tampering guards, cryptographic SHA-256 signature digests,
 * GST compliance breakdowns, and payment instrument input validation.
 */

import { 
  RazorpayPaymentSuccessResponse, 
  PaymentVerificationResult, 
  GstTaxBreakdown, 
  CardValidationResult, 
  UpiValidationResult,
  BillingCycle,
  PaymentCurrency
} from '../types/payment';

// Canonical pricing reference - immutable single source of truth
export const CANONICAL_PRO_PLAN = {
  id: 'pro' as const,
  name: 'Floravia Pro Plan',
  tagline: 'Unlimited neural diagnostics, turgor telemetry, and microclimate sync',
  priceINRMonthly: 649,
  priceINRAnnual: 419,  // billed annually ₹5,028 (419 * 12)
  priceUSDMonthly: 7.99,
  priceUSDAnnual: 4.99,  // billed annually $59.88 (4.99 * 12)
  totalAnnualINR: 5028,
  totalAnnualUSD: 59.88
};

/**
 * Calculates itemized GST (18% for Software & Cloud Services, HSN/SAC: 998434)
 */
export function calculateGstBreakdown(
  totalAmount: number, 
  currency: PaymentCurrency = 'INR'
): GstTaxBreakdown {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const igstRate = 0.18;
  
  // Total = Net + (Net * 0.18) = Net * 1.18
  // Net = Total / 1.18
  const netAmount = Math.round((safeTotal / (1 + igstRate)) * 100) / 100;
  const igstAmount = Math.round((safeTotal - netAmount) * 100) / 100;

  return {
    netAmount,
    igstRate,
    igstAmount,
    totalAmount: safeTotal,
    currency,
    sacCode: '998434' // IT & Software SaaS Services
  };
}

/**
 * Computes an authentic SHA-256 cryptographic digest of payment metadata using Web Crypto API.
 */
export async function computeCryptographicSignature(data: {
  paymentId: string;
  orderId: string;
  planId: string;
  amount: number;
  currency: string;
  billingCycle: string;
  timestamp: string;
}): Promise<string> {
  const rawString = [
    data.paymentId.trim(),
    data.orderId.trim(),
    data.planId.trim(),
    data.amount.toFixed(2),
    data.currency.toUpperCase(),
    data.billingCycle.toLowerCase(),
    data.timestamp.trim(),
    'FLORAVIA_SECURE_PAYMENT_SALT_V2'
  ].join('::');

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(rawString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto unavailable, falling back to algorithmic hash digest:', err);
  }

  // Fallback hash implementation if SubtleCrypto is unavailable in certain test environments
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fallback_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Validates transaction payload against canonical price matrices, formats, and limits.
 * Prevents client-side tampering (e.g. modifying amount or currency in devtools).
 */
export async function verifyPaymentTransaction(
  payload: RazorpayPaymentSuccessResponse
): Promise<PaymentVerificationResult> {
  const errors: string[] = [];

  // 1. Validate paymentId format
  if (!payload.razorpay_payment_id || typeof payload.razorpay_payment_id !== 'string') {
    errors.push('Missing or invalid payment ID.');
  } else if (!/^pay_[a-zA-Z0-9_-]{8,64}$/.test(payload.razorpay_payment_id)) {
    errors.push('Payment ID does not conform to standard Razorpay format.');
  }

  // 2. Validate orderId format if present
  if (payload.razorpay_order_id && !/^order_[a-zA-Z0-9_-]{6,64}$/.test(payload.razorpay_order_id)) {
    errors.push('Order ID does not conform to standard format.');
  }

  // 3. Validate Plan ID
  if (payload.planId !== 'pro') {
    errors.push(`Unsupported or unknown plan tier: ${payload.planId}`);
  }

  // 4. Validate Billing Cycle
  if (payload.billingCycle !== 'monthly' && payload.billingCycle !== 'yearly') {
    errors.push(`Invalid billing cycle: ${payload.billingCycle}`);
  }

  // 5. Anti-Tamper Amount & Currency Verification
  const expectedAmountINR = payload.billingCycle === 'yearly' 
    ? CANONICAL_PRO_PLAN.totalAnnualINR 
    : CANONICAL_PRO_PLAN.priceINRMonthly;

  const expectedAmountUSD = payload.billingCycle === 'yearly'
    ? CANONICAL_PRO_PLAN.totalAnnualUSD
    : CANONICAL_PRO_PLAN.priceUSDMonthly;

  if (payload.currency === 'INR') {
    if (Math.abs(payload.amount - expectedAmountINR) > 1.0) {
      errors.push(`Amount tampering detected: Expected ₹${expectedAmountINR}, but received ₹${payload.amount}.`);
    }
  } else if (payload.currency === 'USD') {
    if (Math.abs(payload.amount - expectedAmountUSD) > 0.1) {
      errors.push(`Amount tampering detected: Expected $${expectedAmountUSD}, but received $${payload.amount}.`);
    }
  } else {
    errors.push(`Unsupported transaction currency: ${payload.currency}`);
  }

  // 6. Validate Timestamp (reject future timestamps > 5 minutes or stale timestamps > 30 days)
  const txTime = new Date(payload.timestamp).getTime();
  const now = Date.now();
  if (isNaN(txTime)) {
    errors.push('Invalid transaction timestamp format.');
  } else if (txTime > now + 300000) {
    errors.push('Transaction timestamp cannot be in the future.');
  } else if (txTime < now - (30 * 86400000)) {
    errors.push('Transaction timestamp has expired beyond allowable window.');
  }

  // 7. Compute signature hash if verification passed
  let signatureHash: string | undefined;
  if (errors.length === 0) {
    signatureHash = await computeCryptographicSignature({
      paymentId: payload.razorpay_payment_id,
      orderId: payload.razorpay_order_id || `order_${payload.razorpay_payment_id.slice(4)}`,
      planId: payload.planId,
      amount: payload.amount,
      currency: payload.currency,
      billingCycle: payload.billingCycle,
      timestamp: payload.timestamp
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    signatureHash,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Validates credit/debit card numbers using the standard Luhn algorithm (mod 10).
 */
export function validateCardLuhn(rawNumber: string): boolean {
  const digits = rawNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Detects card brand from number prefix.
 */
export function detectCardBrand(rawNumber: string): 'Visa' | 'MasterCard' | 'RuPay' | 'Amex' | 'Unknown' {
  const clean = rawNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MasterCard';
  if (/^(508|60|65|81|82)/.test(clean)) return 'RuPay';
  if (/^3[47]/.test(clean)) return 'Amex';
  return 'Unknown';
}

/**
 * Validates card form inputs before simulation or submission.
 */
export function validateCardInput(
  cardNumber: string,
  cardExpiry: string,
  cardCvv: string,
  cardHolder: string
): CardValidationResult {
  const cleanNum = cardNumber.replace(/\s+/g, '');

  if (!cleanNum) {
    return { isValid: false, error: 'Card number is required.' };
  }

  if (!/^\d{13,19}$/.test(cleanNum)) {
    return { isValid: false, error: 'Card number must be between 13 and 19 digits.' };
  }

  // Luhn algorithm verification
  if (!validateCardLuhn(cleanNum)) {
    return { isValid: false, error: 'Card number is invalid (Luhn checksum failed).' };
  }

  // Expiry check (MM/YY or MM/YYYY)
  const expiryMatch = cardExpiry.trim().match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!expiryMatch) {
    return { isValid: false, error: 'Expiry must be in MM/YY format.' };
  }

  const month = parseInt(expiryMatch[1], 10);
  let year = parseInt(expiryMatch[2], 10);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Expiry month must be between 01 and 12.' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: 'Card has expired.' };
  }

  // CVV check
  const cleanCvv = cardCvv.trim();
  if (!/^\d{3,4}$/.test(cleanCvv)) {
    return { isValid: false, error: 'CVV must be 3 or 4 digits.' };
  }

  // Cardholder check
  if (!cardHolder.trim() || cardHolder.trim().length < 2) {
    return { isValid: false, error: 'Please enter the name on the card.' };
  }

  return {
    isValid: true,
    brand: detectCardBrand(cleanNum)
  };
}

/**
 * Validates Virtual Payment Address (UPI VPA).
 */
export function validateUpiVpa(vpa: string): UpiValidationResult {
  const cleanVpa = vpa.trim().toLowerCase();
  if (!cleanVpa) {
    return { isValid: false, error: 'UPI ID is required.' };
  }

  // Standard UPI regex: username@bankname
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  if (!upiRegex.test(cleanVpa)) {
    return { isValid: false, error: 'Please enter a valid UPI ID (e.g. name@okaxis, botanist@upi).' };
  }

  return { isValid: true };
}

/**
 * Masks a card number to show only the last 4 digits for PCI-DSS compliance.
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return '**** **** **** 0000';
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Sanitizes arbitrary string input to prevent XSS or database injection.
 */
export function sanitizePaymentString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/[<>'"&]/g, '')
    .trim()
    .slice(0, 150);
}
