import { useState, useEffect, useCallback } from 'react';
import { 
  getUserPlants, 
  getPlantReminders, 
  addPlantReminder, 
  deleteReminder, 
  SavedPlant, 
  PlantReminder, 
  getCareLogs, 
  addCareLog, 
  CareLog, 
  getPlantHealthHistory, 
  HealthHistoryEntry, 
  updatePlantHealth, 
  updatePlantNickname 
} from '../services/firebase';
import { useAuth } from './useAuth';
import { getUserTimezone, getNextReminderOccurrence } from '../utils/timezone';

export type TabView = 'reminders' | 'history' | 'trends';

export function useGarden() {
  const { user, isEmailVerified } = useAuth();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [reminders, setReminders] = useState<Record<string, PlantReminder[]>>({});
  const [careLogs, setCareLogs] = useState<Record<string, CareLog[]>>({});
  const [healthHistory, setHealthHistory] = useState<Record<string, HealthHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTabs, setActiveTabs] = useState<Record<string, TabView>>({});

  const loadGarden = useCallback(async () => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    if (!user.emailVerified) {
      setPlants([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const savedPlants = await getUserPlants();
      setPlants(savedPlants);
      
      const newReminders: Record<string, PlantReminder[]> = {};
      const newLogs: Record<string, CareLog[]> = {};
      const newHealthHistory: Record<string, HealthHistoryEntry[]> = {};
      const initialTabs: Record<string, TabView> = {};

      for (const p of savedPlants) {
        if (p.id) {
          const [rems, logs, history] = await Promise.all([
            getPlantReminders(p.id).catch(() => []),
            getCareLogs(p.id).catch(() => []),
            getPlantHealthHistory(p.id).catch(() => [])
          ]);
          
          newReminders[p.id] = rems;
          newLogs[p.id] = logs;
          newHealthHistory[p.id] = history;
          initialTabs[p.id] = 'reminders';
        }
      }
      
      setReminders(newReminders);
      setCareLogs(newLogs);
      setHealthHistory(newHealthHistory);
      setActiveTabs(initialTabs);
    } catch (err: any) {
      console.warn('Failed to load garden database:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isEmailVerified) {
      loadGarden();
    } else {
      setLoading(false);
    }
  }, [user, isEmailVerified, loadGarden]);

  const handleAddReminder = async (plantId: string, type: string, days: string, time: string = '09:00') => {
    const userTz = getUserTimezone();
    const daysCount = parseInt(days) || 1;
    const { dueDate } = getNextReminderOccurrence(daysCount, time, userTz);
    
    await addPlantReminder(plantId, type, dueDate, { time, timezone: userTz });
    const rems = await getPlantReminders(plantId);
    setReminders(prev => ({ ...prev, [plantId]: rems }));
  };

  const handleCompleteReminder = async (reminderId: string, plantId: string, type: string) => {
    await deleteReminder(reminderId);
    await addCareLog(plantId, type);
    setReminders(prev => ({
      ...prev,
      [plantId]: prev[plantId].filter(r => r.id !== reminderId)
    }));
    const updatedLogs = await getCareLogs(plantId);
    setCareLogs(prev => ({ ...prev, [plantId]: updatedLogs }));
  };

  const handleManualLog = async (plantId: string, type: string) => {
    await addCareLog(plantId, type);
    const updatedLogs = await getCareLogs(plantId);
    setCareLogs(prev => ({ ...prev, [plantId]: updatedLogs }));
  };

  const handlePulseCheck = async (plantId: string, score: number, mood: string, note: string) => {
    await updatePlantHealth(plantId, score, mood, note);
    const updatedPlants = await getUserPlants();
    setPlants(updatedPlants);
    const history = await getPlantHealthHistory(plantId);
    setHealthHistory(prev => ({ ...prev, [plantId]: history }));
  };

  const handleUpdateNickname = async (plantId: string, nickname: string) => {
    await updatePlantNickname(plantId, nickname);
    setPlants(prev => prev.map(p => p.id === plantId ? { ...p, nickname } : p));
  };

  const handleTabChange = async (plantId: string, tab: TabView) => {
    setActiveTabs(prev => ({ ...prev, [plantId]: tab }));
    if (tab === 'trends' && !healthHistory[plantId]) {
      const history = await getPlantHealthHistory(plantId);
      setHealthHistory(prev => ({ ...prev, [plantId]: history }));
    }
  };

  return {
    plants,
    reminders,
    careLogs,
    healthHistory,
    loading,
    activeTabs,
    handleAddReminder,
    handleCompleteReminder,
    handleManualLog,
    handlePulseCheck,
    handleUpdateNickname,
    handleTabChange,
    refreshGarden: loadGarden
  };
}
