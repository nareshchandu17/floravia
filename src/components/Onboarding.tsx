import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Activity, MessageSquare, Sprout, Bell, ChevronRight, Check } from 'lucide-react';
import { requestNotificationPermission } from '../services/firebase';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isRequestingNotifs, setIsRequestingNotifs] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: "Welcome to Floravia",
      subtitle: "Your botanical journey begins here. Discover, diagnose, and curate your green space with AI.",
      icon: <Leaf className="w-12 h-12 text-green-400" />,
      glow: "shadow-[0_0_80px_rgba(34,197,94,0.3)] border-green-500/20"
    },
    {
      id: 'identify',
      title: "Discover Your Green",
      subtitle: "Instantly identify any plant, flower, or tree with unparalleled accuracy using our AI vision model.",
      icon: <Leaf className="w-12 h-12 text-teal-400" />,
      glow: "shadow-[0_0_80px_rgba(45,212,191,0.3)] border-teal-500/20"
    },
    {
      id: 'diagnose',
      title: "Expert Diagnostics",
      subtitle: "Upload a photo of a sick leaf to get instant disease diagnosis and tailored treatment plans.",
      icon: <Activity className="w-12 h-12 text-amber-400" />,
      glow: "shadow-[0_0_80px_rgba(251,191,36,0.3)] border-amber-500/20"
    },
    {
      id: 'chat-garden',
      title: "Nurture & Grow",
      subtitle: "Chat with Sage, your AI botanical expert, and log your plant care history in My Garden.",
      icon: <Sprout className="w-12 h-12 text-primary" />,
      glow: "shadow-[0_0_80px_rgba(240,253,244,0.3)] border-white/20"
    },
    {
      id: 'notifications',
      title: "Stay Connected",
      subtitle: "Never forget to water again. Enable notifications for intelligent plant care reminders.",
      icon: <Bell className="w-12 h-12 text-blue-400" />,
      glow: "shadow-[0_0_80px_rgba(59,130,246,0.3)] border-blue-500/20"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleEnableNotifications = async () => {
    setIsRequestingNotifs(true);
    try {
      await requestNotificationPermission();
    } catch (e) {
      console.warn("Notifications issue:", e);
    } finally {
      setIsRequestingNotifs(false);
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void overflow-hidden text-primary font-ui selection:bg-green-500/30 selection:text-primary">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-green-900/30 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-teal-900/20 rounded-full blur-[120px]" 
        />
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-2xl w-full px-6 flex flex-col items-center text-center h-full justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center"
          >
            <div className={`w-32 h-32 rounded-full glass-card flex items-center justify-center mb-10 ${currentStep.glow} transition-colors duration-700`}>
              {currentStep.icon}
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight text-gradient pb-2">
              {currentStep.title}
            </h1>
            
            <p className="text-lg md:text-xl text-secondary/80 max-w-lg leading-relaxed font-ui">
              {currentStep.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation Area */}
      <div className="absolute z-20 bottom-12 left-0 right-0 px-6 flex flex-col items-center gap-8">
        
        {/* Progress Dots */}
        <div className="flex items-center gap-3">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? 'w-8 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md">
          {step === steps.length - 1 ? (
            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={handleEnableNotifications}
                disabled={isRequestingNotifs}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-400 text-void font-bold text-lg hover:from-blue-400 hover:to-teal-300 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                {isRequestingNotifs ? 'Enabling...' : 'Enable Notifications'}
                {!isRequestingNotifs && <Bell className="w-5 h-5 ml-1" />}
              </button>
              <button 
                onClick={handleNext}
                disabled={isRequestingNotifs}
                className="w-full py-4 px-8 rounded-2xl bg-surface/50 text-secondary border border-white/5 hover:bg-surface hover:text-primary transition-all font-semibold font-ui"
              >
                Maybe Later
              </button>
            </div>
          ) : (
            <button 
              onClick={handleNext}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-void font-bold text-lg hover:from-green-400 hover:to-teal-400 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
