import { useState, useCallback, useEffect } from 'react';
import { analyzePlantImage, diagnosePlantDisease, PlantAnalysis as PlantAnalysisType, DiseaseDiagnosis } from '../services/gemini';
import { compressImage } from '../utils/imageCompressor';

export function useAppState() {
  const [activeTab, setActiveTab] = useState<'identify' | 'diagnose' | 'chat' | 'garden' | 'guide' | 'profile' | 'community'>('identify');
  const [analysis, setAnalysis] = useState<PlantAnalysisType | null>(null);
  const [diagnosis, setDiseaseDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastImage, setLastImage] = useState<string | null>(null);

  const handleImageSelected = useCallback(async (base64: string, currentTab: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setDiseaseDiagnosis(null);
    
    // Ensure base64 is optimized
    let optimizedBase64 = base64;
    try {
      if (base64.length > 1024 * 1024) { // Larger than ~750KB
        const compressed = await compressImage(base64, {
          maxDimension: 1600,
          targetMaxSizeBytes: 800 * 1024
        });
        optimizedBase64 = compressed.base64;
      }
    } catch (e) {
      console.warn('Fallback: using uncompressed base64', e);
    }

    setLastImage(optimizedBase64);
    
    try {
      if (currentTab === 'identify') {
        const result = await analyzePlantImage(optimizedBase64);
        setAnalysis(result);
      } else if (currentTab === 'diagnose') {
        const result = await diagnosePlantDisease(optimizedBase64);
        setDiseaseDiagnosis(result);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Failed to ${currentTab === 'identify' ? 'identify' : 'diagnose'} plant. Please try a clearer photo.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    analysis,
    setAnalysis,
    diagnosis,
    setDiseaseDiagnosis,
    isLoading,
    setIsLoading,
    error,
    setError,
    lastImage,
    handleImageSelected
  };
}
