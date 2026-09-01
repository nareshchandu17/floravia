import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ForumPost, 
  ForumCategory, 
  ForumComment, 
  ForumReport,
  ReportReason
} from '../types/forum';
import { 
  subscribeToForumPosts, 
  createForumPost, 
  toggleLikePost, 
  getUserLikedPostIds,
  deleteForumPost,
  togglePinPost,
  toggleSolvePost,
  hideForumPost,
  submitForumReport,
  getPendingReports,
  updateReportStatus,
  INITIAL_FORUM_POSTS
} from '../services/forum';
import { useAuth } from './useAuth';
import { isModerator, checkContentSafety } from '../utils/moderation';

export type ForumSortOption = 'trending' | 'newest' | 'unanswered' | 'solved' | 'my-posts';

export function useForum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory>('all');
  const [sortBy, setSortBy] = useState<ForumSortOption>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Moderation Queue state
  const [pendingReports, setPendingReports] = useState<ForumReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const isUserMod = useMemo(() => isModerator(user?.email), [user?.email]);

  // Load user likes
  const refreshUserLikes = useCallback(async () => {
    if (!user) {
      setLikedPostIds(new Set());
      return;
    }
    const ids = await getUserLikedPostIds();
    setLikedPostIds(ids);
  }, [user]);

  // Load pending moderation reports for mods
  const loadReports = useCallback(async () => {
    if (!isUserMod) return;
    setIsLoadingReports(true);
    try {
      const reports = await getPendingReports();
      setPendingReports(reports);
    } catch (err) {
      console.warn('Could not fetch mod reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [isUserMod]);

  useEffect(() => {
    refreshUserLikes();
    if (isUserMod) {
      loadReports();
    }
  }, [user, refreshUserLikes, isUserMod, loadReports]);

  // Subscribe to real-time posts
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToForumPosts((livePosts) => {
      if (livePosts.length > 0) {
        setPosts(livePosts);
      } else {
        // Hydrate demo seed if empty
        const initialWithIds: ForumPost[] = INITIAL_FORUM_POSTS.map((p, idx) => ({
          id: `demo-post-${idx + 1}`,
          ...p
        }));
        setPosts(initialWithIds);
      }
      setIsLoading(false);
    }, activeCategory);

    return () => unsubscribe();
  }, [activeCategory]);

  // Add new post
  const handleCreatePost = async (data: {
    title: string;
    content: string;
    category: 'question' | 'showcase' | 'tip' | 'discussion' | 'identification';
    photoUrl?: string | null;
    plantTag?: string | null;
  }) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const postId = await createForumPost(data);
      // Optimistic addition
      const optimisticPost: ForumPost = {
        id: postId,
        userId: user?.uid || 'guest',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Botanist',
        userEmail: user?.email || undefined,
        userAvatar: user?.photoURL || undefined,
        title: data.title,
        content: data.content,
        category: data.category,
        photoUrl: data.photoUrl,
        plantTag: data.plantTag,
        likesCount: 0,
        commentsCount: 0,
        isPinned: false,
        isSolved: false,
        status: 'active',
        flagCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setPosts(prev => [optimisticPost, ...prev.filter(p => p.id !== postId)]);
      return postId;
    } catch (err: any) {
      setActionError(err.message || 'Failed to create post');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote/Like toggle
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      setActionError('Please sign in to upvote botanical discussions.');
      return;
    }
    const hasLiked = likedPostIds.has(postId);
    
    // Optimistic state
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (hasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likesCount: Math.max(0, p.likesCount + (hasLiked ? -1 : 1))
        };
      }
      return p;
    }));

    try {
      await toggleLikePost(postId, hasLiked);
    } catch (err) {
      // Revert optimistic on error
      refreshUserLikes();
    }
  };

  // Moderator / Author actions
  const handleDeletePost = async (postId: string) => {
    try {
      await deleteForumPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      // Allow local removal for demo posts if not stored
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleTogglePin = async (postId: string, currentPinned: boolean) => {
    try {
      await togglePinPost(postId, currentPinned);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !currentPinned } : p));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !currentPinned } : p));
    }
  };

  const handleToggleSolve = async (postId: string, currentSolved: boolean) => {
    try {
      await toggleSolvePost(postId, currentSolved);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSolved: !currentSolved } : p));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSolved: !currentSolved } : p));
    }
  };

  const handleHidePost = async (postId: string, status: 'active' | 'hidden') => {
    try {
      await hideForumPost(postId, status);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
    }
  };

  const handleReportPost = async (data: {
    targetType: 'post' | 'comment';
    targetId: string;
    postId: string;
    targetTitle?: string;
    targetContentSnippet?: string;
    reason: ReportReason;
    details?: string;
  }) => {
    await submitForumReport(data);
  };

  const handleActionReport = async (reportId: string, action: 'reviewed' | 'dismissed' | 'actioned') => {
    await updateReportStatus(reportId, action);
    setPendingReports(prev => prev.filter(r => r.id !== reportId));
  };

  // Filtered & Sorted list
  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => {
      // Hide hidden posts for regular users unless moderator or author
      if (post.status === 'hidden' && !isUserMod && post.userId !== user?.uid) {
        return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title?.toLowerCase().includes(q);
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesTag = post.plantTag?.toLowerCase().includes(q);
        const matchesAuthor = post.userName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesTag && !matchesAuthor) {
          return false;
        }
      }

      // My Posts filter
      if (sortBy === 'my-posts') {
        return post.userId === user?.uid;
      }

      // Unanswered filter
      if (sortBy === 'unanswered') {
        return post.category === 'question' && (!post.commentsCount || post.commentsCount === 0);
      }

      // Solved filter
      if (sortBy === 'solved') {
        return post.isSolved === true;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      // Pinned posts always stay at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'trending') {
        // Score = likes * 2 + comments * 3
        const scoreA = (a.likesCount || 0) * 2 + (a.commentsCount || 0) * 3;
        const scoreB = (b.likesCount || 0) * 2 + (b.commentsCount || 0) * 3;
        return scoreB - scoreA;
      }

      // Newest default
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
      return timeB - timeA;
    });
  }, [posts, searchQuery, sortBy, user?.uid, isUserMod]);

  return {
    posts: filteredPosts,
    rawPosts: posts,
    isLoading,
    isSubmitting,
    actionError,
    setActionError,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    likedPostIds,
    isUserMod,
    pendingReports,
    isLoadingReports,
    handleCreatePost,
    handleToggleLike,
    handleDeletePost,
    handleTogglePin,
    handleToggleSolve,
    handleHidePost,
    handleReportPost,
    handleActionReport,
    loadReports
  };
}
