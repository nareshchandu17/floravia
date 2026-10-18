import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useVoice } from '../hooks/useVoice';
import { 
  getUserPlants, 
  getUserFeedback, 
  getUserPreferences, 
  saveUserPreferences, 
  getUserTransactions,
  getUserProfile,
  saveUserProfile,
  UserProfileData,
  sendPasswordReset,
  resendVerificationEmail,
  getPlantReminders,
  getCareLogs,
  SavedPlant, 
  FeedbackEntry, 
  UserPreferences,
  UserTransaction,
  signOut 
} from '../services/firebase';
import { calculateGstBreakdown } from '../services/paymentSecurity';
import { 
  Sprout, 
  Bell, 
  BellOff, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  LogOut, 
  Loader2, 
  Brain, 
  Sparkles, 
  Wand2, 
  Globe, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  CreditCard,
  Receipt,
  FileText,
  Copy,
  Check,
  ShieldCheck, 
  Crown, 
  Search, 
  Printer, 
  X, 
  User as UserIcon,
  Mail,
  Key,
  Download,
  Trash2,
  HardDrive,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Thermometer,
  Layers,
  Calendar,
  Database,
  MapPin,
  FileEdit,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmailVerificationGate } from './EmailVerificationGate';
import { 
  COMMON_TIMEZONES, 
  getUserTimezone, 
  setUserTimezoneCache, 
  getDeviceTimezone, 
  getUserLocalCurrentTimeString, 
  getTimezoneDisplayOffset 
} from '../utils/timezone';
import { 
  getActiveSubscription, 
  RAZORPAY_KEY_ID 
} from '../services/razorpay';
import { useSubscription } from '../hooks/useSubscription';

export type SettingsTab = 'account' | 'persona' | 'scheduling' | 'preferences' | 'billing' | 'data';

interface ProfileProps {
  onNavigateToGarden: () => void;
  onOpenAuthModal?: () => void;
  onOpenUpgradeModal?: () => void;
}

interface ProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  expertise: 'beginner' | 'intermediate' | 'expert';
  gardeningStyle: string;
  timezone: string;
  preferredReminderTime: string;
  photoURL: string;
}

interface FormErrors {
  displayName?: string;
  bio?: string;
  location?: string;
  preferredReminderTime?: string;
}

