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
          <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Search Protocols</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-green-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Query the collective knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/5 rounded-2xl py-3 md:py-4 pl-12 pr-4 text-primary focus:outline-none focus:border-green-500/30 transition-all font-ui shadow-inner-void text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border text-[11px] md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-green-500 text-void border-green-400 shadow-glow-green' 
                  : 'bg-void border-white/5 text-secondary hover:border-white/20'
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
            className="bg-primary text-void px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-glow shadow-white/10 text-xs md:text-sm"
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
          <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Syncing with collective database...</p>
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="text-center py-20 glass-card border-white/5">
          <MessageSquare className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-display font-bold text-primary">No results found for your query</h3>
          <p className="text-secondary font-ui mt-2">Try adjusting your filters or be the first to contribute!</p>
        </div>
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
                <div className={`glass-card p-6 border-white/5 hover:border-green-500/30 transition-all h-full flex flex-col ${tip.isCurated ? 'bg-green-500/5' : ''}`}>
                  {tip.isCurated && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-green-500 rounded-full flex items-center gap-1.5 shadow-glow-green">
                      <Award className="w-3.5 h-3.5 text-void" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-void">Sage Verified</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl border border-white/10 ${tip.isCurated ? 'bg-green-500/20 text-green-400' : 'bg-void text-muted'}`}>
                      <CategoryIcon category={tip.plantCategory || 'General'} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-muted uppercase">
                      {new Date(tip.createdAt?.toDate?.() || tip.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-lg font-display font-bold text-primary mb-3 leading-tight group-hover:text-green-400 transition-colors">
                    {tip.title}
                  </h4>
                  
                  <p className="text-secondary text-sm font-ui leading-relaxed mb-6 flex-1 italic text-stone-400 line-clamp-4">
                    "{tip.tip}"
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 group/vote">
                        <button 
                          onClick={() => handleVote(tip.id!, 'up')}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted hover:text-green-400 transition-all active:scale-110"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black text-secondary">{tip.upvotes || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 group/vote">
                        <button 
                          onClick={() => handleVote(tip.id!, 'down')}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-all active:scale-110"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black text-secondary">{tip.downvotes || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-900/40 border border-green-500/30 flex items-center justify-center text-[10px] font-black text-green-400">
                        {tip.userName?.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-muted uppercase tracking-tighter">{tip.userName}</span>
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
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="relative w-full max-w-xl bg-void border border-green-500/20 rounded-[40px] shadow-[0_0_100px_rgba(34,197,94,0.15)] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-primary">Contribute Protocol</h3>
                    <p className="text-xs text-muted font-ui uppercase tracking-widest font-black">Collective Gardening IQ</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-muted" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <AnimatePresence>
                  {submissionError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2"
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
                      className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Protocol Type</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewTip(prev => ({ ...prev, plantCategory: cat }))}
                        className={`px-5 py-2 rounded-xl border text-xs font-bold transition-all ${
                          newTip.plantCategory === cat 
                          ? 'bg-green-500 text-void border-green-400' 
                          : 'bg-surface border-white/5 text-secondary hover:border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g., The Monstera Propagation Secret"
                    value={newTip.title}
                    onChange={(e) => {
                      setNewTip(prev => ({ ...prev, title: e.target.value }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    className={`w-full bg-surface border rounded-2xl p-4 text-primary focus:outline-none transition-all font-ui shadow-inner-void ${
                      errors.title ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-green-500/30'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-1">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Tip Details</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe your breakthrough care methods..."
                    value={newTip.tip}
                    onChange={(e) => {
                      setNewTip(prev => ({ ...prev, tip: e.target.value }));
                      if (errors.tip) setErrors(prev => ({ ...prev, tip: undefined }));
                    }}
                    className={`w-full bg-surface border rounded-2xl p-4 text-primary focus:outline-none transition-all font-ui shadow-inner-void resize-none ${
                        errors.tip ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-green-500/30'
                    }`}
                  />
                  {errors.tip && (
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-1">
                      {errors.tip}
                    </p>
                  )}
                  <p className="text-[9px] text-muted text-right font-mono">ENFORCE PRECISION. NO BIAS.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-500 text-void py-5 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-green-400 disabled:opacity-50 transition-all shadow-glow-green"
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

