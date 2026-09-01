import React, { useState, useMemo } from 'react';
import { 
  SavedPlant, 
  PlantReminder, 
  CareLog,
  HealthHistoryEntry,
} from '../services/firebase';
import { Sprout, ArrowDownAz, LayoutGrid, Layers, Compass, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherWidget } from './WeatherWidget';
import { GardenStats } from './subcomponents/GardenStats';
import { EmptyGarden } from './subcomponents/EmptyGarden';
import { PlantCard } from './subcomponents/PlantCard';
import { GardenSpatialGrid } from './subcomponents/GardenSpatialGrid';
import { useGarden, TabView } from '../hooks/useGarden';
import { useAuth } from '../hooks/useAuth';
import { EmailVerificationGate } from './EmailVerificationGate';
import { DashboardPlant } from '../types/botanical';
import { DEFAULT_PLANTS } from '../data/defaultPlants';

type SortOption = 'date' | 'name' | 'scientific';
type GardenViewMode = 'cards' | 'spatial-grid';

interface MyGardenProps {
  appPlants?: DashboardPlant[];
  onWaterPlant?: (plantId: string) => void;
  onSelectPlant?: (plant: DashboardPlant) => void;
  onOpenAuthModal?: () => void;
}

export const MyGarden: React.FC<MyGardenProps> = ({
  appPlants = DEFAULT_PLANTS,
  onWaterPlant,
  onSelectPlant,
  onOpenAuthModal
}) => {
  const { user, isEmailVerified } = useAuth();
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
    handleTabChange,
    refreshGarden
  } = useGarden();

  const [viewMode, setViewMode] = useState<GardenViewMode>('cards');
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

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Sprout className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Sign In to View Your Garden</h3>
        <p className="text-xs text-emerald-200/70 leading-relaxed">
          Create an account or sign in to save botanical discoveries, track health trends, and receive smart watering reminders.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (user && !isEmailVerified) {
    return (
      <EmailVerificationGate 
        featureName="My Garden" 
        onVerified={refreshGarden} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-emerald-400">
        <Sprout className="w-8 h-8 animate-bounce rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0 space-y-6">
      {/* Top View Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1610] border border-emerald-900/30 rounded-2xl p-3 md:p-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">My Botanical Sanctuary</h2>
            <p className="text-xs text-slate-400">
              {plants.length > 0 
                ? `${plants.length} saved plant${plants.length !== 1 ? 's' : ''} in cloud database` 
                : 'Interactive Garden & Spatial Layout Planner'}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#060e0a] border border-emerald-900/40">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Card List</span>
          </button>

          <button
            onClick={() => setViewMode('spatial-grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
              viewMode === 'spatial-grid'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            <span>Room & Garden Layout</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
          </button>
        </div>
      </div>

      {/* VIEW 1: SPATIAL ROOM & GARDEN DRAG-AND-DROP GRID */}
      {viewMode === 'spatial-grid' && (
        <motion.div
          key="spatial-grid-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          <GardenSpatialGrid 
            userPlants={plants} 
            appPlants={appPlants} 
            onWaterPlant={onWaterPlant} 
          />
        </motion.div>
      )}

      {/* VIEW 2: STANDARD CARD LIST VIEW */}
      {viewMode === 'cards' && (
        <motion.div
          key="cards-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {plants.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-[#0b1712] border border-cyan-500/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                    <Compass className="w-3 h-3" />
                    Spatial Simulator Ready
                  </div>
                  <h4 className="text-sm font-bold text-white">Want to design your physical room layout?</h4>
                  <p className="text-xs text-slate-400">
                    Use our drag-and-drop spatial grid to position houseplants around south windows, desks, and patios.
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('spatial-grid')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Room Grid</span>
                </button>
              </div>

              <EmptyGarden />
            </div>
          ) : (
            <>
              <GardenStats stats={gardenStats} count={plants.length} />

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <WeatherWidget plantName="your garden" />
              </motion.div>

              <div className="flex justify-between items-center mb-4">
                <p className="text-secondary font-medium font-ui text-xs md:text-sm">
                  {plants.length} plant{plants.length !== 1 ? 's' : ''} saved
                </p>
                <div className="flex items-center gap-2">
                  <ArrowDownAz className="w-4 h-4 text-secondary" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-[#0b1712] border border-emerald-900/40 rounded-lg px-2.5 py-1 text-xs font-semibold font-ui text-emerald-400 focus:ring-0 cursor-pointer outline-none"
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
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};


