import React from 'react';
import { motion } from 'motion/react';
import { 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  Pin, 
  Tag, 
  HelpCircle, 
  Flower2, 
  Lightbulb, 
  Leaf, 
  MessageCircle, 
  Flag,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { ForumPost } from '../../types/forum';
import { isModerator } from '../../utils/moderation';

interface PostCardProps {
  post: ForumPost;
  hasLiked: boolean;
  onToggleLike: (postId: string) => void;
  onSelectPost: (post: ForumPost) => void;
  onOpenReportModal: (targetType: 'post' | 'comment', targetId: string, title?: string) => void;
}

const CATEGORY_META = {
  question: { label: 'Question', icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  showcase: { label: 'Showcase', icon: Flower2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  tip: { label: 'Care Tip', icon: Lightbulb, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
  identification: { label: 'Plant ID', icon: Leaf, color: 'text-lime-400', bg: 'bg-lime-500/10 border-lime-500/30' },
  discussion: { label: 'Discussion', icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  hasLiked,
  onToggleLike,
  onSelectPost,
  onOpenReportModal
}) => {
  const meta = CATEGORY_META[post.category] || CATEGORY_META.discussion;
  const Icon = meta.icon;

  const formatDate = (dateObj: any) => {
    if (!dateObj) return 'Recent';
    const d = dateObj.toDate ? dateObj.toDate() : (dateObj instanceof Date ? dateObj : new Date(dateObj));
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        post.isPinned
          ? 'bg-gradient-to-b from-[#0f261a] to-[#0a1810] border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.08)]'
          : post.status === 'hidden'
          ? 'bg-slate-950/60 border-rose-950/60 opacity-60'
          : 'bg-[#0b1710]/90 hover:bg-[#0e1e15] border-emerald-500/20 hover:border-emerald-500/40 shadow-lg'
      }`}
    >
      {/* Top badges bar */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>

            {post.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}

            {post.isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            )}

            {post.status === 'hidden' && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                Hidden
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {formatDate(post.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onSelectPost(post)}
          className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 cursor-pointer transition-colors leading-snug line-clamp-2"
        >
          {post.title}
        </h3>

        {/* Plant tag */}
        {post.plantTag && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] text-emerald-300 font-medium mt-2">
            <Tag className="w-3 h-3 text-emerald-400" />
            <span className="line-clamp-1">{post.plantTag}</span>
          </div>
        )}

        {/* Snippet */}
        <p 
          onClick={() => onSelectPost(post)}
          className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 mt-2 leading-relaxed cursor-pointer"
        >
          {post.content}
        </p>
      </div>

      {/* Photo thumbnail if exists */}
      {post.photoUrl && (
        <div 
          onClick={() => onSelectPost(post)}
          className="px-4 sm:px-5 pb-3 cursor-pointer"
        >
          <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 h-44 bg-black/40 group">
            <img
              src={post.photoUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 flex items-center gap-1 border border-white/10">
              <ImageIcon className="w-3 h-3 text-emerald-400" />
              <span>Full Photo</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Author & Stats */}
      <div className="px-4 sm:px-5 py-3 border-t border-emerald-950/60 bg-black/20 flex items-center justify-between gap-3">
        {/* Author info */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={post.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
            alt={post.userName}
            className="w-6 h-6 rounded-full object-cover border border-emerald-500/20 shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">{post.userName}</span>
            {isModerator(post.userEmail) && (
              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[8px] uppercase font-bold shrink-0">
                Mod
              </span>
            )}
          </div>
        </div>

        {/* Engagement toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(post.id!);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              hasLiked
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-slate-950' : ''}`} />
            <span>{post.likesCount || 0}</span>
          </button>

          <button
            onClick={() => onSelectPost(post)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 text-xs font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentsCount || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
