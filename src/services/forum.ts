import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { ForumPost, ForumComment, ForumReport, ReportReason } from '../types/forum';
import { checkContentSafety } from '../utils/moderation';

export const INITIAL_FORUM_POSTS: Omit<ForumPost, 'id'>[] = [
  {
    userId: 'botanical-expert-1',
    userName: 'Elena Vance (Master Gardener)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    title: '🌿 How I cured powdery mildew on my English Rose without synthetic chemicals',
    content: 'For weeks my climbing roses suffered in the humid summer mornings with white powdery film. I experimented with a 1:9 whole-milk to water foliar spray applied during full sunlight. The lactic acid and protein exposure oxidized the fungus within 48 hours without burning tender foliage!\n\n**Recipe:**\n- 100ml Organic whole milk\n- 900ml Filtered water\n- 3 drops cold-pressed neem oil\n\nSpray both tops and undersides of leaves twice weekly in mid-morning.',
    category: 'tip',
    photoUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1000&q=80',
    plantTag: 'Rosa gallica (English Rose)',
    likesCount: 38,
    commentsCount: 9,
    isPinned: true,
    isSolved: false,
    status: 'active',
    flagCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2)
  },
  {
    userId: 'indoor-enthusiast-2',
    userName: 'Dr. Marcus Thorne',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    title: '❓ Monstera Deliciosa: Lower leaves yellowing after winter repotting — Help needed!',
    content: 'I repotted my 3-year-old Monstera into an aroid mix (orchid bark, perlite, coconut coir, worm castings) last Sunday. Since then, the two lowest fenestrated leaves started turning limp and translucent yellow with brown necrotic margins. Is this transplant shock or overhydration?\n\nAmbient humidity is 60%, room temperature 22°C (72°F). Check the attached photo!',
    category: 'question',
    photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80',
    plantTag: 'Monstera deliciosa',
    likesCount: 14,
    commentsCount: 6,
    isPinned: false,
    isSolved: true,
    status: 'active',
    flagCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 18)
  },
  {
    userId: 'balcony-grower-3',
    userName: 'Aria Chen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    title: '🌸 Japanese Maple & Japanese Forest Grass Balcony Oasis Showcase',
    content: 'Just finished redesigning my 5th-floor north-west facing balcony! Grouped Acer palmatum "Bloodgood" with Hakonechloa macra and dwarf Japanese Azaleas. The multi-tiered planters create a serene microclimate that drops ambient heat by nearly 3 degrees.\n\nHappy to answer any questions on urban wind-sheltering techniques!',
    category: 'showcase',
    photoUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80',
    plantTag: 'Acer palmatum & Hakonechloa',
    likesCount: 52,
    commentsCount: 12,
    isPinned: false,
    isSolved: false,
    status: 'active',
    flagCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 40)
  },
  {
    userId: 'forager-botanist-4',
    userName: 'Kaelen O\'Connor',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    title: '🔍 Wildflower spotted in shade woodland — Can someone verify identification?',
    content: 'Found this delicate nodding white flower blooming along a shaded creek bank in USDA Zone 7. Trifoliate leaves with scalloped edges. Is this Anemone quinquefolia (Wood Anemone) or a variety of Trillium?',
    category: 'identification',
    photoUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1000&q=80',
    plantTag: 'Anemone quinquefolia / Trillium',
    likesCount: 8,
    commentsCount: 4,
    isPinned: false,
    isSolved: false,
    status: 'active',
    flagCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 8)
  }
];

export const INITIAL_FORUM_COMMENTS: Record<string, Omit<ForumComment, 'id'>[]> = {
  'demo-post-2': [
    {
      postId: 'demo-post-2',
      userId: 'botanical-expert-1',
      userName: 'Elena Vance (Master Gardener)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      content: 'Classic transplant stress compounded by root turgor adjustment. When repotting into chunky aroid mix, root hairs take 10-14 days to re-establish capillary contact. Prune off the lowest dying leaf so energy directs toward apical shoots, and hold off on fertilizing for 4 weeks.',
      isSolution: true,
      likesCount: 11,
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 12)
    },
    {
      postId: 'demo-post-2',
      userId: 'soil-whisperer',
      userName: 'Mateo Morales',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
      content: 'Agreed with Elena. Also ensure the chunky perlite has good bottom aeration. If the saucer retains drainage water, siphon it immediately.',
      isSolution: false,
      likesCount: 3,
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 6)
    }
  ]
};

