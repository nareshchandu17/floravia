import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface CommunityTip {
  id: string;
  userId: string;
  userName?: string;
  plantCategory?: string;
  title?: string;
  tip: string;
  isCurated: boolean;
  createdAt: any;
}

export async function submitTip(tipData: { 
  tip: string; 
  title?: string; 
  plantCategory?: string;
  userName?: string;
}) {
  if (!auth.currentUser) throw new Error('User must be signed in to submit a tip');

  const tipRef = collection(db, 'communityTips');
  return await addDoc(tipRef, {
    ...tipData,
    userId: auth.currentUser.uid,
    isCurated: false,
    createdAt: serverTimestamp()
  });
}

export function subscribeToTips(callback: (tips: CommunityTip[]) => void, curatedOnly: boolean = false) {
  let q = query(collection(db, 'communityTips'), orderBy('createdAt', 'desc'));
  
  if (curatedOnly) {
    q = query(collection(db, 'communityTips'), where('isCurated', '==', true), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const tips = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommunityTip[];
    callback(tips);
  });
}

export async function deleteTip(tipId: string) {
  if (!auth.currentUser) throw new Error('User must be signed in to delete a tip');
  const tipRef = doc(db, 'communityTips', tipId);
  return await deleteDoc(tipRef);
}
