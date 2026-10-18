import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useAuth } from './hooks/useAuth';
import { DashboardPlant, GrowthMeasurement } from './types/botanical';
import { DEFAULT_PLANTS } from './data/defaultPlants';
import { PlantSpeciesGuide } from './data/plantCareData';
import { Leaf, Sparkles, Activity, Sprout, Bell, X, PanelLeftOpen } from 'lucide-react';
import { POPULAR_CITY_WEATHER } from './services/weather';
import { Analytics } from '@vercel/analytics/react';

const VALID_TABS: readonly NavigationTab[] = [
  'home',
  'identify',
  'diagnose',
  'garden',
  'calendar',
  'community',
  'guide',
  'chat',
  'reminders',
  'shop',
  'profile'
] as const;

function getTabFromUrl(): NavigationTab {
  if (typeof window === 'undefined') return 'home';
  // 1. Check pathname (e.g. /identify)
  const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (cleanPath && (VALID_TABS as readonly string[]).includes(cleanPath)) {
    return cleanPath as NavigationTab;
  }
  // 2. Check hash fallback (e.g. #identify or #/identify)
  const cleanHash = window.location.hash.replace(/^#[/]?/, '').toLowerCase();
  if (cleanHash && (VALID_TABS as readonly string[]).includes(cleanHash)) {
    return cleanHash as NavigationTab;
  }
  return 'home';
}

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => getTabFromUrl());

  const setActiveTab = useCallback((tab: NavigationTab, replace = false) => {
    setActiveTabState(tab);
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  }, []);

  // Sync route on popstate (browser back/forward) or hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Sync initial pathname if directly loaded on a specific path or root
    const initialTab = getTabFromUrl();
    const expectedPath = initialTab === 'home' ? '/' : `/${initialTab}`;
    if (window.location.pathname !== expectedPath && !window.location.pathname.startsWith('/api')) {
      window.history.replaceState({ tab: initialTab }, '', expectedPath);
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Automatically scroll main content to top whenever the active view changes
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);
  const [gardenPlants, setGardenPlants] = useState<DashboardPlant[]>(() => {
    try {
      const saved = localStorage.getItem('floravia_local_garden');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PLANTS;
  });
  const [currentPlant, setCurrentPlant] = useState<DashboardPlant | null>(() => {
    try {
      const saved = localStorage.getItem('floravia_local_garden');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {
      // ignore
    }
    return DEFAULT_PLANTS[0] || null;
  });

  // Ensure currentPlant points to an existing specimen or null when garden is empty
  useEffect(() => {
    if (gardenPlants.length > 0) {
      if (!currentPlant || !gardenPlants.some(p => p.id === currentPlant.id)) {
        setCurrentPlant(gardenPlants[0]);
      }
    } else {
      setCurrentPlant(null);
    }
  }, [gardenPlants, currentPlant]);

  // Sync garden plants to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('floravia_local_garden', JSON.stringify(gardenPlants));
    } catch (e) {
      console.error(e);
    }
  }, [gardenPlants]);
  
  // Sidebar open/collapse state (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('floravia_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('floravia_sidebar_open', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar w.r.t the right data panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals state
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryPlant, setGalleryPlant] = useState<DashboardPlant | null>(null);
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
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);

  const handleOpenChatWithTopic = useCallback((topic: string) => {
    setChatInitialPrompt(topic);
    setActiveTab('chat');
  }, [setActiveTab]);

  const handleUnauthorizedUpload = useCallback(() => {
    setToast({
      title: 'Authentication Required',
      body: 'Please sign in or create an account to upload plant images and use AI botanical features.',
      type: 'warning'
    });
    openAuthModal('login');
  }, [setToast]);

  const handleScanImage = useCallback((img: string, mode: 'identify' | 'diagnose') => {
    if (!user) {
      handleUnauthorizedUpload();
      return;
    }
    handleImageSelected(img, mode);
  }, [user, handleUnauthorizedUpload, handleImageSelected]);

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

  const handleCityChange = (city: string) => {
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
    setCurrentPlant(prev => (prev ? {
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
    } : null));
  };

  const handleAddPlantFromGuide = useCallback((plantGuide: PlantSpeciesGuide) => {
    const existing = gardenPlants.find(p => 
      p.scientificName?.toLowerCase() === plantGuide.scientificName?.toLowerCase() ||
      p.name?.toLowerCase() === plantGuide.commonName?.toLowerCase()
    );

    if (existing) {
      setCurrentPlant(existing);
      setToast({
        title: 'Already in Your Garden',
        body: `${plantGuide.commonName} is already part of your botanical collection.`,
        type: 'info'
      });
      return;
    }

    const newPlant: DashboardPlant = {
      id: `guide-plant-${Date.now()}`,
      name: plantGuide.commonName,
      scientificName: plantGuide.scientificName,
      nickname: plantGuide.commonName.split(' ')[0],
      matchScore: 99.5,
      confidence: 'High Confidence',
      imageUrl: plantGuide.imageUrl,
      galleryImages: [plantGuide.imageUrl],
      healthScore: 96,
      vigorIndexLabel: 'Vigor Index',
      mood: 'Vibrant',
      hydrationStatus: 'Optimal',
      pathologyRisk: 'Low Risk',
      neuralStress: 'Minimal',
      aiAssessment: {
        mood: 'Vibrant',
        points: [
          'Added from Floravia Plant Care Guide',
          `Light preference: ${plantGuide.quickSpecs?.light || 'Bright indirect daylight'}`,
          `Watering routine: ${plantGuide.quickSpecs?.water || 'Check topsoil before watering'}`
        ]
      },
      priorityAdjustments: {
        soilHydro: plantGuide.quickSpecs?.water || 'Allow topsoil to dry before watering',
        luminance: plantGuide.quickSpecs?.light || 'Bright indirect daylight'
      },
      weatherInsight: {
        city: selectedCity,
        condition: 'Indoor Sanctuary',
        temp: weatherTemp,
        humidity: weatherHumidity,
        advice: `Keep ${plantGuide.commonName} away from cold drafts and check soil moisture regularly.`
      },
      careEssentials: {
        water: plantGuide.quickSpecs?.water || 'Every 1 to 2 weeks',
        light: plantGuide.quickSpecs?.light || 'Bright indirect daylight',
        temp: '65–80°F',
        air: plantGuide.quickSpecs?.humidity || 'Moderate humidity',
        summary: plantGuide.summary,
        userRating: 5
      },
      healthOverview: {
        period: 'This Week',
        trend: [
          { date: 'Today', score: 96, mood: 'Vibrant' }
        ],
        lastWatered: 'Just added',
        lastFertilized: 'Not fertilized yet',
        nextWatering: 'Check in 2–3 days',
        nextPruning: 'Inspect in 30 days'
      },
      timeline: [
        { date: 'Today', action: 'Added from Plant Care Guide', type: 'identified', color: 'emerald' }
      ],
      aiTip: {
        tip: `Keep in ${plantGuide.quickSpecs?.light?.toLowerCase() || 'bright indirect light'} and test soil with finger before watering.`
      },
      careInstructions: {
        detailedText: plantGuide.summary,
        water: plantGuide.quickSpecs?.water || 'Every 1 to 2 weeks',
        light: plantGuide.quickSpecs?.light || 'Bright indirect light',
        temp: '65–80°F',
        air: plantGuide.quickSpecs?.humidity || 'Moderate'
      }
    };

    setGardenPlants(prev => [newPlant, ...prev]);
    setCurrentPlant(newPlant);
    setToast({
      title: 'Added to Your Garden! 🌿',
      body: `${plantGuide.commonName} has been added to your collection.`,
      type: 'success'
    });
  }, [gardenPlants, selectedCity, weatherTemp, weatherHumidity, setToast]);

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

    setCurrentPlant(prev => (prev ? updatePlant(prev) : null));
    setGardenPlants(prev => prev.map(p => updatePlant(p)));
    setToast({
      title: 'Plant Watered! 💧',
      body: `${currentPlant?.name || 'Specimen'} marked as watered. Hydration is optimal!`
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

    setCurrentPlant(prev => (prev ? updatePlant(prev) : null));
    setGardenPlants(prev => prev.map(p => updatePlant(p)));
    setToast({
      title: 'Nutrients Applied! 🌿✨',
      body: `${currentPlant?.name || 'Specimen'} fertilized with ${details?.fertilizerType || 'species nutrients'}.`
    });
  };

  const handleGrowthUpdated = (plantId: string, measurements: GrowthMeasurement[]) => {
    const updatePlant = (p: DashboardPlant): DashboardPlant => {
      if (p.id === plantId) {
        return {
          ...p,
          growthHistory: measurements
        };
      }
      return p;
    };
    setCurrentPlant(prev => (prev ? updatePlant(prev) : null));
    setGardenPlants(prev => prev.map(p => updatePlant(p)));
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
    <div className="h-screen w-screen bg-[#06130d] text-[#f2fbf5] font-ui flex flex-row overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
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

      {/* Desktop Persistent Left Sidebar (Locked to full screen height; does not scroll with main content) */}
      <div 
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 h-full z-40 overflow-hidden ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="w-64 h-full">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={(tab) => setActiveTab(tab)}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onOpenAuthModal={openAuthModal}
            onToggleCollapse={toggleSidebar}
          />
        </div>
      </div>

      {/* Floating edge tab when sidebar is collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="hidden md:flex fixed left-0 top-20 z-30 bg-[#081911]/95 hover:bg-[#0b2518] border border-l-0 border-emerald-500/30 hover:border-emerald-400 text-emerald-400 p-2.5 rounded-r-2xl shadow-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all group items-center gap-1.5 cursor-pointer backdrop-blur-md"
          title="Open sidebar (Ctrl+B)"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
        </button>
      )}

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
              className="relative w-64 h-full bg-[#081911] border-r border-emerald-500/20 z-50 flex flex-col"
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

      {/* Main Right View Area - Independent Scroll Container */}
      <div 
        ref={mainScrollRef}
        className="flex-1 h-full flex flex-col min-w-0 bg-[#06130d] overflow-y-auto overflow-x-hidden"
      >
        {/* Top Header */}
        <TopHeader
          onSearch={handleSearch}
          selectedCity={selectedCity}
          onChangeCity={handleCityChange}
          weatherTemp={weatherTemp}
          weatherHumidity={weatherHumidity}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
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
                  selectedCity={selectedCity}
                  onChangeCity={handleCityChange}
                  weatherTemp={weatherTemp}
                  weatherHumidity={weatherHumidity}
                  onSelectPlant={(plant) => setCurrentPlant(plant)}
                  onOpenBioSignature={() => setIsBioModalOpen(true)}
                  onOpenGallery={(plant) => handleOpenGallery(plant)}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onWaterPlant={handleWaterPlant}
                  onFertilizePlant={handleFertilizePlant}
                  onOpenChatWithTopic={handleOpenChatWithTopic}
                  onGrowthUpdated={handleGrowthUpdated}
                  onLoadStarterPlants={() => setGardenPlants(DEFAULT_PLANTS)}
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
                  onImageSelected={(img) => handleScanImage(img, 'identify')} 
                  isLoading={isLoading} 
                  isAuthenticated={!!user}
                  onUnauthorized={handleUnauthorizedUpload}
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
                  onImageSelected={(img) => handleScanImage(img, 'diagnose')} 
                  isLoading={isLoading}
                  title="Symptom Scanner"
                  subtitle="Position lesion in center frame"
                  loadingText="Isolating Pathogenic Bio-Signals..."
                  loadingSubtext="Querying Pathological Library"
                  isAuthenticated={!!user}
                  onUnauthorized={handleUnauthorizedUpload}
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
                  onNavigateToTab={(tab) => setActiveTab(tab as NavigationTab)}
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

            {/* 7. PLANT CARE GUIDE */}
            {activeTab === 'guide' && (
              <motion.div
                key="guide-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto p-2 md:p-4"
              >
                <PlantCareGuide 
                  gardenPlants={gardenPlants}
                  onNavigateToCalendar={() => setActiveTab('calendar')}
                  onNavigateToGarden={() => setActiveTab('garden')}
                  onAddPlantToGarden={handleAddPlantFromGuide}
                  onOpenChatWithTopic={handleOpenChatWithTopic}
                  onSelectPlant={(plant) => {
                    setCurrentPlant(plant);
                    setActiveTab('home');
                  }}
                  onOpenAuthModal={() => openAuthModal('login')}
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
                <ChatBot 
                  initialPrompt={chatInitialPrompt}
                  onClearInitialPrompt={() => setChatInitialPrompt(null)}
                />
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
                className="max-w-5xl mx-auto p-4 pt-6"
              >
                <Profile 
                  onNavigateToGarden={() => setActiveTab('garden')} 
                  onOpenAuthModal={() => openAuthModal('login')}
                  onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
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

      {galleryPlant && (
        <GalleryModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          plantName={galleryPlant.name}
          images={galleryPlant.galleryImages}
        />
      )}

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
            <div className={`p-4 rounded-2xl bg-[#0e2118] border ${toast.type === 'success' ? 'border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.35)]' : 'border-emerald-500/40 shadow-2xl'} flex items-start gap-3`}>
              <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {toast.type === 'success' ? <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" /> : <Bell className="w-5 h-5 animate-pulse" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{toast.title}</h4>
                  <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.body}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