// --- Posts CRUD ---

export async function createForumPost(data: {
  title: string;
  content: string;
  category: 'question' | 'showcase' | 'tip' | 'discussion' | 'identification';
  photoUrl?: string | null;
  plantTag?: string | null;
}): Promise<string> {
  if (!auth.currentUser) throw new Error('You must be signed in to create a forum post.');

  // Pre-validate safety
  const safety = checkContentSafety(data.content, data.title);
  if (!safety.isSafe) {
    throw new Error(safety.warningMessage || 'Content violates community guidelines.');
  }

  const path = 'forumPosts';
  try {
    const postRef = collection(db, path);
    const newDoc = await addDoc(postRef, {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Botanist',
      userEmail: auth.currentUser.email || null,
      userAvatar: auth.currentUser.photoURL || null,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      photoUrl: data.photoUrl || null,
      plantTag: data.plantTag?.trim() || null,
      likesCount: 0,
      commentsCount: 0,
      isPinned: false,
      isSolved: false,
      status: 'active',
      flagCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export function subscribeToForumPosts(
  callback: (posts: ForumPost[]) => void,
  category: string = 'all'
) {
  const path = 'forumPosts';
  try {
    let q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (category !== 'all') {
      q = query(
        collection(db, path),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const livePosts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ForumPost[];
      callback(livePosts);
    }, (error) => {
      console.warn('Forum posts snapshot note:', error.message);
      // If empty or permission/unverified fallback to demo
      callback([]);
    });
  } catch (err) {
    console.error('Error listening to forum posts:', err);
    return () => {};
  }
}

export async function toggleLikePost(postId: string, currentHasLiked: boolean): Promise<boolean> {
  if (!auth.currentUser) throw new Error('Must be signed in to like posts.');
  const userId = auth.currentUser.uid;
  const likeDocId = `${userId}_${postId}`;
  const likePath = `forumLikes/${likeDocId}`;
  const postPath = `forumPosts/${postId}`;

  try {
    if (currentHasLiked) {
      await deleteDoc(doc(db, 'forumLikes', likeDocId));
      await updateDoc(doc(db, 'forumPosts', postId), {
        likesCount: increment(-1)
      });
      return false;
    } else {
      await setDoc(doc(db, 'forumLikes', likeDocId), {
        userId,
        targetId: postId,
        targetType: 'post',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'forumPosts', postId), {
        likesCount: increment(1)
      });
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, currentHasLiked ? OperationType.DELETE : OperationType.CREATE, likePath);
    throw err;
  }
}

export async function getUserLikedPostIds(): Promise<Set<string>> {
  if (!auth.currentUser) return new Set();
  const path = 'forumLikes';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid),
      where('targetType', '==', 'post')
    );
    const snap = await getDocs(q);
    const set = new Set<string>();
    snap.forEach(d => {
      const data = d.data();
      if (data.targetId) set.add(data.targetId);
    });
    return set;
  } catch (err) {
    return new Set();
  }
}

export async function deleteForumPost(postId: string) {
  if (!auth.currentUser) throw new Error('Must be signed in to delete posts.');
  const path = `forumPosts/${postId}`;
  try {
    await deleteDoc(doc(db, 'forumPosts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function togglePinPost(postId: string, isPinned: boolean) {
  if (!auth.currentUser) throw new Error('Must be signed in.');
  const path = `forumPosts/${postId}`;
  try {
    await updateDoc(doc(db, 'forumPosts', postId), {
      isPinned: !isPinned,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function toggleSolvePost(postId: string, isSolved: boolean) {
  if (!auth.currentUser) throw new Error('Must be signed in.');
  const path = `forumPosts/${postId}`;
  try {
    await updateDoc(doc(db, 'forumPosts', postId), {
      isSolved: !isSolved,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function hideForumPost(postId: string, status: 'active' | 'hidden' = 'hidden') {
  if (!auth.currentUser) throw new Error('Must be signed in.');
  const path = `forumPosts/${postId}`;
  try {
    await updateDoc(doc(db, 'forumPosts', postId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// --- Comments CRUD ---

export function subscribeToPostComments(
  postId: string,
  callback: (comments: ForumComment[]) => void
) {
  const path = `forumPosts/${postId}/comments`;
  try {
    const q = query(
      collection(db, 'forumPosts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ForumComment[];
      callback(comments);
    }, (err) => {
      console.warn('Comments snapshot warning:', err.message);
      callback(INITIAL_FORUM_COMMENTS[postId] ? (INITIAL_FORUM_COMMENTS[postId].map((c, i) => ({ id: `init-c-${i}`, ...c })) as ForumComment[]) : []);
    });
  } catch (err) {
    console.error('Error listening to comments:', err);
    return () => {};
  }
}

export async function addForumComment(postId: string, content: string, photoUrl?: string | null): Promise<string> {
  if (!auth.currentUser) throw new Error('Must be signed in to reply.');

  const safety = checkContentSafety(content);
  if (!safety.isSafe) {
    throw new Error(safety.warningMessage || 'Content violates community guidelines.');
  }

  const path = `forumPosts/${postId}/comments`;
  try {
    const commentsRef = collection(db, 'forumPosts', postId, 'comments');
    const docRef = await addDoc(commentsRef, {
      postId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Gardener',
      userAvatar: auth.currentUser.photoURL || null,
      userEmail: auth.currentUser.email || null,
      content: content.trim(),
      photoUrl: photoUrl || null,
      isSolution: false,
      likesCount: 0,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Increment comments counter on post
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch {
      // Non-fatal if post update permissions vary
    }

    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function toggleMarkSolution(postId: string, commentId: string, isSolution: boolean) {
  if (!auth.currentUser) throw new Error('Must be signed in.');
  const commentPath = `forumPosts/${postId}/comments/${commentId}`;
  try {
    await updateDoc(doc(db, 'forumPosts', postId, 'comments', commentId), {
      isSolution: !isSolution
    });
    // Mark post as solved if a solution is designated
    await updateDoc(doc(db, 'forumPosts', postId), {
      isSolved: !isSolution,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, commentPath);
    throw err;
  }
}

export async function deleteForumComment(postId: string, commentId: string) {
  if (!auth.currentUser) throw new Error('Must be signed in.');
  const path = `forumPosts/${postId}/comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'forumPosts', postId, 'comments', commentId));
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } catch {
      // Non-fatal
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// --- Reports & Moderation ---

export async function submitForumReport(report: {
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  targetTitle?: string;
  targetContentSnippet?: string;
  reason: ReportReason;
  details?: string;
}) {
  if (!auth.currentUser) throw new Error('Must be signed in to submit a moderation report.');
  const path = 'forumReports';
  try {
    const reportRef = collection(db, path);
    await addDoc(reportRef, {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email || 'anonymous',
      targetType: report.targetType,
      targetId: report.targetId,
      postId: report.postId,
      targetTitle: report.targetTitle || null,
      targetContentSnippet: report.targetContentSnippet || null,
      reason: report.reason,
      details: report.details?.trim() || null,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // Auto increment flag count on post
    if (report.targetType === 'post') {
      try {
        await updateDoc(doc(db, 'forumPosts', report.postId), {
          flagCount: increment(1)
        });
      } catch {
        // Non-fatal
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getPendingReports(): Promise<ForumReport[]> {
  if (!auth.currentUser) return [];
  const path = 'forumReports';
  try {
    const q = query(
      collection(db, path),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumReport));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed' | 'actioned') {
  if (!auth.currentUser) return;
  const path = `forumReports/${reportId}`;
  try {
    await updateDoc(doc(db, 'forumReports', reportId), {
      status
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
