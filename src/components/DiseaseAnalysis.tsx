import React from 'react';
import { DiseaseDiagnosis } from '../services/gemini';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, CheckCircle, Stethoscope, HeartPulse } from 'lucide-react';

interface DiseaseAnalysisProps {
  diagnosis: DiseaseDiagnosis;
}

import { FeedbackWidget } from './FeedbackWidget';

export const DiseaseAnalysis: React.FC<DiseaseAnalysisProps> = ({ diagnosis }) => {
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

  const isHealthy = diagnosis.isHealthy;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8"
    >
      <motion.div variants={item} className="space-y-4 text-center">
        <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold font-ui uppercase tracking-widest text-[10px] md:text-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
          isHealthy 
            ? 'glass-card text-green-400 border-green-500/30' 
            : 'glass-card text-red-400 border-red-500/30'
        }`}>
          {isHealthy ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shadow-glow-green rounded-full bg-green-500/20" /> : <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 bg-red-500/20 rounded-full" />}
          {isHealthy ? 'Plant Appears Healthy' : 'Disease Detected'}
        </div>
        
        {!isHealthy && diagnosis.diseaseName && (
          <h2 className="text-3xl md:text-5xl font-display text-primary leading-tight mt-4 md:mt-6">
            {diagnosis.diseaseName}
          </h2>
        )}
      </motion.div>

      {/* Health Score Visualization */}
      <motion.div variants={item} className="glass-card p-6 border-white/5 bg-void/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Health Vitality</span>
          <span className={`text-sm font-bold ${diagnosis.healthScore > 70 ? 'text-green-400' : diagnosis.healthScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {diagnosis.healthScore}%
          </span>
        </div>
        <div className="h-2 w-full bg-surface rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${diagnosis.healthScore}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full shadow-glow-sm ${
              diagnosis.healthScore > 70 ? 'bg-green-500 shadow-glow-green' : 
              diagnosis.healthScore > 40 ? 'bg-amber-500 shadow-glow-amber' : 
              'bg-red-500 shadow-glow-red'
            }`}
          />
        </div>
      </motion.div>

      <motion.div variants={item} className={`glass-card p-6 border ${
        isHealthy ? 'border-green-400/20 shadow-glow-green' : 'border-amber-400/20 shadow-[0_0_40px_rgba(251,191,36,0.1)]'
      }`}>
        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
          <Stethoscope className={`w-6 h-6 ${isHealthy ? 'text-green-400' : 'text-amber-400'}`} />
          <h3 className="font-ui font-semibold text-primary/90 text-lg">Diagnosis Analysis</h3>
        </div>
        <p className="text-primary leading-relaxed font-ui text-base/7">
          {diagnosis.analysis}
        </p>
      </motion.div>

      {!isHealthy && (
        <>
          {diagnosis.severity && (
            <motion.div variants={item} className="grid grid-cols-1 gap-4">
              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    <Activity className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="font-semibold text-primary font-ui">Severity Level</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                  diagnosis.severity === 'Severe' || diagnosis.severity === 'High' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : diagnosis.severity === 'Medium'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                }`}>
                  {diagnosis.severity}
                </div>
              </div>
            </motion.div>
          )}

          {diagnosis.treatment && (
            <motion.div variants={item} className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-display text-primary flex items-center gap-3">
                <HeartPulse className="w-6 h-6 md:w-8 md:h-8 text-green-400 shadow-glow-green rounded-full" />
                Treatment Plan
              </h3>
              <div className="markdown-body glass-card p-5 md:p-8 font-ui text-sm md:text-base">
                <Markdown>{diagnosis.treatment}</Markdown>
              </div>
            </motion.div>
          )}
        </>
      )}

      <motion.div variants={item}>
        <FeedbackWidget analysisType="diagnose" />
      </motion.div>
    </motion.div>
  );
};
