import React, { useState, useMemo } from 'react';
import { 
  SavedPlant, 
  PlantReminder, 
  CareLog,
  HealthHistoryEntry,
} from '../services/firebase';
import { Sprout, ArrowDownAz } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherWidget } from './WeatherWidget';
import { GardenStats } from './subcomponents/GardenStats';
import { EmptyGarden } from './subcomponents/EmptyGarden';
import { PlantCard } from './subcomponents/PlantCard';
import { useGarden, TabView } from '../hooks/useGarden';

type SortOption = 'date' | 'name' | 'scientific';

export const MyGarden: React.FC = () => {
  const {
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
    handleTabChange
  } = useGarden();

  const [sortBy, setSortBy] = useState<SortOption>('date');
  
  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'scientific') {
        return a.scientificName.localeCompare(b.scientificName);
      } else if (sortBy === 'date') {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [plants, sortBy]);

  const gardenStats = useMemo(() => {
    if (plants.length === 0) return null;
    const avgHealth = Math.round(plants.reduce((acc, p) => acc + (p.healthScore || 0), 0) / plants.length);
    const mostCommonMood = plants.reduce((acc, p) => {
      acc[p.mood || 'Vibrant'] = (acc[p.mood || 'Vibrant'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const moodEntries = Object.entries(mostCommonMood).sort((a, b) => b[1] - a[1]);
    
    return {
      avgHealth,
      mood: moodEntries[0][0]
    };
  }, [plants]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-green-400">
        <Sprout className="w-8 h-8 animate-bounce shadow-glow-green rounded-full" />
      </div>
    );
  }

  if (plants.length === 0) {
    return <EmptyGarden />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
      <GardenStats stats={gardenStats} count={plants.length} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <WeatherWidget plantName="your garden" />
      </motion.div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-secondary font-medium font-ui">{plants.length} plant{plants.length !== 1 ? 's' : ''} saved</p>
        <div className="flex items-center gap-2">
          <ArrowDownAz className="w-4 h-4 text-secondary" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-none text-sm font-semibold font-ui text-green-400 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="date">Date Added</option>
            <option value="name">Name (A-Z)</option>
            <option value="scientific">Scientific Name (A-Z)</option>
          </select>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {sortedPlants.map((plant, index) => (
            <PlantCard 
              key={plant.id}
              plant={plant}
              index={index}
              reminders={reminders[plant.id!] || []}
              careLogs={careLogs[plant.id!] || []}
              healthHistory={healthHistory[plant.id!] || []}
              activeTab={activeTabs[plant.id!] || 'reminders'}
              onAddReminder={handleAddReminder}
              onCompleteReminder={handleCompleteReminder}
              onManualLog={handleManualLog}
              onPulseCheck={handlePulseCheck}
              onUpdateNickname={handleUpdateNickname}
              onTabChange={handleTabChange}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

