import { useState, useEffect, useCallback } from 'react';
import { getCommunityTips, addCommunityTip, CommunityTip, voteOnTip, parseFirestoreError } from '../services/firebase';
import { useAuth } from './useAuth';

export function useCommunityTips(activeCategory: string) {
  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTips = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCommunityTips(activeCategory);
      setTips(data);
    } catch (err) {
      console.error("Failed to fetch tips:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const handleAddTip = async (newTip: { title: string; tip: string; plantCategory: string }) => {
    setIsSubmitting(true);
    try {
      await addCommunityTip(newTip);
      await fetchTips();
    } catch (err) {
      console.error("Failed to submit tip:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (tipId: string, type: 'up' | 'down') => {
    setVoteError(null);
    if (!user) {
      setVoteError('Please sign in to vote on community protocols.');
      return;
    }
    try {
      await voteOnTip(tipId, type);
      // Optimistic update
      setTips(prev => prev.map(t => {
        if (t.id === tipId) {
          const field = type === 'up' ? 'upvotes' : 'downvotes';
          return {
            ...t,
            [field]: (t[field] || 0) + 1
          };
        }
        return t;
      }));
    } catch (err) {
      const parsed = parseFirestoreError(err);
      setVoteError(parsed.userMessage);
      console.error("Failed to vote:", err);
    }
  };

  return {
    tips,
    isLoading,
    isSubmitting,
    voteError,
    setVoteError,
    handleAddTip,
    handleVote,
    refreshTips: fetchTips
  };
}

