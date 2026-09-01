import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  resendVerificationEmail, 
  reloadCurrentUser, 
  signOut as firebaseSignOut 
} from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const syncUserState = useCallback((currentUser: User | null) => {
    setUser(currentUser);
    // Google accounts or verified emails have emailVerified = true
    setIsEmailVerified(currentUser ? !!currentUser.emailVerified : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      syncUserState(currentUser);
    });

    return () => unsubscribe();
  }, [syncUserState]);

  // Reload current user state from Firebase
  const reloadUser = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    setIsCheckingVerification(true);
    try {
      await reloadCurrentUser();
      const refreshedUser = auth.currentUser;
      syncUserState(refreshedUser);
      return !!refreshedUser?.emailVerified;
    } catch (err) {
      console.warn("Failed to reload user:", err);
      return false;
    } finally {
      setIsCheckingVerification(false);
    }
  }, [syncUserState]);

  // Auto-reload user on window focus / tab switch so clicking email verification link is detected immediately
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && auth.currentUser && !auth.currentUser.emailVerified) {
        reloadUser();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [reloadUser]);

  const resendVerification = useCallback(async () => {
    await resendVerificationEmail();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut();
    setUser(null);
    setIsEmailVerified(false);
  }, []);

  return { 
    user, 
    loading, 
    isEmailVerified, 
    isCheckingVerification,
    reloadUser, 
    resendVerification, 
    signOut 
  };
}
