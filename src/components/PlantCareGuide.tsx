import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  X, 
  Droplets, 
  Sun, 
  Bug, 
  Scissors, 
  Sparkles, 
  Star, 
  Plus, 
  Send, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  RefreshCw, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sprout, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  ExternalLink,
  Info,
  Check,
  Heart
} from 'lucide-react';
import { CommunityTip, subscribeToTips, submitTip } from '../services/communityTips';
import { useAuth } from '../hooks/useAuth';
import { FertilizerCalculator } from './FertilizerCalculator';
import { DashboardPlant } from '../types/botanical';
import { EmptyState } from './EmptyState';
import { 
  PlantSpeciesGuide, 
  PlantProblemGuide, 
  CareTopicGuide,
  PLANT_SPECIES_GUIDES, 
  PLANT_PROBLEM_GUIDES, 
  CARE_TOPIC_GUIDES, 
  CARE_ROUTINE_STEPS,
  searchPlantCareContent,
  SearchResultItem
} from '../data/plantCareData';

export interface PlantCareGuideProps {
  gardenPlants?: DashboardPlant[];
  onNavigateToCalendar?: () => void;
  onNavigateToGarden?: () => void;
  onAddPlantToGarden?: (plant: PlantSpeciesGuide) => void;
  onOpenChatWithTopic?: (topic: string) => void;
  onSelectPlant?: (plant: DashboardPlant) => void;
  onOpenAuthModal?: () => void;
}

type MainSection = 'guides' | 'calculator' | 'community';
type DiscoveryCategory = 'all' | 'plants' | 'problems' | 'care' | 'routine';

