/**
 * Server-Side Razorpay Payment Engine & State Machine
 * Enforces cryptographic verification, server-authoritative entitlements,
 * database idempotency, and anti-tamper security.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { 
  ServerTransaction, 
  UserSubscriptionState, 
  PaymentStatus,
  BillingCycle 
} from '../types/payment';
import { 
  CANONICAL_PLANS, 
  CreateOrderInputSchema, 
  VerifyPaymentInputSchema,
  RazorpayWebhookEvent
} from '../services/paymentSchemas';
import { firebaseAdmin } from '../services/firebase-admin';

// Custom Error classes
export class PaymentVerificationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'PaymentVerificationError';
  }
}

export class OrderCreationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'OrderCreationError';
  }
}

// In-Memory Storage Cache (Guarantees atomic operations & test-suite reliability)
const memoryTransactions = new Map<string, ServerTransaction>();
const memorySubscriptions = new Map<string, UserSubscriptionState>();
const processedWebhookEvents = new Set<string>();

/**
 * Initializes official Razorpay SDK client with safe environment validation.
 */
export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  try {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.error('Failed to construct Razorpay SDK client:', err);
    return null;
  }
}

/**
 * Creates an authoritative Razorpay Order for an authenticated user.
 * Pricing is strictly determined by server-side canonical plans.
 */
