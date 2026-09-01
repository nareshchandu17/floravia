import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Compass, 
  Sparkles, 
  Droplets, 
  Trash2, 
  Plus, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Wind, 
  Thermometer, 
  Home, 
  LayoutGrid, 
  Layers, 
  Info, 
  Lightbulb,
  Maximize2,
  Minimize2,
  Shuffle,
  Eye,
  Sliders,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SavedPlant } from '../../services/firebase';
import { DashboardPlant } from '../../types/botanical';
import { DEFAULT_PLANTS } from '../../data/defaultPlants';

export interface GridPlantItem {
  id: string;
  name: string;
  scientificName: string;
  nickname?: string;
  imageUrl: string;
  healthScore?: number;
  lightNeed: 'full-sun' | 'bright-indirect' | 'medium-light' | 'low-light';
  waterNeed: 'frequent' | 'moderate' | 'low';
  humidityNeed?: 'high' | 'normal' | 'low';
}

export interface PlacedPlant extends GridPlantItem {
  row: number;
  col: number;
  placedAt: number;
}

export type RoomPresetId = 'living-room' | 'balcony' | 'sunroom' | 'bedroom-desk' | 'garden-bed';

interface RoomPreset {
  id: RoomPresetId;
  name: string;
  icon: string;
  dimensions: { rows: number; cols: number };
  description: string;
  defaultOrientation: 'South' | 'North' | 'East' | 'West' | '360° Open';
  windowPosition: 'top' | 'left' | 'right' | 'all' | 'none';
  baseTemp: string;
  baseHumidity: string;
}

const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'living-room',
    name: 'Living Room (South Window)',
    icon: '🛋️',
    dimensions: { rows: 5, cols: 6 },
    description: 'Bright southern exposure with high illumination near top wall fading to gentle ambient light.',
    defaultOrientation: 'South',
    windowPosition: 'top',
    baseTemp: '72°F (22°C)',
    baseHumidity: '55% RH'
  },
  {
    id: 'balcony',
    name: 'Balcony / Covered Patio',
    icon: '🌿',
    dimensions: { rows: 4, cols: 7 },
    description: 'Direct outdoor sunlight gradient with high fresh air circulation.',
    defaultOrientation: 'East',
    windowPosition: 'top',
    baseTemp: '78°F (25°C)',
    baseHumidity: '65% RH'
  },
  {
    id: 'sunroom',
    name: 'Sunroom / Greenhouse',
    icon: '🪴',
    dimensions: { rows: 6, cols: 6 },
    description: 'Panoramic 360° high solar luminance and optimal humidity retention.',
    defaultOrientation: '360° Open',
    windowPosition: 'all',
    baseTemp: '75°F (24°C)',
    baseHumidity: '75% RH'
  },
  {
    id: 'bedroom-desk',
    name: 'Office & Bedroom Space',
    icon: '🛏️',
    dimensions: { rows: 4, cols: 5 },
    description: 'Gentle indirect exposure from west window with low-light corners for shade-tolerant foliage.',
    defaultOrientation: 'West',
    windowPosition: 'left',
    baseTemp: '70°F (21°C)',
    baseHumidity: '48% RH'
  },
  {
    id: 'garden-bed',
    name: 'Outdoor Garden Bed',
    icon: '🏡',
    dimensions: { rows: 5, cols: 6 },
    description: 'Open ground plot with full sun center and partial tree shade along perimeter.',
    defaultOrientation: '360° Open',
    windowPosition: 'none',
    baseTemp: '80°F (26°C)',
    baseHumidity: '60% RH'
  }
];

interface GardenSpatialGridProps {
  userPlants?: SavedPlant[];
  appPlants?: DashboardPlant[];
  onSelectPlant?: (plantId: string) => void;
  onWaterPlant?: (plantId: string) => void;
}

