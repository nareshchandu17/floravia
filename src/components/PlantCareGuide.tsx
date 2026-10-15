import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Droplets, 
  Sun, 
  Bug, 
  Scissors, 
  MessageSquare, 
  Plus, 
  Send, 
  X, 
  Star,
  Calculator,
  BookOpen,
  FlaskConical,
  Sparkles,
  Leaf
} from 'lucide-react';
import { CommunityTip, subscribeToTips, submitTip } from '../services/communityTips';
import { useAuth } from '../hooks/useAuth';
import { FertilizerCalculator } from './FertilizerCalculator';
import { DashboardPlant } from '../types/botanical';
import { EmptyState } from './EmptyState';

interface PlantCareGuideProps {
  gardenPlants?: DashboardPlant[];
  onNavigateToCalendar?: () => void;
}

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

export const PlantCareGuide: React.FC<PlantCareGuideProps> = ({
  gardenPlants = [],
  onNavigateToCalendar
}) => {
  const [activeSection, setActiveSection] = useState<'calculator' | 'encyclopedia' | 'community'>('calculator');
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
      className="max-w-5xl mx-auto space-y-8 pb-20"
    >
      {/* Header & Sub-Navigation */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Botanical Care & Nutrition Guide
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
          Plant Care & Fertilizer Guide
        </h1>

        <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed font-ui">
          Master plant nutrition, species-specific care protocols, pest solutions, and interactive fertilizer dosing calibrated for every developmental growth stage.
        </p>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveSection('calculator')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'bg-[#08140e] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Fertilizer Calculator</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${
              activeSection === 'calculator' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              Interactive
            </span>
          </button>

          <button
            onClick={() => setActiveSection('encyclopedia')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'encyclopedia'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'bg-[#08140e] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Care Encyclopedia</span>
          </button>

          <button
            onClick={() => setActiveSection('community')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'community'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'bg-[#08140e] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Community Wisdom</span>
            {communityTips.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeSection === 'community' ? 'bg-slate-950 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {communityTips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= 1. FERTILIZER CALCULATOR TAB ================= */}
      {activeSection === 'calculator' && (
        <motion.div
          key="calculator-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <FertilizerCalculator 
            gardenPlants={gardenPlants}
            onNavigateToCalendar={onNavigateToCalendar}
          />
        </motion.div>
      )}

      {/* ================= 2. CARE ENCYCLOPEDIA TAB ================= */}
      {activeSection === 'encyclopedia' && (
        <motion.div
          key="encyclopedia-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {guideCategories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { ease: [0.25, 0.46, 0.45, 0.94] } } }}
                  key={category.id} 
                  className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl overflow-hidden shadow-xl"
                >
                  <div className="bg-[#071610] border-b border-emerald-500/10 p-5 flex items-center gap-4">
                    <div className="p-3 bg-[#0b1f16] rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-white text-lg tracking-wide">{category.title}</h3>
                  </div>
                  <div className="divide-y divide-emerald-500/10 font-ui">
                    {category.topics.map((topic, index) => {
                      const topicId = `${category.id}-${index}`;
                      const isOpen = openTopic === topicId;
                      
                      return (
                        <div key={topicId} className="group">
                          <button
                            onClick={() => toggleTopic(topicId)}
                            className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-[#0c2419] transition-colors focus:outline-none cursor-pointer"
                          >
                            <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors text-sm">
                              {topic.title}
                            </span>
                            <ChevronDown 
                              className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} 
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
                                <div className="px-6 pb-5 text-slate-300 text-xs leading-relaxed border-l-2 border-emerald-500/40 ml-6 mb-3">
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
        </motion.div>
      )}

      {/* ================= 3. COMMUNITY WISDOM TAB ================= */}
      {activeSection === 'community' && (
        <motion.div 
          key="community-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-400/20 text-amber-400 shadow-md">
                <Star className="w-5 h-5 fill-amber-400/20" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-xl tracking-wide">Community Wisdom</h3>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tips from fellow botanists</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSubmitForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Share a Tip
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {communityTips.map((tip) => (
              <motion.div 
                key={tip.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 border-l-4 shadow-lg ${tip.isCurated ? 'border-l-amber-400' : 'border-l-emerald-400'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                    {tip.plantCategory || 'General'}
                  </span>
                  {tip.isCurated && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> Curated
                    </div>
                  )}
                </div>
                <h4 className="font-display font-bold text-white mb-1.5 text-sm">{tip.title || 'Gardening Secret'}</h4>
                <p className="text-slate-300 text-xs leading-relaxed italic mb-3">"{tip.tip}"</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-emerald-900/20 pt-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-400/80">
                    <MessageSquare className="w-3 h-3" />
                    Shared by {tip.userName || 'Anonymous'}
                  </div>
                  <span>{tip.createdAt?.toDate().toLocaleDateString() || 'Recently'}</span>
                </div>
              </motion.div>
            ))}
            {communityTips.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState
                  variant="dashed"
                  icon={MessageSquare}
                  badge="Care Wisdom"
                  title="No Community Tips Yet"
                  description="Be the first botanist to contribute your personal care protocol, watering trick, or pruning experience."
                  action={{
                    label: "Share First Tip",
                    onClick: () => setShowSubmitForm(true),
                    icon: Plus
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Submit Tip Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 md:p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <button 
                onClick={() => setShowSubmitForm(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-display font-bold text-white mb-1">Share Your Wisdom</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Contribute to the Floravia botanical community</p>
              </div>

              <form onSubmit={handleSubmitTip} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold ml-1">Subject / Plant Name</label>
                  <input 
                    type="text"
                    required
                    value={newTip.title}
                    onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                    placeholder="e.g. Aloe Vera Drainage Secret"
                    className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500/50 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold ml-1">Category</label>
                  <select 
                    value={newTip.category}
                    onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                    className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500/50 outline-none transition-colors"
                  >
                    <option value="General">General Care</option>
                    <option value="Fertilizing">Fertilizing & Nutrients</option>
                    <option value="Watering">Watering</option>
                    <option value="Pests">Pest Control</option>
                    <option value="Repotting">Repotting</option>
                    <option value="Propagation">Propagation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold ml-1">Your Tip</label>
                  <textarea 
                    required
                    value={newTip.tip}
                    onChange={(e) => setNewTip({ ...newTip, tip: e.target.value })}
                    placeholder="Share your practical experience or care formula..."
                    rows={4}
                    className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500/50 outline-none transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : (
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

