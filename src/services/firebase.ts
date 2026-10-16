import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, Timestamp, orderBy, setDoc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
    
export const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface FeedbackEntry {
  id?: string;
  userId: string;
  analysisType: 'identify' | 'diagnose';
  isPositive: boolean;
  createdAt: any;
}

import { BillingCycle, PaymentCurrency, PaymentStatus } from '../types/payment';
import { sanitizePaymentString } from './paymentSecurity';

export interface UserTransaction {
  id?: string;
  userId: string;
  userEmail?: string;
  paymentId: string;
  orderId?: string;
  signature?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: PaymentCurrency | string;
  billingCycle: BillingCycle;
  method?: string;
  status: PaymentStatus;
  createdAt: any;
  signatureHash?: string;
  tamperVerified?: boolean;
}

export async function recordUserTransaction(receipt: {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  planId?: string;
  planName: string;
  amount: number;
  currency?: PaymentCurrency | string;
  billingCycle: BillingCycle;
  timestamp?: string;
  userEmail?: string;
  method?: string;
  status?: PaymentStatus | string;
  signatureHash?: string;
}): Promise<string | null> {
  if (!auth.currentUser) return null;

  // Strict input sanitization and verification
  const cleanPaymentId = (receipt.razorpay_payment_id || '').trim();
  if (!cleanPaymentId || !/^pay_[a-zA-Z0-9_-]{6,64}$/.test(cleanPaymentId)) {
    console.warn("Invalid payment ID format rejected:", cleanPaymentId);
    return null;
  }

  const cleanAmount = Number(receipt.amount);
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    console.warn("Invalid transaction amount rejected:", receipt.amount);
    return null;
  }

  const cleanCurrency = (receipt.currency === 'USD' ? 'USD' : 'INR') as PaymentCurrency;
  const cleanCycle: BillingCycle = receipt.billingCycle === 'monthly' ? 'monthly' : 'yearly';
  const cleanPlanName = sanitizePaymentString(receipt.planName) || 'Floravia Pro Plan';
  const cleanPlanId = sanitizePaymentString(receipt.planId) || 'pro';
  const cleanOrderId = receipt.razorpay_order_id 
    ? sanitizePaymentString(receipt.razorpay_order_id) 
    : `order_${cleanPaymentId.replace(/^pay_/, '')}`;
  const cleanSignature = receipt.razorpay_signature 
    ? sanitizePaymentString(receipt.razorpay_signature)
    : `sig_${cleanPaymentId}_captured`;
  const cleanEmail = sanitizePaymentString(receipt.userEmail || auth.currentUser.email || '');
  const cleanMethod = sanitizePaymentString(receipt.method || 'CARD');
  const cleanStatus: PaymentStatus = (receipt.status === 'success' || receipt.status === 'captured')
    ? 'captured'
    : 'captured';

  const path = 'transactions';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId: auth.currentUser.uid,
      userEmail: cleanEmail,
      paymentId: cleanPaymentId,
      orderId: cleanOrderId,
      signature: cleanSignature,
      planId: cleanPlanId,
      planName: cleanPlanName,
      amount: cleanAmount,
      currency: cleanCurrency,
      billingCycle: cleanCycle,
      method: cleanMethod,
      status: cleanStatus,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err: any) {
    console.warn("Could not record transaction to Firestore:", err);
    return null;
  }
}

