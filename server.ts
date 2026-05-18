import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cron from 'node-cron';
import { firebaseAdmin } from './src/services/firebase-admin';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Route - We don't necessarily need a public route just for cron,
  // but let's provide a health check endpoint.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // CRON JOB SETUP: Run every hour to check for due reminders
  if (firebaseAdmin) {
    console.log("Firebase Admin initialized. Setting up notification cron job.");
    
    // Check every hour (using '0 * * * *')
    cron.schedule('0 * * * *', async () => {
      console.log('Running plant reminder check task...');
      try {
        const { adminDb, adminMessaging } = firebaseAdmin;
        
        // Find reminders where due date is now or in the past, and we haven't notified yet.
        const remindersRef = adminDb.collection('reminders');
        const now = new Date();
        
        const snapshot = await remindersRef
          .where('dueDate', '<=', now)
          .where('notified', '==', false)
          .get();

        if (snapshot.empty) {
          console.log('No due reminders found.');
          return;
        }

        console.log(`Found ${snapshot.size} reminders to process.`);

        const batch = adminDb.batch();

        for (const doc of snapshot.docs) {
          const reminderData = doc.data();
          const userId = reminderData.userId;
          const plantId = reminderData.plantId;
          const type = reminderData.type;

          // 1. Fetch user to get FCM token
          const userDoc = await adminDb.collection('users').doc(userId).get();
          const fcmToken = userDoc.data()?.fcmToken;

          if (fcmToken) {
            // 2. Fetch plant to get the name for a nice message
            const plantDoc = await adminDb.collection('plants').doc(plantId).get();
            const plantName = plantDoc.data()?.name || 'Your plant';

            try {
              // 3. Send Notification
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
              
              // 4. Mark as notified so we don't spam them
              batch.update(doc.ref, { notified: true });
              console.log(`Sent notification to user ${userId} for ${plantName} (${type}).`);

            } catch (err: any) {
              console.error(`Error sending message to token ${fcmToken}:`, err);
              // If token is invalid, we might want to delete it from the user doc in a real app
              if (err.errorInfo?.code === 'messaging/registration-token-not-registered') {
                await adminDb.collection('users').doc(userId).update({
                  fcmToken: null // Or use FieldValue.delete()
                });
              }
            }
          } else {
             // Mark as notified anyway since we can't reach them, prevent processing again
             batch.update(doc.ref, { notified: true });
          }
        }
        
        // Commit the batch update for all notified reminders
        await batch.commit();

      } catch (err) {
        console.error("Error in reminder cron job:", err);
      }
    });
  } else {
    console.warn("Firebase Admin not configured. Push Notification cron job is disabled.");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
