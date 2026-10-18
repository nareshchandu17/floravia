/**
 * Runtime Payment Validation Schemas via Zod
 * Enforces zero-trust input validation on browser payloads, webhooks, and gateway responses.
 */

import { z } from 'zod';
import { CanonicalPlanConfig } from '../types/payment';

// Immutable Canonical Pricing Configuration (Single Source of Truth)
export const CANONICAL_PLANS: CanonicalPlanConfig = {
  id: 'pro',
  name: 'Floravia Pro Plan',
  tagline: 'Unlimited neural diagnostics, turgor telemetry, and microclimate sync',
  description: 'Full-spectrum plant pathology cures, cellular conductance telemetry, and continuous cloud sync',
  features: [
    'Unlimited Neural Vision Species Identification',
    'Deep Cellular Diagnostics & Pathology Cures',
    'Live Turgor Pressure & Conductance Telemetry',
    'Full Foliar Progress Timeline Gallery',
    'Unlimited Garden Plant Cloud Sync',
    '24/7 Sage AI Botanical Persona Memory',
    'Automated 2-way Google Calendar Schedule Push'
  ],
  pricing: {
    monthly: {
      amountINR: 649,
      amountPaiseINR: 64900,
      amountUSD: 7.99,
      periodDays: 30
    },
    yearly: {
      amountINR: 5028,
      amountPaiseINR: 502800,
      amountUSD: 59.88,
      periodDays: 365
    }
  }
};

// Schema for client order creation requests
export const CreateOrderInputSchema = z.object({
  planId: z.literal('pro'),
  billingCycle: z.enum(['monthly', 'yearly'])
}).strict();

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

// Strict schema for payment verification requests from Razorpay Checkout callback
export const VerifyPaymentInputSchema = z.object({
  razorpay_order_id: z.string()
    .trim()
    .min(10, 'Razorpay order ID is too short')
    .max(64, 'Razorpay order ID is too long')
    .regex(/^order_[a-zA-Z0-9_-]+$/, 'Invalid Razorpay order ID format'),
  razorpay_payment_id: z.string()
    .trim()
    .min(10, 'Razorpay payment ID is too short')
    .max(64, 'Razorpay payment ID is too long')
    .regex(/^pay_[a-zA-Z0-9_-]+$/, 'Invalid Razorpay payment ID format'),
  razorpay_signature: z.string()
    .trim()
    .length(64, 'Razorpay signature must be a 64-character SHA-256 HMAC hex string')
    .regex(/^[a-fA-F0-9]{64}$/, 'Razorpay signature must be valid hexadecimal')
}).strict();

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

// Schema for Razorpay Webhook Events
export const RazorpayWebhookEventSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string().optional(),
  event: z.enum([
    'payment.authorized',
    'payment.captured',
    'payment.failed',
    'order.paid',
    'refund.created',
    'refund.processed',
    'refund.failed'
  ]),
  contains: z.array(z.string()).optional(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number().int().positive(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().nullable().optional(),
        method: z.string().optional(),
        email: z.string().optional(),
        contact: z.string().optional(),
        error_code: z.string().nullable().optional(),
        error_description: z.string().nullable().optional(),
        notes: z.record(z.string(), z.any()).optional()
      })
    }).optional(),
    order: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number().int().positive(),
        amount_paid: z.number().int().optional(),
        amount_due: z.number().int().optional(),
        currency: z.string(),
        status: z.string(),
        receipt: z.string().optional(),
        notes: z.record(z.string(), z.any()).optional()
      })
    }).optional(),
    refund: z.object({
      entity: z.object({
        id: z.string(),
        payment_id: z.string(),
        amount: z.number().int().positive(),
        currency: z.string(),
        status: z.string()
      })
    }).optional()
  }),
  created_at: z.number()
});

export type RazorpayWebhookEvent = z.infer<typeof RazorpayWebhookEventSchema>;