const CURATED_AVATARS = [
  { id: 'av1', label: 'Flora Specialist', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { id: 'av2', label: 'Master Horticulturist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { id: 'av3', label: 'Botanical Researcher', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'av4', label: 'Arborist Curator', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { id: 'av5', label: 'Orchid Collector', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { id: 'av6', label: 'Ecological Botanist', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { id: 'av7', label: 'Urban Permaculturist', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 'av8', label: 'Greenhouse Director', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
];

const BOTANICAL_SPECIALIZATIONS = [
  { id: 'tropical', label: 'Tropical Aroids & Foliage' },
  { id: 'succulents', label: 'Desert Cacti & Succulents' },
  { id: 'bonsai', label: 'Rare Bonsai & Topiary' },
  { id: 'herbs', label: 'Culinary Herbs & Edibles' },
  { id: 'orchids', label: 'Epiphytes & Exotic Orchids' },
  { id: 'ferns', label: 'Ancient Ferns & Mosses' },
  { id: 'carnivorous', label: 'Carnivorous Specimens' },
  { id: 'hydroponics', label: 'Hydroponic Cultivation' },
];

const CULTIVATION_STYLES = [
  { id: 'Organic Substrates', label: 'Organic Living Soil & Substrates' },
  { id: 'Hydroponics & Aeroponics', label: 'Hydroponics & Closed Loops' },
  { id: 'Indoor Urban Apartment', label: 'Indoor Urban Apartment Sanctuary' },
  { id: 'Outdoor Garden Sanctuary', label: 'Outdoor Botanical Sanctuary' },
  { id: 'Low-Maintenance Living', label: 'Low-Maintenance Resilient Living' },
];

export const Profile: React.FC<ProfileProps> = ({ 
  onNavigateToGarden, 
  onOpenAuthModal,
  onOpenUpgradeModal 
}) => {
  const { user, isEmailVerified, reloadUser } = useAuth();
  const { 
    enabled: notificationsEnabled, 
    isToggling: togglingNotifs, 
    toggle: toggleNotifications,
    notify
  } = useNotifications();
  const { speak, isSpeaking, stopSpeaking } = useVoice();

  // Active settings tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Core Data
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingTx, setRefreshingTx] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<UserTransaction | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'yearly' | 'monthly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Production Settings Form State (Mapped to Firestore `users/{userId}`)
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    location: '',
    expertise: 'intermediate',
    gardeningStyle: 'Organic Substrates',
    timezone: getDeviceTimezone(),
    preferredReminderTime: '09:00',
    photoURL: ''
  });
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    location: '',
    expertise: 'intermediate',
    gardeningStyle: 'Organic Substrates',
    timezone: getDeviceTimezone(),
    preferredReminderTime: '09:00',
    photoURL: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formSuccessMsg, setFormSuccessMsg] = useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Security & Auth State
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isSendingVerify, setIsSendingVerify] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);

  // Local Preferences (Units, Density, Audio)
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>(() => {
    return (localStorage.getItem('floravia_temp_unit') as any) || 'celsius';
  });
  const [dateFormat, setDateFormat] = useState<'MDY' | 'DMY'>(() => {
    return (localStorage.getItem('floravia_date_format') as any) || 'MDY';
  });
  const [visualDensity, setVisualDensity] = useState<'spacious' | 'compact'>(() => {
    return (localStorage.getItem('floravia_visual_density') as any) || 'spacious';
  });
  const [voiceAutoPlay, setVoiceAutoPlay] = useState<boolean>(() => {
    return localStorage.getItem('floravia_voice_auto_speak') === 'true';
  });

  // Export & Storage State
  const [isExporting, setIsExporting] = useState(false);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  const activeTimezone = getUserTimezone(formData.timezone || prefs?.timezone);

  // Dirty State Detection
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  // Live clock ticker
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(getUserLocalCurrentTimeString(activeTimezone));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [activeTimezone]);

  // Cooldown timer for resending email verification
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setTimeout(() => setVerifyCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [verifyCooldown]);

  // Local storage footprint calculation
  useEffect(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          total += key.length + val.length;
        }
      }
      setStorageUsedBytes(total * 2);
    } catch {
      setStorageUsedBytes(1024 * 180);
    }
  }, [cacheClearedMsg]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [userProfileDoc, savedPlants, userFeedback, userPrefs, userTx] = await Promise.all([
        getUserProfile(user?.uid).catch(() => null),
        getUserPlants().catch(() => []),
        getUserFeedback().catch(() => []),
        getUserPreferences().catch(() => null),
        getUserTransactions().catch(() => [])
      ]);

      setPlants(savedPlants || []);
      setFeedbacks(userFeedback || []);
      setTransactions(userTx || []);
      
      const deviceTz = getDeviceTimezone();

      // Assemble Form Initial Data from Firestore
      const loadedForm: ProfileFormData = {
        displayName: userProfileDoc?.displayName || user?.displayName || '',
        bio: userProfileDoc?.bio || '',
        location: userProfileDoc?.location || '',
        expertise: userProfileDoc?.expertise || userPrefs?.expertise || 'intermediate',
        gardeningStyle: userProfileDoc?.gardeningStyle || userPrefs?.gardeningStyle || 'Organic Substrates',
        timezone: userProfileDoc?.timezone || userPrefs?.timezone || deviceTz,
        preferredReminderTime: userProfileDoc?.preferredReminderTime || '09:00',
        photoURL: userProfileDoc?.photoURL || user?.photoURL || ''
      };

      setFormData(loadedForm);
      setInitialFormData(loadedForm);
      setUserTimezoneCache(loadedForm.timezone);

      if (userPrefs) {
        setPrefs(userPrefs);
        if (userPrefs.temperatureUnit) setTempUnit(userPrefs.temperatureUnit);
        if (typeof userPrefs.voiceAutoPlay === 'boolean') setVoiceAutoPlay(userPrefs.voiceAutoPlay);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    setRefreshingTx(true);
    try {
      const tx = await getUserTransactions();
      setTransactions(tx || []);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
    } finally {
      setRefreshingTx(false);
    }
  };

  // Form Field Validation
  const validateForm = (data: ProfileFormData): FormErrors => {
    const errors: FormErrors = {};

    const trimmedName = data.displayName.trim();
    if (!trimmedName) {
      errors.displayName = 'Botanist display name is required.';
    } else if (trimmedName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters.';
    } else if (trimmedName.length > 60) {
      errors.displayName = 'Display name cannot exceed 60 characters.';
    } else if (!/^[a-zA-Z0-9\s._'-]+$/.test(trimmedName)) {
      errors.displayName = 'Display name contains invalid special characters.';
    }

    if (data.bio && data.bio.length > 250) {
      errors.bio = 'Botanical bio cannot exceed 250 characters.';
    }

    if (data.location && data.location.length > 60) {
      errors.location = 'Location cannot exceed 60 characters.';
    }

    if (data.preferredReminderTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.preferredReminderTime)) {
      errors.preferredReminderTime = 'Invalid time format (HH:MM).';
    }

    return errors;
  };

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Real-time validation
      const validationErrs = validateForm(updated);
      setFormErrors(validationErrs);
      return updated;
    });
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setFormSuccessMsg(null);
    setFormErrorMsg(null);
  };

  const handleSaveProfileForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setFormErrorMsg("Please correct the validation errors before saving.");
      return;
    }

    setIsSavingForm(true);
    setFormSuccessMsg(null);
    setFormErrorMsg(null);

    try {
      // 1. Save directly to Firestore collection `users/{userId}`
      await saveUserProfile({
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        expertise: formData.expertise,
        gardeningStyle: formData.gardeningStyle,
        timezone: formData.timezone,
        preferredReminderTime: formData.preferredReminderTime,
        photoURL: formData.photoURL
      });

      // 2. Synchronize Firestore `userPreferences` so Sage AI context receives same updates
      await saveUserPreferences({
        expertise: formData.expertise,
        gardeningStyle: formData.gardeningStyle,
        timezone: formData.timezone
      });

      // 3. Reload Firebase Auth user identity
      await reloadUser();

      // 4. Update initial snapshot to clear dirty state
      setInitialFormData(formData);
      setUserTimezoneCache(formData.timezone);

      setFormSuccessMsg("Profile successfully saved to Firestore and synchronized.");
      notify("Profile Synchronized", "Your botanical profile changes were written to Firestore.", "success");
      setTimeout(() => setFormSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to save profile to Firestore:", err);
      const msg = err?.message || "Failed to write profile to Firestore.";
      setFormErrorMsg(msg);
      notify("Save Failed", msg, "error");
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleSelectAvatar = async (url: string) => {
    handleFieldChange('photoURL', url);
    setIsAvatarModalOpen(false);
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    setResetSuccessMsg(null);
    try {
      await sendPasswordReset(user.email);
      setResetSuccessMsg(`Password reset email dispatched to ${user.email}. Check your inbox.`);
      notify("Password Reset Sent", `Verification link delivered to ${user.email}`, "info");
    } catch (err: any) {
      console.error("Password reset error:", err);
      notify("Reset Failed", err?.message || "Could not send password reset.", "error");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendVerification = async () => {
    if (verifyCooldown > 0) return;
    setIsSendingVerify(true);
    try {
      await resendVerificationEmail();
      setVerifyCooldown(60);
      notify("Verification Sent", "A new verification email has been dispatched.", "success");
    } catch (err: any) {
      console.error("Failed to resend email verification:", err);
      notify("Verification Failed", err?.message || "Could not send email.", "error");
    } finally {
      setIsSendingVerify(false);
    }
  };

  const handleAutoDetectTimezone = () => {
    const deviceTz = getDeviceTimezone();
    handleFieldChange('timezone', deviceTz);
  };

  const handleToggleSpecialInterest = async (interestId: string) => {
    const current = prefs?.specialInterests || [];
    const updated = current.includes(interestId)
      ? current.filter((id) => id !== interestId)
      : [...current, interestId];
    setSavingPrefs(true);
    try {
      await saveUserPreferences({ specialInterests: updated });
      setPrefs((prev) => prev ? { ...prev, specialInterests: updated } : null);
      notify("Specialization Saved", "Sage focus areas updated in Firestore.", "success");
    } catch (err) {
      console.error("Failed to update specialization:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleUpdateSageTone = async (tone: string) => {
    setSavingPrefs(true);
    try {
      await saveUserPreferences({ sageTone: tone });
      setPrefs((prev) => prev ? { ...prev, sageTone: tone } : null);
      notify("Advisory Tone Updated", `Sage persona adjusted to ${tone}.`, "success");
    } catch (err) {
      console.error("Failed to update tone:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const success = await toggleNotifications();
      if (!success && !notificationsEnabled) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'denied') {
            notify("Notifications Blocked", "Please unblock notifications in your browser address bar settings.", "warning");
          } else {
            notify("Permission Needed", "Please click 'Allow' in your browser notification prompt.", "info");
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
    }
  };

  const triggerTestNotification = async () => {
    try {
      await notify(
        "🌿 Floravia Botanical Alert", 
        `Temporal link active in ${activeTimezone}. Optimal turgor checks scheduled for ${formData.preferredReminderTime}.`,
        "success"
      );
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("🌿 Floravia System Check", {
          body: `Temporal care alerts online for ${activeTimezone}.`,
          icon: '/logo.png'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestVoiceSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak("System online. Voice Gardener protocols active. I am Sage, your botanical intelligence core. How shall we safeguard your sanctuary today?");
    }
  };

  const handleUpdateTempUnit = async (unit: 'celsius' | 'fahrenheit') => {
    setTempUnit(unit);
    localStorage.setItem('floravia_temp_unit', unit);
    await saveUserPreferences({ temperatureUnit: unit });
  };

  const handleUpdateDateFormat = (format: 'MDY' | 'DMY') => {
    setDateFormat(format);
    localStorage.setItem('floravia_date_format', format);
  };

  const handleUpdateDensity = (density: 'spacious' | 'compact') => {
    setVisualDensity(density);
    localStorage.setItem('floravia_visual_density', density);
  };

  const handleUpdateVoiceAutoPlay = async (enabled: boolean) => {
    setVoiceAutoPlay(enabled);
    localStorage.setItem('floravia_voice_auto_speak', String(enabled));
    await saveUserPreferences({ voiceAutoPlay: enabled });
  };

  const handleExportSanctuaryData = async () => {
    setIsExporting(true);
    try {
      const [userPlants, userLogs, userReminders] = await Promise.all([
        getUserPlants().catch(() => []),
        Promise.all((plants || []).map(p => p.id ? getCareLogs(p.id).catch(() => []) : [])).then(res => res.flat()),
        Promise.all((plants || []).map(p => p.id ? getPlantReminders(p.id).catch(() => []) : [])).then(res => res.flat()),
      ]);

      const exportPayload = {
        floraviaExportVersion: "2.0",
        exportDate: new Date().toISOString(),
        userProfile: formData,
        preferences: prefs,
        gardenInventory: userPlants,
        careInterventionLogs: userLogs,
        activeReminders: userReminders,
        transactionHistory: transactions
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `floravia-sanctuary-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      notify("Data Export Ready", "Your botanical sanctuary data has been downloaded as JSON.", "success");
    } catch (err) {
      console.error("Export failure:", err);
      notify("Export Failed", "Could not assemble sanctuary backup.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('floravia_local_garden_cache');
      localStorage.removeItem('floravia_scanned_plant_cache');
      setCacheClearedMsg("Offline cache purged successfully.");
      setTimeout(() => setCacheClearedMsg(null), 4000);
      notify("Cache Purged", "Temporary local image cache cleared.", "info");
    } catch (err) {
      console.error("Cache clear failure:", err);
    }
  };

  const handleCopyPaymentId = (paymentId: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(paymentId);
      setCopiedId(paymentId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatTransactionDate = (dateVal: any) => {
    try {
      let dateObj: Date;
      if (dateVal?.toDate) {
        dateObj = dateVal.toDate();
      } else if (dateVal instanceof Date) {
        dateObj = dateVal;
      } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
        dateObj = new Date(dateVal);
      } else {
        dateObj = new Date();
      }
      return new Intl.DateTimeFormat('en-US', {
        timeZone: activeTimezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch {
      return 'Recent';
    }
  };

  const { subscription: serverSub } = useSubscription();
  const activeSub = (serverSub && serverSub.isPro) ? (serverSub as any) : getActiveSubscription();

  const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'Profile & Account Form', icon: UserIcon },
    { id: 'persona', label: 'Sage Intelligence', icon: Brain },
    { id: 'scheduling', label: 'Temporal & Alerts', icon: Globe },
    { id: 'preferences', label: 'Units & Display', icon: SlidersHorizontal },
    { id: 'billing', label: 'Plan & Invoices', icon: CreditCard },
    { id: 'data', label: 'Data & Privacy', icon: HardDrive },
  ];

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Sprout className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-display font-bold text-white">Sign In to Access Settings</h3>
        <p className="text-xs text-emerald-200/70 leading-relaxed">
          Sign in to customize your botanical persona, configure automated care reminders, and manage your account.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          Sign In / Register Account
        </button>
      </div>
    );
  }

  if (user && !isEmailVerified) {
    return (
      <EmailVerificationGate 
        featureName="Sanctuary Settings & Controls" 
        onVerified={loadProfileData} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-emerald-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-slate-400">Loading Firestore Sanctuary Configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8 font-ui">
      
      {/* Settings Masthead */}
      <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* User Avatar with Edit Trigger */}
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
              {formData.photoURL ? (
                <img 
                  src={formData.photoURL} 
                  alt={formData.displayName || 'Botanist'} 
                  className="w-20 h-20 rounded-2xl border-2 border-emerald-500/40 shadow-lg object-cover group-hover:brightness-90 transition-all" 
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#071610] border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold shadow-inner">
                  {formData.displayName?.charAt(0) || user.email?.charAt(0) || 'B'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-bold uppercase tracking-wider text-center p-1">
                Change Avatar
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {formData.displayName || 'Floravia Botanist'}
                </h1>
                {activeSub ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Pro Member
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-mono text-[10px] font-semibold uppercase">
                    Standard Free
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs mt-1 flex items-center gap-2">
                <span>{user.email}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-mono">{activeTimezone}</span>
                {formData.location && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {formData.location}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right pr-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Database Engine</span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Connected
              </span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#071610] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-emerald-500/20 hover:border-rose-500/30 rounded-xl transition-all font-semibold text-xs shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-emerald-500/15 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-[#071610]/80 text-slate-300 hover:text-white hover:bg-emerald-500/10 border border-emerald-500/15'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: FUNCTIONAL PROFILE SETTINGS FORM (FIRESTORE PERSISTED)
          ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/15 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-bold text-white">Botanist Profile Settings Form</h3>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      ● Unsaved Changes
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Production-grade profile editor saving directly to your verified Firestore document (`users/{user.uid}`).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#071610] hover:bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Choose Avatar</span>
                </button>
              </div>
            </div>

            {/* Notification Feedback Banners */}
            {formSuccessMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccessMsg}</span>
              </motion.div>
            )}

            {formErrorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formErrorMsg}</span>
              </motion.div>
            )}

            {/* The Production Form */}
            <form onSubmit={handleSaveProfileForm} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* 1. Display Name Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>Botanist Display Name</span>
                      <span className="text-emerald-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {formData.displayName.length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange('displayName', e.target.value)}
                    placeholder="e.g. Master Botanist Chandu"
                    className={`w-full bg-[#071610] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                      formErrors.displayName 
                        ? 'border-rose-500 focus:border-rose-400' 
                        : 'border-emerald-500/30 focus:border-emerald-400'
                    }`}
                  />
                  {formErrors.displayName ? (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.displayName}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Visible on forum comments, plant scans, and exported reports.</p>
                  )}
                </div>

                {/* 2. Geographic Microclimate Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Geographic Location / City</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {formData.location.length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    placeholder="e.g. Bhimavaram, Andhra Pradesh"
                    className={`w-full bg-[#071610] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                      formErrors.location 
                        ? 'border-rose-500 focus:border-rose-400' 
                        : 'border-emerald-500/30 focus:border-emerald-400'
                    }`}
                  />
                  {formErrors.location ? (
                    <p className="text-[11px] text-rose-400 font-medium">{formErrors.location}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Contextualizes sunlight angles, humidity thresholds, and seasonal weather.</p>
                  )}
                </div>

                {/* 3. Preferred Daily Alert Time */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>Daily Briefing Alert Time</span>
                  </label>
                  <select
                    value={formData.preferredReminderTime}
                    onChange={(e) => handleFieldChange('preferredReminderTime', e.target.value)}
                    className="w-full bg-[#071610] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                  >
                    <option value="06:00">06:00 AM (Sunrise Inspection)</option>
                    <option value="07:00">07:00 AM (Morning Botanical Scan)</option>
                    <option value="08:00">08:00 AM (Optimal Foliage Misting)</option>
                    <option value="09:00">09:00 AM (Standard Hydration Window)</option>
                    <option value="10:00">10:00 AM (Late Morning Inspection)</option>
                    <option value="18:00">06:00 PM (Dusk Evaporation Check)</option>
                    <option value="20:00">08:00 PM (Night Sensor Routine)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Trigger window for cron reminder notifications and daily briefings.</p>
                </div>

                {/* 4. Cultivation Methodology */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sprout className="w-3 h-3 text-emerald-400" />
                    <span>Cultivation Methodology</span>
                  </label>
                  <select
                    value={formData.gardeningStyle}
                    onChange={(e) => handleFieldChange('gardeningStyle', e.target.value)}
                    className="w-full bg-[#071610] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                  >
                    {CULTIVATION_STYLES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0b1f16] text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Calibrates soil drainage and nutrient advice in AI diagnostic scans.</p>
                </div>
              </div>

              {/* 5. Botanical Bio & Sanctuary Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileEdit className="w-3 h-3 text-emerald-400" />
                    <span>Botanical Bio & Sanctuary Notes</span>
                  </label>
                  <span className={`text-[10px] font-mono ${formData.bio.length > 250 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                    {formData.bio.length} / 250
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Tell Sage about your indoor conservatory, specific specimen species you cultivate, or current botanical objectives..."
                  className={`w-full bg-[#071610] border rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    formErrors.bio 
                      ? 'border-rose-500 focus:border-rose-400' 
                      : 'border-emerald-500/30 focus:border-emerald-400'
                  }`}
                />
                {formErrors.bio && (
                  <p className="text-[11px] text-rose-400 font-medium">{formErrors.bio}</p>
                )}
              </div>

              {/* 6. Expertise Tier Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Botanical Experience Level</span>
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', title: 'Beginner', desc: 'Everyday vocabulary, fundamental care guides & watering steps' },
                    { id: 'intermediate', title: 'Intermediate', desc: 'Balanced diagnostic metrics, seasonal cycles & soil composition' },
                    { id: 'expert', title: 'Master Botanist', desc: 'Cellular turgor pressure, stomatal transpiration & Latin taxonomy' },
                  ].map((level) => {
                    const isSelected = formData.expertise === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => handleFieldChange('expertise', level.id)}
                        className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-[#071610] border-emerald-500/15 text-slate-300 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-300">{level.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{level.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-4 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Target Document: <code className="font-mono text-emerald-300">users/{user.uid}</code></span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    disabled={!hasUnsavedChanges || isSavingForm}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#071610] hover:bg-slate-800 disabled:opacity-40 border border-emerald-500/20 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingForm || Object.keys(formErrors).length > 0}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingForm ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile to Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Account Security & Password Reset */}
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-4">
            <div className="flex items-center gap-3 border-b border-emerald-500/15 pb-4">
              <Key className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-xl font-display font-bold text-white">Authentication & Account Credentials</h3>
                <p className="text-xs text-slate-300 mt-0.5">Dispatch encrypted password resets and view identity credentials.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#071610] border border-emerald-500/15 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Account Email</span>
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Email Account
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-amber-400 font-medium">Pending Verification</span>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={verifyCooldown > 0 || isSendingVerify}
                        className="text-[11px] text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        {verifyCooldown > 0 ? `Resend (${verifyCooldown}s)` : 'Send Verification'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#071610] border border-emerald-500/15 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Password Security</span>
                <p className="text-xs text-slate-300">Dispatch a password reset link to your registered email address.</p>
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 mt-1"
                >
                  {isSendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>Request Password Reset</span>
                </button>
              </div>
            </div>

            {resetSuccessMsg && (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {resetSuccessMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SAGE AI COGNITIVE PERSONA
          ========================================================================= */}
      {activeTab === 'persona' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-display font-bold text-white">Sage Cognitive Persona</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Tune the reasoning depth, narrative style, and voice of your botanical intelligence companion.</p>
                </div>
              </div>
              {savingPrefs && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
            </div>

            {/* Advisory Tone */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                Advisory Tone & Response Style
              </label>
              <div className="grid sm:grid-cols-4 gap-3">
                {[
                  { id: 'Friendly', label: 'Friendly', desc: 'Warm, encouraging & supportive' },
                  { id: 'Clinical', label: 'Clinical', desc: 'Strict, objective & data-driven' },
                  { id: 'Supportive', label: 'Supportive', desc: 'Patient troubleshooting focus' },
                  { id: 'Direct', label: 'Direct', desc: 'Punchy 2-sentence actionable advice' },
                ].map((tone) => {
                  const isSelected = (prefs?.sageTone || 'Friendly') === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleUpdateSageTone(tone.id)}
                      className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-[#071610] border-emerald-500/15 text-slate-300 hover:border-emerald-500/30'
                      }`}
                    >
                      <span className="font-bold text-xs text-emerald-300 block">{tone.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{tone.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botanical Specializations */}
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                Botanical Focus & Sanctuary Categories
              </label>
              <p className="text-xs text-slate-400">Sage prioritizes these specimen categories when recommending interventions and seasonal guides.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {BOTANICAL_SPECIALIZATIONS.map((spec) => {
                  const isChecked = (prefs?.specialInterests || []).includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleToggleSpecialInterest(spec.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                          : 'bg-[#071610] text-slate-300 border-emerald-500/15 hover:border-emerald-500/30 hover:text-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-slate-950" />}
                      <span>{spec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Audio Protocols */}
            <div className="p-4 rounded-xl bg-[#071610] border border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  {voiceAutoPlay ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Voice Speech Protocol</h4>
                  <p className="text-[11px] text-slate-400">Automatically synthesize spoken responses using Gemini TTS in Voice Gardener mode.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestVoiceSpeech}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0b1f16] hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeaking ? 'Stop Audio' : 'Test Speech'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateVoiceAutoPlay(!voiceAutoPlay)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    voiceAutoPlay
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {voiceAutoPlay ? 'Auto-Read: On' : 'Auto-Read: Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEMPORAL SCHEDULING & TIMEZONE
          ========================================================================= */}
      {activeTab === 'scheduling' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-display font-bold text-white">Temporal Scheduling & Timezone</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Enforces that watering, fertilization, and misting tasks execute strictly at your local time.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Timezone Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Active Botanical Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  className="w-full bg-[#071610] border border-emerald-500/30 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-[#0b1f16] text-white">
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    UTC Offset: <strong className="text-emerald-400 font-mono">{getTimezoneDisplayOffset(formData.timezone)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoDetectTimezone}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Detect Device ({getDeviceTimezone()})
                  </button>
                </div>
              </div>

              {/* Live Synchronized Clock */}
              <div className="p-5 rounded-2xl bg-[#071610] border border-emerald-500/20 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Temporal Sync
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    Real-Time
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-white tracking-wide">
                    {currentTimeStr || 'Synchronizing...'}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Care reminders are computed against this verified clock.
                  </p>
                </div>
              </div>
            </div>

            {/* Master Notifications Switch */}
            <div className="pt-4 border-t border-emerald-500/15">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Browser & Web Push Alerts
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleToggleNotifications}
                  disabled={togglingNotifs}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    notificationsEnabled
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-[#071610] text-slate-300 border border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  <span>{togglingNotifs ? 'Saving...' : notificationsEnabled ? 'Notifications: Enabled' : 'Notifications: Disabled'}</span>
                </button>

                <button
                  onClick={triggerTestNotification}
                  className="px-4 py-2.5 rounded-xl bg-[#071610] hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Send Test Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: UNITS, MEASUREMENTS & DISPLAY
          ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-display font-bold text-white">Display & Measurement Preferences</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Configure measurement standards for temperature, calendars, and visual density.</p>
                </div>
              </div>
            </div>

            {/* Temperature Scale */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#071610] border border-emerald-500/15">
              <div className="flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Temperature Unit</h4>
                  <p className="text-xs text-slate-400">Used across microclimate cards, weather telemetry, and care guides.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#0b1f16] p-1 rounded-xl border border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => handleUpdateTempUnit('celsius')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tempUnit === 'celsius'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTempUnit('fahrenheit')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tempUnit === 'fahrenheit'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            {/* Date Display Notation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#071610] border border-emerald-500/15">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Date Format Standard</h4>
                  <p className="text-xs text-slate-400">Affects calendar timeline stamps, health snapshots, and receipts.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#0b1f16] p-1 rounded-xl border border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => handleUpdateDateFormat('MDY')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateFormat === 'MDY'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Oct 10, 2026 (MDY)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDateFormat('DMY')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateFormat === 'DMY'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  10 Oct 2026 (DMY)
                </button>
              </div>
            </div>

            {/* Visual Density */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#071610] border border-emerald-500/15">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Plant Grid Layout Density</h4>
                  <p className="text-xs text-slate-400">Toggle between spacious botanical cards or compact data metrics.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#0b1f16] p-1 rounded-xl border border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => handleUpdateDensity('spacious')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visualDensity === 'spacious'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Spacious
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDensity('compact')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visualDensity === 'compact'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SUBSCRIPTIONS & VERIFIED INVOICES
          ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Crown className={`w-5 h-5 ${activeSub ? 'text-amber-400' : 'text-slate-400'}`} />
                <h3 className="text-xl font-display font-bold text-white">
                  {activeSub ? activeSub.planName : 'Floravia Standard (Free)'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold uppercase">
                  {activeSub ? 'Active Pro' : 'Free Tier'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                {activeSub
                  ? `Unlimited Gemini multimodal scans, Voice Gardener audio TTS, and longitudinal health memory active.`
                  : `Free tier includes 3 scans daily. Upgrade to Floravia Pro for unlimited AI diagnostics and Voice Gardener.`}
              </p>
            </div>

            {onOpenUpgradeModal && (
              <button
                onClick={onOpenUpgradeModal}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>{activeSub ? 'Manage / Extend Plan' : 'Upgrade to Floravia Pro'}</span>
              </button>
            )}
          </div>

          {/* Payment History & Verified Invoices */}
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-bold text-white">Payment Invoices & Receipts</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold uppercase">
                    Razorpay 256-Bit
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Itemized tax receipts, GST compliance, and transaction records.</p>
              </div>

              <button
                onClick={refreshTransactions}
                disabled={refreshingTx}
                className="px-4 py-2 rounded-xl bg-[#071610] hover:bg-emerald-950/40 border border-emerald-500/20 text-slate-200 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingTx ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Refresh Receipts</span>
              </button>
            </div>

            {/* Filters & Search Control */}
            <div className="px-6 py-4 border-b border-emerald-500/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#071610] p-1 rounded-xl border border-emerald-500/20">
                <button
                  onClick={() => setTransactionFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  onClick={() => setTransactionFilter('yearly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionFilter === 'yearly'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Annual ({transactions.filter(t => t.billingCycle === 'yearly').length})
                </button>
                <button
                  onClick={() => setTransactionFilter('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    transactionFilter === 'monthly'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Monthly ({transactions.filter(t => t.billingCycle === 'monthly').length})
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID or plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#071610] border border-emerald-500/25 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Invoices List */}
            <div className="divide-y divide-emerald-500/15">
              {transactions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#071610] border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-display font-bold text-white">No Invoices on File</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you subscribe to Floravia Pro, your official tax receipts, payment tokens, and GST invoices will be logged here.
                  </p>
                  {onOpenUpgradeModal && (
                    <button
                      onClick={onOpenUpgradeModal}
                      className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Upgrade to Pro</span>
                    </button>
                  )}
                </div>
              ) : (
                transactions
                  .filter((t) => {
                    if (transactionFilter !== 'all' && t.billingCycle !== transactionFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase().trim();
                      return (
                        t.paymentId?.toLowerCase().includes(q) ||
                        t.planName?.toLowerCase().includes(q) ||
                        t.method?.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((tx) => (
                    <div
                      key={tx.id || tx.paymentId}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#071610]/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{tx.planName || 'Floravia Pro'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                              {tx.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                            <span>ID: {tx.paymentId}</span>
                            <span>•</span>
                            <span>{formatTransactionDate(tx.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-emerald-500/15">
                        <div className="text-left md:text-right">
                          <span className="font-mono font-bold text-white text-base">₹{Number(tx.amount || 0).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-emerald-400/80 block font-mono">Paid (GST Incl.)</span>
                        </div>
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="px-4 py-2 rounded-xl bg-[#071610] hover:bg-emerald-950/40 border border-emerald-500/25 text-slate-200 hover:text-emerald-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DATA PORTABILITY, CACHE & PRIVACY
          ========================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-[#0b1f16] border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-display font-bold text-white">Data Portability & Storage Management</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Export your complete botanical sanctuary records and manage local device storage.</p>
                </div>
              </div>
            </div>

            {/* Export Sanctuary Data */}
            <div className="p-5 rounded-2xl bg-[#071610] border border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Export Complete Sanctuary Archive (.JSON)
                </h4>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  Download a full machine-readable archive containing all your saved plants, health vitality histories, care logs, upcoming reminders, and cognitive preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportSanctuaryData}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center gap-2 shadow-md shadow-emerald-500/15"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? 'Packaging Archive...' : 'Download Archive'}</span>
              </button>
            </div>

            {/* Storage Diagnostic & Cache Flush */}
            <div className="p-5 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Device Storage & Scanned Images Cache
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimated local browser cache: <strong className="text-emerald-400 font-mono">{(storageUsedBytes / 1024).toFixed(1)} KB</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-4 py-2 rounded-xl bg-[#0b1f16] hover:bg-rose-950/40 border border-emerald-500/20 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Flush Local Cache</span>
                </button>
              </div>

              {cacheClearedMsg && (
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {cacheClearedMsg}
                </p>
              )}
            </div>

            {/* Cloud Firestore Verification */}
            <div className="p-4 rounded-xl bg-[#071610]/50 border border-emerald-500/15 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All core plants and histories are synchronized and stored in Google Cloud Firestore.</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold shrink-0">Status: Active</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: BOTANIST AVATAR PICKER
          ========================================================================= */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Select Botanist Specialist Avatar</h3>
                  <p className="text-xs text-slate-400">Choose a high-resolution portrait or enter a custom image URL.</p>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Curated Grid */}
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                {CURATED_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => handleSelectAvatar(av.url)}
                    className="group relative rounded-xl overflow-hidden border border-emerald-500/20 hover:border-emerald-400 transition-all cursor-pointer aspect-square"
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white p-1 text-center truncate">
                      {av.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Image URL option */}
              <div className="pt-2 border-t border-emerald-500/15 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Custom Image Web URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-[#071610] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarUrl.trim()) handleSelectAvatar(customAvatarUrl.trim());
                    }}
                    disabled={!customAvatarUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: PRINTABLE TAX INVOICE RECEIPT
          ========================================================================= */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1f16] border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto font-ui"
            >
              <div className="flex items-start justify-between border-b border-emerald-500/15 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <span className="font-display font-bold text-lg text-white">Floravia Botanical AI</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Official Tax Invoice & Payment Receipt</p>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-500/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Header */}
              <div className="py-4 border-b border-emerald-500/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Captured & Paid
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Timestamp</span>
                  <span className="text-xs font-mono text-white mt-0.5 block">{formatTransactionDate(selectedReceipt.createdAt)}</span>
                </div>
              </div>

              {/* Customer and Gateway Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#071610] border border-emerald-500/15 text-xs my-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Account</span>
                  <span className="font-semibold text-white block truncate">{formData.displayName || user?.displayName || 'Floravia Botanist'}</span>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">{selectedReceipt.userEmail || user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Method</span>
                  <span className="font-semibold text-emerald-400 block uppercase">{selectedReceipt.method || 'Card Checkout'}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">Razorpay Gateway</span>
                </div>
              </div>

              {/* Itemized Charges */}
              <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-sm">{selectedReceipt.planName || 'Floravia Pro Plan'}</p>
                    <p className="text-[11px] text-slate-400">
                      {selectedReceipt.billingCycle === 'yearly' ? 'Annual Tier • Full Neural Vision & Diagnostics' : 'Monthly Tier • Neural Diagnostics & Care'}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{Number(selectedReceipt.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {(() => {
                  const gst = calculateGstBreakdown(Number(selectedReceipt.amount || 0), (selectedReceipt.currency === 'USD' ? 'USD' : 'INR'));
                  return (
                    <div className="border-t border-emerald-500/15 pt-2 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Base Taxable Amount</span>
                        <span className="font-mono">₹{gst.netAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Integrated GST (18% • SAC {gst.sacCode})</span>
                        <span className="font-mono text-emerald-400">₹{gst.igstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold pt-1 border-t border-emerald-500/15 text-sm">
                        <span className="text-emerald-400">Total Tax Invoice Amount</span>
                        <span className="font-mono text-emerald-400">₹{gst.totalAmount.toLocaleString('en-IN')} {selectedReceipt.currency || 'INR'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Crypto and Audit Data */}
              <div className="space-y-1 font-mono text-[11px] bg-black/40 p-3 rounded-xl border border-emerald-500/15 my-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-300">{selectedReceipt.paymentId}</span>
                    <button
                      onClick={() => handleCopyPaymentId(selectedReceipt.paymentId)}
                      className="p-0.5 text-slate-400 hover:text-emerald-400 cursor-pointer"
                    >
                      {copiedId === selectedReceipt.paymentId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{selectedReceipt.orderId || `order_${selectedReceipt.paymentId}`}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/10 text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Integrity Token:</span>
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {selectedReceipt.signatureHash ? `${selectedReceipt.signatureHash.slice(0, 16)}... (SHA-256)` : '256-bit Verified'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-[#071610] hover:bg-emerald-950/40 border border-emerald-500/25 text-slate-200 hover:text-emerald-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
