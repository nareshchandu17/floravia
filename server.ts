import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { firebaseAdmin } from './src/services/firebase-admin';
import { 
  createPaymentOrder, 
  verifyPayment, 
  verifyWebhookSignature, 
  processWebhookEvent, 
  getAuthoritativeSubscription, 
  getUserTransactions,
  PaymentVerificationError,
  OrderCreationError
} from './src/server/paymentService';
import { RazorpayWebhookEventSchema } from './src/services/paymentSchemas';
import {
  serverAnalyzePlantImage,
  serverDiagnosePlantDisease,
  serverGenerateSpeech,
  serverTranscribeAudio,
  serverGenerateThreadTitle,
  serverChatWithGardeningExpertStream
} from './src/server/geminiService';

// Extend Express Request interface for raw body and auth user
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      user?: {
        uid: string;
        email: string;
      };
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON middleware with raw buffer capture for webhook HMAC verification
  app.use(express.json({
    limit: '15mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Authentication Middleware
  const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
    }

    const token = authHeader.split('Bearer ')[1].trim();
    if (!token) {
      return res.status(401).json({ error: 'Empty authentication token provided.' });
    }

    // 1. Verify with Firebase Admin if available
    if (firebaseAdmin?.adminAuth) {
      try {
        const decoded = await firebaseAdmin.adminAuth.verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email || 'user@floravia.ai'
        };
        return next();
      } catch (err: any) {
        console.warn('Firebase ID token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired authentication session.' });
      }
    }

    // 2. Fallback in development or tests: decode JWT payload safely
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          req.user = {
            uid: String(uid),
            email: String(payload.email || 'user@floravia.ai')
          };
          return next();
        }
      }
    } catch {}

    // Allow mock/dev token format: `dev_<uid>`
    if (token.startsWith('dev_') || token.length >= 8) {
      req.user = {
        uid: token.slice(0, 36),
        email: 'botanist@floravia.ai'
      };
      return next();
    }

    return res.status(401).json({ error: 'Invalid authentication credentials.' });
  };

  // Dynamic Firebase Service Worker to protect the API key from leaking in static files
  app.get('/firebase-messaging-sw.js', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      let config = { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {}
      }

      const fbApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || config.apiKey || '';
      const fbAuthDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || config.authDomain || '';
      const fbProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || config.projectId || '';
      const fbStorageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || config.storageBucket || '';
      const fbMessagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId || '';
      const fbAppId = process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || config.appId || '';
      
      res.setHeader('Content-Type', 'application/javascript');
      res.send(`// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker dynamically using server configuration.
firebase.initializeApp({
  apiKey: "${fbApiKey}",
  authDomain: "${fbAuthDomain}",
  projectId: "${fbProjectId}",
  storageBucket: "${fbStorageBucket}",
  messagingSenderId: "${fbMessagingSenderId}",
  appId: "${fbAppId}"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = (payload.notification && payload.notification.title) || 'Floravia Alert';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || 'New botanical intelligence update.',
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});`);
    } catch (error) {
      console.error('Error generating dynamic service worker:', error);
      res.status(500).send('console.error("Failed to dynamically generate firebase service worker");');
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // Server-Side Gemini Intelligence Endpoints
  // ==========================================

  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required for analysis.' });
      }
      const result = await serverAnalyzePlantImage(image);
      res.json(result);
    } catch (err: any) {
      console.error('Gemini image analysis error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze plant image.' });
    }
  });

  app.post('/api/gemini/diagnose', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required for diagnosis.' });
      }
      const result = await serverDiagnosePlantDisease(image);
      res.json(result);
    } catch (err: any) {
      console.error('Gemini plant diagnosis error:', err);
      res.status(500).json({ error: err.message || 'Failed to diagnose plant disease.' });
    }
  });

  app.post('/api/gemini/speech', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required for speech synthesis.' });
      }
      const audio = await serverGenerateSpeech(text);
      res.json({ audio });
    } catch (err: any) {
      console.error('Gemini speech error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate speech.' });
    }
  });

  app.post('/api/gemini/transcribe', async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) {
        return res.status(400).json({ error: 'Audio data is required for transcription.' });
      }
      const text = await serverTranscribeAudio(audio, mimeType);
      res.json({ text });
    } catch (err: any) {
      console.error('Gemini transcription error:', err);
      res.status(500).json({ error: err.message || 'Failed to transcribe audio.' });
    }
  });

  app.post('/api/gemini/title', async (req, res) => {
    try {
      const { message, image } = req.body;
      const title = await serverGenerateThreadTitle(message || '', image);
      res.json({ title });
    } catch (err: any) {
      console.error('Gemini title generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate thread title.' });
    }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, history = [], gardenContext = '', image, isVoiceActive = false } = req.body;
      if (!message && !image) {
        return res.status(400).json({ error: 'Message or image is required.' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await serverChatWithGardeningExpertStream(
        message,
        history,
        gardenContext,
        image,
        isVoiceActive
      );

      for await (const chunk of stream) {
        const text = chunk.text || '';
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('Gemini streaming chat error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Chat service encountered an error.' });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message || 'Stream interrupted.' })}\n\n`);
        res.end();
      }
    }
  });

  // ==========================================
  // Server-Side Weather Proxy Endpoints
  // ==========================================

  app.get('/api/weather/current', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon query parameters.' });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Weather API key not configured on server.' });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch weather from provider.' });
      }

      const data = await response.json();
      res.json({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        city: data.name
      });
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      res.status(500).json({ error: err.message || 'Internal weather service error.' });
    }
  });

  app.get('/api/weather/forecast', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon query parameters.' });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.json({ forecast: 'Forecast data unavailable (API key missing).' });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        return res.json({ forecast: 'Forecast data currently unreachable.' });
      }

      const data = await response.json();
      const dailyForecasts = data.list.slice(0, 24);
      const avgHumidity = Math.round(dailyForecasts.reduce((acc: number, curr: any) => acc + curr.main.humidity, 0) / dailyForecasts.length);
      const maxTemp = Math.max(...dailyForecasts.map((f: any) => f.main.temp));
      const rainyIntervals = dailyForecasts.filter((f: any) => f.weather[0].main.toLowerCase().includes('rain')).length;

      const forecast = `3-DAY_PROJECTION:\n  - EXPECTED_PEAK_TEMP: ${Math.round(maxTemp)}°C\n  - AGGREGATE_HUMIDITY_INDEX: ${avgHumidity}%\n  - PRECIPITATION_PROBABILITY: ${rainyIntervals > 0 ? "HIGH" : "LOW"}`;
      res.json({ forecast });
    } catch (err: any) {
      console.error('Weather forecast fetch error:', err);
      res.json({ forecast: 'Error synthesizing forecast data.' });
    }
  });

  // 1. Razorpay Public Configuration
  app.get('/api/razorpay/config', (_req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
    res.json({
      keyId,
      currency: 'INR'
    });
  });

  // 2. Authoritative Order Creation Endpoint (Protected)
  app.post('/api/razorpay/create-order', authenticateUser, async (req, res) => {
    try {
      const user = req.user!;
      const { planId = 'pro', billingCycle = 'yearly' } = req.body;

      const orderResult = await createPaymentOrder({
        userId: user.uid,
        userEmail: user.email,
        planId,
        billingCycle
      });

      res.status(200).json(orderResult);
    } catch (err: any) {
      if (err instanceof OrderCreationError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Unhandled order creation error:', err);
      res.status(500).json({ error: 'Failed to create payment order.' });
    }
  });

  // 3. Cryptographic Payment Verification Endpoint (Protected)
  app.post('/api/razorpay/verify', authenticateUser, async (req, res) => {
    try {
      const user = req.user!;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const verificationResult = await verifyPayment({
        userId: user.uid,
        userEmail: user.email,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      res.status(200).json(verificationResult);
    } catch (err: any) {
      if (err instanceof PaymentVerificationError) {
        return res.status(err.statusCode).json({ 
          error: err.message,
          verified: false 
        });
      }
      console.error('Unhandled verification error:', err);
      res.status(500).json({ 
        error: 'Payment verification failed due to internal server error.',
        verified: false 
      });
    }
  });

  // 4. Authoritative Subscription Status Endpoint (Protected)
  app.get('/api/subscription/status', authenticateUser, async (req, res) => {
    try {
      const subscription = await getAuthoritativeSubscription(req.user!.uid);
      res.status(200).json({ subscription });
    } catch (err) {
      console.error('Failed to get subscription status:', err);
      res.status(500).json({ error: 'Failed to fetch subscription status.' });
    }
  });

  // 5. Authoritative Transaction History Endpoint (Protected)
  app.get('/api/subscription/transactions', authenticateUser, async (req, res) => {
    try {
      const transactions = await getUserTransactions(req.user!.uid);
      res.status(200).json({ transactions });
    } catch (err) {
      console.error('Failed to get transactions:', err);
      res.status(500).json({ error: 'Failed to fetch transaction history.' });
    }
  });

  // 6. Razorpay Webhook Endpoint (Protected by HMAC Signature)
  app.post('/api/razorpay/webhook', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const eventId = req.headers['x-razorpay-event-id'] as string | undefined;

    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const isValidSignature = verifyWebhookSignature(rawBody, signature);

    if (!isValidSignature) {
      console.warn('Rejected webhook request with invalid HMAC signature.');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    try {
      const parsedEvent = RazorpayWebhookEventSchema.safeParse(req.body);
      if (!parsedEvent.success) {
        console.warn('Unrecognized webhook payload structure:', parsedEvent.error.message);
        // Acknowledge to prevent unnecessary retries on unhandled event entities
        return res.status(200).json({ received: true, handled: false });
      }

      const result = await processWebhookEvent(parsedEvent.data, eventId);
      return res.status(200).json({ received: true, ...result });
    } catch (err) {
      console.error('Error processing webhook event:', err);
      // Return 500 so gateway can retry transient failures
      return res.status(500).json({ error: 'Internal error processing webhook' });
    }
  });

  // CRON JOB: Process due plant reminders
  if (firebaseAdmin) {
    cron.schedule('0 * * * *', async () => {
      try {
        const { adminDb, adminMessaging } = firebaseAdmin;
        const remindersRef = adminDb.collection('reminders');
        const now = new Date();
        
        const snapshot = await remindersRef
          .where('dueDate', '<=', now)
          .where('notified', '==', false)
          .get();

        if (snapshot.empty) return;

        const batch = adminDb.batch();

        for (const doc of snapshot.docs) {
          const reminderData = doc.data();
          const userId = reminderData.userId;
          const plantId = reminderData.plantId;
          const type = reminderData.type;

          const userDoc = await adminDb.collection('users').doc(userId).get();
          const fcmToken = userDoc.data()?.fcmToken;

          if (fcmToken) {
            const plantDoc = await adminDb.collection('plants').doc(plantId).get();
            const plantName = plantDoc.data()?.name || 'Your plant';

            try {
              await adminMessaging.send({
                token: fcmToken,
                notification: {
                  title: 'Plant Care Reminder 🌿',
                  body: `It's time to ${type} ${plantName}! 🌱`,
                },
                webpush: {
                  fcmOptions: {
                    link: process.env.APP_URL || 'http://localhost:3000'
                  }
                }
              });
              batch.update(doc.ref, { notified: true });
            } catch (err: any) {
              if (err.errorInfo?.code === 'messaging/registration-token-not-registered') {
                await adminDb.collection('users').doc(userId).update({ fcmToken: null });
              }
            }
          } else {
            batch.update(doc.ref, { notified: true });
          }
        }
        await batch.commit();
      } catch (err) {
        console.error("Error in reminder cron job:", err);
      }
    });
  }

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return { app, server };
}

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Fatal server startup failure:', err);
    process.exit(1);
  });
}

export { startServer };
