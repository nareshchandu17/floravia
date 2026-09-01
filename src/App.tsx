import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { ImageUploader } from './components/ImageUploader';
import { DiseaseAnalysis } from './components/DiseaseAnalysis';
import { MyGarden } from './components/MyGarden';
import { CareCalendar } from './components/CareCalendar';
import { PlantCareGuide } from './components/PlantCareGuide';
import { ChatBot } from './components/ChatBot';
import { CommunityForum } from './components/forum/CommunityForum';
import { Profile } from './components/Profile';
import { Shop } from './components/Shop';
import { RemindersView } from './components/RemindersView';
import { BioSignatureModal } from './components/BioSignatureModal';
import { GalleryModal } from './components/GalleryModal';
import { UpgradeModal } from './components/UpgradeModal';
import { NotificationList } from './components/NotificationList';
import { Onboarding } from './components/Onboarding';
import { AuthModal } from './components/AuthModal';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from './hooks/useNotifications';
import { useAppState } from './hooks/useAppState';
import { DEFAULT_PLANTS } from './data/defaultPlants';
import { DashboardPlant } from './types/botanical';
import { Leaf, Sparkles, Activity, Sprout, Bell, X } from 'lucide-react';
import { POPULAR_CITY_WEATHER } from './services/weather';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [gardenPlants, setGardenPlants] = useState<DashboardPlant[]>(DEFAULT_PLANTS);
  const [currentPlant, setCurrentPlant] = useState<DashboardPlant>(DEFAULT_PLANTS[0]);
  
  // Modals state
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryPlant, setGalleryPlant] = useState<DashboardPlant>(DEFAULT_PLANTS[0]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'verify-email'>('login');

  const openAuthModal = (mode: 'login' | 'signup' | 'verify-email' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Top header state
  const [selectedCity, setSelectedCity] = useState('Bhimavaram');
  const [weatherTemp, setWeatherTemp] = useState(29);
  const [weatherHumidity, setWeatherHumidity] = useState(73);

  // Gemini state from hook
  const {
    analysis,
    setAnalysis,
    diagnosis,
    isLoading,
    error,
    lastImage,
    handleImageSelected
  } = useAppState();

  const { toast, setToast } = useNotifications();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('floravia_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // When a new plant is scanned via AI, convert to DashboardPlant format and make it active
  useEffect(() => {
    if (analysis) {
      const newDashboardPlant: DashboardPlant = {
        id: `scanned-${Date.now()}`,
        name: analysis.name,
        scientificName: analysis.scientificName,
        matchScore: Number(analysis.confidence.toFixed(1)) || 99.4,
        confidence: 'High Confidence',
        imageUrl: lastImage || 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          lastImage || 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1200&q=85'
        ],
        healthScore: analysis.healthScore || 92,
        vigorIndexLabel: 'Vigor Index',
        mood: analysis.mood || 'Vibrant',
        hydrationStatus: (analysis.indicators?.hydration as any) || 'Optimal',
        pathologyRisk: (analysis.indicators?.diseaseRisk as any) || 'Low Risk',
        neuralStress: (analysis.indicators?.stressLevel as any) || 'Minimal',
        aiAssessment: {
          mood: analysis.mood || 'Vibrant',
          points: analysis.insights || [
            'Optimal chlorophyll saturation across foliar plane',
            'Strong turgor response observed in cellular structure',
            'Active vegetative respiration and growth potential'
          ]
        },
        priorityAdjustments: {
          soilHydro: analysis.predictedNeeds?.watering || 'Allow top layer to dry between waterings',
          luminance: analysis.predictedNeeds?.light || 'Provide bright filtered light daily'
        },
        weatherInsight: {
          city: selectedCity,
          condition: 'Ambient Microclimate',
          temp: weatherTemp,
          humidity: weatherHumidity,
          advice: `Current conditions in ${selectedCity} are favorable for ${analysis.name}.`
        },
        careEssentials: {
          water: 'Regularly',
          light: 'Bright Indirect',
          temp: '65–80°F',
          air: 'Well Ventilated',
          summary: analysis.insights?.[0] || `Identified ${analysis.name} (${analysis.scientificName}) with a health score of ${analysis.healthScore}%.`,
          userRating: 5
        },
        healthOverview: {
          period: 'This Week',
          trend: [
            { date: 'May 14', score: 70, mood: 'Good' },
            { date: 'May 21', score: 78, mood: 'Good' },
            { date: 'May 28', score: 85, mood: 'Thriving' },
            { date: 'Jun 04', score: 89, mood: 'Thriving' },
            { date: 'Jun 11', score: analysis.healthScore || 95, mood: analysis.mood }
          ],
          lastWatered: 'Today',
          lastFertilized: '10 days ago',
          nextWatering: 'In 2–3 days',
          nextPruning: 'In 14 days'
        },
        timeline: [
          { date: 'Today', action: 'Identified via AI Lens', type: 'identified', color: 'emerald' },
          { date: 'Today', action: 'Bio-Signature Logged', type: 'watered', color: 'emerald' }
        ],
        aiTip: {
          tip: `Keep ${analysis.name} in steady ambient conditions and avoid sudden drafts.`,
          guideLink: 'care'
        },
        careInstructions: {
          detailedText: `${analysis.name} (${analysis.scientificName}) flourishes with consistent care. Water when the top inch of soil is dry, allowing excess liquid to drain thoroughly. Position in adequate natural light to foster vibrant photosynthesis.`,
          water: 'Regularly',
          light: 'Bright Indirect',
          temp: '65–80°F',
          air: 'Well Ventilated'
        },
        bioSignature: {
          stomatalConductance: '0.40 mol/m²·s (Healthy)',
          chlorophyllFluorescence: 'Fv/Fm = 0.82 (High)',
          turgorPressure: '0.88 MPa (Optimal)',
          photoperiodicPhase: 'Diurnal Synthesis',
          cellularHydrationIndex: 95,
          metabolicEfficiency: 93
        }
      };

      setGardenPlants(prev => [newDashboardPlant, ...prev.filter(p => p.id !== newDashboardPlant.id)]);
      setCurrentPlant(newDashboardPlant);
      setActiveTab('home');
    }
  }, [analysis, lastImage, selectedCity, weatherTemp, weatherHumidity]);

  const handleOpenGallery = (plant: DashboardPlant) => {
    setGalleryPlant(plant);
    setIsGalleryModalOpen(true);
  };

  const handleWaterPlant = (plantId: string) => {
    const updatePlant = (p: DashboardPlant): DashboardPlant => {
      if (p.id === plantId) {
        return {
          ...p,
          healthScore: Math.min(100, (p.healthScore || 90) + 1),
          hydrationStatus: 'Optimal',
          healthOverview: {
            ...p.healthOverview,
            lastWatered: 'Just now',
            nextWatering: 'In 3–4 days'
          },
          timeline: [
            { date: 'Just now', action: 'Watered & Hydrated', type: 'watered', color: 'emerald' },
            ...(p.timeline || []).filter(t => t.action !== 'Watered & Hydrated')
          ]
        };
      }
      return p;
    };

    setCurrentPlant(prev => updatePlant(prev));
    setGardenPlants(prev => prev.map(p => updatePlant(p)));
    setToast({
      title: 'Plant Watered! 💧',
      body: `${currentPlant.name} marked as watered. Hydration is optimal!`
    });
  };

  const handleFertilizePlant = (plantId: string, details?: { fertilizerType: string; date: string; notes?: string }) => {
    const updatePlant = (p: DashboardPlant): DashboardPlant => {
      if (p.id === plantId) {
        const fertDate = details?.date || 'Just now';
        return {
          ...p,
          healthScore: Math.min(100, (p.healthScore || 90) + 2),
          healthOverview: {
            ...p.healthOverview,
            lastFertilized: fertDate
          },
          timeline: [
            { 
              date: fertDate === 'Today' || fertDate === 'Just now' ? 'Just now' : fertDate, 
              action: `Fertilized: ${details?.fertilizerType || 'Nutrient Boost'}`, 
              type: 'fertilized', 
              color: 'amber' 
            },
            ...(p.timeline || []).filter(t => !t.action.startsWith('Fertilized'))
          ]
        };
      }
      return p;
    };

    setCurrentPlant(prev => updatePlant(prev));
    setGardenPlants(prev => prev.map(p => updatePlant(p)));
    setToast({
      title: 'Nutrients Applied! 🌿✨',
      body: `${currentPlant.name} fertilized with ${details?.fertilizerType || 'species nutrients'}.`
    });
  };

  const handleSearch = (query: string) => {
    if (!query) return;
    const match = gardenPlants.find(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(query.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(query.toLowerCase()))
    );
    if (match) {
      setCurrentPlant(match);
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#050b08] text-[#f2fbf5] font-ui flex flex-row overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Onboarding Dialog */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding 
            onComplete={() => {
              localStorage.setItem('floravia_onboarded', 'true');
              setShowOnboarding(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onOpenAuthModal={openAuthModal}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="relative w-64 h-full bg-[#08120d] z-50 flex flex-col"
            >
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileSidebarOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenUpgradeModal={() => {
                  setIsUpgradeModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenAuthModal={(mode) => {
                  openAuthModal(mode);
                  setIsMobileSidebarOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Right View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050b08]">
        {/* Top Header */}
        <TopHeader
          onSearch={handleSearch}
          selectedCity={selectedCity}
          onChangeCity={(city) => {
            setSelectedCity(city);
            const cityData = POPULAR_CITY_WEATHER[city] || {
              city,
              temp: 27,
              humidity: 45,
              condition: 'Pleasant Microclimate',
              icon: '02d'
            };
            setWeatherTemp(cityData.temp);
            setWeatherHumidity(cityData.humidity);

            // Dynamically synchronize current plant's weatherInsight
            setCurrentPlant(prev => ({
              ...prev,
              weatherInsight: {
                city: cityData.city,
                condition: cityData.condition,
                temp: cityData.temp,
                humidity: cityData.humidity,
                advice: cityData.humidity < 40 
                  ? `Arid air detected in ${cityData.city} (${cityData.humidity}% RH). Supplemental misting recommended.`
                  : `Ambient conditions in ${cityData.city} are favorable for ${prev.name}.`
              }
            }));
          }}
          weatherTemp={weatherTemp}
          weatherHumidity={weatherHumidity}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          gardenPlants={gardenPlants}
          onSelectPlant={(plant) => {
            setCurrentPlant(plant);
            setActiveTab('home');
          }}
          onOpenAuthModal={() => openAuthModal('login')}
        />

        {/* Global Email Verification Warning Ribbon */}
        <EmailVerificationBanner onOpenVerificationModal={() => openAuthModal('verify-email')} />

        {/* Content Body Router */}
        <main className="flex-1 p-2 md:p-4 pb-20">
          <AnimatePresence mode="wait">
            {/* 1. HOME DASHBOARD (Exact Match to Screenshot) */}
            {activeTab === 'home' && (
              <motion.div
                key="home-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardView
                  currentPlant={currentPlant}
                  gardenPlants={gardenPlants}
                  onSelectPlant={(plant) => setCurrentPlant(plant)}
                  onOpenBioSignature={() => setIsBioModalOpen(true)}
                  onOpenGallery={(plant) => handleOpenGallery(plant)}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onWaterPlant={handleWaterPlant}
                  onFertilizePlant={handleFertilizePlant}
                  onOpenChatWithTopic={() => setActiveTab('chat')}
                />
              </motion.div>
            )}

            {/* 2. IDENTIFY PLANT */}
            {activeTab === 'identify' && (
              <motion.div
                key="identify-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto p-4 space-y-6"
              >
                <div className="text-center space-y-2 pt-4 mb-8">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Leaf className="w-3.5 h-3.5" />
                    AI Botanical Scanner
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Identify Any Plant Species
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Upload or snap a photo of any leaf, bloom, or foliage. Our neural-botanical engine provides instant species recognition and physiological analysis.
                  </p>
                </div>

                <ImageUploader 
                  onImageSelected={(img) => handleImageSelected(img, 'identify')} 
                  isLoading={isLoading} 
                />

                {error && (
                  <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. DIAGNOSE PATHOLOGY */}
            {activeTab === 'diagnose' && (
              <motion.div
                key="diagnose-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto p-4 space-y-6"
              >
                <div className="text-center space-y-2 pt-4 mb-8">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5" />
                    Pathology Diagnostics
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Plant Health & Disease Scanner
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Position affected leaves, discolored tissue, or pest evidence for treatment protocols.
                  </p>
                </div>

                <ImageUploader 
                  onImageSelected={(img) => handleImageSelected(img, 'diagnose')} 
                  isLoading={isLoading}
                  title="Symptom Scanner"
                  subtitle="Position lesion in center frame"
                  loadingText="Isolating Pathogenic Bio-Signals..."
                  loadingSubtext="Querying Pathological Library"
                />

                {error && (
                  <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                {diagnosis && <DiseaseAnalysis diagnosis={diagnosis} />}
              </motion.div>
            )}

            {/* 4. MY GARDEN */}
            {activeTab === 'garden' && (
              <motion.div
                key="garden-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4"
              >
                <MyGarden 
                  appPlants={gardenPlants}
                  onWaterPlant={handleWaterPlant}
                  onSelectPlant={(p) => {
                    setCurrentPlant(p);
                    setActiveTab('home');
                  }}
                  onOpenAuthModal={() => openAuthModal('login')}
                />
              </motion.div>
            )}

            {/* 5. CARE CALENDAR */}
            {activeTab === 'calendar' && (
              <motion.div
                key="calendar-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 md:p-4"
              >
                <CareCalendar />
              </motion.div>
            )}

            {/* 6. COMMUNITY FORUM */}
            {activeTab === 'community' && (
              <motion.div
                key="community-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <CommunityForum 
                  userPlants={gardenPlants} 
                  onOpenAuthModal={() => openAuthModal('login')} 
                />
              </motion.div>
            )}

            {/* 7. PLANT ENCYCLOPEDIA / GUIDE */}
            {activeTab === 'guide' && (
              <motion.div
                key="guide-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto p-4"
              >
                <PlantCareGuide 
                  gardenPlants={gardenPlants}
                  onNavigateToCalendar={() => setActiveTab('calendar')}
                />
              </motion.div>
            )}

            {/* 8. AI ASSISTANT / CHATBOT */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col p-2 md:p-4"
              >
                <ChatBot />
              </motion.div>
            )}

            {/* 9. REMINDERS */}
            {activeTab === 'reminders' && (
              <motion.div
                key="reminders-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 md:p-4"
              >
                <RemindersView />
              </motion.div>
            )}

            {/* 10. SHOP */}
            {activeTab === 'shop' && (
              <motion.div
                key="shop-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 md:p-4"
              >
                <Shop />
              </motion.div>
            )}

            {/* 11. PROFILE / SETTINGS */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto p-4 pt-6"
              >
                <Profile 
                  onNavigateToGarden={() => setActiveTab('garden')} 
                  onOpenAuthModal={() => openAuthModal('login')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Interactive Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <BioSignatureModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        plant={currentPlant}
      />

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        plantName={galleryPlant.name}
        images={galleryPlant.galleryImages}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <NotificationList
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Floating Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full"
          >
            <div className="p-4 rounded-2xl bg-[#0e2118] border border-emerald-500/40 shadow-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{toast.title}</h4>
                  <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1">{toast.body}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
