import React, { useState } from 'react';
import { PlantAnalysis as PlantAnalysisType } from '../services/gemini';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { Info, BookmarkPlus, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { FeedbackWidget } from './FeedbackWidget';
import { useAuth } from '../hooks/useAuth';
import { savePlantToGarden, signIn } from '../services/firebase';
import { WeatherWidget } from './WeatherWidget';
import { TechnicalScan } from './subcomponents/TechnicalScan';
import { PlantHealthMetrics } from './subcomponents/PlantHealthMetrics';
import { PlantInsights } from './subcomponents/PlantInsights';
import { PlantCareGrid } from './subcomponents/PlantCareGrid';

interface PlantAnalysisProps {
  analysis: PlantAnalysisType;
  image?: string;
}

export const PlantAnalysis: React.FC<PlantAnalysisProps> = ({ analysis, image }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showTechnicalScan, setShowTechnicalScan] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `Floravia | ${analysis.name} ID`,
      text: `I just used Floravia to identify my ${analysis.name} (${analysis.scientificName})! It has a vigor score of ${analysis.healthScore}% and is feeling ${analysis.mood}. Check out this botanical report! 🌿`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleSave = async () => {
    if (!user) {
      try {
        await signIn();
      } catch (e) {
        return;
      }
    }
    setSaving(true);
    try {
      await savePlantToGarden({
        name: analysis.name,
        nickname: nickname.trim() || undefined,
        scientificName: analysis.scientificName,
        healthScore: analysis.healthScore,
        mood: analysis.mood,
        predictedNeeds: analysis.predictedNeeds
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-4 flex flex-col sm:flex-row sm:items-end gap-4 w-full">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-green-400 font-medium text-[10px] md:text-xs font-ui uppercase tracking-widest">
              <Info className="w-4 h-4" />
              Identification Result
            </div>
            <h2 className="text-3xl md:text-5xl font-display text-primary leading-tight">
              {analysis.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-base md:text-lg italic text-secondary font-display">
                {analysis.scientificName}
              </p>
              <div className="h-4 w-px bg-emerald-500/20 mx-1" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] md:text-[10px] font-black text-emerald-300 uppercase tracking-tighter">
                  Match {analysis.confidence.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {!saved && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Give it a nickname (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bessie the Basil"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-400 text-white placeholder:text-emerald-500/40 transition-colors"
                />
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:mb-1">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg cursor-pointer ${
                saved 
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95'
              }`}
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              {saved ? 'Saved to Garden' : saving ? 'Saving...' : user ? 'Save to Garden' : 'Sign in to Save'}
            </button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-[#071610] border border-emerald-500/20 text-emerald-300 hover:text-white hover:border-emerald-400/50 transition-all flex items-center justify-center group relative shrink-0 cursor-pointer shadow-sm"
              title="Share Identification"
            >
              <Share2 className="w-4 h-4" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0b1f16] border border-emerald-500/30 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-lg translate-y-2 group-hover:translate-y-0 z-50">
                Share Protocol
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Visual Technical Scan Overlay (Premium Feature) */}
      {image && (
        <TechnicalScan 
          image={image} 
          showTechnicalScan={showTechnicalScan} 
          setShowTechnicalScan={setShowTechnicalScan} 
        />
      )}

      {/* Novelty Features: Health & Mood */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlantHealthMetrics 
          healthScore={analysis.healthScore} 
          mood={analysis.mood} 
          indicators={analysis.indicators} 
        />
        <PlantInsights 
          insights={analysis.insights} 
          predictedNeeds={analysis.predictedNeeds} 
        />
      </motion.div>

      {/* Weather-Based Care Reminder */}
      <motion.div variants={item}>
        <WeatherWidget plantName={analysis.name} />
      </motion.div>

      <motion.div variants={item} className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-6 shadow-lg flex items-start gap-4">
        <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 p-3 rounded-2xl shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <p className="text-slate-300 leading-relaxed font-ui text-base/7 pt-1">
          {analysis.summary}
        </p>
      </motion.div>

      <motion.div variants={item}>
        <PlantCareGrid />
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        <h3 className="text-2xl md:text-3xl font-display text-white flex items-center gap-2">
          Care Instructions
        </h3>
        <div className="markdown-body bg-[#0b1f16] border border-emerald-500/15 rounded-2xl p-5 md:p-8 shadow-lg font-ui text-sm md:text-base">
          <Markdown>{analysis.careInstructions}</Markdown>
        </div>
      </motion.div>
      
      <motion.div variants={item}>
        <FeedbackWidget analysisType="identify" />
      </motion.div>
    </motion.div>
  );
};
