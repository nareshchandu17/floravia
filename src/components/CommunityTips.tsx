import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Award, 
  Droplets,
  Sun,
  Wind,
  ShieldAlert,
  Sparkles,
  Loader2,
  X,
  ThumbsUp,
  ThumbsDown,
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCommunityTips } from '../hooks/useCommunityTips';
import { parseFirestoreError } from '../services/firebase';
import { AuthModal } from './AuthModal';
import { EmptyState } from './EmptyState';

const CATEGORIES = ['All', 'Watering', 'Light', 'Soil', 'Pests', 'General'];

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case 'Watering': return <Droplets className={className} />;
    case 'Light': return <Sun className={className} />;
    case 'Soil': return <Wind className={className} />;
    case 'Pests': return <ShieldAlert className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export function CommunityTips() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'verify-email'>('verify-email');
  const { user } = useAuth();
  
  const {
    tips,
    isLoading,
    isSubmitting,
    voteError,
    setVoteError,
    handleAddTip,
    handleVote
  } = useCommunityTips(activeCategory);

  // Form State
  const [newTip, setNewTip] = useState({
    title: '',
    tip: '',
    plantCategory: 'Watering'
  });
  const [errors, setErrors] = useState<{ title?: string; tip?: string }>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { title?: string; tip?: string } = {};
    if (newTip.title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters.';
    if (newTip.title.trim().length > 100) newErrors.title = 'Title must be under 100 characters.';
    if (newTip.tip.trim().length < 20) newErrors.tip = 'Please provide more detail (at least 20 characters).';
    if (newTip.tip.trim().length > 800) newErrors.tip = 'Tip must be under 800 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setSuccessMessage(null);
    
    if (!validate() || isSubmitting) return;

    try {
      await handleAddTip(newTip);
      setSuccessMessage('Protocol uploaded successfully to the collective database.');
      setNewTip({ title: '', tip: '', plantCategory: 'Watering' });
      setErrors({});
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      const parsed = parseFirestoreError(err);
      setSubmissionError(parsed.userMessage);
    }
  };

  const filteredTips = tips.filter(tip => 
    tip.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tip.tip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-end mb-8 md:mb-12">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Protocols</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/60 group-focus-within:text-emerald-300 transition-colors" />
            <input 
              type="text" 
              placeholder="Query the collective knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b1f16] border border-emerald-500/20 rounded-2xl py-3 md:py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-400/50 transition-all font-ui shadow-inner text-sm md:text-base placeholder:text-emerald-500/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border text-[11px] md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeCategory === cat 
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-[#071610] border-emerald-500/15 text-slate-300 hover:border-emerald-500/35 hover:text-white'
                }`}
              >
                {cat !== 'All' && <CategoryIcon category={cat} className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                {cat}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              if (!user) {
                setAuthModalMode('login');
                setAuthModalOpen(true);
                return;
              }
              if (!user.emailVerified) {
                setAuthModalMode('verify-email');
                setAuthModalOpen(true);
                return;
              }
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] text-xs md:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> Share Tip
          </button>
        </div>
      </div>

      {/* Vote / Action Error Toast */}
      <AnimatePresence>
        {voteError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{voteError}</span>
            </div>
            <div className="flex items-center gap-2">
              {(!user || !user.emailVerified) && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode(user ? 'verify-email' : 'login');
                    setAuthModalOpen(true);
                    setVoteError(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                >
                  {user ? 'Verify Email' : 'Sign In'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setVoteError(null)}
                className="p-1 text-amber-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Syncing with collective database...</p>
        </div>
      ) : filteredTips.length === 0 ? (
        <EmptyState
          variant="card"
          icon={MessageSquare}
          badge="Wisdom Exchange"
          title={searchQuery ? "No results found for your query" : "No shared protocols in this category"}
          description={
            searchQuery
              ? `No plant care tips matched "${searchQuery}". Try adjusting your search keywords or category filters.`
              : "No community tips have been shared in this category yet. Be the first to contribute your verified gardening wisdom!"
          }
          action={{
            label: "Share Your Wisdom",
            onClick: () => {
              if (!user) {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              } else {
                setIsModalOpen(true);
              }
            },
            icon: Plus
          }}
          secondaryAction={
            searchQuery || activeCategory !== 'All'
              ? {
                  label: "Reset Filters",
                  onClick: () => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip, i) => (
              <motion.div
                key={tip.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div className={`bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-6 hover:border-emerald-500/35 transition-all h-full flex flex-col shadow-lg ${tip.isCurated ? 'bg-[#0d261b]' : ''}`}>
                  {tip.isCurated && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-slate-950 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <Award className="w-3.5 h-3.5 text-slate-950" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-950">Sage Verified</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl border border-emerald-500/20 ${tip.isCurated ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#071610] text-emerald-400'}`}>
                      <CategoryIcon category={tip.plantCategory || 'General'} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {new Date(tip.createdAt?.toDate?.() || tip.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-lg font-display font-bold text-white mb-3 leading-tight group-hover:text-emerald-300 transition-colors">
                    {tip.title}
                  </h4>
                  
                  <p className="text-slate-300 text-sm font-ui leading-relaxed mb-6 flex-1 italic line-clamp-4">
                    "{tip.tip}"
                  </p>

                  <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 group/vote">
                        <button 
                          onClick={() => handleVote(tip.id!, 'up')}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-all active:scale-110 cursor-pointer"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black text-slate-300">{tip.upvotes || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 group/vote">
                        <button 
                          onClick={() => handleVote(tip.id!, 'down')}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all active:scale-110 cursor-pointer"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black text-slate-300">{tip.downvotes || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">
                        {tip.userName?.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{tip.userName}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Submission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="relative w-full max-w-xl bg-[#0b1f16] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-emerald-500/15 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white">Contribute Protocol</h3>
                    <p className="text-xs text-slate-400 font-ui uppercase tracking-widest font-black">Collective Gardening IQ</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
                  <X className="w-6 h-6 text-slate-400 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <AnimatePresence>
                  {submissionError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {submissionError}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Type</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewTip(prev => ({ ...prev, plantCategory: cat }))}
                        className={`px-5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          newTip.plantCategory === cat 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                          : 'bg-[#071610] border-emerald-500/15 text-slate-300 hover:border-emerald-500/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., The Monstera Propagation Secret"
                    value={newTip.title}
                    onChange={(e) => {
                      setNewTip(prev => ({ ...prev, title: e.target.value }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    className={`w-full bg-[#071610] border rounded-2xl p-4 text-white focus:outline-none transition-all font-ui ${
                      errors.title ? 'border-rose-500/50 focus:border-rose-500' : 'border-emerald-500/20 focus:border-emerald-400'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter ml-1">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tip Details</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe your breakthrough care methods..."
                    value={newTip.tip}
                    onChange={(e) => {
                      setNewTip(prev => ({ ...prev, tip: e.target.value }));
                      if (errors.tip) setErrors(prev => ({ ...prev, tip: undefined }));
                    }}
                    className={`w-full bg-[#071610] border rounded-2xl p-4 text-white focus:outline-none transition-all font-ui resize-none ${
                        errors.tip ? 'border-rose-500/50 focus:border-rose-500' : 'border-emerald-500/20 focus:border-emerald-400'
                    }`}
                  />
                  {errors.tip && (
                    <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter ml-1">
                      {errors.tip}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400 text-right font-mono">ENFORCE PRECISION. NO BIAS.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      UPLOADING PROTOCOL...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      SUBMIT TO COLLECTIVE
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal for Unverified or Signed Out Users */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