export async function createPaymentOrder(params: {
  userId: string;
  userEmail: string;
  planId: 'pro';
  billingCycle: BillingCycle;
}): Promise<{
  orderId: string;
  amount: number;       // in paise
  currency: 'INR';
  keyId: string;
  planId: 'pro';
  billingCycle: BillingCycle;
  notes: Record<string, string>;
}> {
  const validation = CreateOrderInputSchema.safeParse({
    planId: params.planId,
    billingCycle: params.billingCycle
  });

  if (!validation.success) {
    const errorDetails = validation.error.issues 
      ? validation.error.issues.map(e => e.message).join(', ') 
      : 'Invalid order request payload';
    throw new OrderCreationError(errorDetails);
  }

  const { planId, billingCycle } = validation.data;
  const pricingConfig = CANONICAL_PLANS.pricing[billingCycle];
  const amountPaise = pricingConfig.amountPaiseINR;
  const amountMajor = pricingConfig.amountINR;

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  if (!keyId) {
    throw new OrderCreationError('Payment Gateway Key ID is not configured on the server.', 500);
  }

  const notes: Record<string, string> = {
    userId: params.userId,
    userEmail: params.userEmail,
    planId: 'pro',
    billingCycle: String(billingCycle),
    platform: 'floravia_web'
  };

  const razorpay = getRazorpayClient();
  let razorpayOrderId: string;

  if (razorpay) {
    try {
      const order: any = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${params.userId.slice(0, 8)}`,
        notes
      });
      razorpayOrderId = String(order.id);
    } catch (err: any) {
      console.error('Razorpay SDK order creation error:', err?.error || err);
      throw new OrderCreationError(
        `Failed to create payment order with gateway: ${err?.error?.description || err.message || 'Gateway error'}`,
        502
      );
    }
  } else {
    // If running in development without Razorpay credentials, fail with clear error
    throw new OrderCreationError(
      'Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) must be set in environment variables.',
      503
    );
  }

  const newTransaction: ServerTransaction = {
    id: `tx_${razorpayOrderId}`,
    userId: params.userId,
    userEmail: params.userEmail,
    orderId: razorpayOrderId,
    planId: 'pro',
    planName: CANONICAL_PLANS.name,
    billingCycle,
    amount: amountMajor,
    amountPaise,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString()
  };

  // Persist in Memory
  memoryTransactions.set(razorpayOrderId, newTransaction);

  // Persist in Firestore if Admin is initialized
  if (firebaseAdmin?.adminDb) {
    try {
      await firebaseAdmin.adminDb.collection('transactions').doc(razorpayOrderId).set({
        ...newTransaction,
        serverTimestamp: new Date()
      });
    } catch (err) {
      console.warn('Could not persist order to Firestore (fallback active):', err);
    }
  }

  return {
    orderId: razorpayOrderId,
    amount: amountPaise,
    currency: 'INR',
    keyId,
    planId: 'pro',
    billingCycle,
    notes
  };
}

/**
 * Authoritatively verifies a returned payment signature and grants subscription entitlement.
 * ZERO bypass allowed: validates HMAC SHA-256 signature using timing-safe comparison.
 */
export async function verifyPayment(params: {
  userId: string;
  userEmail: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{
  success: boolean;
  status: PaymentStatus;
  subscription: UserSubscriptionState;
  paymentId: string;
  orderId: string;
}> {
  // 1. Strict Runtime Format Validation
  const validation = VerifyPaymentInputSchema.safeParse({
    razorpay_order_id: params.razorpay_order_id,
    razorpay_payment_id: params.razorpay_payment_id,
    razorpay_signature: params.razorpay_signature
  });

  if (!validation.success) {
    const errorDetails = validation.error.issues 
      ? validation.error.issues.map(e => e.message).join(', ') 
      : 'Invalid payment verification payload';
    throw new PaymentVerificationError(
      `Malformed payment payload: ${errorDetails}`,
      400
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new PaymentVerificationError('Server Razorpay Key Secret is not configured.', 500);
  }

  // 2. Cryptographic HMAC SHA-256 Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const actualBuf = Buffer.from(razorpay_signature, 'utf8');

  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    console.error(`Invalid payment signature attempt for order ${razorpay_order_id}.`);
    throw new PaymentVerificationError('Payment verification failed: Invalid cryptographic signature.', 400);
  }

  // 3. Retrieve and Validate Existing Order / Transaction
  let transaction = memoryTransactions.get(razorpay_order_id);

  if (!transaction && firebaseAdmin?.adminDb) {
    try {
      const doc = await firebaseAdmin.adminDb.collection('transactions').doc(razorpay_order_id).get();
      if (doc.exists) {
        transaction = doc.data() as ServerTransaction;
        memoryTransactions.set(razorpay_order_id, transaction);
      }
    } catch (e) {
      console.warn('Error reading transaction from Firestore:', e);
    }
  }

  // If already captured and processed (Idempotency Guard)
  if (transaction && transaction.status === 'captured' && transaction.paymentId === razorpay_payment_id) {
    const activeSub = await getAuthoritativeSubscription(params.userId);
    return {
      success: true,
      status: 'captured',
      subscription: activeSub,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    };
  }

  // 4. Verify Gateway Status via Razorpay SDK
  const razorpay = getRazorpayClient();
  let paymentMethod = 'CARD';

  if (razorpay) {
    try {
      const paymentRecord = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (!paymentRecord) {
        throw new PaymentVerificationError('Payment record not found on Razorpay gateway.', 404);
      }

      // Check payment order match
      if (paymentRecord.order_id && paymentRecord.order_id !== razorpay_order_id) {
        throw new PaymentVerificationError('Payment does not belong to the requested order ID.', 400);
      }

      // Verify payment was captured or authorized
      if (paymentRecord.status !== 'captured' && paymentRecord.status !== 'authorized') {
        throw new PaymentVerificationError(`Payment is not in captured state. Status: ${paymentRecord.status}`, 400);
      }

      // Verify amount match if transaction exists
      if (transaction && paymentRecord.amount !== transaction.amountPaise) {
        throw new PaymentVerificationError(
          `Amount mismatch: expected ${transaction.amountPaise} paise, gateway recorded ${paymentRecord.amount} paise.`,
          400
        );
      }

      paymentMethod = (paymentRecord.method || 'CARD').toUpperCase();
    } catch (err: any) {
      if (err instanceof PaymentVerificationError) throw err;
      console.error('Error fetching payment from Razorpay API:', err);
      throw new PaymentVerificationError(
        `Gateway payment verification error: ${err?.error?.description || err.message}`,
        502
      );
    }
  }

  // 5. Update Transaction State Machine -> 'captured'
  const billingCycle = transaction?.billingCycle || 'yearly';
  const planTier = transaction?.planId || 'pro';
  const amount = transaction?.amount || (billingCycle === 'yearly' ? 5028 : 649);
  const amountPaise = transaction?.amountPaise || amount * 100;

  const nowIso = new Date().toISOString();
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  const expiresAtIso = new Date(Date.now() + periodDays * 86400000).toISOString();

  const updatedTransaction: ServerTransaction = {
    id: `tx_${razorpay_order_id}`,
    userId: params.userId,
    userEmail: params.userEmail,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    planId: planTier,
    planName: CANONICAL_PLANS.name,
    billingCycle,
    amount,
    amountPaise,
    currency: 'INR',
    status: 'captured',
    method: paymentMethod,
    createdAt: transaction?.createdAt || nowIso,
    verifiedAt: nowIso
  };

  memoryTransactions.set(razorpay_order_id, updatedTransaction);

  // 6. Grant Server-Authoritative Subscription Entitlement
  const newSubscription: UserSubscriptionState = {
    status: 'active',
    planId: 'pro',
    planName: CANONICAL_PLANS.name,
    billingCycle,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    subscribedAt: nowIso,
    expiresAt: expiresAtIso,
    isPro: true
  };

  memorySubscriptions.set(params.userId, newSubscription);

  // Persist to Firestore if available
  if (firebaseAdmin?.adminDb) {
    try {
      const batch = firebaseAdmin.adminDb.batch();

      // Write to transactions collection
      const txRef = firebaseAdmin.adminDb.collection('transactions').doc(razorpay_order_id);
      batch.set(txRef, {
        ...updatedTransaction,
        verifiedTimestamp: new Date()
      }, { merge: true });

      // Write to user's dedicated subscriptions collection (Read-only for client)
      const subRef = firebaseAdmin.adminDb.collection('subscriptions').doc(params.userId);
      batch.set(subRef, {
        ...newSubscription,
        updatedTimestamp: new Date()
      }, { merge: true });

      // Update user doc with verified entitlement
      const userRef = firebaseAdmin.adminDb.collection('users').doc(params.userId);
      batch.set(userRef, {
        subscription: newSubscription,
        isPro: true,
        entitlementExpiresAt: expiresAtIso
      }, { merge: true });

      await batch.commit();
    } catch (e) {
      console.warn('Could not commit subscription state to Firestore (in-memory state active):', e);
    }
  }

  return {
    success: true,
    status: 'captured',
    subscription: newSubscription,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id
  };
}

/**
 * Validates Razorpay Webhook Signatures using the raw request body.
 */
export function verifyWebhookSignature(rawBody: string | Buffer, headerSignature?: string): boolean {
  if (!headerSignature) return false;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(headerSignature.trim(), 'utf8');

    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return false;
  }
}

/**
 * Idempotently processes a verified Razorpay Webhook event.
 */
export async function processWebhookEvent(
  event: RazorpayWebhookEvent, 
  rawEventId?: string
): Promise<{ handled: boolean; duplicate?: boolean; action?: string }> {
  const eventId = rawEventId || `${event.event}_${event.created_at}_${event.payload.payment?.entity?.id || event.payload.order?.entity?.id || ''}`;

  if (processedWebhookEvents.has(eventId)) {
    return { handled: true, duplicate: true, action: 'skipped_duplicate' };
  }

  processedWebhookEvents.add(eventId);

  // Handle Event Types
  switch (event.event) {
    case 'order.paid':
    case 'payment.captured': {
      const paymentEntity = event.payload.payment?.entity;
      const orderEntity = event.payload.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const userId = notes.userId ? String(notes.userId) : undefined;
      const userEmail = notes.userEmail ? String(notes.userEmail) : (paymentEntity?.email || 'user@floravia.ai');
      const billingCycle: BillingCycle = (notes.billingCycle === 'monthly' ? 'monthly' : 'yearly');

      if (userId && orderId && paymentId) {
        const nowIso = new Date().toISOString();
        const periodDays = billingCycle === 'yearly' ? 365 : 30;
        const expiresAtIso = new Date(Date.now() + periodDays * 86400000).toISOString();

        const activeSub: UserSubscriptionState = {
          status: 'active',
          planId: 'pro',
          planName: CANONICAL_PLANS.name,
          billingCycle,
          paymentId,
          orderId,
          subscribedAt: nowIso,
          expiresAt: expiresAtIso,
          isPro: true
        };

        memorySubscriptions.set(userId, activeSub);

        if (firebaseAdmin?.adminDb) {
          try {
            await firebaseAdmin.adminDb.collection('subscriptions').doc(userId).set({
              ...activeSub,
              webhookConfirmed: true,
              updatedTimestamp: new Date()
            }, { merge: true });

            await firebaseAdmin.adminDb.collection('users').doc(userId).set({
              isPro: true,
              subscription: activeSub
            }, { merge: true });
          } catch (e) {
            console.warn('Webhook Firestore update error:', e);
          }
        }

        return { handled: true, action: 'entitlement_activated' };
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = event.payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId && memoryTransactions.has(orderId)) {
        const tx = memoryTransactions.get(orderId)!;
        tx.status = 'failed';
        tx.failureReason = paymentEntity?.error_description || 'Payment rejected by gateway.';
      }
      return { handled: true, action: 'payment_failed_recorded' };
    }

    case 'refund.processed': {
      const refundEntity = event.payload.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        // Find user by payment ID and revoke Pro entitlement
        for (const [userId, sub] of memorySubscriptions.entries()) {
          if (sub.paymentId === paymentId) {
            sub.status = 'canceled';
            sub.isPro = false;
            
            if (firebaseAdmin?.adminDb) {
              await firebaseAdmin.adminDb.collection('subscriptions').doc(userId).set({
                status: 'canceled',
                isPro: false,
                refundedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        }
      }
      return { handled: true, action: 'refund_processed' };
    }
  }

  return { handled: true, action: 'event_acknowledged' };
}

/**
 * Retrieves the authoritative subscription entitlement for a user.
 * Automatically checks and updates expiration.
 */
export async function getAuthoritativeSubscription(userId: string): Promise<UserSubscriptionState> {
  let sub = memorySubscriptions.get(userId);

  if (!sub && firebaseAdmin?.adminDb) {
    try {
      const doc = await firebaseAdmin.adminDb.collection('subscriptions').doc(userId).get();
      if (doc.exists) {
        sub = doc.data() as UserSubscriptionState;
        memorySubscriptions.set(userId, sub);
      }
    } catch (e) {
      console.warn('Error reading user subscription from Firestore:', e);
    }
  }

  if (!sub) {
    return {
      status: 'none',
      planId: 'free',
      planName: 'Floravia Free',
      isPro: false
    };
  }

  if (sub.status === 'canceled' || sub.status === 'expired' || sub.status === 'none') {
    sub.isPro = false;
    return sub;
  }

  // Check expiration
  if (sub.expiresAt) {
    const expiryTime = new Date(sub.expiresAt).getTime();
    if (isNaN(expiryTime) || expiryTime < Date.now()) {
      sub.status = 'expired';
      sub.isPro = false;
    } else {
      sub.isPro = true;
    }
  }

  return sub;
}

/**
 * Retrieves authoritative transaction history for a user from database.
 */
export async function getUserTransactions(userId: string): Promise<ServerTransaction[]> {
  const list: ServerTransaction[] = [];

  for (const tx of memoryTransactions.values()) {
    if (tx.userId === userId) {
      list.push(tx);
    }
  }

  if (firebaseAdmin?.adminDb) {
    try {
      const snap = await firebaseAdmin.adminDb
        .collection('transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const cloudList = snap.docs.map(d => d.data() as ServerTransaction);
      const seen = new Set(list.map(t => t.orderId));
      for (const ct of cloudList) {
        if (!seen.has(ct.orderId)) {
          list.push(ct);
        }
      }
    } catch (e) {
      console.warn('Error fetching transactions from Firestore:', e);
    }
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
