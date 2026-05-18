import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Check if we hit the limit or missing env variables
const getFirebaseAdmin = () => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_BASE64 env var is missing. Backend push notifications will be disabled.");
    return null;
  }

  try {
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    const app = initializeApp({
      credential: cert(serviceAccount)
    });

    const firestoreConfig = require('../../firebase-applet-config.json');
    const db = getFirestore(app);
    if (firestoreConfig?.firestoreDatabaseId) {
       db.settings({ databaseId: firestoreConfig.firestoreDatabaseId });
    }
    
    return {
      adminApp: app,
      adminDb: db,
      adminMessaging: getMessaging(app)
    };
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e);
    return null;
  }
};

export const firebaseAdmin = getFirebaseAdmin();