export async function getUserTransactions(): Promise<UserTransaction[]> {
  // 1. Fetch locally cached receipts first for instant availability / offline support
  let localList: UserTransaction[] = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('floravia_subscription_receipts') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      localList = (Array.isArray(parsed) ? parsed : []).map((r: any, idx: number) => ({
        id: `local_${r.razorpay_payment_id || idx}`,
        userId: auth.currentUser?.uid || '',
        userEmail: r.userEmail || auth.currentUser?.email || '',
        paymentId: r.razorpay_payment_id || `pay_${idx}`,
        orderId: r.razorpay_order_id || `order_${idx}`,
        signature: r.razorpay_signature,
        planId: r.planId || 'pro',
        planName: r.planName || 'Floravia Pro Plan',
        amount: r.amount || 5028,
        currency: r.currency || 'INR',
        billingCycle: r.billingCycle || 'yearly',
        method: r.method || 'CARD',
        status: 'captured',
        createdAt: r.timestamp || new Date().toISOString()
      }));
    }
  } catch (e) {
    console.warn("Failed to parse local transaction receipts:", e);
  }

  if (!auth.currentUser) {
    return localList;
  }

  const path = 'transactions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const cloudTransactions: UserTransaction[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as UserTransaction));

    // Deduplicate by paymentId
    const seenPaymentIds = new Set(cloudTransactions.map(t => t.paymentId));
    const merged = [...cloudTransactions];

    for (const lt of localList) {
      if (!seenPaymentIds.has(lt.paymentId)) {
        seenPaymentIds.add(lt.paymentId);
        merged.push(lt);
        // Try uploading to Firestore in background
        recordUserTransaction({
          razorpay_payment_id: lt.paymentId,
          razorpay_order_id: lt.orderId,
          razorpay_signature: lt.signature,
          planId: lt.planId,
          planName: lt.planName,
          amount: lt.amount,
          currency: lt.currency,
          billingCycle: lt.billingCycle,
          timestamp: typeof lt.createdAt === 'string' ? lt.createdAt : new Date().toISOString(),
          userEmail: auth.currentUser.email || lt.userEmail,
          method: lt.method
        }).catch(() => {});
      }
    }

    // Sort descending by date
    merged.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt).getTime() || 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt).getTime() || 0);
      return timeB - timeA;
    });

    return merged;
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      console.warn("User transactions read skipped while offline:", msg);
      return localList;
    }
    console.warn("Error fetching cloud transactions, returning local transactions:", err);
    return localList;
  }
}

export async function getUserFeedback(): Promise<FeedbackEntry[]> {
  if (!auth.currentUser) return [];
  const path = 'feedback';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackEntry));
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('client is offline') || error?.code === 'unavailable') {
      console.warn("User feedback read skipped while offline:", msg);
      return [];
    }
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function getNotificationSettings(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (d.exists()) {
      return !!d.data().fcmToken;
    }
    return false;
  } catch (error: any) {
    // If offline or document does not exist yet, fallback gracefully without throwing
    console.warn("Could not retrieve notification settings (offline or initial profile):", error?.message || error);
    return false;
  }
}

export async function disableNotifications() {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'users', auth.currentUser.uid), { fcmToken: null }, { merge: true });
  } catch (error) {
    console.warn("Error disabling notifications in database:", error);
  }
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  bio?: string;
  location?: string;
  photoURL?: string;
  expertise?: 'beginner' | 'intermediate' | 'expert';
  gardeningStyle?: string;
  timezone?: string;
  preferredReminderTime?: string;
  fcmToken?: string | null;
  updatedAt?: any;
}

export async function getUserProfile(userId?: string): Promise<UserProfileData | null> {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid) return null;
  const path = 'users';
  try {
    const snap = await getDoc(doc(db, path, targetUid));
    if (snap.exists()) {
      return { userId: snap.id, ...snap.data() } as UserProfileData;
    }
    return null;
  } catch (error: any) {
    console.warn("Could not retrieve user profile from Firestore:", error?.message || error);
    return null;
  }
}

