import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Droplets, Sun, Bug, Scissors, MessageSquare, Plus, Send, X, Star } from 'lucide-react';
import { CommunityTip, subscribeToTips, submitTip } from '../services/communityTips';
import { useAuth } from '../hooks/useAuth';

const guideCategories = [
  {
    id: 'basics',
    title: 'Plant Care Basics',
    icon: Droplets,
    topics: [
      {
        title: 'Watering 101: How much is too much?',
        content: 'The most common way people kill houseplants is by overwatering. Only water when the top 1-2 inches of soil feel dry to the touch. Ensure your pots have drainage holes so roots do not sit in water, which causes root rot.'
      },
      {
        title: 'Understanding Light Levels',
        content: '"Bright indirect light" means placing the plant near a window but out of the direct path of the sun\'s rays. South or West facing windows provide bright light, while North is usually low light.'
      },
      {
        title: 'Choosing the Right Soil',
        content: 'Most tropical houseplants thrive in a well-draining potting mix containing peat moss, perlite, and pine bark. Succulents and cacti require specialized sandy mixes that dry out very quickly.'
      }
    ]
  },
  {
    id: 'pests',
    title: 'Common Pests & Diseases',
    icon: Bug,
    topics: [
      {
        title: 'Fungus Gnats',
        content: 'These look like tiny fruit flies darting around the soil. They thrive in damp soil. To control them, let the top few inches of soil dry out completely between waterings, and consider using yellow sticky traps.'
      },
      {
        title: 'Spider Mites',
        content: 'Look for tiny, dust-like specks on the undersides of leaves and fine webbing. They love dry, warm conditions. Treat by wiping leaves with a damp cloth and applying neem oil or insecticidal soap.'
      },
      {
        title: 'Mealybugs',
        content: 'These appear as small, fuzzy white cotton-like clusters, usually hiding in the joints where leaves meet stems. Remove them using a cotton swab dipped in rubbing alcohol, then spray the plant with neem oil.'
      }
    ]
  },
  {
    id: 'popular',
    title: 'Guides for Popular Plants',
    icon: Sun,
    topics: [
      {
        title: 'Monstera Deliciosa (Swiss Cheese Plant)',
        content: 'Thrives in bright, indirect light. Water when the top 2-3 inches of soil are dry. They love humidity. As they grow, provide a moss pole or trellis for support to encourage larger, fenestrated (holey) leaves.'
      },
      {
        title: 'Snake Plant (Sansevieria)',
        content: 'One of the most indestructible plants. It tolerates very low light but prefers moderate light. Water very sparingly—only when the soil is completely bone dry all the way through.'
      },
      {
        title: 'Pothos (Epipremnum aureum)',
        content: 'Excellent for beginners. Can tolerate low light and irregular watering. Let the top half of the soil dry out before watering. If the leaves droop significantly, it\'s thirsty.'
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Pruning & Maintenance',
    icon: Scissors,
    topics: [
      {
        title: 'When to Repot',
        content: 'Repot when roots start growing out of the drainage holes or circling the surface. Choose a new pot only 1-2 inches larger in diameter. Spring is the best time for repotting.'
      },
      {
        title: 'How to Prune',
        content: 'Use clean, sharp shears. Cut just above a leaf node (the bump on the stem where leaves grow) to encourage bushy new growth. Remove yellow or dead leaves entirely to help the plant conserve energy.'
      },
      {
        title: 'Fertilizing Schedule',
        content: 'Most houseplants only need fertilizer during their active growing season (Spring and Summer). A balanced liquid fertilizer diluted to half-strength once a month is usually sufficient.'
      }
    ]
  }
];

export const PlantCareGuide: React.FC = () => {
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [communityTips, setCommunityTips] = useState<CommunityTip[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', tip: '', category: 'General' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToTips((tips) => {
      setCommunityTips(tips);
    }, false);
    return () => unsubscribe();
  }, []);

  const toggleTopic = (id: string) => {
    setOpenTopic(openTopic === id ? null : id);
  };

  const handleSubmitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTip.tip.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitTip({
        tip: newTip.tip,
        title: newTip.title || 'Community Insight',
        plantCategory: newTip.category,
        userName: user?.displayName || 'Botanist'
      });
      setNewTip({ title: '', tip: '', category: 'General' });
      setShowSubmitForm(false);
    } catch (err) {
      console.error('Failed to submit tip:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {guideCategories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { ease: [0.25, 0.46, 0.45, 0.94] } } }}
              key={category.id} 
              className="glass-card overflow-hidden"
            >
              <div className="bg-surface/30 border-b border-white/5 p-5 flex items-center gap-4">
                <div className="p-3 bg-surface rounded-2xl shadow-inner text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-primary text-xl tracking-wide">{category.title}</h3>
              </div>
              <div className="divide-y divide-white/5 font-ui">
                {category.topics.map((topic, index) => {
                  const topicId = `${category.id}-${index}`;
                  const isOpen = openTopic === topicId;
                  
                  return (
                    <div key={topicId} className="group">
                      <button
                        onClick={() => toggleTopic(topicId)}
                        className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-surface/50 transition-colors focus:outline-none"
                      >
                        <span className="font-semibold text-primary/80 group-hover:text-green-400 transition-colors">
                          {topic.title}
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-400' : ''}`} 
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 text-secondary text-sm leading-relaxed border-l-2 border-green-500/30 ml-6 mb-4">
                              {topic.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Community Wisdom Section */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)] text-yellow-400">
              <Star className="w-5 h-5 fill-yellow-400/20" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary text-xl tracking-wide">Community Wisdom</h3>
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Tips from fellow gardeners</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSubmitForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all text-sm font-bold shadow-glow-green"
          >
            <Plus className="w-4 h-4" /> Share a Tip
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {communityTips.map((tip) => (
            <motion.div 
              key={tip.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`glass-card p-6 border-l-4 ${tip.isCurated ? 'border-l-yellow-400' : 'border-l-green-500/30'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-muted uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">
                  {tip.plantCategory || 'General'}
                </span>
                {tip.isCurated && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-yellow-400 uppercase tracking-widest">
                    <Star className="w-2.5 h-2.5 fill-yellow-400" /> Curated
                  </div>
                )}
              </div>
              <h4 className="font-display font-bold text-primary mb-2">{tip.title || 'Gardening Secret'}</h4>
              <p className="text-secondary text-sm leading-relaxed italic mb-4">"{tip.tip}"</p>
              <div className="flex items-center justify-between text-[10px] text-muted font-bold">
                <div className="flex items-center gap-1.5 text-blue-400/70">
                  <MessageSquare className="w-3 h-3" />
                  Shared by {tip.userName || 'Anonymous'}
                </div>
                <span>{tip.createdAt?.toDate().toLocaleDateString() || 'Recently'}</span>
              </div>
            </motion.div>
          ))}
          {communityTips.length === 0 && (
            <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-muted text-sm font-ui">No community tips yet. Be the first to share your wisdom!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Submit Tip Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-8 relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <button 
                onClick={() => setShowSubmitForm(false)}
                className="absolute top-6 right-6 text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-display font-bold text-primary mb-1">Share Your Wisdom</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest leading-none">Contribute to the Floravia community</p>
              </div>

              <form onSubmit={handleSubmitTip} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted font-black ml-1">Subject / Plant Name</label>
                  <input 
                    type="text"
                    required
                    value={newTip.title}
                    onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                    placeholder="e.g. Aloe Vera Secret"
                    className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-primary focus:border-green-500/50 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted font-black ml-1">Category</label>
                  <select 
                    value={newTip.category}
                    onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                    className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-primary focus:border-green-500/50 outline-none transition-colors"
                  >
                    <option value="General">General Care</option>
                    <option value="Watering">Watering</option>
                    <option value="Pests">Pest Control</option>
                    <option value="Repotting">Repotting</option>
                    <option value="Propagation">Propagation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted font-black ml-1">Your Tip</label>
                  <textarea 
                    required
                    value={newTip.tip}
                    onChange={(e) => setNewTip({ ...newTip, tip: e.target.value })}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-primary focus:border-green-500/50 outline-none transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-green-500 text-void font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors shadow-glow-green disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing...' : (
                    <>
                      <Send className="w-4 h-4" /> Broadcast Tip
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
