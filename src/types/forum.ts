export type ForumCategory = 
  | 'all' 
  | 'question' 
  | 'showcase' 
  | 'tip' 
  | 'discussion' 
  | 'identification';

export interface ForumPost {
  id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: 'question' | 'showcase' | 'tip' | 'discussion' | 'identification';
  photoUrl?: string | null;
  plantTag?: string | null;
  likesCount: number;
  commentsCount: number;
  isPinned?: boolean;
  isSolved?: boolean;
  status: 'active' | 'hidden' | 'flagged';
  flagCount?: number;
  createdAt: any;
  updatedAt?: any;
  hasLiked?: boolean;
}

export interface ForumComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  content: string;
  photoUrl?: string | null;
  isSolution?: boolean;
  likesCount: number;
  status: 'active' | 'hidden';
  createdAt: any;
  hasLiked?: boolean;
}

export type ReportReason = 
  | 'spam' 
  | 'harassment' 
  | 'misleading' 
  | 'inappropriate' 
  | 'other';

export interface ForumReport {
  id?: string;
  userId: string;
  userEmail?: string;
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  targetTitle?: string;
  targetContentSnippet?: string;
  reason: ReportReason;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  createdAt: any;
}
