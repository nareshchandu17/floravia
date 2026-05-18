import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PlantAnalysis } from './components/PlantAnalysis';
import { DiseaseAnalysis } from './components/DiseaseAnalysis';
import { MyGarden } from './components/MyGarden';
import { ChatBot } from './components/ChatBot';
import { PlantCareGuide } from './components/PlantCareGuide';
import { Profile } from './components/Profile';
import { CommunityTips } from './components/CommunityTips';
import { Onboarding } from './components/Onboarding';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Activity, Sprout, BookOpenText, Bell, Users } from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    analysis,
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

  return (
    <div className="min-h-screen bg-void text-primary font-ui selection:bg-green-500/30 selection:text-primary">
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

      {/* Bioluminescent Gradient Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-green-900/40 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-teal-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[600px] bg-green-800/10 rounded-full blur-[150px]" />
      </div>

      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={`relative z-10 ${activeTab === 'chat' ? 'pb-0' : 'pb-32 md:pb-20'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'identify' && (
            <motion.div
              key="identify-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4"
            >
              {!analysis && (
                <div className="max-w-4xl mx-auto pt-8 md:pt-12 text-center space-y-4 mb-8 md:mb-12">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/40 text-green-300 text-[10px] md:text-xs font-bold uppercase tracking-widest border border-green-500/20 shadow-glow-green"
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    AI Plant Intelligence
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-7xl font-display italic text-gradient tracking-tight"
                  >
                    Discover Your Green
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base md:text-lg text-secondary/80 max-w-xl mx-auto leading-relaxed font-ui"
                  >
                    Leverage our neural-botanical engine to identify species and unlock professional care protocols instantly.
                  </motion.p>
                </div>
              )}

              <ImageUploader 
                onImageSelected={(img) => handleImageSelected(img, activeTab)} 
                isLoading={isLoading} 
              />

              {error && (
                <div className="max-w-2xl mx-auto mt-6 p-4 glass-card border-red-500/30 text-red-400 text-center font-medium">
                  {error}
                </div>
              )}

              {analysis && <PlantAnalysis analysis={analysis} image={lastImage || undefined} />}
              
              {!analysis && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-4xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                >
                  {[
                    { icon: Sprout, title: "Species Detection", desc: "Compare against 100k+ global botanical signatures." },
                    { icon: Activity, title: "Neural Vigor Analysis", desc: "Evaluate health scores via computer vision." },
                    { icon: Leaf, title: "Care Orchestration", desc: "Get tailored hydration and light schedules." }
                  ].map((feat, i) => (
                    <div key={i} className="space-y-3 p-6 glass-card border-white/5 bg-void/10">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center justify-center mx-auto text-green-400 mb-2">
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{feat.title}</h4>
                      <p className="text-[10px] text-muted leading-relaxed uppercase tracking-tighter">{feat.desc}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'diagnose' && (
            <motion.div
              key="diagnose-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4"
            >
              {!diagnosis && (
                <div className="max-w-4xl mx-auto pt-8 md:pt-12 text-center space-y-4 mb-8 md:mb-12">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/30 text-amber-300 text-[10px] md:text-xs font-bold uppercase tracking-widest border border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.15)]"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Plant Health Check
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-7xl font-display italic text-gradient tracking-tight"
                  >
                    Diagnose Pathology
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base md:text-lg text-secondary/80 max-w-xl mx-auto leading-relaxed font-ui"
                  >
                    Upload a high-resolution scan of affected foliage for pathogen identification and recovery planning.
                  </motion.p>
                </div>
              )}

              <ImageUploader 
                onImageSelected={(img) => handleImageSelected(img, activeTab)} 
                isLoading={isLoading}
                title="Symptom Scanner"
                subtitle="Position lesion in center frame"
                loadingText="Isolating Bio-Signals..."
                loadingSubtext="Accessing Pathological Database"
              />

              {error && (
                <div className="max-w-2xl mx-auto mt-6 p-4 glass-card border-red-500/30 text-red-400 text-center font-medium">
                  {error}
                </div>
              )}

              {diagnosis && <DiseaseAnalysis diagnosis={diagnosis} />}

              {!diagnosis && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-md mx-auto mt-16 p-8 glass-card border-amber-500/10 bg-amber-950/5 text-center"
                >
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Diagnostic Protocol</h4>
                  <div className="text-[11px] text-muted space-y-4 font-mono leading-relaxed">
                    <p className="flex items-center gap-4">
                      <span className="text-amber-500/40">01</span> USE NATURAL LIGHT FOR OPTIMAL COLOR ACCURACY
                    </p>
                    <p className="flex items-center gap-4">
                      <span className="text-amber-500/40">02</span> FOCUS ON THE TRANSITION BETWEEN HEALTHY & AFFECTED TISSUE
                    </p>
                    <p className="flex items-center gap-4">
                      <span className="text-amber-500/40">03</span> ENSURE BACKGROUND IS NEUTRAL TO MINIMIZE NOISE
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'garden' && (
            <motion.div
              key="garden-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4"
            >
              <div className="max-w-4xl mx-auto pt-12 text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/30 text-teal-300 text-xs font-bold uppercase tracking-widest border border-teal-500/20 shadow-glow-teal">
                  <Sprout className="w-3.5 h-3.5" />
                  My Collection
                </div>
                <h2 className="text-5xl md:text-6xl font-display italic text-gradient tracking-tight">
                  My Garden
                </h2>
                <p className="text-lg text-secondary/80 max-w-xl mx-auto leading-relaxed">
                  Manage the plants you've discovered and track their care schedules to keep them thriving.
                </p>
              </div>

              <MyGarden />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4"
            >
              <div className="max-w-4xl mx-auto pt-12 text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/30 text-blue-300 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
                  <BookOpenText className="w-3.5 h-3.5" />
                  Library & Resources
                </div>
                <h2 className="text-5xl md:text-6xl font-display italic text-gradient tracking-tight">
                  Plant Care Guide
                </h2>
                <p className="text-lg text-secondary/80 max-w-xl mx-auto leading-relaxed">
                  Explore our curated compendium of gardening knowledge. Learn the basics, identify pests, and discover how to care for popular houseplants.
                </p>
              </div>

              <PlantCareGuide />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5 } }}
              exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="w-full flex flex-col"
            >
              <ChatBot />
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div
              key="community-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4"
            >
              <div className="max-w-4xl mx-auto pt-12 text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/30 text-purple-300 text-xs font-bold uppercase tracking-widest border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                  <Users className="w-3.5 h-3.5" />
                  Collective Intelligence
                </div>
                <h2 className="text-5xl md:text-6xl font-display italic text-gradient tracking-tight">
                  Community Protocols
                </h2>
                <p className="text-lg text-secondary/80 max-w-xl mx-auto leading-relaxed">
                  Access shared expertise and breakthrough care strategies from Floravia's global network of botanical experts.
                </p>
              </div>

              <CommunityTips />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.3 } }}
              className="px-4 pt-12"
            >
              <Profile onNavigateToGarden={() => setActiveTab('garden')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {activeTab !== 'chat' && (
        <footer className="fixed bottom-0 left-0 right-0 glass-panel border-t border-green-400/10 py-4 text-center text-xs text-muted z-50">
          <p>© 2026 Floravia • AI-Powered Plant Intelligence</p>
        </footer>
      )}

      {/* Premium Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full"
          >
            <div className="glass-card p-5 border-green-500/30 flex items-start gap-4 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <Bell className="w-6 h-6 text-green-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-primary text-lg">{toast.title}</h4>
                  <button 
                    onClick={() => setToast(null)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Activity className="w-4 h-4 rotate-45" />
                  </button>
                </div>
                <p className="text-secondary text-sm font-ui mt-1 leading-relaxed">
                  {toast.body}
                </p>
                <div className="mt-3 h-1 w-full bg-surface rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                    className="h-full bg-green-500 shadow-glow-green"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