export const GardenSpatialGrid: React.FC<GardenSpatialGridProps> = ({
  userPlants = [],
  appPlants = DEFAULT_PLANTS,
  onSelectPlant,
  onWaterPlant
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<RoomPresetId>('living-room');
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);
  const [selectedPlantIdForPlacement, setSelectedPlantIdForPlacement] = useState<string | null>(null);
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);
  const [inspectingPlant, setInspectingPlant] = useState<PlacedPlant | null>(null);
  
  // Visual overlays & simulation states
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'noon' | 'afternoon' | 'night'>('noon');
  const [growLights, setGrowLights] = useState<{ row: number; col: number; id: string }[]>([]);
  const [humidifiers, setHumidifiers] = useState<{ row: number; col: number; id: string }[]>([]);
  const [toolMode, setToolMode] = useState<'plant' | 'growlight' | 'humidifier'>('plant');
  const [layoutSavedToast, setLayoutSavedToast] = useState(false);

  const currentPreset = useMemo(() => {
    return ROOM_PRESETS.find(p => p.id === selectedPresetId) || ROOM_PRESETS[0];
  }, [selectedPresetId]);

  // Normalize all available plants into a rich unified collection
  const availablePlants: GridPlantItem[] = useMemo(() => {
    const list: GridPlantItem[] = [];
    const seenIds = new Set<string>();

    // 1. User saved plants from Firebase
    if (userPlants && userPlants.length > 0) {
      userPlants.forEach((p, idx) => {
        const id = p.id || `saved-${idx}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          // Determine light needs from predictedNeeds or defaults
          const lightText = p.predictedNeeds?.light?.toLowerCase() || '';
          let lightNeed: GridPlantItem['lightNeed'] = 'bright-indirect';
          if (lightText.includes('full') || lightText.includes('direct')) lightNeed = 'full-sun';
          else if (lightText.includes('low') || lightText.includes('shade')) lightNeed = 'low-light';
          else if (lightText.includes('medium') || lightText.includes('partial')) lightNeed = 'medium-light';

          const matchingAppPlant = appPlants.find(ap => 
            ap.name.toLowerCase() === p.name.toLowerCase() || 
            ap.scientificName.toLowerCase() === p.scientificName.toLowerCase()
          );

          list.push({
            id,
            name: p.name,
            scientificName: p.scientificName,
            nickname: p.nickname,
            imageUrl: matchingAppPlant?.imageUrl || 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=600&q=80',
            healthScore: p.healthScore || 90,
            lightNeed,
            waterNeed: 'moderate'
          });
        }
      });
    }

    // 2. Supplement with App / Default Plants if list is small
    appPlants.forEach((p) => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        const lightText = p.careEssentials?.light?.toLowerCase() || '';
        let lightNeed: GridPlantItem['lightNeed'] = 'bright-indirect';
        if (lightText.includes('full') || lightText.includes('direct')) lightNeed = 'full-sun';
        else if (lightText.includes('low') || lightText.includes('shade')) lightNeed = 'low-light';
        else if (lightText.includes('medium') || lightText.includes('partial')) lightNeed = 'medium-light';

        list.push({
          id: p.id,
          name: p.name,
          scientificName: p.scientificName,
          nickname: p.nickname,
          imageUrl: p.imageUrl,
          healthScore: p.healthScore,
          lightNeed,
          waterNeed: 'moderate'
        });
      }
    });

    return list;
  }, [userPlants, appPlants]);

  // Load layout from localStorage on preset change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`floravia_layout_${selectedPresetId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.placedPlants)) {
          setPlacedPlants(parsed.placedPlants);
        }
        if (Array.isArray(parsed.growLights)) {
          setGrowLights(parsed.growLights);
        }
        if (Array.isArray(parsed.humidifiers)) {
          setHumidifiers(parsed.humidifiers);
        }
        return;
      }
    } catch (e) {
      console.warn('Failed to load spatial layout from localStorage', e);
    }

    // Initial default placement if empty
    if (availablePlants.length > 0) {
      const initial: PlacedPlant[] = [];
      if (availablePlants[0]) initial.push({ ...availablePlants[0], row: 0, col: 2, placedAt: Date.now() });
      if (availablePlants[1]) initial.push({ ...availablePlants[1], row: 1, col: 4, placedAt: Date.now() });
      if (availablePlants[2]) initial.push({ ...availablePlants[2], row: 3, col: 1, placedAt: Date.now() });
      setPlacedPlants(initial);
      setGrowLights([]);
      setHumidifiers([]);
    }
  }, [selectedPresetId, availablePlants]);

  // Save layout helper
  const saveCurrentLayout = (plants: PlacedPlant[], lights: typeof growLights, hums: typeof humidifiers) => {
    try {
      localStorage.setItem(`floravia_layout_${selectedPresetId}`, JSON.stringify({
        placedPlants: plants,
        growLights: lights,
        humidifiers: hums,
        updatedAt: Date.now()
      }));
      setLayoutSavedToast(true);
      setTimeout(() => setLayoutSavedToast(false), 2200);
    } catch (e) {
      console.warn('Could not save layout', e);
    }
  };

  // Determine light level of a cell given the room preset, time of day, and placed grow lights
  const getCellMicroclimate = (row: number, col: number) => {
    const { rows, cols } = currentPreset.dimensions;
    const { windowPosition, id } = currentPreset;
    let baseIntensity = 50; // Lux index (0-100)

    // Window light gradients
    if (windowPosition === 'top') {
      // Distance from top row
      const distFromWindow = row / (rows - 1);
      baseIntensity = 95 - (distFromWindow * 60);
      // Horizontal angle based on sun time
      if (timeOfDay === 'morning') {
        const eastFactor = (cols - 1 - col) / (cols - 1);
        baseIntensity += eastFactor * 15;
      } else if (timeOfDay === 'afternoon') {
        const westFactor = col / (cols - 1);
        baseIntensity += westFactor * 15;
      } else if (timeOfDay === 'night') {
        baseIntensity = 10;
      }
    } else if (windowPosition === 'left') {
      const distFromWindow = col / (cols - 1);
      baseIntensity = 90 - (distFromWindow * 65);
      if (timeOfDay === 'morning') baseIntensity *= 1.15;
      if (timeOfDay === 'night') baseIntensity = 8;
    } else if (windowPosition === 'all') {
      baseIntensity = timeOfDay === 'night' ? 12 : 88;
    } else if (windowPosition === 'none' && id === 'garden-bed') {
      // Center is open, edges have slight tree shade
      const centerDist = Math.abs(col - cols / 2) + Math.abs(row - rows / 2);
      baseIntensity = 95 - (centerDist * 6);
      if (timeOfDay === 'night') baseIntensity = 5;
    }

    // Boost if nearby Grow Light (within 1 cell radius)
    growLights.forEach(gl => {
      const dist = Math.hypot(gl.row - row, gl.col - col);
      if (dist <= 1.5) {
        baseIntensity += (2 - dist) * 25;
      }
    });

    baseIntensity = Math.max(5, Math.min(100, Math.round(baseIntensity)));

    // Categorize light category
    let category: 'full-sun' | 'bright-indirect' | 'medium-light' | 'low-light' = 'low-light';
    let fcValue = Math.round(baseIntensity * 12); // Foot-candles approximation

    if (baseIntensity >= 75) category = 'full-sun';
    else if (baseIntensity >= 50) category = 'bright-indirect';
    else if (baseIntensity >= 25) category = 'medium-light';
    else category = 'low-light';

    // Check humidity boost
    let hasHighHumidity = false;
    humidifiers.forEach(h => {
      const dist = Math.hypot(h.row - row, h.col - col);
      if (dist <= 1.8) hasHighHumidity = true;
    });

    return {
      intensity: baseIntensity,
      category,
      fcValue,
      hasHighHumidity
    };
  };

  // Evaluate compatibility of a plant placed at row, col
  const evaluateCompatibility = (plant: GridPlantItem, row: number, col: number) => {
    const climate = getCellMicroclimate(row, col);
    let matchScore = 100;
    let status: 'perfect' | 'good' | 'warning' | 'poor' = 'perfect';
    let message = 'Optimal microclimate & lighting balance.';

    const need = plant.lightNeed;
    const actual = climate.category;

    if (need === 'full-sun') {
      if (actual === 'full-sun') {
        matchScore = 98;
        status = 'perfect';
        message = 'Direct sunlight promotes vibrant blooms and lush foliage.';
      } else if (actual === 'bright-indirect') {
        matchScore = 80;
        status = 'good';
        message = 'Adequate light, but growth rate might be slightly slower.';
      } else {
        matchScore = 45;
        status = 'warning';
        message = 'Insufficient light: risk of leggy stems and poor foliage.';
      }
    } else if (need === 'bright-indirect') {
      if (actual === 'bright-indirect') {
        matchScore = 100;
        status = 'perfect';
        message = 'Ideal bright filtered luminance without leaf scorch risk.';
      } else if (actual === 'full-sun') {
        matchScore = 55;
        status = 'warning';
        message = 'Intense direct sun may cause leaf burn or chlorosis.';
      } else if (actual === 'medium-light') {
        matchScore = 85;
        status = 'good';
        message = 'Sufficient ambient light for steady, healthy growth.';
      } else {
        matchScore = 50;
        status = 'poor';
        message = 'Too dim: consider moving closer to the window or adding a grow lamp.';
      }
    } else if (need === 'low-light') {
      if (actual === 'low-light' || actual === 'medium-light') {
        matchScore = 96;
        status = 'perfect';
        message = 'Thrives in gentle, low-intensity shade.';
      } else if (actual === 'full-sun') {
        matchScore = 30;
        status = 'poor';
        message = 'Severe sunburn risk! Low-light species prefer shielded spots.';
      } else {
        matchScore = 75;
        status = 'good';
        message = 'Comfortable light levels.';
      }
    }

    return { matchScore, status, message, climate };
  };

  // Overall Room Health & Spatial Score
  const roomMetrics = useMemo(() => {
    if (placedPlants.length === 0) {
      return { overallScore: 100, optimalCount: 0, warningCount: 0, densityPct: 0 };
    }

    let totalScore = 0;
    let optimalCount = 0;
    let warningCount = 0;

    placedPlants.forEach(p => {
      const evalResult = evaluateCompatibility(p, p.row, p.col);
      totalScore += evalResult.matchScore;
      if (evalResult.status === 'perfect' || evalResult.status === 'good') optimalCount++;
      else warningCount++;
    });

    const overallScore = Math.round(totalScore / placedPlants.length);
    const totalCells = currentPreset.dimensions.rows * currentPreset.dimensions.cols;
    const densityPct = Math.round((placedPlants.length / totalCells) * 100);

    return { overallScore, optimalCount, warningCount, densityPct };
  }, [placedPlants, currentPreset, timeOfDay, growLights, humidifiers]);

  // Unplaced plants in the dock tray
  const unplacedPlants = useMemo(() => {
    const placedIds = new Set(placedPlants.map(p => p.id));
    return availablePlants.filter(p => !placedIds.has(p.id));
  }, [availablePlants, placedPlants]);

  // Cell Click / Placement Handler
  const handleCellClick = (row: number, col: number) => {
    if (toolMode === 'growlight') {
      const existing = growLights.find(g => g.row === row && g.col === col);
      let updated: typeof growLights;
      if (existing) {
        updated = growLights.filter(g => g.id !== existing.id);
      } else {
        updated = [...growLights, { row, col, id: `gl-${Date.now()}` }];
      }
      setGrowLights(updated);
      saveCurrentLayout(placedPlants, updated, humidifiers);
      return;
    }

    if (toolMode === 'humidifier') {
      const existing = humidifiers.find(h => h.row === row && h.col === col);
      let updated: typeof humidifiers;
      if (existing) {
        updated = humidifiers.filter(h => h.id !== existing.id);
      } else {
        updated = [...humidifiers, { row, col, id: `hum-${Date.now()}` }];
      }
      setHumidifiers(updated);
      saveCurrentLayout(placedPlants, growLights, updated);
      return;
    }

    // Plant Tool Mode
    const existingPlant = placedPlants.find(p => p.row === row && p.col === col);

    if (existingPlant) {
      // Open inspection modal / popover
      setInspectingPlant(existingPlant);
      return;
    }

    // If an unplaced plant is selected, place it here!
    if (selectedPlantIdForPlacement) {
      const plantObj = availablePlants.find(p => p.id === selectedPlantIdForPlacement);
      if (plantObj) {
        const newPlaced: PlacedPlant = {
          ...plantObj,
          row,
          col,
          placedAt: Date.now()
        };
        const updated = [...placedPlants.filter(p => p.id !== plantObj.id), newPlaced];
        setPlacedPlants(updated);
        setSelectedPlantIdForPlacement(null);
        saveCurrentLayout(updated, growLights, humidifiers);
      }
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (plantId: string) => {
    setDraggedPlantId(plantId);
  };

  const handleDragOverCell = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverCell({ row, col });
  };

  const handleDragLeaveCell = () => {
    setDragOverCell(null);
  };

  const handleDropOnCell = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverCell(null);

    if (!draggedPlantId) return;

    const plantObj = availablePlants.find(p => p.id === draggedPlantId);
    if (!plantObj) return;

    // Check if cell is occupied
    const filtered = placedPlants.filter(p => p.id !== plantObj.id && !(p.row === row && p.col === col));
    const newPlaced: PlacedPlant = {
      ...plantObj,
      row,
      col,
      placedAt: Date.now()
    };

    const updated = [...filtered, newPlaced];
    setPlacedPlants(updated);
    setDraggedPlantId(null);
    saveCurrentLayout(updated, growLights, humidifiers);
  };

  const handleRemovePlantFromGrid = (plantId: string) => {
    const updated = placedPlants.filter(p => p.id !== plantId);
    setPlacedPlants(updated);
    if (inspectingPlant?.id === plantId) setInspectingPlant(null);
    saveCurrentLayout(updated, growLights, humidifiers);
  };

  const handleClearGrid = () => {
    setPlacedPlants([]);
    setGrowLights([]);
    setHumidifiers([]);
    saveCurrentLayout([], [], []);
  };

  const handleAutoOptimize = () => {
    // AI Placement algorithm: Matches each plant to its ideal cell light level
    const { rows, cols } = currentPreset.dimensions;
    const allCells: { row: number; col: number; category: string }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        allCells.push({ row: r, col: c, category: getCellMicroclimate(r, c).category });
      }
    }

    const newPlaced: PlacedPlant[] = [];
    const usedCells = new Set<string>();

    availablePlants.forEach(plant => {
      // Find best unmatched cell
      let bestCell = allCells.find(cell => 
        !usedCells.has(`${cell.row}-${cell.col}`) && cell.category === plant.lightNeed
      );

      // Fallback to any open cell
      if (!bestCell) {
        bestCell = allCells.find(cell => !usedCells.has(`${cell.row}-${cell.col}`));
      }

      if (bestCell) {
        usedCells.add(`${bestCell.row}-${bestCell.col}`);
        newPlaced.push({
          ...plant,
          row: bestCell.row,
          col: bestCell.col,
          placedAt: Date.now()
        });
      }
    });

    setPlacedPlants(newPlaced);
    saveCurrentLayout(newPlaced, growLights, humidifiers);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Controls Bar */}
      <div className="bg-[#0b1712] border border-emerald-900/40 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Room Preset Selector */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Physical Room & Garden Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Drag and place plants onto the spatial layout to calculate microclimate luminance and growth synergy.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] font-bold'
                    : 'bg-[#102219] hover:bg-[#152e22] text-slate-300 border border-emerald-900/30'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name.split('(')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Room Info Strip & Score Badges */}
        <div className="mt-4 pt-4 border-t border-emerald-900/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#070f0b]/80 border border-emerald-900/30 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Room Compatibility</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-base font-black ${
                roomMetrics.overallScore >= 85 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {roomMetrics.overallScore}%
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold">
                {roomMetrics.overallScore >= 85 ? 'Optimal' : 'Needs Adjustment'}
              </span>
            </div>
          </div>

          <div className="bg-[#070f0b]/80 border border-emerald-900/30 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Placed Plants</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black text-white">{placedPlants.length}</span>
              <span className="text-[10px] text-slate-400">/ {currentPreset.dimensions.rows * currentPreset.dimensions.cols} slots</span>
            </div>
          </div>

          <div className="bg-[#070f0b]/80 border border-emerald-900/30 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Solar Orientation</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-slate-200 font-bold">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentPreset.defaultOrientation} Exposure</span>
            </div>
          </div>

          <div className="bg-[#070f0b]/80 border border-emerald-900/30 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Base Microclimate</span>
            <div className="flex items-center gap-2 mt-0.5 text-slate-300">
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-emerald-400" />{currentPreset.baseTemp}</span>
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-cyan-400" />{currentPreset.baseHumidity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT / CENTER: The Interactive Spatial Grid Canvas */}
        <div className="lg:col-span-3 space-y-4">
          {/* Spatial Grid Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1e15] border border-emerald-900/40 rounded-xl px-4 py-2.5 text-xs">
            {/* Time of Day Sun Sim Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Sun Position:
              </span>
              <div className="inline-flex rounded-lg bg-[#070f0b] p-0.5 border border-emerald-900/40">
                {(['morning', 'noon', 'afternoon', 'night'] as const).map(time => (
                  <button
                    key={time}
                    onClick={() => setTimeOfDay(time)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      timeOfDay === time 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* View Layer Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showHeatmap 
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' 
                    : 'bg-[#070f0b] text-slate-400 border-emerald-900/30'
                }`}
                title="Toggle Sunlight Heatmap Overlay"
              >
                <Layers className="w-3 h-3" />
                <span>Light Map</span>
              </button>

              <button
                onClick={handleAutoOptimize}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="AI Automatically positions each plant to its ideal light spot"
              >
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Auto-Arrange</span>
              </button>

              <button
                onClick={handleClearGrid}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Clear all placed items"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SPATIAL ROOM GRID CANVAS CONTAINER */}
          <div className="relative bg-[#08120d] border-2 border-emerald-900/40 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden min-h-[460px] flex flex-col justify-between select-none">
            {/* Top Room Edge Marker (e.g. South Window / Patio Boundary) */}
            {currentPreset.windowPosition === 'top' && (
              <div className="mb-4 w-full py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/25 to-amber-500/10 border border-amber-400/30 flex items-center justify-between text-[11px] font-mono text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
                  <span className="font-bold">☀️ PRIMARY SOUTH-FACING WINDOW (800+ FC)</span>
                </div>
                <span className="text-[10px] text-amber-300/70 uppercase">Direct Light Zone</span>
              </div>
            )}

            {currentPreset.windowPosition === 'all' && (
              <div className="mb-4 w-full py-1.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/15 via-emerald-400/20 to-cyan-500/15 border border-emerald-400/30 flex items-center justify-between text-[11px] font-mono text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">🌿 360° GREENHOUSE SOLAR GLASS APERTURE</span>
                </div>
                <span className="text-[10px] text-emerald-300/80">Full Immersion</span>
              </div>
            )}

            {/* Grid Surface Matrix */}
            <div 
              className="grid gap-3 w-full my-auto transition-all"
              style={{
                gridTemplateColumns: `repeat(${currentPreset.dimensions.cols}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: currentPreset.dimensions.rows }).map((_, r) => (
                <React.Fragment key={`row-${r}`}>
                  {Array.from({ length: currentPreset.dimensions.cols }).map((_, c) => {
                    const cellClimate = getCellMicroclimate(r, c);
                    const placedPlant = placedPlants.find(p => p.row === r && p.col === c);
                    const hasGrowLight = growLights.some(g => g.row === r && g.col === c);
                    const hasHumidifier = humidifiers.some(h => h.row === r && h.col === c);
                    const isDragTarget = dragOverCell?.row === r && dragOverCell?.col === c;

                    // Compute compatibility if plant is placed
                    const comp = placedPlant ? evaluateCompatibility(placedPlant, r, c) : null;

                    // Determine background shade based on sunlight heatmap
                    let heatmapBg = 'bg-[#0d1e15]/60';
                    let heatmapBorder = 'border-emerald-900/30';

                    if (showHeatmap) {
                      if (cellClimate.category === 'full-sun') {
                        heatmapBg = 'bg-amber-950/25 hover:bg-amber-950/40';
                        heatmapBorder = 'border-amber-500/30 hover:border-amber-400/60';
                      } else if (cellClimate.category === 'bright-indirect') {
                        heatmapBg = 'bg-emerald-950/30 hover:bg-emerald-950/50';
                        heatmapBorder = 'border-emerald-500/30 hover:border-emerald-400/60';
                      } else if (cellClimate.category === 'medium-light') {
                        heatmapBg = 'bg-teal-950/20 hover:bg-teal-950/35';
                        heatmapBorder = 'border-teal-700/25 hover:border-teal-500/50';
                      } else {
                        heatmapBg = 'bg-slate-900/40 hover:bg-slate-900/60';
                        heatmapBorder = 'border-slate-800/40 hover:border-slate-700/60';
                      }
                    }

                    if (isDragTarget) {
                      heatmapBg = 'bg-emerald-500/30 scale-[1.03] shadow-[0_0_20px_rgba(16,185,129,0.4)]';
                      heatmapBorder = 'border-emerald-400';
                    }

                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        onDragOver={(e) => handleDragOverCell(e, r, c)}
                        onDragLeave={handleDragLeaveCell}
                        onDrop={(e) => handleDropOnCell(e, r, c)}
                        onClick={() => handleCellClick(r, c)}
                        className={`aspect-square rounded-xl border p-1.5 relative flex flex-col justify-between transition-all cursor-pointer group ${heatmapBg} ${heatmapBorder}`}
                      >
                        {/* Cell Light Level Tag / Heatmap Indicator */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pointer-events-none">
                          <span className="opacity-40">{r},{c}</span>
                          {showHeatmap && (
                            <span className={`px-1 rounded ${
                              cellClimate.category === 'full-sun' ? 'text-amber-300' :
                              cellClimate.category === 'bright-indirect' ? 'text-emerald-300' :
                              cellClimate.category === 'medium-light' ? 'text-teal-300' : 'text-slate-400'
                            }`}>
                              {cellClimate.fcValue} fc
                            </span>
                          )}
                        </div>

                        {/* PLACED PLANT CARD TOKEN */}
                        {placedPlant ? (
                          <motion.div
                            layoutId={`plant-token-${placedPlant.id}`}
                            draggable
                            onDragStart={() => handleDragStart(placedPlant.id)}
                            className="relative w-full flex-1 flex flex-col items-center justify-center p-1 rounded-lg bg-black/50 border border-white/10 hover:border-emerald-400 shadow-md group-hover:scale-105 transition-all"
                          >
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-emerald-400 shadow-sm shrink-0">
                              <img 
                                src={placedPlant.imageUrl} 
                                alt={placedPlant.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <p className="text-[10px] md:text-[11px] font-bold text-white truncate max-w-full text-center mt-1 leading-tight">
                              {placedPlant.nickname || placedPlant.name.split(' ')[0]}
                            </p>

                            {/* Compatibility Dot Badge */}
                            {comp && (
                              <div 
                                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-md ${
                                  comp.status === 'perfect' 
                                    ? 'bg-emerald-500 text-slate-950' 
                                    : comp.status === 'good'
                                    ? 'bg-teal-500 text-slate-950'
                                    : 'bg-amber-500 text-slate-950 animate-pulse'
                                }`}
                                title={comp.message}
                              >
                                {comp.status === 'perfect' ? '✓' : '!'}
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          /* EMPTY CELL INTERACTION HINT */
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 group-hover:text-emerald-400 transition-colors">
                            {hasGrowLight && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>Lamp</span>
                              </div>
                            )}
                            {hasHumidifier && (
                              <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-bold">
                                <Droplets className="w-3.5 h-3.5" />
                                <span>Mist</span>
                              </div>
                            )}
                            {!hasGrowLight && !hasHumidifier && (
                              <Plus className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                            )}
                          </div>
                        )}

                        {/* Hover Quick Action to Clear */}
                        {placedPlant && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlantFromGrid(placedPlant.id);
                            }}
                            className="absolute -bottom-1 -right-1 p-1 bg-red-950 text-red-300 rounded-full border border-red-500/40 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer z-10"
                            title="Remove from grid"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Bottom Room Boundary Marker */}
            <div className="mt-4 pt-2 border-t border-emerald-900/20 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Floor Dimension: {currentPreset.dimensions.cols * 3}ft × {currentPreset.dimensions.rows * 3}ft Spatial Envelope
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-amber-300">● Full Sun</span>
                <span className="flex items-center gap-1 text-emerald-300">● Bright Indirect</span>
                <span className="flex items-center gap-1 text-slate-400">● Low Light</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Plant Dock Tray & Microclimate Toolset */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Plant Dock Card */}
          <div className="bg-[#0b1712] border border-emerald-900/40 rounded-2xl p-4 shadow-xl space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plants Tray</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                  {unplacedPlants.length} available
                </span>
              </h4>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag any card onto a grid tile, or click a card then tap an empty tile.
            </p>

            {/* Available Plants List */}
            <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 scrollbar-none flex-1">
              {availablePlants.map((plant) => {
                const isPlaced = placedPlants.some(p => p.id === plant.id);
                const isSelected = selectedPlantIdForPlacement === plant.id;

                return (
                  <motion.div
                    key={plant.id}
                    draggable={!isPlaced}
                    onDragStart={() => handleDragStart(plant.id)}
                    onClick={() => {
                      if (isPlaced) {
                        const found = placedPlants.find(p => p.id === plant.id);
                        if (found) setInspectingPlant(found);
                      } else {
                        setSelectedPlantIdForPlacement(isSelected ? null : plant.id);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : isPlaced
                        ? 'bg-[#060e0a]/60 border-emerald-900/20 opacity-60'
                        : 'bg-[#0d1e15] hover:bg-[#12291d] border-emerald-900/40 text-white'
                    }`}
                  >
                    <img 
                      src={plant.imageUrl} 
                      alt={plant.name} 
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-500/30 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{plant.nickname || plant.name}</p>
                      <p className="text-[10px] text-slate-400 truncate italic">{plant.scientificName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          plant.lightNeed === 'full-sun' ? 'bg-amber-500/20 text-amber-300' :
                          plant.lightNeed === 'bright-indirect' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-slate-700/40 text-slate-300'
                        }`}>
                          {plant.lightNeed.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {isPlaced && (
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800/40">
                        Placed
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Environmental Add-on Tools (Grow Lamps / Humidifiers) */}
          <div className="bg-[#0b1712] border border-emerald-900/40 rounded-2xl p-4 shadow-xl space-y-2">
            <h5 className="text-[11px] font-bold text-slate-300 uppercase font-mono">Microclimate Tools</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setToolMode(toolMode === 'growlight' ? 'plant' : 'growlight')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  toolMode === 'growlight'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-[#0d1e15] border-emerald-900/30 text-slate-300 hover:bg-[#12291d]'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Grow Lamp</span>
              </button>

              <button
                onClick={() => setToolMode(toolMode === 'humidifier' ? 'plant' : 'humidifier')}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  toolMode === 'humidifier'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0d1e15] border-emerald-900/30 text-slate-300 hover:bg-[#12291d]'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Humidifier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PLANT INSPECTION MODAL / OVERLAY */}
      <AnimatePresence>
        {inspectingPlant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setInspectingPlant(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b1712] border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-start gap-4">
                <img 
                  src={inspectingPlant.imageUrl} 
                  alt={inspectingPlant.name} 
                  className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500/40 shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{inspectingPlant.nickname || inspectingPlant.name}</h3>
                  <p className="text-xs text-slate-400 italic">{inspectingPlant.scientificName}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      Grid Spot: ({inspectingPlant.row}, {inspectingPlant.col})
                    </span>
                    <span className="text-xs text-slate-400">
                      Health: {inspectingPlant.healthScore || 90}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Compatibility Insight */}
              {(() => {
                const comp = evaluateCompatibility(inspectingPlant, inspectingPlant.row, inspectingPlant.col);
                return (
                  <div className="p-3 rounded-xl bg-[#08120d] border border-emerald-900/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Botanical Synergy Score</span>
                      <span className={`font-black ${
                        comp.status === 'perfect' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {comp.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {comp.message}
                    </p>
                    <div className="pt-1.5 border-t border-emerald-900/30 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Light: {comp.climate.fcValue} Foot-Candles</span>
                      <span>Category: {comp.climate.category.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Actions: Water, View Details, Remove from Spot */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (onWaterPlant) onWaterPlant(inspectingPlant.id);
                    setInspectingPlant(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Water Plant</span>
                </button>

                <button
                  onClick={() => handleRemovePlantFromGrid(inspectingPlant.id)}
                  className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unplace</span>
                </button>

                <button
                  onClick={() => setInspectingPlant(null)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Save Toast */}
      <AnimatePresence>
        {layoutSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 shadow-2xl flex items-center gap-2 text-emerald-200 text-xs backdrop-blur-md"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Room & Garden layout saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
