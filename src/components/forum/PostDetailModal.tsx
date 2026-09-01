import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  Pin, 
  Share2, 
  Flag, 
  Trash2, 
  EyeOff, 
  Send, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  Loader2, 
  Tag, 
  ShieldCheck, 
  Award,
  AlertTriangle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ForumPost, ForumComment, ReportReason } from '../../types/forum';
import { 
  subscribeToPostComments, 
  addForumComment, 
  toggleMarkSolution, 
  deleteForumComment 
} from '../../services/forum';
import { useAuth } from '../../hooks/useAuth';
import { checkContentSafety, isModerator } from '../../utils/moderation';

interface PostDetailModalProps {
  post: ForumPost | null;
  isOpen: boolean;
  onClose: () => void;
  hasLiked: boolean;
  onToggleLike: (postId: string) => void;
  onTogglePin?: (postId: string, isPinned: boolean) => void;
  onToggleSolve?: (postId: string, isSolved: boolean) => void;
  onHidePost?: (postId: string, status: 'active' | 'hidden') => void;
  onDeletePost?: (postId: string) => void;
  onOpenReportModal: (targetType: 'post' | 'comment', targetId: string, title?: string) => void;
  onOpenAuthModal?: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  hasLiked,
  onToggleLike,
  onTogglePin,
  onToggleSolve,
  onHidePost,
  onDeletePost,
  onOpenReportModal,
  onOpenAuthModal
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentWarning, setCommentWarning] = useState<string | null>(null);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.uid && post?.userId === user.uid;
  const isMod = isModerator(user?.email);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = subscribeToPostComments(post.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsubscribe();
  }, [post?.id]);

  if (!isOpen || !post) return null;

  const handleTextChange = (text: string) => {
    setCommentText(text);
    const safety = checkContentSafety(text);
    if (!safety.isSafe) {
      setCommentWarning(safety.warningMessage || 'Restricted terminology detected.');
    } else {
      setCommentWarning(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCommentPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuthModal?.();
      return;
    }
    if (!commentText.trim()) return;

    const safety = checkContentSafety(commentText);
    if (!safety.isSafe) {
      setCommentError(safety.warningMessage || 'Violates community guidelines.');
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await addForumComment(post.id!, commentText.trim(), commentPhoto);
      setCommentText('');
      setCommentPhoto(null);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMarkSolution = async (comment: ForumComment) => {
    if (!comment.id || !post.id) return;
    try {
      await toggleMarkSolution(post.id, comment.id, !!comment.isSolution);
    } catch (err: any) {
      console.error('Error toggling solution:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post.id || !confirm('Delete this response?')) return;
    try {
      await deleteForumComment(post.id, commentId);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return 'Just now';
    const d = dateObj.toDate ? dateObj.toDate() : (dateObj instanceof Date ? dateObj : new Date(dateObj));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-3xl bg-[#08130d] border border-emerald-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-900/30 bg-[#0c1c13]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={post.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                  alt={post.userName}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                />
                {isModerator(post.userEmail) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-black" title="Botanical Moderator">
                    ✓
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">{post.userName}</h4>
                  {isModerator(post.userEmail) && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] uppercase font-bold border border-amber-500/30">
                      Mod
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">• {formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-[10px] text-emerald-300 capitalize font-medium">
                    {post.category}
                  </span>
                  {post.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {post.isSolved && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Solved
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mod actions dropdown */}
              {(isMod || isAuthor) && (
                <div className="relative">
                  <button
                    onClick={() => setShowModMenu(!showModMenu)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                  >
                    <span>Manage</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showModMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-30 text-xs">
                      {isMod && (
                        <button
                          onClick={() => {
                            onTogglePin?.(post.id!, !!post.isPinned);
                            setShowModMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                        >
                          <Pin className="w-3.5 h-3.5 text-amber-400" />
                          {post.isPinned ? 'Unpin Discussion' : 'Pin to Top'}
                        </button>
                      )}
                      {(isAuthor || isMod) && (
                        <button
                          onClick={() => {
                            onToggleSolve?.(post.id!, !!post.isSolved);
                            setShowModMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {post.isSolved ? 'Mark as Open' : 'Mark as Solved'}
                        </button>
                      )}
                      {isMod && (
                        <button
                          onClick={() => {
                            onHidePost?.(post.id!, post.status === 'hidden' ? 'active' : 'hidden');
                            setShowModMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          {post.status === 'hidden' ? 'Unhide Post' : 'Hide from Public'}
                        </button>
                      )}
                      {(isAuthor || isMod) && (
                        <button
                          onClick={() => {
                            if (confirm('Permanently delete this discussion?')) {
                              onDeletePost?.(post.id!);
                              onClose();
                            }
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-rose-950/50 text-rose-300 flex items-center gap-2 border-t border-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Post & Responses Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title & Tag */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {post.title}
              </h2>
              {post.plantTag && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/25 text-emerald-300 text-xs mt-2 font-medium">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>{post.plantTag}</span>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-white/5">
              {post.content}
            </div>

            {/* Attached Garden Photo */}
            {post.photoUrl && (
              <div className="space-y-1.5">
                <div 
                  onClick={() => setIsPhotoZoomed(true)}
                  className="rounded-xl overflow-hidden border border-emerald-500/25 bg-black/50 cursor-pointer group relative max-h-96"
                >
                  <img
                    src={post.photoUrl}
                    alt="Garden Attachment"
                    className="w-full h-auto max-h-96 object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Click to Zoom Fullscreen
                  </div>
                </div>
              </div>
            )}

            {/* Post Interaction Bar */}
            <div className="flex items-center justify-between py-3 border-y border-emerald-900/30 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleLike(post.id!)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    hasLiked
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-slate-950' : ''}`} />
                  <span>{post.likesCount || 0}</span>
                  <span className="hidden sm:inline">Helpful</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 text-slate-400 text-xs font-medium border border-slate-800">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{comments.length} Responses</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs inline-flex items-center gap-1.5 transition-colors"
                  title="Copy link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>

                <button
                  onClick={() => onOpenReportModal('post', post.id!, post.title)}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs inline-flex items-center gap-1.5 transition-colors"
                  title="Report inappropriate content"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Report</span>
                </button>
              </div>
            </div>

            {/* Responses List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Community Responses</span>
                  <span className="text-xs text-emerald-400 font-mono">({comments.length})</span>
                </h3>
              </div>

              {comments.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-300">No responses yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Be the first botanist to share advice, insights, or solutions for this post!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const isCommentAuthor = user?.uid && comment.userId === user.uid;
                    return (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-xl border transition-all ${
                          comment.isSolution
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-900/60 border-slate-800/80'
                        }`}
                      >
                        {/* Solution Badge */}
                        {comment.isSolution && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider mb-2 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Accepted Solution by Author
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={comment.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                              alt={comment.userName}
                              className="w-8 h-8 rounded-full object-cover border border-emerald-500/20"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{comment.userName}</span>
                                {isModerator(comment.userEmail) && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[8px] uppercase font-bold border border-amber-500/30">
                                    Mod
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">{formatDate(comment.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Author can designate solution for question posts */}
                            {isAuthor && post.category === 'question' && (
                              <button
                                onClick={() => handleMarkSolution(comment)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                                  comment.isSolution
                                    ? 'bg-emerald-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {comment.isSolution ? 'Solution' : 'Mark Solution'}
                              </button>
                            )}

                            {(isCommentAuthor || isMod) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id!)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                                title="Delete response"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenReportModal('comment', comment.id!, `Comment by ${comment.userName}`)}
                              className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                              title="Report response"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Comment Body */}
                        <div className="text-xs sm:text-sm text-slate-200 mt-2.5 leading-relaxed whitespace-pre-line pl-10">
                          {comment.content}
                        </div>

                        {/* Comment Photo if attached */}
                        {comment.photoUrl && (
                          <div className="mt-2.5 pl-10">
                            <img
                              src={comment.photoUrl}
                              alt="Response attachment"
                              className="max-h-48 rounded-xl border border-slate-700 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Interactive Response Composer */}
          <div className="p-4 border-t border-emerald-900/30 bg-[#0a160f]">
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-2.5">
                {commentPhoto && (
                  <div className="relative inline-block rounded-lg overflow-hidden border border-emerald-500/30">
                    <img src={commentPhoto} alt="Preview" className="h-16 w-16 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCommentPhoto(null)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-rose-300 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {commentWarning && (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{commentWarning}</span>
                  </div>
                )}

                {commentError && (
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{commentError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
                    title="Attach botanical photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Contribute your botanical advice or answer..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim() || !!commentWarning}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-300">Sign in to join the conversation and help fellow gardeners.</span>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Lightbox photo zoom */}
        {isPhotoZoomed && post.photoUrl && (
          <div 
            onClick={() => setIsPhotoZoomed(false)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={post.photoUrl}
              alt="Zoomed attachment"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
