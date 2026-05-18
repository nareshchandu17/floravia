import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, Timestamp, orderBy, setDoc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
    
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface FeedbackEntry {
  id?: string;
  userId: string;
  analysisType: 'identify' | 'diagnose';
  isPositive: boolean;
  createdAt: any;
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
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return []; // Never reached but satisfies TS
  }
}

export async function getNotificationSettings(): Promise<boolean> {
  if (!auth.currentUser) return false;
  const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (d.exists()) {
    return !!d.data().fcmToken;
  }
  return false;
}

export async function disableNotifications() {
  if (!auth.currentUser) return;
  await setDoc(doc(db, 'users', auth.currentUser.uid), { fcmToken: null }, { merge: true });
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
  try {
    const plantsRef = collection(db, 'plants');
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
    throw new Error("Failed to save plant: " + err.message);
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
  const q = query(
    collection(db, 'plants', plantId, 'healthHistory'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HealthHistoryEntry));
}

export async function updatePlantHealth(plantId: string, healthScore: number, mood: string, note?: string, photoUrl?: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to update plant health");
  
  const plantRef = doc(db, 'plants', plantId);
  await setDoc(plantRef, { healthScore, mood, updatedAt: serverTimestamp() }, { merge: true });
  
  await addDoc(collection(db, 'plants', plantId, 'healthHistory'), {
    healthScore,
    mood,
    note: note || null,
    photoUrl: photoUrl || null,
    createdAt: serverTimestamp()
  });
}

export async function updatePlantNickname(plantId: string, nickname: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to update plant nickname");
  const plantRef = doc(db, 'plants', plantId);
  await setDoc(plantRef, { nickname, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserPlants(): Promise<SavedPlant[]> {
  if (!auth.currentUser) return [];
  const q = query(collection(db, 'plants'), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedPlant));
}

export interface PlantReminder {
  id?: string;
  userId: string;
  plantId: string;
  type: 'water' | 'fertilize' | 'prune' | 'other';
  dueDate: any; // Firestore Timestamp
  createdAt: any;
  notified?: boolean;
}

export async function addPlantReminder(plantId: string, type: string, dueDate: Date) {
  if (!auth.currentUser) throw new Error("Must be logged in to add reminder");
  try {
    const remindersRef = collection(db, 'reminders');
    const docRef = await addDoc(remindersRef, {
      userId: auth.currentUser.uid,
      plantId,
      type,
      dueDate: Timestamp.fromDate(dueDate),
      createdAt: serverTimestamp(),
      notified: false
    });
    return docRef.id;
  } catch (err: any) {
    throw new Error("Failed to add reminder: " + err.message);
  }
}

export async function getPlantReminders(plantId: string): Promise<PlantReminder[]> {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, 'reminders'), 
    where("userId", "==", auth.currentUser.uid),
    where("plantId", "==", plantId),
    orderBy("dueDate", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlantReminder));
}

export async function deleteReminder(reminderId: string) {
  if (!auth.currentUser) return;
  await deleteDoc(doc(db, 'reminders', reminderId));
}

export interface UserPreferences {
  id?: string;
  userId: string;
  gardeningStyle?: string;
  expertise?: 'beginner' | 'intermediate' | 'expert';
  specialInterests?: string[];
  sageTone?: string;
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
  } catch (error) {
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
  } catch (err) {
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
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function addCareLog(plantId: string, type: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to add care log");
  try {
    const logsRef = collection(db, 'careLogs');
    const docRef = await addDoc(logsRef, {
      userId: auth.currentUser.uid,
      plantId,
      type,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err: any) {
    throw new Error("Failed to add care log: " + err.message);
  }
}

export async function getCareLogs(plantId: string): Promise<CareLog[]> {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, 'careLogs'), 
    where("userId", "==", auth.currentUser.uid),
    where("plantId", "==", plantId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CareLog));
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
  const tipsRef = collection(db, 'communityTips');
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
}

export async function addCommunityTip(tip: Partial<CommunityTip>) {
  if (!auth.currentUser) throw new Error("Must be logged in to share tips");
  const tipsRef = collection(db, 'communityTips');
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
}

export async function voteOnTip(tipId: string, type: 'up' | 'down') {
  if (!auth.currentUser) throw new Error("Must be logged in to vote");
  const tipRef = doc(db, 'communityTips', tipId);
  await updateDoc(tipRef, {
    [type === 'up' ? 'upvotes' : 'downvotes']: increment(1)
  });
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

export const signIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