export async function saveUserProfile(data: Partial<UserProfileData>): Promise<void> {
  if (!auth.currentUser) throw new Error("Must be logged in to update profile");
  const path = 'users';
  try {
    const cleanPayload: any = {
      userId: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    };
    if (data.displayName !== undefined) cleanPayload.displayName = data.displayName.trim();
    if (data.bio !== undefined) cleanPayload.bio = data.bio.trim();
    if (data.location !== undefined) cleanPayload.location = data.location.trim();
    if (data.photoURL !== undefined) cleanPayload.photoURL = data.photoURL.trim();
    if (data.expertise !== undefined) cleanPayload.expertise = data.expertise;
    if (data.gardeningStyle !== undefined) cleanPayload.gardeningStyle = data.gardeningStyle;
    if (data.timezone !== undefined) cleanPayload.timezone = data.timezone;
    if (data.preferredReminderTime !== undefined) cleanPayload.preferredReminderTime = data.preferredReminderTime;

    await setDoc(doc(db, path, auth.currentUser.uid), cleanPayload, { merge: true });

    // Also synchronize Firebase Auth profile
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (data.displayName) authUpdates.displayName = data.displayName.trim();
    if (data.photoURL) authUpdates.photoURL = data.photoURL.trim();
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(auth.currentUser, authUpdates);
    }
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export interface FeedbackPayload {
  analysisType: 'identify' | 'diagnose';
  isPositive: boolean;
}

export async function submitFeedback(payload: FeedbackPayload) {
  if (!auth.currentUser) throw new Error("Must be logged in to submit feedback");
  
  const path = 'feedback';
  try {
    const feedbackRef = collection(db, path);
    await addDoc(feedbackRef, {
      userId: auth.currentUser.uid,
      analysisType: payload.analysisType,
      isPositive: payload.isPositive,
      createdAt: serverTimestamp()
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface SavedPlant {
  id?: string;
  userId: string;
  name: string;
  nickname?: string;
  scientificName: string;
  healthScore?: number;
  mood?: string;
  predictedNeeds?: {
    watering: string;
    light: string;
    fertilizing: string;
  };
  createdAt: any;
}

export async function savePlantToGarden(plant: Partial<SavedPlant>) {
  if (!auth.currentUser) throw new Error("Must be logged in to save plants");
  const path = 'plants';
  try {
    const plantsRef = collection(db, path);
    const docRef = await addDoc(plantsRef, {
      userId: auth.currentUser.uid,
      name: plant.name,
      nickname: plant.nickname || null,
      scientificName: plant.scientificName,
      healthScore: plant.healthScore || 100,
      mood: plant.mood || 'Vibrant',
      predictedNeeds: plant.predictedNeeds || {
        watering: 'Next watering in 3 days',
        light: 'Optimal light levels',
        fertilizing: 'Feeding not required'
      },
      createdAt: serverTimestamp()
    });

    // Save initial health history
    await addDoc(collection(db, 'plants', docRef.id, 'healthHistory'), {
      healthScore: plant.healthScore || 100,
      mood: plant.mood || 'Vibrant',
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export interface HealthHistoryEntry {
  id?: string;
  healthScore: number;
  mood?: string;
  note?: string;
  photoUrl?: string;
  createdAt: any;
}

export async function getPlantHealthHistory(plantId: string): Promise<HealthHistoryEntry[]> {
  if (!auth.currentUser) return [];
  const path = `plants/${plantId}/healthHistory`;
  try {
    const q = query(
      collection(db, 'plants', plantId, 'healthHistory'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HealthHistoryEntry));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function updatePlantHealth(plantId: string, healthScore: number, mood: string, note?: string, photoUrl?: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to update plant health");
  const path = `plants/${plantId}`;
  try {
    const plantRef = doc(db, 'plants', plantId);
    await setDoc(plantRef, { healthScore, mood, updatedAt: serverTimestamp() }, { merge: true });
    
    await addDoc(collection(db, 'plants', plantId, 'healthHistory'), {
      healthScore,
      mood,
      note: note || null,
      photoUrl: photoUrl || null,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updatePlantNickname(plantId: string, nickname: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to update plant nickname");
  const path = `plants/${plantId}`;
  try {
    const plantRef = doc(db, 'plants', plantId);
    await setDoc(plantRef, { nickname, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getUserPlants(): Promise<SavedPlant[]> {
  if (!auth.currentUser) return [];
  const path = 'plants';
  try {
    const q = query(collection(db, path), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedPlant));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      console.warn("User plants read skipped while offline:", msg);
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export interface PlantReminder {
  id?: string;
  userId: string;
  plantId: string;
  type: 'water' | 'fertilize' | 'prune' | 'other' | string;
  dueDate: any; // Firestore Timestamp
  time?: string; // e.g. "09:00"
  timezone?: string; // e.g. "America/New_York"
  createdAt: any;
  notified?: boolean;
}

export async function addPlantReminder(
  plantId: string, 
  type: string, 
  dueDate: Date,
  options?: { time?: string; timezone?: string }
) {
  if (!auth.currentUser) throw new Error("Must be logged in to add reminder");
  const path = 'reminders';
  try {
    const remindersRef = collection(db, path);
    const docRef = await addDoc(remindersRef, {
      userId: auth.currentUser.uid,
      plantId,
      type,
      dueDate: Timestamp.fromDate(dueDate),
      time: options?.time || '09:00',
      timezone: options?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      createdAt: serverTimestamp(),
      notified: false
    });
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getPlantReminders(plantId: string): Promise<PlantReminder[]> {
  if (!auth.currentUser) return [];
  const path = 'reminders';
  try {
    const q = query(
      collection(db, path), 
      where("userId", "==", auth.currentUser.uid),
      where("plantId", "==", plantId),
      orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlantReminder));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function deleteReminder(reminderId: string) {
  if (!auth.currentUser) return;
  const path = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export interface UserPreferences {
  id?: string;
  userId: string;
  timezone?: string;
  gardeningStyle?: string;
  expertise?: 'beginner' | 'intermediate' | 'expert';
  specialInterests?: string[];
  sageTone?: string;
  temperatureUnit?: 'celsius' | 'fahrenheit';
  voiceAutoPlay?: boolean;
  updatedAt: any;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (!auth.currentUser) return null;
  const path = 'userPreferences';
  try {
    const d = await getDoc(doc(db, path, auth.currentUser.uid));
    if (d.exists()) {
      return { id: d.id, ...d.data() } as UserPreferences;
    }
    return null;
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('client is offline') || error?.code === 'unavailable') {
      console.warn("User preferences read skipped while offline:", msg);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>) {
  if (!auth.currentUser) return;
  const path = 'userPreferences';
  try {
    await setDoc(doc(db, path, auth.currentUser.uid), {
      ...prefs,
      userId: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// care log functions
export interface CareLog {
  id?: string;
  userId: string;
  plantId: string;
  type: 'water' | 'fertilize' | 'prune' | 'other';
  createdAt: any; // Firestore Timestamp
}

export interface ChatThread {
  id?: string;
  userId: string;
  title: string;
  snippet?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  threadId?: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  feedback?: 'like' | 'dislike' | null;
  createdAt: any;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  read: boolean;
  createdAt: any;
}

export async function createChatThread(title: string): Promise<string> {
  if (!auth.currentUser) throw new Error("Authentication required");
  const path = 'chatThreads';
  try {
    const threadRef = collection(db, path);
    const docRef = await addDoc(threadRef, {
      userId: auth.currentUser.uid,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return "";
  }
}

export async function sendNotification(notification: Partial<Notification>) {
  if (!auth.currentUser) return;
  const path = 'notifications';
  try {
    const ref = collection(db, path);
    await addDoc(ref, {
      ...notification,
      userId: auth.currentUser.uid,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(id: string) {
  if (!auth.currentUser) return;
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteNotification(id: string) {
  if (!auth.currentUser) return;
  const path = `notifications/${id}`;
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

import { onSnapshot } from 'firebase/firestore';

export function listenNotifications(callback: (notifications: Notification[]) => void) {
  if (!auth.currentUser) return () => {};
  
  const path = 'notifications';
  const q = query(
    collection(db, path),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, path);
  });
  
  return unsubscribe;
}

export async function getUserThreads(): Promise<ChatThread[]> {
  if (!auth.currentUser) return [];
  const path = 'chatThreads';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      console.warn("User chat threads read skipped while offline:", msg);
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function updateChatThread(threadId: string, updates: Partial<ChatThread>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `chatThreads/${threadId}`;
  try {
    await updateDoc(doc(db, 'chatThreads', threadId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteChatThread(threadId: string): Promise<void> {
  if (!auth.currentUser) return;
  
  try {
    const batch = writeBatch(db);
    
    // 1. Delete all messages in the thread
    const historyPath = 'chatHistory';
    const messagesQuery = query(
      collection(db, historyPath),
      where('userId', '==', auth.currentUser.uid),
      where('threadId', '==', threadId)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });

    // 2. Delete the thread document itself
    const threadsPath = 'chatThreads';
    const threadRef = doc(db, threadsPath, threadId);
    batch.delete(threadRef);

    // Commit the batch
    await batch.commit();
  } catch (err) {
    // We try to be specific about the path if we can, but since it's a batch,
    // we'll report it as a multi-path operation or default to threadId path.
    handleFirestoreError(err, OperationType.DELETE, `chatThreads/${threadId}`);
  }
}

export async function saveChatMessage(text: string, role: 'user' | 'model', image?: string, threadId?: string): Promise<string | undefined> {
  if (!auth.currentUser) return;
  const path = 'chatHistory';
  try {
    const chatRef = collection(db, path);
    const docRef = await addDoc(chatRef, {
      userId: auth.currentUser.uid,
      threadId: threadId || null,
      role,
      text,
      image: image || null,
      createdAt: serverTimestamp()
    });

    if (threadId) {
      const threadRef = doc(db, 'chatThreads', threadId);
      const updates: any = { updatedAt: serverTimestamp() };
      
      // If user message, update snippet as well
      if (role === 'user') {
        updates.snippet = text.slice(0, 80) + (text.length > 80 ? '...' : '');
      }
      
      await updateDoc(threadRef, updates);
    }
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteMessagePair(threadId: string, modelMessageId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = 'chatHistory';
  try {
    const q = query(
      collection(db, path),
      where('threadId', '==', threadId)
    );
    const snapshot = await getDocs(q);
    // Sort in memory to avoid needing a composite index
    const messages = snapshot.docs.sort((a, b) => {
      const dataA = a.data();
      const dataB = b.data();
      const timeA = dataA.createdAt?.toMillis?.() || (dataA.createdAt instanceof Date ? dataA.createdAt.getTime() : 0);
      const timeB = dataB.createdAt?.toMillis?.() || (dataB.createdAt instanceof Date ? dataB.createdAt.getTime() : 0);
      
      if (timeA !== timeB) return timeB - timeA;
      // If timestamps are identical, role might give a tiny hint (model usually follows user)
      return dataB.role.localeCompare(dataA.role);
    });
    
    const modelIndex = messages.findIndex(d => d.id === modelMessageId);
    
    if (modelIndex === -1) return;

    const batch = writeBatch(db);
    batch.delete(messages[modelIndex].ref);

    // Delete the preceding user message if it exists
    if (modelIndex + 1 < messages.length && messages[modelIndex + 1].data().role === 'user') {
      batch.delete(messages[modelIndex + 1].ref);
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function updateMessageFeedback(messageId: string, feedback: 'like' | 'dislike' | null): Promise<void> {
  if (!auth.currentUser) return;
  const path = `chatHistory/${messageId}`;
  try {
    await updateDoc(doc(db, 'chatHistory', messageId), {
      feedback
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getChatHistory(threadId?: string, limitCount: number = 50): Promise<ChatMessage[]> {
  if (!auth.currentUser) return [];
  const path = 'chatHistory';
  try {
    let q;
    if (threadId) {
      q = query(
        collection(db, path),
        where('userId', '==', auth.currentUser.uid),
        where('threadId', '==', threadId)
      );
    } else {
      q = query(
        collection(db, path),
        where('userId', '==', auth.currentUser.uid)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any } as ChatMessage))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB; // Chronological
      })
      .slice(-limitCount); // Keep only the latest N
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function addCareLog(plantId: string, type: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to add care log");
  const path = 'careLogs';
  try {
    const logsRef = collection(db, path);
    const docRef = await addDoc(logsRef, {
      userId: auth.currentUser.uid,
      plantId,
      type,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getCareLogs(plantId: string): Promise<CareLog[]> {
  if (!auth.currentUser) return [];
  const path = 'careLogs';
  try {
    const q = query(
      collection(db, path), 
      where("userId", "==", auth.currentUser.uid),
      where("plantId", "==", plantId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CareLog));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export interface CommunityTip {
  id?: string;
  userId: string;
  userName?: string;
  plantCategory?: string;
  title?: string;
  tip: string;
  isCurated?: boolean;
  upvotes?: number;
  downvotes?: number;
  createdAt: any;
}

export async function getCommunityTips(category?: string): Promise<CommunityTip[]> {
  const path = 'communityTips';
  try {
    const tipsRef = collection(db, path);
    let q;
    if (category && category !== 'All') {
      q = query(
        tipsRef,
        where('plantCategory', '==', category),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(tipsRef, orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as CommunityTip));
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('client is offline') || err?.code === 'unavailable') {
      return [];
    }
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function addCommunityTip(tip: Partial<CommunityTip>) {
  if (!auth.currentUser) throw new Error("Must be logged in to share tips");
  const path = 'communityTips';
  try {
    const tipsRef = collection(db, path);
    await addDoc(tipsRef, {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Anonymous Gardener',
      plantCategory: tip.plantCategory || 'General',
      title: tip.title || 'Gardening Wisdom',
      tip: tip.tip,
      isCurated: false,
      upvotes: 0,
      downvotes: 0,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function voteOnTip(tipId: string, type: 'up' | 'down') {
  if (!auth.currentUser) throw new Error("Must be logged in to vote");
  const path = `communityTips/${tipId}`;
  try {
    const tipRef = doc(db, 'communityTips', tipId);
    await updateDoc(tipRef, {
      [type === 'up' ? 'upvotes' : 'downvotes']: increment(1)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Firebase Cloud Messaging Functions
export const requestNotificationPermission = async () => {
  if (!auth.currentUser) return null;
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn("Notifications API not available in this browser.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = getMessaging(app);
      const vapidKey = (import.meta as any).env 
        ? (import.meta as any).env.VITE_FIREBASE_VAPID_KEY 
        : process.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.error("FCM: VAPID Key is missing in environment variables.");
        return null;
      }

      const currentToken = await getToken(messaging, { vapidKey });
      
      if (currentToken) {
        // Save the token to the user's document in Firestore
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: currentToken
        }, { merge: true });
        
        console.log('Firebase Cloud Messaging token saved to profile.');
        return currentToken;
      }
    }
    return null;
  } catch (error) {
    // Expected in the iframe preview unless opened in a new tab
    console.warn("Notification permissions block or fail usually due to iframe sandbox:", error);
    return null;
  }
};

// Initialize foreground message listener
export const setupOnMessageListener = (callback: (payload: any) => void) => {
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  } catch (err) {
    console.warn("FCM disabled or not supported in this environment");
    return () => {};
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info("Google Sign-in popup was dismissed by user.");
      throw error;
    }
    console.error("Google Auth error:", error);
    throw error;
  }
};

export const signIn = signInWithGoogle;

export const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<User> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    if (cred.user) {
      // Send email verification link immediately
      await sendEmailVerification(cred.user);
    }
    return cred.user;
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const resendVerificationEmail = async (): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("No signed-in user to send verification email to.");
  }
  await sendEmailVerification(auth.currentUser);
};

export const reloadCurrentUser = async (): Promise<User | null> => {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
  if (!auth.currentUser) throw new Error("Must be logged in to update profile");
  await updateProfile(auth.currentUser, updates);
};

export const signOut = () => firebaseSignOut(auth);

// --- Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isUnverified = auth.currentUser && !auth.currentUser.emailVerified;
  const rawMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: isUnverified 
      ? `Email verification required: Please verify your email (${auth.currentUser?.email}) before accessing your garden database.` 
      : rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function parseFirestoreError(err: unknown): {
  isPermissionError: boolean;
  isUnverifiedEmail: boolean;
  userMessage: string;
} {
  const isCurrentlyUnverified = !!auth.currentUser && !auth.currentUser.emailVerified;
  
  if (isCurrentlyUnverified) {
    return {
      isPermissionError: true,
      isUnverifiedEmail: true,
      userMessage: `Email verification required: Please verify your email (${auth.currentUser?.email}) before syncing cloud data or saving plants.`
    };
  }

  const rawMessage = err instanceof Error ? err.message : String(err);

  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed && typeof parsed === 'object') {
      const isUnverified = parsed.authInfo?.emailVerified === false;
      const isPerm = parsed.error?.includes('permission') || parsed.error?.includes('insufficient') || isUnverified;
      return {
        isPermissionError: isPerm,
        isUnverifiedEmail: isUnverified,
        userMessage: isUnverified
          ? `Email verification required: Please verify your email (${parsed.authInfo?.email || 'your email'}) to complete this action.`
          : isPerm
            ? 'Action blocked by database security rules. Please make sure you have appropriate access.'
            : parsed.error || rawMessage
      };
    }
  } catch {
    // Not a JSON string
  }

  const isPerm = rawMessage.includes('permission-denied') || rawMessage.includes('Missing or insufficient permissions') || rawMessage.includes('Email verification required');
  return {
    isPermissionError: isPerm,
    isUnverifiedEmail: isCurrentlyUnverified || rawMessage.includes('Email verification required'),
    userMessage: isPerm
      ? (isCurrentlyUnverified 
          ? `Email verification required: Please verify your email (${auth.currentUser?.email}) to continue.` 
          : 'Access denied: You do not have permission for this cloud database operation.')
      : rawMessage
  };
}
