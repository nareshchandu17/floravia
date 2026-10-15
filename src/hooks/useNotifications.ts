import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  setupOnMessageListener, 
  requestNotificationPermission, 
  getNotificationSettings, 
  disableNotifications,
  listenNotifications,
  markNotificationRead,
  deleteNotification,
  sendNotification,
  Notification,
  getUserPlants,
  getPlantReminders
} from '../services/firebase';
import { useAuth } from './useAuth';

export interface ToastData {
  title: string;
  body: string;
  type?: 'success' | 'warning' | 'error' | 'reminder' | 'info';
}

const toastListeners = new Set<(toast: ToastData | null) => void>();
let currentGlobalToast: ToastData | null = null;
let toastTimer: any = null;

export const showGlobalToast = (toast: ToastData | null, durationMs = 8000) => {
  currentGlobalToast = toast;
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  toastListeners.forEach((listener) => listener(toast));
  if (toast && durationMs > 0) {
    toastTimer = setTimeout(() => {
      showGlobalToast(null, 0);
    }, durationMs);
  }
};

export function useNotifications() {
  const { user } = useAuth();
  const [toast, setLocalToast] = useState<ToastData | null>(currentGlobalToast);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    toastListeners.add(setLocalToast);
    return () => {
      toastListeners.delete(setLocalToast);
    };
  }, []);

  const setToast = useCallback((t: ToastData | null) => {
    showGlobalToast(t);
  }, []);
  
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  // Load initial settings
  useEffect(() => {
    const checkSettings = async () => {
      if (user) {
        setLoading(true);
        try {
          const isEnabled = await getNotificationSettings();
          setEnabled(isEnabled);
        } catch (err) {
          console.error("Failed to fetch notification settings:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkSettings();
  }, [user]);

  // Real-time Firestore Notification Listener
  useEffect(() => {
    if (user) {
      const unsubscribe = listenNotifications((newNotifications) => {
        setNotifications(newNotifications);
        
        // Check for new unread notifications to show toast
        const unread = newNotifications.filter(n => !n.read);
        if (unread.length > 0) {
          const latest = unread[0];
          
          const now = Date.now();
          const createdAt = latest.createdAt?.toMillis?.() || Date.now();
          if (now - createdAt < 10000) {
            setToast({
              title: latest.title,
              body: latest.body,
              type: latest.type
            });
          }
        }
      });
      return unsubscribe;
    }
  }, [user, setToast]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const removeNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const notify = useCallback(async (title: string, body: string, type: Notification['type'] = 'info') => {
    // 1. Immediately emit toast for instant UI feedback
    showGlobalToast({ title, body, type });
    // 2. Persist to Firestore if user is authenticated
    try {
      await sendNotification({ title, body, type });
    } catch (e) {
      console.warn("Could not persist notification to Firestore:", e);
    }
  }, []);

  // Monitor Reminders in Real-Time
  useEffect(() => {
    if (!user || !enabled) return;

    const checkReminders = async () => {
      try {
        const plants = await getUserPlants();
        for (const plant of plants) {
          if (!plant.id) continue;
          const reminders = await getPlantReminders(plant.id);
          const now = new Date();
          
          for (const rem of reminders) {
            if (!rem.id) continue;
            const dueDate = rem.dueDate?.toDate?.() || new Date(rem.dueDate);
            
            // If reminder is due and we haven't notified for it in this session
            if (dueDate <= now && !rem.notified && !notifiedRemindersRef.current.has(rem.id)) {
              notifiedRemindersRef.current.add(rem.id);
              await notify(
                "Maintenance Required",
                `Your ${plant.nickname || plant.name} requires ${rem.type} immediately.`,
                "reminder"
              );
            }
          }
        }
      } catch (err) {
        console.error("Reminder watcher error:", err);
      }
    };

    // Poll every minute for due reminders
    const interval = setInterval(checkReminders, 60000);
    checkReminders(); // Run once on startup

    return () => clearInterval(interval);
  }, [user, enabled, notify]);

  // Foreground push message listener (FCM fallback)
  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      try {
        unsubscribe = setupOnMessageListener((payload) => {
          console.log("Push Notification Received:", payload);
          if (payload.notification) {
            setToast({
              title: payload.notification.title || 'Plant Reminder',
              body: payload.notification.body || 'You have a new care task!'
            });
            setTimeout(() => setToast(null), 8000);
          }
        });
      } catch (err) {
        console.warn("FCM: Could not register onMessage listener.", err);
      }
    }
    return () => {
      unsubscribe();
    }
  }, [user]);

  const toggle = useCallback(async () => {
    if (!user) return false;
    
    setIsToggling(true);
    try {
      if (enabled) {
        await disableNotifications();
        setEnabled(false);
        return true;
      } else {
        const token = await requestNotificationPermission();
        if (token) {
          setEnabled(true);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error("Toggle Notifications Error:", err);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [user, enabled]);

  return { 
    toast, 
    setToast,
    notifications,
    enabled,
    loading,
    isToggling,
    toggle,
    markRead,
    removeNotification,
    notify
  };
}
