import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { 
  createPaymentOrder, 
  verifyPayment, 
  verifyWebhookSignature, 
  processWebhookEvent, 
  getAuthoritativeSubscription,
  PaymentVerificationError,
  OrderCreationError
} from '../src/server/paymentService';
import { CANONICAL_PLANS } from '../src/services/paymentSchemas';

// Hermetic mock for external Razorpay gateway API calls (no external network dependency)
vi.mock('razorpay', () => {
  return {
    default: class MockRazorpay {
      orders = {
        create: vi.fn().mockImplementation(async (params: any) => ({
          id: `order_gateway_${Math.random().toString(36).substring(2, 12)}`,
          amount: params.amount,
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes,
          status: 'created'
        }))
      };
      payments = {
        fetch: vi.fn().mockImplementation(async (paymentId: string) => ({
          id: paymentId,
          amount: 502800,
          currency: 'INR',
          status: 'captured',
          method: 'CARD'
        }))
      };
    }
  };
});

describe('Floravia Production Payment Engine', () => {
  const TEST_KEY_ID = 'rzp_test_floraviaSecureTestKey123';
  const TEST_KEY_SECRET = 'floraviaSecretKeyCryptographic32Chars!';
  const TEST_WEBHOOK_SECRET = 'webhookSecretSignatureVerificationKey!';

  const TEST_USER = {
    uid: 'user_botanist_alpha_99',
    email: 'alice.botanist@floravia.ai'
  };

  const ATTACKER_USER = {
    uid: 'user_malicious_attacker_00',
    email: 'attacker@evil.com'
  };

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  // -------------------------------------------------------------
  // 1. Authoritative Pricing & Order Creation
  // -------------------------------------------------------------
  describe('1. Authoritative Server Order Creation', () => {
    it('creates an order with canonical server pricing (64900 paise for monthly)', async () => {
      const order = await createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'monthly'
      });

      expect(order).toBeDefined();
      expect(order.orderId).toMatch(/^order_/);
      expect(order.amount).toBe(CANONICAL_PLANS.pricing.monthly.amountPaiseINR); // 64900
      expect(order.currency).toBe('INR');
      expect(order.keyId).toBe(TEST_KEY_ID);
      expect(order.notes.userId).toBe(TEST_USER.uid);
      expect(order.notes.billingCycle).toBe('monthly');
    });

    it('creates an annual order with canonical annual pricing (502800 paise)', async () => {
      const order = await createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'yearly'
      });

      expect(order.amount).toBe(CANONICAL_PLANS.pricing.yearly.amountPaiseINR); // 502800
      expect(order.billingCycle).toBe('yearly');
    });

    it('rejects order creation with missing gateway credentials in environment', async () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.VITE_RAZORPAY_KEY_ID;

      await expect(createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'monthly'
      })).rejects.toThrow(OrderCreationError);
    });

    it('rejects order creation with invalid or unapproved plan tier', async () => {
      await expect(createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'unlimited_hacked_plan' as any,
        billingCycle: 'monthly'
      })).rejects.toThrow(OrderCreationError);
    });
  });

  // -------------------------------------------------------------
  // 2. Cryptographic Verification & Anti-Forgery
  // -------------------------------------------------------------
  describe('2. Cryptographic Signature Verification & Anti-Forgery', () => {
    it('successfully verifies a valid cryptographic HMAC SHA-256 signature and grants Pro entitlement', async () => {
      // Step A: Create valid order
      const order = await createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'yearly'
      });

      const paymentId = 'pay_realVerifiedPayment1001';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${order.orderId}|${paymentId}`)
        .digest('hex');

      // Step B: Verify payment
      const result = await verifyPayment({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        razorpay_order_id: order.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('captured');
      expect(result.subscription.isPro).toBe(true);
      expect(result.subscription.planId).toBe('pro');
      expect(result.subscription.status).toBe('active');
      expect(result.paymentId).toBe(paymentId);

      // Verify authoritative subscription lookup
      const authSub = await getAuthoritativeSubscription(TEST_USER.uid);
      expect(authSub.isPro).toBe(true);
      expect(authSub.planId).toBe('pro');
    });

    it('REJECTS forged signature even if prefixed with "sig_"', async () => {
      const order = await createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'monthly'
      });

      const forgedSignature = `sig_${'a'.repeat(60)}`; // 64 chars, starts with sig_

      await expect(verifyPayment({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        razorpay_order_id: order.orderId,
        razorpay_payment_id: 'pay_attackPayment1002',
        razorpay_signature: forgedSignature
      })).rejects.toThrow(PaymentVerificationError);
    });

    it('REJECTS tampered order ID in signature verification', async () => {
      const validOrder = await createPaymentOrder({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        planId: 'pro',
        billingCycle: 'monthly'
      });

      const fakeOrderId = 'order_fabricatedOrderId0001';
      const paymentId = 'pay_legitimatePayment1003';
      const signatureForFakeOrder = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${fakeOrderId}|${paymentId}`)
        .digest('hex');

      // Attempting to submit for real order with signature computed for different order
      await expect(verifyPayment({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        razorpay_order_id: validOrder.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureForFakeOrder
      })).rejects.toThrow(PaymentVerificationError);
    });

    it('REJECTS verification when key secret is missing', async () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(verifyPayment({
        userId: TEST_USER.uid,
        userEmail: TEST_USER.email,
        razorpay_order_id: 'order_testOrder12345',
        razorpay_payment_id: 'pay_testPayment12345',
        razorpay_signature: '0'.repeat(64)
      })).rejects.toThrow(PaymentVerificationError);
    });
  });

  // -------------------------------------------------------------
  // 3. Webhooks & Idempotency
  // -------------------------------------------------------------
  describe('3. Webhooks & Idempotent Processing', () => {
    it('validates authentic webhook signature with exact raw payload', () => {
      const rawPayload = JSON.stringify({
        entity: 'event',
        event: 'order.paid',
        created_at: 1718000000
      });

      const validSig = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      expect(verifyWebhookSignature(rawPayload, validSig)).toBe(true);
    });

    it('rejects tampered or forged webhook payload signature', () => {
      const rawPayload = JSON.stringify({ entity: 'event', event: 'order.paid' });
      const tamperedPayload = JSON.stringify({ entity: 'event', event: 'order.paid', extra: 'tampered' });

      const sigForOriginal = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      expect(verifyWebhookSignature(tamperedPayload, sigForOriginal)).toBe(false);
      expect(verifyWebhookSignature(rawPayload, 'invalid_signature_hex')).toBe(false);
    });

    it('idempotently handles duplicate webhook deliveries without duplicate side-effects', async () => {
      const targetUserId = 'user_webhook_target_01';
      const eventPayload: any = {
        entity: 'event',
        event: 'payment.captured',
        created_at: 1718100000,
        payload: {
          payment: {
            entity: {
              id: 'pay_webhookTestPayment999',
              order_id: 'order_webhookTestOrder888',
              amount: 502800,
              currency: 'INR',
              status: 'captured',
              notes: {
                userId: targetUserId,
                billingCycle: 'yearly'
              }
            }
          }
        }
      };

      const eventId = 'evt_testWebhookEventId001';

      // First delivery: processes and activates entitlement
      const firstResult = await processWebhookEvent(eventPayload, eventId);
      expect(firstResult.handled).toBe(true);
      expect(firstResult.action).toBe('entitlement_activated');

      const userSub = await getAuthoritativeSubscription(targetUserId);
      expect(userSub.isPro).toBe(true);

      // Second delivery (duplicate): recognized and skipped safely
      const secondResult = await processWebhookEvent(eventPayload, eventId);
      expect(secondResult.handled).toBe(true);
      expect(secondResult.duplicate).toBe(true);
      expect(secondResult.action).toBe('skipped_duplicate');
    });

    it('handles refund.processed event by canceling subscription entitlement', async () => {
      const refundedUser = 'user_refund_test_42';
      const paymentId = 'pay_refundTargetPayment777';

      // Setup active subscription
      await processWebhookEvent({
        entity: 'event',
        event: 'payment.captured',
        created_at: 1718200000,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: 'order_refundOrder777',
              amount: 64900,
              currency: 'INR',
              status: 'captured',
              notes: { userId: refundedUser, billingCycle: 'monthly' }
            }
          }
        }
      } as any, 'evt_sub_setup_01');

      let sub = await getAuthoritativeSubscription(refundedUser);
      expect(sub.isPro).toBe(true);

      // Process refund event
      const refundResult = await processWebhookEvent({
        entity: 'event',
        event: 'refund.processed',
        created_at: 1718200500,
        payload: {
          refund: {
            entity: {
              id: 'rfnd_001',
              payment_id: paymentId,
              amount: 64900,
              currency: 'INR',
              status: 'processed'
            }
          }
        }
      } as any, 'evt_refund_01');

      expect(refundResult.handled).toBe(true);
      expect(refundResult.action).toBe('refund_processed');

      // Entitlement revoked
      sub = await getAuthoritativeSubscription(refundedUser);
      expect(sub.isPro).toBe(false);
      expect(sub.status).toBe('canceled');
    });
  });

  // -------------------------------------------------------------
  // 4. Proof: Unverified Payment NEVER Grants Access
  // -------------------------------------------------------------
  describe('4. Proof: Unverified Payments Never Grant Access', () => {
    it('unauthenticated or unverified user has Free tier with isPro = false', async () => {
      const sub = await getAuthoritativeSubscription('unverified_random_user_999');
      expect(sub.isPro).toBe(false);
      expect(sub.planId).toBe('free');
      expect(sub.status).toBe('none');
    });

    it('failed payment attempt leaves user without Pro access', async () => {
      const failedUser = 'user_failed_attempt_33';
      const order = await createPaymentOrder({
        userId: failedUser,
        userEmail: 'failed@test.com',
        planId: 'pro',
        billingCycle: 'monthly'
      });

      // Gateway reports payment failure
      await processWebhookEvent({
        entity: 'event',
        event: 'payment.failed',
        created_at: 1718300000,
        payload: {
          payment: {
            entity: {
              id: 'pay_failedPayment001',
              order_id: order.orderId,
              amount: 64900,
              currency: 'INR',
              status: 'failed',
              error_description: 'Payment was declined by issuing bank'
            }
          }
        }
      } as any, 'evt_fail_01');

      const sub = await getAuthoritativeSubscription(failedUser);
      expect(sub.isPro).toBe(false);
      expect(sub.planId).toBe('free');
    });
  });
});
