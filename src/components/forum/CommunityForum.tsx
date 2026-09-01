import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquarePlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  HelpCircle, 
  Flower2, 
  Lightbulb, 
  Leaf, 
  Flame, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  AlertCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useForum, ForumSortOption } from '../../hooks/useForum';
import { ForumCategory, ForumPost, ReportReason } from '../../types/forum';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { PostDetailModal } from './PostDetailModal';
import { ReportModal } from './ReportModal';
import { ModerationPanel } from './ModerationPanel';
import { CommunityGuidelinesModal } from './CommunityGuidelinesModal';
import { DashboardPlant } from '../../types/botanical';

interface CommunityForumProps {
  userPlants?: DashboardPlant[];
  onOpenAuthModal?: () => void;
}

const CATEGORY_TABS: { id: ForumCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Discussions', icon: Sparkles },
  { id: 'question', label: 'Questions & Help', icon: HelpCircle },
  { id: 'showcase', label: 'Garden Showcases', icon: Flower2 },
  { id: 'tip', label: 'Tips & Guides', icon: Lightbulb },
  { id: 'identification', label: 'Plant ID', icon: Leaf },
];

export const CommunityForum: React.FC<CommunityForumProps> = ({
  userPlants = [],
  onOpenAuthModal
}) => {
  const {
    posts,
    isLoading,
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
  } = useForum();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isModPanelOpen, setIsModPanelOpen] = useState(false);
  
  // Reporting state
  const [reportingTarget, setReportingTarget] = useState<{
    targetType: 'post' | 'comment';
    targetId: string;
    postId: string;
    targetTitle?: string;
  } | null>(null);

  const suggestedPlants = userPlants.map(p => ({
    name: p.name,
    scientificName: p.scientificName
  }));

  const handleOpenReportModal = (
    targetType: 'post' | 'comment',
    targetId: string,
    title?: string
  ) => {
    setReportingTarget({
      targetType,
      targetId,
      postId: selectedPost?.id || targetId,
      targetTitle: title
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Forum Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d2217] via-[#091810] to-[#0d2217] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" />
              Floravia Community Sanctuary
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Gardening Forum & Knowledge Exchange
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ask plant questions, share photos of your garden oasis, exchange verified botanical tips, and connect with passionate growers worldwide.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Guidelines
            </button>

            {isUserMod && (
              <button
                onClick={() => {
                  loadReports();
                  setIsModPanelOpen(true);
                }}
                className="relative px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <ShieldAlert className="w-4 h-4" />
                Moderation Queue
                {pendingReports.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {pendingReports.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] inline-flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New Discussion / Question
            </button>
          </div>
        </div>
      </div>

      {/* Navigation & Filter Bar */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c1912] p-3 rounded-2xl border border-emerald-500/20">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, plant species, disease diagnosis, or author..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 font-medium px-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Sort:
            </span>

            {[
              { id: 'trending', label: 'Trending', icon: Flame },
              { id: 'newest', label: 'Newest', icon: Clock },
              { id: 'unanswered', label: 'Unanswered', icon: HelpCircle },
              { id: 'solved', label: 'Solved', icon: CheckCircle2 },
              { id: 'my-posts', label: 'My Posts', icon: UserCheck }
            ].map((s) => {
              const Icon = s.icon;
              const isSelected = sortBy === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as ForumSortOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts Grid / Feed */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading botanical discussions...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 rounded-3xl bg-[#09150e] border border-dashed border-emerald-500/20 text-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No discussions found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No topics matched "${searchQuery}". Try changing search keywords or clearing filters.`
                : 'Be the first to start a conversation in this category!'}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all inline-flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Start First Discussion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              hasLiked={post.id ? likedPostIds.has(post.id) : false}
              onToggleLike={handleToggleLike}
              onSelectPost={setSelectedPost}
              onOpenReportModal={handleOpenReportModal}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        suggestedPlants={suggestedPlants}
      />

      {/* Full Post Detail View Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        hasLiked={selectedPost?.id ? likedPostIds.has(selectedPost.id) : false}
        onToggleLike={handleToggleLike}
        onTogglePin={handleTogglePin}
        onToggleSolve={handleToggleSolve}
        onHidePost={handleHidePost}
        onDeletePost={handleDeletePost}
        onOpenReportModal={handleOpenReportModal}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Guidelines Modal */}
      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Report Modal */}
      {reportingTarget && (
        <ReportModal
          isOpen={!!reportingTarget}
          onClose={() => setReportingTarget(null)}
          targetType={reportingTarget.targetType}
          targetId={reportingTarget.targetId}
          postId={reportingTarget.postId}
          targetTitle={reportingTarget.targetTitle}
          onSubmitReport={handleReportPost}
        />
      )}

      {/* Moderation Command Panel */}
      {isUserMod && (
        <ModerationPanel
          isOpen={isModPanelOpen}
          onClose={() => setIsModPanelOpen(false)}
          reports={pendingReports}
          isLoading={isLoadingReports}
          onActionReport={handleActionReport}
          onHidePost={handleHidePost}
          onDeletePost={handleDeletePost}
          onRefresh={loadReports}
          onViewPost={(postId) => {
            const match = posts.find(p => p.id === postId);
            if (match) setSelectedPost(match);
          }}
        />
      )}
    </div>
  );
};
