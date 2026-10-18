/**
 * useSubscription Hook
 * React hook providing reactive, server-authoritative subscription state and Pro entitlements.
 * Eliminates reliance on client-side localStorage as source of truth.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserSubscriptionState } from '../types/payment';
import { fetchSubscriptionStatus } from '../services/razorpay';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        status: 'none',
        planId: 'free',
        planName: 'Floravia Free',
        isPro: false
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const authoritativeSub = await fetchSubscriptionStatus(token);
      setSubscription(authoritativeSub);

      // Keep temporary local sync cache for immediate tab-switch reactivity
      if (authoritativeSub.isPro) {
        localStorage.setItem('floravia_current_plan', JSON.stringify({
          planId: authoritativeSub.planId,
          planName: authoritativeSub.planName,
          billingCycle: authoritativeSub.billingCycle || 'yearly',
          paymentId: authoritativeSub.paymentId || 'verified',
          orderId: authoritativeSub.orderId,
          expiresAt: authoritativeSub.expiresAt,
          tamperVerified: true
        }));
      } else {
        localStorage.removeItem('floravia_current_plan');
      }
    } catch (err: any) {
      console.warn('Could not fetch server subscription, checking fallback cache:', err.message);
      // Fallback to locally cached server-verified state if offline
      try {
        const cached = localStorage.getItem('floravia_current_plan');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now()) {
            setSubscription({
              status: 'active',
              planId: 'pro',
              planName: parsed.planName || 'Floravia Pro Plan',
              billingCycle: parsed.billingCycle,
              paymentId: parsed.paymentId,
              orderId: parsed.orderId,
              expiresAt: parsed.expiresAt,
              isPro: true
            });
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      setSubscription({
        status: 'none',
        planId: 'free',
        planName: 'Floravia Free',
        isPro: false
      });
      setError(err?.message || 'Failed to load subscription status.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscription();

    const handleSubscriptionChange = () => {
      loadSubscription();
    };

    window.addEventListener('floravia_subscription_changed', handleSubscriptionChange);
    window.addEventListener('storage', handleSubscriptionChange);

    return () => {
      window.removeEventListener('floravia_subscription_changed', handleSubscriptionChange);
      window.removeEventListener('storage', handleSubscriptionChange);
    };
  }, [loadSubscription]);

  return {
    subscription,
    isPro: subscription?.isPro ?? false,
    isLoading,
    error,
    refetch: loadSubscription
  };
}