export const PlantCareGuide: React.FC<PlantCareGuideProps> = ({
  gardenPlants = [],
  onNavigateToCalendar,
  onNavigateToGarden,
  onAddPlantToGarden,
  onOpenChatWithTopic,
  onSelectPlant,
  onOpenAuthModal
}) => {
  // 1. Navigation state: Defaults directly to 'guides' (Plant Guides)
  const [activeSection, setActiveSection] = useState<MainSection>('guides');
  const [activeCategory, setActiveCategory] = useState<DiscoveryCategory>('all');
  
  // 2. Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // 3. Modals and expanded items
  const [selectedPlantModal, setSelectedPlantModal] = useState<PlantSpeciesGuide | null>(null);
  const [openProblemId, setOpenProblemId] = useState<string | null>('yellow_leaves');
  const [openTopicId, setOpenTopicId] = useState<string | null>('watering_fundamentals');
  const [showAdvancedInModal, setShowAdvancedInModal] = useState(false);
  const [addedPlantNotification, setAddedPlantNotification] = useState<string | null>(null);

  // 4. Community Tips state
  const [communityTips, setCommunityTips] = useState<CommunityTip[]>([]);
  const [showSubmitTipModal, setShowSubmitTipModal] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', tip: '', category: 'General' });
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);
  const [tipSubmitError, setTipSubmitError] = useState<string | null>(null);
  const [tipSubmitSuccess, setTipSubmitSuccess] = useState(false);

  const { user } = useAuth();

  // Subscribe to community tips in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTips((tips) => {
      setCommunityTips(tips);
    }, false);
    return () => unsubscribe();
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    return searchPlantCareContent(searchQuery);
  }, [searchQuery]);

  // Handle adding plant to garden with feedback
  const handleAddPlant = (plant: PlantSpeciesGuide) => {
    if (onAddPlantToGarden) {
      onAddPlantToGarden(plant);
    } else {
      // Local fallback
      try {
        const saved = localStorage.getItem('floravia_local_garden');
        const currentList: DashboardPlant[] = saved ? JSON.parse(saved) : [];
        const exists = currentList.some(p => p.scientificName.toLowerCase() === plant.scientificName.toLowerCase());
        
        if (!exists) {
          const newPlant: DashboardPlant = {
            id: `guide-plant-${Date.now()}`,
            name: plant.commonName,
            scientificName: plant.scientificName,
            nickname: plant.commonName.split(' ')[0],
            matchScore: 99.5,
            confidence: 'High Confidence',
            imageUrl: plant.imageUrl,
            galleryImages: [plant.imageUrl],
            healthScore: 95,
            vigorIndexLabel: 'Vigor Index',
            mood: 'Vibrant',
            hydrationStatus: 'Optimal',
            pathologyRisk: 'Low Risk',
            neuralStress: 'Minimal',
            aiAssessment: {
              mood: 'Vibrant',
              points: [
                'Added from Plant Care Guide',
                `Light: ${plant.quickSpecs.light}`,
                `Water: ${plant.quickSpecs.water}`
              ]
            },
            priorityAdjustments: {
              soilHydro: plant.quickSpecs.water,
              luminance: plant.quickSpecs.light
            },
            weatherInsight: {
              city: 'My Location',
              condition: 'Indoor Sanctuary',
              temp: 24,
              humidity: 50,
              advice: `Check soil moisture before watering your new ${plant.commonName}.`
            },
            careEssentials: {
              water: plant.quickSpecs.water,
              light: plant.quickSpecs.light,
              temp: '65–80°F',
              air: plant.quickSpecs.humidity,
              summary: plant.summary,
              userRating: 5
            },
            healthOverview: {
              period: 'This Week',
              trend: [{ date: 'Today', score: 95, mood: 'Vibrant' }],
              lastWatered: 'Recently added',
              lastFertilized: 'Not fertilized yet',
              nextWatering: 'Check in 2–3 days',
              nextPruning: 'Inspect in 30 days'
            },
            timeline: [
              { date: 'Today', action: 'Added from Plant Care Guide', type: 'identified', color: 'emerald' }
            ],
            aiTip: {
              tip: `Keep in ${plant.quickSpecs.light.toLowerCase()} and test soil with finger before watering.`
            },
            careInstructions: {
              detailedText: plant.summary,
              water: plant.quickSpecs.water,
              light: plant.quickSpecs.light,
              temp: '65–80°F',
              air: plant.quickSpecs.humidity
            }
          };
          localStorage.setItem('floravia_local_garden', JSON.stringify([newPlant, ...currentList]));
        }
      } catch (e) {
        console.error('Failed to save to local garden:', e);
      }
    }

    setAddedPlantNotification(plant.commonName);
    setTimeout(() => {
      setAddedPlantNotification(null);
    }, 3500);
  };

  // Handle Ask Sage contextual action
  const handleAskSage = (prompt: string) => {
    if (onOpenChatWithTopic) {
      onOpenChatWithTopic(prompt);
    }
  };

  // Submit a community tip
  const handleSubmitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTip.tip.trim()) return;

    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        setTipSubmitError('Please sign in to share a community tip.');
      }
      return;
    }

    setIsSubmittingTip(true);
    setTipSubmitError(null);
    try {
      await submitTip({
        tip: newTip.tip.trim(),
        title: newTip.title.trim() || 'Plant Care Tip',
        plantCategory: newTip.category,
        userName: user.displayName || user.email?.split('@')[0] || 'Botanist'
      });
      setNewTip({ title: '', tip: '', category: 'General' });
      setTipSubmitSuccess(true);
      setTimeout(() => {
        setTipSubmitSuccess(false);
        setShowSubmitTipModal(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit tip:', err);
      setTipSubmitError(err.message || 'Failed to submit tip. Please try again.');
    } finally {
      setIsSubmittingTip(false);
    }
  };

  // Helper icon renderer for care topics
  const renderTopicIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Droplets': return <Droplets className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'RefreshCw': return <RefreshCw className={className} />;
      case 'Scissors': return <Scissors className={className} />;
      case 'FlaskConical': return <FlaskConical className={className} />;
      default: return <Sprout className={className} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 text-slate-200">
      
      {/* Toast Notification for Adding Plant */}
      <AnimatePresence>
        {addedPlantNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#071d13] border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Added to My Garden! 🌿</p>
              <p className="text-[11px] text-emerald-300/80">{addedPlantNotification} has been added to your collection.</p>
            </div>
            {onNavigateToGarden && (
              <button
                onClick={onNavigateToGarden}
                className="ml-2 text-xs font-bold text-emerald-400 hover:text-white underline cursor-pointer"
              >
                View
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* HEADER SECTION: Friendly Page Intro                            */}
      {/* ============================================================== */}
      <header className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/25 text-emerald-300 text-xs font-bold tracking-wide">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Floravia Plant Care Guide</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
          Learn How to Care for Your Plants
        </h1>

        <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Simple, practical advice to help your plants grow healthier. Find your plant, understand what it needs, and learn what to do next.
        </p>

        {/* Top-Level Section Switcher: 3 clearly named sections */}
        <nav aria-label="Care Guide Sections" className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
          <button
            role="tab"
            aria-selected={activeSection === 'guides'}
            onClick={() => {
              setActiveSection('guides');
              setSearchQuery('');
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'guides'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105'
                : 'bg-[#081810] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Plant Guides</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === 'calculator'}
            onClick={() => setActiveSection('calculator')}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105'
                : 'bg-[#081810] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Fertilizer Calculator</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              activeSection === 'calculator' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              Interactive
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeSection === 'community'}
            onClick={() => setActiveSection('community')}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'community'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105'
                : 'bg-[#081810] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Community Tips</span>
            {communityTips.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeSection === 'community' ? 'bg-slate-950 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {communityTips.length}
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* ============================================================== */}
      {/* SECTION 1: PLANT GUIDES (DEFAULT)                              */}
      {/* ============================================================== */}
      {activeSection === 'guides' && (
        <div className="space-y-8">
          
          {/* SEARCH BAR (Functional local search) */}
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="relative">
              <label htmlFor="plant-care-search" className="sr-only">
                Search a plant, care question, or problem
              </label>
              <Search className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="plant-care-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a plant, care question, or problem (e.g. Monstera, yellow leaves, watering)..."
                className="w-full pl-12 pr-10 py-3.5 bg-[#071610] border border-emerald-500/25 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Transparent notice on search scope */}
            <p className="text-[11px] text-slate-400 text-center">
              Search covers verified houseplant species, troubleshooting guides, and core care topics.
            </p>
          </div>

          {/* ============================================================ */}
          {/* SEARCH RESULTS VIEW (When query exists)                      */}
          {/* ============================================================ */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Search Results</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'} found for "{searchQuery}")
                  </span>
                </h2>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>

              {/* Empty Search State */}
              {searchResults.length === 0 && (
                <div className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No Guides Found for "{searchQuery}"</h3>
                  <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    We couldn't find a direct match in our beginner collection. Try searching for broader terms or pick a popular topic below:
                  </p>
                  
                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {['Watering', 'Yellow leaves', 'Monstera', 'Snake Plant', 'Brown tips', 'Pests', 'Fertilizer'].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setSearchQuery(chip)}
                        className="px-3 py-1.5 rounded-full bg-[#071610] border border-emerald-500/20 text-xs text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {onOpenChatWithTopic && (
                    <div className="pt-4 border-t border-emerald-900/30">
                      <button
                        onClick={() => handleAskSage(`How do I care for or fix ${searchQuery}?`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ask Sage AI about "{searchQuery}"</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Render Search Results */}
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          item.badgeColor === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : item.badgeColor === 'rose'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                        }`}>
                          {item.badge}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {item.type === 'plant' ? 'Plant Guide' : item.type === 'problem' ? 'Problem Fix' : 'Care Concept'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-emerald-400/90 italic">{item.subtitle}</p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {item.snippet}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-emerald-900/25 flex items-center justify-between">
                      {item.type === 'plant' && (
                        <button
                          onClick={() => setSelectedPlantModal(item.data as PlantSpeciesGuide)}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Full Plant Guide</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.type === 'problem' && (
                        <button
                          onClick={() => {
                            setActiveCategory('problems');
                            setOpenProblemId(item.id);
                            setSearchQuery('');
                          }}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Problem Solution</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.type === 'topic' && (
                        <button
                          onClick={() => {
                            setActiveCategory('care');
                            setOpenTopicId(item.id);
                            setSearchQuery('');
                          }}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Read Care Topic</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onOpenChatWithTopic && (
                        <button
                          onClick={() => handleAskSage(`Tell me more about ${item.title}`)}
                          className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          title="Ask Sage AI"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Ask Sage</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* FOUR DISCOVERY ENTRY POINTS (When no active search)          */
            /* ============================================================ */
            <div className="space-y-10">
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#071610] border border-emerald-500/15 rounded-2xl max-w-2xl mx-auto">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Sections
                </button>
                <button
                  onClick={() => setActiveCategory('plants')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === 'plants'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Find My Plant</span>
                </button>
                <button
                  onClick={() => setActiveCategory('problems')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === 'problems'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Fix a Plant Problem</span>
                </button>
                <button
                  onClick={() => setActiveCategory('care')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === 'care'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Learn Plant Care</span>
                </button>
                <button
                  onClick={() => setActiveCategory('routine')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === 'routine'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Build My Routine</span>
                </button>
              </div>

              {/* -------------------------------------------------------- */}
              {/* 1. FIND MY PLANT (Plant Guides Gallery)                   */}
              {/* -------------------------------------------------------- */}
              {(activeCategory === 'all' || activeCategory === 'plants') && (
                <section aria-labelledby="heading-find-my-plant" className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 pb-3">
                    <div>
                      <h2 id="heading-find-my-plant" className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                        <Sprout className="w-5 h-5 text-emerald-400" />
                        <span>Find My Plant</span>
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300">
                        Plain-language care guides for popular indoor houseplants with verified care needs.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
                      {PLANT_SPECIES_GUIDES.length} Verified Guides
                    </span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {PLANT_SPECIES_GUIDES.map((plant) => (
                      <article 
                        key={plant.id}
                        className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl overflow-hidden shadow-xl hover:border-emerald-500/35 transition-all flex flex-col justify-between group"
                      >
                        {/* Image Header with Badges */}
                        <div className="relative h-44 overflow-hidden bg-[#06140d]">
                          <img 
                            src={plant.imageUrl} 
                            alt={plant.commonName}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f16] via-transparent to-black/30" />
                          
                          {/* Difficulty Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#071610]/90 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                              {plant.difficulty}
                            </span>
                          </div>

                          {/* Toxicity Indicator */}
                          <div className="absolute top-3 right-3">
                            {plant.toxicity.petSafe ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 flex items-center gap-1" title="Non-toxic to pets">
                                <Heart className="w-3 h-3 fill-emerald-400/30 text-emerald-400" /> Pet Safe
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/30 flex items-center gap-1" title="Toxic if chewed by pets">
                                <ShieldAlert className="w-3 h-3 text-amber-400" /> Toxic to Pets
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Plant Info Content */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <h3 className="font-display font-bold text-white text-base leading-tight group-hover:text-emerald-300 transition-colors">
                              {plant.commonName}
                            </h3>
                            <p className="text-xs text-emerald-400/80 italic font-mono">
                              {plant.scientificName}
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                              {plant.summary}
                            </p>
                          </div>

                          {/* Quick Care Snapshot */}
                          <div className="bg-[#071610] p-2.5 rounded-xl border border-emerald-900/30 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{plant.quickSpecs.light}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{plant.quickSpecs.water}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-2">
                            <button
                              onClick={() => setSelectedPlantModal(plant)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Learn What It Needs</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleAddPlant(plant)}
                              className="w-full py-2 px-3 rounded-xl bg-[#081810] hover:bg-emerald-950/60 text-slate-300 hover:text-white border border-emerald-900/40 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Add to My Garden</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* -------------------------------------------------------- */}
              {/* 2. FIX A PLANT PROBLEM (Symptom Troubleshooting)         */}
              {/* -------------------------------------------------------- */}
              {(activeCategory === 'all' || activeCategory === 'problems') && (
                <section aria-labelledby="heading-fix-problem" className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 pb-3">
                    <div>
                      <h2 id="heading-fix-problem" className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>Fix a Plant Problem</span>
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300">
                        Identify what your plant is showing you before guessing at a solution.
                      </p>
                    </div>
                    <span className="text-xs text-amber-300 font-bold bg-amber-950/60 border border-amber-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
                      Step-by-Step Diagnostic Steps
                    </span>
                  </div>

                  <div className="space-y-4">
                    {PLANT_PROBLEM_GUIDES.map((problem) => {
                      const isOpen = openProblemId === problem.id;
                      return (
                        <div
                          key={problem.id}
                          className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl overflow-hidden shadow-lg transition-all"
                        >
                          <button
                            onClick={() => setOpenProblemId(isOpen ? null : problem.id)}
                            aria-expanded={isOpen}
                            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#0c2419] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 ${
                                problem.severity === 'High'
                                  ? 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                                  : problem.severity === 'Moderate'
                                  ? 'bg-amber-950/60 border-amber-500/30 text-amber-400'
                                  : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                              }`}>
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display font-bold text-white text-base md:text-lg flex items-center gap-2 truncate">
                                  <span>{problem.symptom}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    problem.severity === 'High'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {problem.severity} Priority
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-300 truncate">{problem.shortDescription}</p>
                              </div>
                            </div>

                            <ChevronDown 
                              className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                                isOpen ? 'rotate-180 text-emerald-400' : ''
                              }`} 
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 pt-0 border-t border-emerald-900/30 space-y-5 text-xs md:text-sm">
                                  
                                  {/* What It Means */}
                                  <div className="pt-4 space-y-1.5">
                                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                                      <Info className="w-4 h-4" /> 1. What it means
                                    </h4>
                                    <p className="text-slate-300 leading-relaxed bg-[#071610] p-3.5 rounded-2xl border border-emerald-900/30">
                                      {problem.whatItMeans}
                                    </p>
                                  </div>

                                  {/* Two Column: What to Check vs What to Do */}
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {/* What to check */}
                                    <div className="bg-[#071610] p-4 rounded-2xl border border-emerald-500/15 space-y-2.5">
                                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                        <Search className="w-3.5 h-3.5" /> 2. What to check first
                                      </h4>
                                      <ul className="space-y-2 text-slate-300">
                                        {problem.whatToCheck.map((item, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                              {idx + 1}
                                            </span>
                                            <span className="leading-relaxed">{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* What to do */}
                                    <div className="bg-[#071610] p-4 rounded-2xl border border-emerald-500/15 space-y-2.5">
                                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> 3. What to do next
                                      </h4>
                                      <ul className="space-y-2 text-slate-300">
                                        {problem.whatToDo.map((item, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  {/* What to Avoid & Warning */}
                                  <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-2xl space-y-2 text-rose-200">
                                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-300">
                                      <ShieldAlert className="w-3.5 h-3.5" /> 4. What to avoid
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                                      {problem.whatToAvoid.map((avoid, idx) => (
                                        <li key={idx}>{avoid}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Contextual Action Bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-900/30">
                                    <p className="text-[11px] text-slate-400">
                                      <span className="font-bold text-white">When to seek help:</span> {problem.whenToSeekHelp}
                                    </p>
                                    
                                    {onOpenChatWithTopic && (
                                      <button
                                        onClick={() => handleAskSage(`Help me diagnose and treat ${problem.symptom} on my plant.`)}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Ask Sage About This Symptom</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* -------------------------------------------------------- */}
              {/* 3. LEARN PLANT CARE (Core Care Topics)                   */}
              {/* -------------------------------------------------------- */}
              {(activeCategory === 'all' || activeCategory === 'care') && (
                <section aria-labelledby="heading-learn-care" className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 pb-3">
                    <div>
                      <h2 id="heading-learn-care" className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        <span>Learn Plant Care</span>
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300">
                        Essential principles every houseplant owner should understand in plain English.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
                      6 Core Foundations
                    </span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {CARE_TOPIC_GUIDES.map((topic) => {
                      const isOpen = openTopicId === topic.id;
                      return (
                        <div 
                          key={topic.id}
                          className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
                        >
                          <div className="p-5 bg-[#071610] border-b border-emerald-500/10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#0b1f16] rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-md">
                                {renderTopicIcon(topic.iconName)}
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-white text-base tracking-wide">
                                  {topic.title}
                                </h3>
                                <p className="text-xs text-emerald-400/80 font-medium">
                                  {topic.plainHeading}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                              aria-expanded={isOpen}
                              aria-label={`Toggle details for ${topic.title}`}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                            </button>
                          </div>

                          <div className="p-5 space-y-4 flex-1">
                            {/* Summary */}
                            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                              {topic.summary}
                            </p>

                            {/* Golden Rule Highlight */}
                            <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200">
                              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-white">Golden Rule: </span>
                                {topic.goldenRule}
                              </div>
                            </div>

                            {/* Expandable Action Steps */}
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-4 pt-2 overflow-hidden"
                                >
                                  {/* Steps */}
                                  <div className="space-y-2.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Action Steps</h4>
                                    <div className="space-y-2">
                                      {topic.actionSteps.map((step, idx) => (
                                        <div key={idx} className="bg-[#071610] p-3 rounded-xl border border-emerald-900/30 text-xs space-y-1">
                                          <p className="font-bold text-emerald-300">{step.title}</p>
                                          <p className="text-slate-300 leading-relaxed">{step.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Things to avoid */}
                                  <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-500/20 text-xs space-y-1 text-slate-300">
                                    <p className="font-bold text-rose-300 uppercase tracking-wider text-[10px]">Common Mistakes to Avoid</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                      {topic.thingsToAvoid.map((mistake, idx) => (
                                        <li key={idx}>{mistake}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Beginner tip */}
                                  <p className="text-[11px] text-slate-400 italic">
                                    <span className="font-bold text-slate-300">Pro Tip: </span>
                                    {topic.beginnerAdvice}
                                  </p>

                                  {/* Quick link if topic is fertilizing */}
                                  {topic.category === 'fertilizing' && (
                                    <button
                                      onClick={() => setActiveSection('calculator')}
                                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                    >
                                      <FlaskConical className="w-4 h-4" />
                                      <span>Open Interactive Fertilizer Calculator</span>
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Footer trigger if closed */}
                          {!isOpen && (
                            <div className="p-4 pt-0">
                              <button
                                onClick={() => setOpenTopicId(topic.id)}
                                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Read Full Instructions</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* -------------------------------------------------------- */}
              {/* 4. BUILD MY CARE ROUTINE (Actionable Connections)        */}
              {/* -------------------------------------------------------- */}
              {(activeCategory === 'all' || activeCategory === 'routine') && (
                <section aria-labelledby="heading-care-routine" className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 pb-3">
                    <div>
                      <h2 id="heading-care-routine" className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        <span>Build My Care Routine</span>
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300">
                        Turn plant knowledge into simple, repeatable habits in Floravia.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {CARE_ROUTINE_STEPS.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="bg-[#0b1f16] border border-emerald-500/15 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-4 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-display font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                              {step.stepNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                              {step.frequency}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-white text-base leading-snug">
                            {step.title}
                          </h3>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        <div className="pt-2">
                          {step.actionTab === 'calendar' && onNavigateToCalendar && (
                            <button
                              onClick={onNavigateToCalendar}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{step.actionText}</span>
                            </button>
                          )}

                          {step.actionTab === 'garden' && onNavigateToGarden && (
                            <button
                              onClick={onNavigateToGarden}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{step.actionText}</span>
                            </button>
                          )}

                          {step.actionTab === 'chat' && onOpenChatWithTopic && (
                            <button
                              onClick={() => handleAskSage('Help me build a personalized weekly plant care routine for my home.')}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{step.actionText}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: FERTILIZER CALCULATOR TAB                           */}
      {/* ============================================================== */}
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

      {/* ============================================================== */}
      {/* SECTION 3: COMMUNITY TIPS TAB                                  */}
      {/* ============================================================== */}
      {activeSection === 'community' && (
        <motion.div 
          key="community-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header & Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1f16] border border-emerald-500/15 rounded-3xl p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                <h2 className="font-display font-bold text-white text-xl md:text-2xl">
                  Community Tips & Wisdom
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-300">
                Real-world tips shared by fellow plant owners. Community experiences are subjective and complement verified plant care.
              </p>
            </div>

            <button 
              onClick={() => {
                if (!user && onOpenAuthModal) {
                  onOpenAuthModal();
                } else {
                  setShowSubmitTipModal(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all text-xs font-bold cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> 
              <span>Share a Care Tip</span>
            </button>
          </div>

          {/* Grid of Community Tips */}
          <div className="grid gap-4 md:grid-cols-2">
            {communityTips.map((tip) => (
              <div 
                key={tip.id}
                className={`bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 border-l-4 shadow-lg flex flex-col justify-between ${
                  tip.isCurated ? 'border-l-amber-400' : 'border-l-emerald-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-[#071610] px-2.5 py-0.5 rounded border border-emerald-900/30">
                      {tip.plantCategory || 'General Care'}
                    </span>
                    {tip.isCurated && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>Floravia Verified</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-white text-sm md:text-base">
                    {tip.title || 'Gardening Advice'}
                  </h3>

                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed italic">
                    "{tip.tip}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-emerald-900/20 pt-3 mt-3">
                  <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Shared by {tip.userName || 'Fellow Botanist'}</span>
                  </div>
                  <span>{tip.createdAt?.toDate ? tip.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            ))}

            {communityTips.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState
                  variant="dashed"
                  icon={MessageSquare}
                  badge="Community Knowledge"
                  title="No Community Tips Yet"
                  description="Be the first gardener to share your favorite watering trick, pruning advice, or soil recipe."
                  action={{
                    label: "Share First Tip",
                    onClick: () => setShowSubmitTipModal(true),
                    icon: Plus
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PLANT GUIDE DETAILS                                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedPlantModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-plant-title"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-6 text-slate-200"
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedPlantModal(null);
                  setShowAdvancedInModal(false);
                }}
                aria-label="Close plant care guide modal"
                className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Hero Banner */}
              <div className="relative h-56 w-full overflow-hidden bg-[#06140d]">
                <img 
                  src={selectedPlantModal.imageUrl} 
                  alt={selectedPlantModal.commonName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f16] via-[#0b1f16]/40 to-transparent" />
                
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedPlantModal.difficulty}
                    </span>
                    {selectedPlantModal.toxicity.petSafe ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-emerald-400" /> Pet Safe
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-400" /> Toxic if Ingested
                      </span>
                    )}
                  </div>

                  <h3 id="modal-plant-title" className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
                    {selectedPlantModal.commonName}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono italic">
                    {selectedPlantModal.scientificName} • {selectedPlantModal.family}
                  </p>
                </div>
              </div>

              {/* Modal Body Content */}
              <div className="px-6 pb-6 space-y-6">
                
                {/* Summary */}
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-[#071610] p-4 rounded-2xl border border-emerald-500/15">
                  {selectedPlantModal.summary}
                </p>

                {/* 4 Core Needs Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4" />
                    <span>What This Plant Needs to Grow Well</span>
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Sunlight */}
                    <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-900/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <Sun className="w-4 h-4" />
                        <span>Light & Placement</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPlantModal.lightRequirement.plainDescription}
                      </p>
                      <p className="text-[11px] text-emerald-400/80">
                        <span className="font-semibold text-slate-400">Best spot:</span> {selectedPlantModal.lightRequirement.idealSpot}
                      </p>
                    </div>

                    {/* Watering */}
                    <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-900/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                        <Droplets className="w-4 h-4" />
                        <span>Watering Routine</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPlantModal.wateringGuidance.plainDescription}
                      </p>
                      <p className="text-[11px] text-cyan-400/80">
                        <span className="font-semibold text-slate-400">Finger test:</span> {selectedPlantModal.wateringGuidance.howToCheck}
                      </p>
                    </div>

                    {/* Soil & Drainage */}
                    <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-900/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <Layers className="w-4 h-4" />
                        <span>Soil & Container</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPlantModal.soilAndDrainage.plainDescription}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {selectedPlantModal.soilAndDrainage.potRecommendation}
                      </p>
                    </div>

                    {/* Temperature & Humidity */}
                    <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-900/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Room Climate</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPlantModal.temperatureAndHumidity.plainDescription}
                      </p>
                      <p className="text-[11px] text-purple-300/80">
                        {selectedPlantModal.temperatureAndHumidity.idealTemp}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Practical Care Tips */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Helpful Care Tips</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedPlantModal.careTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pet Safety & Toxicity Alert */}
                <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  selectedPlantModal.toxicity.petSafe 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {selectedPlantModal.toxicity.petSafe ? (
                      <>
                        <Heart className="w-4 h-4 text-emerald-400" />
                        <span>Pet Safety: Safe for Cats & Dogs</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Pet Safety: Caution Around Pets</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedPlantModal.toxicity.details}
                  </p>
                </div>

                {/* Optional Advanced Details Toggle */}
                <div className="border-t border-emerald-900/30 pt-3">
                  <button
                    onClick={() => setShowAdvancedInModal(!showAdvancedInModal)}
                    className="text-xs font-semibold text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{showAdvancedInModal ? 'Hide Advanced Botanical Details' : 'Show Advanced Botanical Details'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedInModal ? 'rotate-180' : ''}`} />
                  </button>

                  {showAdvancedInModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 bg-[#071610] p-4 rounded-2xl border border-emerald-900/40 text-xs space-y-2 text-slate-300"
                    >
                      <p><span className="font-bold text-white">Botanical Family:</span> {selectedPlantModal.advancedDetails.botanicalFamily}</p>
                      <p><span className="font-bold text-white">Growth Habit:</span> {selectedPlantModal.advancedDetails.growthHabit}</p>
                      <p><span className="font-bold text-white">Propagation:</span> {selectedPlantModal.advancedDetails.propagationMethod}</p>
                      <p><span className="font-bold text-white">Native Habitat:</span> {selectedPlantModal.nativeHabitat}</p>
                    </motion.div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddPlant(selectedPlantModal)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to My Garden</span>
                    </button>

                    {onNavigateToCalendar && (
                      <button
                        onClick={() => {
                          setSelectedPlantModal(null);
                          onNavigateToCalendar();
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-[#071610] hover:bg-emerald-950/60 text-slate-300 hover:text-white border border-emerald-900/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Care Calendar</span>
                      </button>
                    )}
                  </div>

                  {onOpenChatWithTopic && (
                    <button
                      onClick={() => {
                        const plantName = selectedPlantModal.commonName;
                        setSelectedPlantModal(null);
                        handleAskSage(`How do I care for my ${plantName} in my home?`);
                      }}
                      className="py-2.5 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ask Sage About This Plant</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: SUBMIT COMMUNITY TIP                                    */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showSubmitTipModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-tip-title"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 md:p-8 relative overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowSubmitTipModal(false)}
                aria-label="Close submit tip modal"
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 id="modal-tip-title" className="text-xl font-display font-bold text-white mb-1">
                  Share Your Plant Care Tip
                </h3>
                <p className="text-xs text-slate-400">
                  Help fellow gardeners with your practical experience or care habits.
                </p>
              </div>

              {tipSubmitSuccess ? (
                <div className="p-6 text-center space-y-3 bg-[#071610] rounded-2xl border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white text-sm">Thank You for Contributing!</p>
                  <p className="text-xs text-slate-300">Your tip is now visible to the Floravia gardening community.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTip} className="space-y-4">
                  {tipSubmitError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                      {tipSubmitError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="tip-title" className="text-xs font-semibold text-slate-300 ml-1">
                      Subject or Plant Name
                    </label>
                    <input 
                      id="tip-title"
                      type="text"
                      required
                      value={newTip.title}
                      onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                      placeholder="e.g. Secret for Healthy Snake Plant Leaves"
                      className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white focus:border-emerald-500/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tip-category" className="text-xs font-semibold text-slate-300 ml-1">
                      Category
                    </label>
                    <select 
                      id="tip-category"
                      value={newTip.category}
                      onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                      className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white focus:border-emerald-500/50 outline-none transition-colors"
                    >
                      <option value="General">General Houseplant Care</option>
                      <option value="Watering">Watering & Moisture</option>
                      <option value="Light">Sunlight & Windows</option>
                      <option value="Pests">Pest Solutions</option>
                      <option value="Repotting">Repotting & Soil</option>
                      <option value="Fertilizing">Feeding & Nutrients</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tip-content" className="text-xs font-semibold text-slate-300 ml-1">
                      Your Practical Advice
                    </label>
                    <textarea 
                      id="tip-content"
                      required
                      value={newTip.tip}
                      onChange={(e) => setNewTip({ ...newTip, tip: e.target.value })}
                      placeholder="Explain your observation or technique in plain language..."
                      rows={4}
                      className="w-full bg-[#050e09] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white focus:border-emerald-500/50 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingTip}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingTip ? 'Publishing...' : (
                      <>
                        <Send className="w-4 h-4" /> 
                        <span>Post Community Tip</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
