import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

    let firestoreConfig: any = {};
    try {
      firestoreConfig = require('../../firebase-applet-config.json');
    } catch {}
    const db = getFirestore(app);
    const databaseId = process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || firestoreConfig?.firestoreDatabaseId;
    if (databaseId) {
       db.settings({ databaseId });
    }
    
    return {
      adminApp: app,
      adminDb: db,
      adminAuth: getAuth(app),
      adminMessaging: getMessaging(app)
    };
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e);
    return null;
  }
};

export const firebaseAdmin = getFirebaseAdmin();
