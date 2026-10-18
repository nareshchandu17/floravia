import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  FlaskConical, 
  Sprout, 
  Droplets, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Scale, 
  Sun, 
  RotateCcw, 
  Leaf, 
  ArrowRight,
  Sliders,
  Flame,
  Award
} from 'lucide-react';
import { DashboardPlant } from '../types/botanical';

export type GrowthStageId = 'seedling' | 'vegetative' | 'budding' | 'fruiting' | 'mature' | 'dormant';
export type FormulationType = 'liquid' | 'powder' | 'organic_fish_kelp' | 'slow_release_granules' | 'compost_tea';
export type PotSizeCategory = 'small' | 'medium' | 'large' | 'xlarge' | 'garden_bed';

export interface PlantSpeciesRule {
  id: string;
  name: string;
  scientificName: string;
  category: 'Tropical Foliage' | 'Succulents & Cacti' | 'Flowering & Roses' | 'Orchids' | 'Vegetables & Crops' | 'Herbs' | 'Trees & Citrus' | 'Carnivorous';
  baseNPK: string;
  baseIntervalDays: number;
  feedTolerance: 'low' | 'moderate' | 'high' | 'zero';
  specialNotes: string;
  foliarSafe: boolean;
  defaultPotSize: PotSizeCategory;
}

export const SPECIES_CATALOG: PlantSpeciesRule[] = [
  {
    id: 'monstera',
    name: 'Monstera Deliciosa / Adansonii',
    scientificName: 'Monstera deliciosa',
    category: 'Tropical Foliage',
    baseNPK: '20-20-20 or 3-1-2',
    baseIntervalDays: 21,
    feedTolerance: 'moderate',
    specialNotes: 'Thrives with balanced nitrogen during spring and summer. Aerial roots absorb diluted kelp mist.',
    foliarSafe: true,
    defaultPotSize: 'large'
  },
  {
    id: 'ficus_lyrata',
    name: 'Fiddle Leaf Fig / Ficus Trees',
    scientificName: 'Ficus lyrata',
    category: 'Tropical Foliage',
    baseNPK: '3-1-2 (High Nitrogen)',
    baseIntervalDays: 28,
    feedTolerance: 'moderate',
    specialNotes: 'Requires regular nitrogen for glossy canopy spread. Flush pot with clear water quarterly.',
    foliarSafe: false,
    defaultPotSize: 'large'
  },
  {
    id: 'pothos',
    name: 'Pothos / Devil\'s Ivy',
    scientificName: 'Epipremnum aureum',
    category: 'Tropical Foliage',
    baseNPK: '20-20-20',
    baseIntervalDays: 28,
    feedTolerance: 'moderate',
    specialNotes: 'Low-maintenance feeder. Reduce dosage if variegation fades or leaves develop brown tips.',
    foliarSafe: true,
    defaultPotSize: 'medium'
  },
  {
    id: 'snake_plant',
    name: 'Snake Plant / Sansevieria',
    scientificName: 'Dracaena trifasciata',
    category: 'Succulents & Cacti',
    baseNPK: '10-10-10 or 8-8-8',
    baseIntervalDays: 60,
    feedTolerance: 'low',
    specialNotes: 'Extremely prone to root burn. Feed maximum 2–3 times per year during warm seasons only.',
    foliarSafe: false,
    defaultPotSize: 'medium'
  },
  {
    id: 'peace_lily',
    name: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    category: 'Tropical Foliage',
    baseNPK: '20-20-20 or 15-30-15',
    baseIntervalDays: 35,
    feedTolerance: 'low',
    specialNotes: 'Sensitive to chemical salts. Use organic amino feeds and dilute to 1/4 strength to prevent black leaf tips.',
    foliarSafe: false,
    defaultPotSize: 'medium'
  },
  {
    id: 'orchid_phalaenopsis',
    name: 'Moth Orchid (Phalaenopsis)',
    scientificName: 'Phalaenopsis amabilis',
    category: 'Orchids',
    baseNPK: '20-20-20 (Urea-Free)',
    baseIntervalDays: 14,
    feedTolerance: 'low',
    specialNotes: 'Practice "weakly, weekly" routine (1/4 strength). Never fertilize dry bark; soak root media in water first.',
    foliarSafe: false,
    defaultPotSize: 'small'
  },
  {
    id: 'succulents_cacti',
    name: 'Succulents & Desert Cacti',
    scientificName: 'Crassulaceae / Cactaceae',
    category: 'Succulents & Cacti',
    baseNPK: '2-7-7 or 5-10-10',
    baseIntervalDays: 60,
    feedTolerance: 'low',
    specialNotes: 'Low nitrogen prevents weak elongated growth. Feed once in spring and once in mid-summer only.',
    foliarSafe: false,
    defaultPotSize: 'small'
  },
  {
    id: 'calathea_maranta',
    name: 'Calathea / Prayer Plant / Maranta',
    scientificName: 'Goeppertia / Maranta',
    category: 'Tropical Foliage',
    baseNPK: '10-10-10 (Organic)',
    baseIntervalDays: 30,
    feedTolerance: 'low',
    specialNotes: 'Very sensitive to chlorine and synthetic salt buildup. Dilute to 25% and use distilled or rainwater.',
    foliarSafe: false,
    defaultPotSize: 'medium'
  },
  {
    id: 'rose_bush',
    name: 'Rose & Flowering Shrub',
    scientificName: 'Rosa spp.',
    category: 'Flowering & Roses',
    baseNPK: '10-15-10 or 12-4-8',
    baseIntervalDays: 14,
    feedTolerance: 'high',
    specialNotes: 'Heavy feeders. High phosphorus promotes continuous bloom flushes. Cease 6 weeks before first frost.',
    foliarSafe: false,
    defaultPotSize: 'garden_bed'
  },
  {
    id: 'tomato_pepper',
    name: 'Tomato / Sweet & Chili Peppers',
    scientificName: 'Solanum lycopersicum / Capsicum',
    category: 'Vegetables & Crops',
    baseNPK: '4-18-38 or 5-10-10',
    baseIntervalDays: 10,
    feedTolerance: 'high',
    specialNotes: 'Crucial calcium and potassium demand during fruit set to prevent blossom end rot.',
    foliarSafe: true,
    defaultPotSize: 'large'
  },
  {
    id: 'culinary_herbs',
    name: 'Culinary Herbs (Basil, Mint, Thyme)',
    scientificName: 'Ocimum basilicum / Mentha',
    category: 'Herbs',
    baseNPK: '3-1-2 or Fish Emulsion 5-1-1',
    baseIntervalDays: 14,
    feedTolerance: 'moderate',
    specialNotes: 'Gentle feeding produces flavorful aromatic oils without forcing bitter leggy stalks.',
    foliarSafe: true,
    defaultPotSize: 'small'
  },
  {
    id: 'citrus_lemon',
    name: 'Citrus (Meyer Lemon, Lime, Orange)',
    scientificName: 'Citrus × meyeri',
    category: 'Trees & Citrus',
    baseNPK: '6-3-3 (with Iron & Zinc)',
    baseIntervalDays: 21,
    feedTolerance: 'high',
    specialNotes: 'Acid-loving. Acidic micronutrients (chelated iron, zinc, magnesium) prevent leaf yellowing.',
    foliarSafe: true,
    defaultPotSize: 'xlarge'
  },
  {
    id: 'carnivorous_venus',
    name: 'Carnivorous (Venus Flytrap, Pitcher)',
    scientificName: 'Dionaea muscipula / Nepenthes',
    category: 'Carnivorous',
    baseNPK: '0-0-0 (DO NOT FERTILIZE)',
    baseIntervalDays: 999,
    feedTolerance: 'zero',
    specialNotes: 'CRITICAL: Standard fertilizers will burn and kill carnivorous roots immediately. Nutrients come only from insects.',
    foliarSafe: false,
    defaultPotSize: 'small'
  },
  {
    id: 'general_houseplant',
    name: 'General Houseplant (Standard)',
    scientificName: 'Plantae',
    category: 'Tropical Foliage',
    baseNPK: '10-10-10 or 20-20-20',
    baseIntervalDays: 28,
    feedTolerance: 'moderate',
    specialNotes: 'Safe all-around feeding formula. Always apply to pre-moistened potting soil.',
    foliarSafe: true,
    defaultPotSize: 'medium'
  }
];

export const GROWTH_STAGES: {
  id: GrowthStageId;
  label: string;
  subtitle: string;
  dosageMultiplier: number;
  intervalMultiplier: number;
  npkRecommendation: string;
  focus: string;
  description: string;
  icon: any;
  colorClass: string;
}[] = [
  {
    id: 'seedling',
    label: 'Seedling / New Rooted Cut',
    subtitle: '0–4 weeks old',
    dosageMultiplier: 0.25,
    intervalMultiplier: 1.5,
    npkRecommendation: '1-1-1 or ultra-diluted Seaweed',
    focus: 'Root hair establishment & safe acclimation',
    description: 'Immature root systems are extremely vulnerable to root damage caused by a fertilizer solution that is too strong. Keep concentration below 25% label rate.',
    icon: Sprout,
    colorClass: 'emerald'
  },
  {
    id: 'vegetative',
    label: 'Active Vegetative Growth',
    subtitle: 'Leaf & stem expansion',
    dosageMultiplier: 1.0,
    intervalMultiplier: 1.0,
    npkRecommendation: '3-1-2 or balanced 20-20-20',
    focus: 'High Nitrogen (N) for lush chlorophyll synthesis',
    description: 'Peak metabolic demand. Plants consume nitrogen rapidly to build sturdy cell walls, deep green foliage, and new shoots.',
    icon: Leaf,
    colorClass: 'emerald'
  },
  {
    id: 'budding',
    label: 'Budding & Flower Spike',
    subtitle: 'Flower buds forming',
    dosageMultiplier: 1.0,
    intervalMultiplier: 0.8,
    npkRecommendation: '10-30-20 or 10-15-10',
    focus: 'High Phosphorus (P) for flower development',
    description: 'Phosphorus directs enzymatic energy into floral bud differentiation, rich petal pigmentation, and extended bloom duration.',
    icon: Sparkles,
    colorClass: 'amber'
  },
  {
    id: 'fruiting',
    label: 'Fruiting & Ripening',
    subtitle: 'Fruit swelling & maturation',
    dosageMultiplier: 1.1,
    intervalMultiplier: 0.8,
    npkRecommendation: '5-10-15 + Calcium (Ca)',
    focus: 'High Potassium (K) & Calcium for fruit density',
    description: 'Potassium governs stomatal conductance and sugar transport into ripening fruit while calcium prevents blossom-end rot.',
    icon: Award,
    colorClass: 'orange'
  },
  {
    id: 'mature',
    label: 'Mature Maintenance',
    subtitle: 'Stable adult size',
    dosageMultiplier: 0.75,
    intervalMultiplier: 1.2,
    npkRecommendation: 'Balanced 10-10-10 or organic compost tea',
    focus: 'Sustained vitality & mineral balance',
    description: 'Steady state care. Moderate feeding prevents excessive leggy growth while keeping established foliage dense and vibrant.',
    icon: Scale,
    colorClass: 'teal'
  },
  {
    id: 'dormant',
    label: 'Dormancy / Winter Rest',
    subtitle: 'Low light / cool rest',
    dosageMultiplier: 0.0,
    intervalMultiplier: 3.0,
    npkRecommendation: 'None or 0.1x Kelp Tonic',
    focus: 'Root protection & zero salt accumulation',
    description: 'Plant metabolism slows drastically in low-light winter. Unused fertilizer salts crystallize in soil, killing fine feeder roots.',
    icon: AlertTriangle,
    colorClass: 'slate'
  }
];

interface FertilizerCalculatorProps {
  gardenPlants?: DashboardPlant[];
  onApplySchedule?: (plantName: string, intervalDays: number, dosageText: string) => void;
  onNavigateToCalendar?: () => void;
}

export const FertilizerCalculator: React.FC<FertilizerCalculatorProps> = ({
  gardenPlants = [],
  onApplySchedule,
  onNavigateToCalendar
}) => {
  // Calculator States
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('monstera');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [growthStage, setGrowthStage] = useState<GrowthStageId>('vegetative');
  const [formulation, setFormulation] = useState<FormulationType>('liquid');
  const [potSize, setPotSize] = useState<PotSizeCategory>('large');
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('metric');
  const [waterBatchVolume, setWaterBatchVolume] = useState<number>(2); // 2 Liters default or 0.5 Gal
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Filter species
  const currentSpecies = useMemo(() => {
    return SPECIES_CATALOG.find(s => s.id === selectedSpeciesId) || SPECIES_CATALOG[0];
  }, [selectedSpeciesId]);

  const currentStage = useMemo(() => {
    return GROWTH_STAGES.find(g => g.id === growthStage) || GROWTH_STAGES[1];
  }, [growthStage]);

  // Synchronize pot size default when species changes if user hasn't explicitly customized
  const handleSelectSpecies = (species: PlantSpeciesRule) => {
    setSelectedSpeciesId(species.id);
    setPotSize(species.defaultPotSize);
  };

  // Perform botanical dosage calculation
  const calculationResult = useMemo(() => {
    const isCarnivorous = currentSpecies.feedTolerance === 'zero';
    const isDormant = growthStage === 'dormant';

    // Base interval calculation
    let calculatedIntervalDays = Math.round(currentSpecies.baseIntervalDays * currentStage.intervalMultiplier);
    if (isCarnivorous) calculatedIntervalDays = 999;
    if (isDormant) calculatedIntervalDays = 75; // 2.5 months

    // Base strength percent (e.g. 50% strength is standard for houseplants)
    let strengthPercent = 50;
    if (currentSpecies.feedTolerance === 'low') strengthPercent = 25;
    if (currentSpecies.feedTolerance === 'high') strengthPercent = 100;
    if (isCarnivorous || isDormant) strengthPercent = 0;

    // Apply growth stage dosage multiplier
    strengthPercent = Math.round(strengthPercent * currentStage.dosageMultiplier);

    // Calculate dosage for formulation per water volume
    // Metric: ml/L or g/L; Imperial: tsp/Gal or tbsp/Gal
    let metricRatePerLiter = 2.5; // ml per liter at 100%
    let imperialRatePerGallon = 1.0; // teaspoon per gallon at 100%

    if (formulation === 'powder') {
      metricRatePerLiter = 1.5; // grams per liter at 100%
      imperialRatePerGallon = 0.5; // teaspoon powder per gallon
    } else if (formulation === 'organic_fish_kelp') {
      metricRatePerLiter = 5.0; // organic is less concentrated
      imperialRatePerGallon = 1.0; // 1 tbsp per gallon
    } else if (formulation === 'slow_release_granules') {
      metricRatePerLiter = 0; // applied directly to soil
    }

    // Adjusted dosage based on strength %
    const metricTotalAmount = Number(((metricRatePerLiter * (strengthPercent / 100)) * waterBatchVolume).toFixed(1));
    
    // Imperial conversion for water volume (if waterBatchVolume is in liters or gallons)
    const effectiveGallons = unitSystem === 'imperial' ? waterBatchVolume : waterBatchVolume * 0.264172;
    const imperialTsp = Number(((imperialRatePerGallon * (strengthPercent / 100)) * effectiveGallons).toFixed(2));

    // Formulate readable dosage string
    let dosageHeadline = '';
    let dosageSubtext = '';
    let burnRisk: 'safe' | 'caution' | 'dangerous' = 'safe';

    if (isCarnivorous) {
      dosageHeadline = '0 ml (Do Not Fertilize)';
      dosageSubtext = 'Carnivorous plants absorb nitrogen from insects. Mineral salts will destroy roots.';
      burnRisk = 'dangerous';
    } else if (isDormant) {
      dosageHeadline = 'Pause Feeding (0 ml)';
      dosageSubtext = 'Winter dormancy. Water with pure filtered water only until new spring growth emerges.';
      burnRisk = 'safe';
    } else if (formulation === 'slow_release_granules') {
      const potGramRates = {
        small: '1/2 teaspoon (approx. 2g)',
        medium: '1 teaspoon (approx. 4g)',
        large: '1 tablespoon (approx. 12g)',
        xlarge: '2 tablespoons (approx. 25g)',
        garden_bed: '1/4 cup per square foot'
      };
      dosageHeadline = potGramRates[potSize];
      dosageSubtext = `Sprinkle evenly over topsoil and work into top 1 inch. Lasts for 90–120 days.`;
      burnRisk = 'safe';
    } else {
      if (unitSystem === 'metric') {
        const unitLabel = formulation === 'powder' ? 'grams' : 'ml';
        dosageHeadline = `${metricTotalAmount} ${unitLabel} in ${waterBatchVolume}L water`;
        dosageSubtext = `Approx. ${(metricTotalAmount / waterBatchVolume).toFixed(1)} ${unitLabel} per 1 Liter of water (${strengthPercent}% strength)`;
      } else {
        const tspText = imperialTsp < 0.25 ? '1/8 tsp' : imperialTsp <= 0.35 ? '1/4 tsp' : imperialTsp <= 0.6 ? '1/2 tsp' : `${imperialTsp} tsp`;
        dosageHeadline = `${tspText} in ${waterBatchVolume} Gallons`;
        dosageSubtext = `Diluted to ${strengthPercent}% of manufacturer label strength.`;
      }

      if (strengthPercent > 80 && currentSpecies.feedTolerance === 'low') {
        burnRisk = 'dangerous';
      } else if (strengthPercent > 60) {
        burnRisk = 'caution';
      }
    }

    // Upcoming feeding projection dates
    const today = new Date();
    const futureCycles: { cycle: number; date: string; stage: string }[] = [];
    if (!isCarnivorous && !isDormant) {
      for (let i = 1; i <= 4; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + (calculatedIntervalDays * i));
        futureCycles.push({
          cycle: i,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stage: i === 1 ? 'Next Scheduled Dose' : `Cycle #${i}`
        });
      }
    }

    // Recommended Target Electrical Conductivity (EC / PPM) estimate
    let targetEC = '0.6 – 0.9 mS/cm (300–450 PPM)';
    if (strengthPercent >= 75) targetEC = '1.2 – 1.6 mS/cm (600–800 PPM)';
    if (strengthPercent <= 25) targetEC = '0.3 – 0.5 mS/cm (150–250 PPM)';
    if (isCarnivorous) targetEC = '< 0.05 mS/cm (< 25 PPM Pure Water)';

    return {
      strengthPercent,
      intervalDays: calculatedIntervalDays,
      dosageHeadline,
      dosageSubtext,
      targetNPK: currentStage.npkRecommendation,
      burnRisk,
      futureCycles,
      targetEC,
      isCarnivorous,
      isDormant
    };
  }, [currentSpecies, currentStage, formulation, potSize, unitSystem, waterBatchVolume, growthStage]);

  // Copy full prescription to clipboard
  const handleCopyRecipe = () => {
    const text = `🌿 Floravia Botanical Fertilizer Prescription:
Plant: ${currentSpecies.name} (${currentSpecies.scientificName})
Growth Stage: ${currentStage.label}
Recommended NPK: ${calculationResult.targetNPK}
Dosage: ${calculationResult.dosageHeadline} (${calculationResult.dosageSubtext})
Frequency: Every ${calculationResult.intervalDays} days
Target EC / TDS: ${calculationResult.targetEC}
Safety Note: ${currentSpecies.specialNotes}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Filter species list by query
  const filteredSpecies = useMemo(() => {
    if (!searchQuery.trim()) return SPECIES_CATALOG;
    const q = searchQuery.toLowerCase();
    return SPECIES_CATALOG.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.scientificName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full bg-[#0b1f16] border border-emerald-500/15 rounded-3xl p-5 md:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/15 pb-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <FlaskConical className="w-3.5 h-3.5" />
            Plant Food & Nutrition Calculator
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            How Much Plant Food Should I Use?
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed font-ui">
            Find the right amount of plant food for your plant species, growth stage, and pot size so you give roots just what they need without risking fertilizer damage.
          </p>
        </div>

        {/* Quick Unit Switcher */}
        <div className="flex items-center gap-1 bg-[#071610] p-1.5 rounded-xl border border-emerald-500/20 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              setUnitSystem('metric');
              if (unitSystem === 'imperial') setWaterBatchVolume(2);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              unitSystem === 'metric' 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Metric (L / ml / g)
          </button>
          <button
            onClick={() => {
              setUnitSystem('imperial');
              if (unitSystem === 'metric') setWaterBatchVolume(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              unitSystem === 'imperial' 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Imperial (Gal / tsp / oz)
          </button>
        </div>
      </div>

      {/* Quick Select from User Garden (If Available) */}
      {gardenPlants.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              Quick-Fill from Your Garden Plants:
            </span>
            <span className="text-[10px] text-slate-400">{gardenPlants.length} plants saved</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {gardenPlants.map((plant) => {
              const matched = SPECIES_CATALOG.find(s => 
                plant.name.toLowerCase().includes(s.id) || 
                plant.scientificName.toLowerCase().includes(s.scientificName.toLowerCase()) ||
                plant.name.toLowerCase().includes(s.name.toLowerCase())
              ) || SPECIES_CATALOG[0];

              return (
                <button
                  key={plant.id}
                  onClick={() => handleSelectSpecies(matched)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 transition-all cursor-pointer ${
                    selectedSpeciesId === matched.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-[#0b1f16] border-emerald-500/20 text-slate-300 hover:text-white hover:border-emerald-500/40'
                  }`}
                >
                  <img 
                    src={plant.imageUrl} 
                    alt={plant.name} 
                    className="w-5 h-5 rounded-md object-cover border border-emerald-500/20" 
                  />
                  <span>{plant.nickname || plant.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STEP 1 & STEP 2: INPUT CONFIGURATION GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 Cols): Parameters */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Plant Species Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
                Select Plant Species / Family
              </label>
              <span className="text-[11px] text-emerald-400 font-semibold">{currentSpecies.category}</span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search species (e.g., Monstera, Ficus, Rose, Orchid, Tomato)..."
                className="w-full bg-[#071610] border border-emerald-500/20 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition-colors"
              />
            </div>

            {/* Species Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredSpecies.map((sp) => {
                const isSelected = selectedSpeciesId === sp.id;
                return (
                  <button
                    key={sp.id}
                    onClick={() => handleSelectSpecies(sp)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-[#071610] border-emerald-500/15 hover:border-emerald-500/35 hover:bg-[#0c2419]'
                    }`}
                  >
                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {sp.name}
                    </div>
                    <div className="text-[10px] text-slate-400 italic truncate">
                      {sp.scientificName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Growth Stage Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">2</span>
                Current Growth Stage
              </label>
              <span className="text-[11px] text-amber-400 font-semibold">{currentStage.subtitle}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {GROWTH_STAGES.map((st) => {
                const isSelected = growthStage === st.id;
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    onClick={() => setGrowthStage(st.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                        : 'bg-[#071610] border-emerald-500/15 hover:border-emerald-500/35 hover:bg-[#0c2419]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400">{st.subtitle}</span>
                    </div>

                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-ui leading-tight mt-0.5 line-clamp-1">
                        {st.focus}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Formulation & Pot Size Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Formulation Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">3</span>
                Fertilizer Formulation
              </label>

              <select
                value={formulation}
                onChange={(e) => setFormulation(e.target.value as FormulationType)}
                className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500/60"
              >
                <option value="liquid">Liquid Concentrate (Standard)</option>
                <option value="powder">Water-Soluble Powder (e.g. 20-20-20)</option>
                <option value="organic_fish_kelp">Organic Fish Emulsion / Kelp Meal</option>
                <option value="slow_release_granules">Slow-Release Granules (Top-dress)</option>
                <option value="compost_tea">Liquid Compost Tea / Worm Castings</option>
              </select>
            </div>

            {/* Pot Size / Growing Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">4</span>
                Pot / Root Zone Size
              </label>

              <select
                value={potSize}
                onChange={(e) => setPotSize(e.target.value as PotSizeCategory)}
                className="w-full bg-[#071610] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500/60"
              >
                <option value="small">Small Pot (3"–5" / 0.5–1L)</option>
                <option value="medium">Medium Pot (6"–8" / 2–4L)</option>
                <option value="large">Large Pot (10"–12" / 7–12L)</option>
                <option value="xlarge">Extra Large Planter (14"+ / 20L+)</option>
                <option value="garden_bed">Outdoor Raised Bed / Garden Soil</option>
              </select>
            </div>
          </div>

          {/* 4. Interactive Water Batch Volume Slider (If using liquid/soluble) */}
          {formulation !== 'slow_release_granules' && (
            <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  Watering Can / Mixing Tank Volume:
                </label>
                <span className="text-xs font-black text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {waterBatchVolume} {unitSystem === 'metric' ? 'Liters' : 'Gallons'}
                </span>
              </div>

              <input
                type="range"
                min={unitSystem === 'metric' ? 0.5 : 0.25}
                max={unitSystem === 'metric' ? 10 : 5}
                step={unitSystem === 'metric' ? 0.5 : 0.25}
                value={waterBatchVolume}
                onChange={(e) => setWaterBatchVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-black/40 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{unitSystem === 'metric' ? '0.5 L (Small Bottle)' : '0.25 Gal (1 Quart)'}</span>
                <span>{unitSystem === 'metric' ? '2.0 L (Standard Can)' : '1.0 Gal (Standard)'}</span>
                <span>{unitSystem === 'metric' ? '10.0 L (Large Reservoir)' : '5.0 Gal (Garden Pail)'}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 Cols): SCIENTIFIC CALCULATION CARD */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-gradient-to-b from-[#0c2419] to-[#071610] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            
            {/* Top Badge: Status & Safety */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" />
                Prescription Output
              </span>

              {/* Safety Level */}
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                calculationResult.burnRisk === 'safe'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : calculationResult.burnRisk === 'caution'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {calculationResult.burnRisk === 'safe' && <CheckCircle2 className="w-3 h-3" />}
                {calculationResult.burnRisk === 'caution' && <AlertTriangle className="w-3 h-3" />}
                {calculationResult.burnRisk === 'dangerous' && <Flame className="w-3 h-3" />}
                {calculationResult.burnRisk === 'safe' ? 'Safe Dilution' : calculationResult.burnRisk === 'caution' ? 'Caution: Strong' : 'High Burn Risk!'}
              </span>
            </div>

            {/* Target Plant & Stage Title */}
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {currentSpecies.name}
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                Stage: {currentStage.label} ({calculationResult.strengthPercent}% strength)
              </p>
            </div>

            {/* BIG METRIC 1: Exact Dosage Rate */}
            <div className="p-4 rounded-2xl bg-[#050e09] border border-emerald-500/25 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                Calculated Dosage
              </span>
              <div className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
                <span>{calculationResult.dosageHeadline}</span>
              </div>
              <p className="text-xs text-slate-300 font-ui leading-relaxed">
                {calculationResult.dosageSubtext}
              </p>
            </div>

            {/* BIG METRIC 2: Frequency & NPK Ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#050e09] border border-emerald-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  Frequency
                </span>
                <div className="text-base font-bold text-emerald-300">
                  {calculationResult.isCarnivorous 
                    ? 'Never' 
                    : calculationResult.isDormant 
                    ? 'Paused' 
                    : `Every ${calculationResult.intervalDays} Days`}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {calculationResult.isDormant ? 'Winter dormancy rest' : 'During active phase'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#050e09] border border-emerald-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Target NPK
                </span>
                <div className="text-base font-bold text-amber-300 truncate">
                  {calculationResult.targetNPK}
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentStage.focus}
                </span>
              </div>
            </div>

            {/* Target Electrical Conductivity / TDS */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Target EC / TDS Level:</span>
              <span className="font-mono font-bold text-emerald-300">{calculationResult.targetEC}</span>
            </div>

            {/* Botanical Pro-Tips & Species Warning */}
            <div className="p-3.5 rounded-xl bg-[#050e09] border border-emerald-500/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Species-Specific Care Guidance</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-ui">
                {currentSpecies.specialNotes}
              </p>
            </div>

            {/* Feeding Schedule Projection Timeline */}
            {!calculationResult.isCarnivorous && !calculationResult.isDormant && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  Projected 4-Cycle Feeding Calendar
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {calculationResult.futureCycles.map((c) => (
                    <div key={c.cycle} className="p-2 rounded-xl bg-[#050e09] border border-emerald-500/20">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Cycle {c.cycle}</span>
                      <span className="block text-xs font-bold text-emerald-400 mt-0.5">{c.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Copy & Sync */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleCopyRecipe}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Copied Prescription!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Care Recipe</span>
                  </>
                )}
              </button>

              {onNavigateToCalendar && (
                <button
                  onClick={onNavigateToCalendar}
                  className="py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  title="Open Care Calendar to log or view feedings"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ================= STEP-BY-STEP FEEDING PROTOCOL GUIDE ================= */}
      <div className="border-t border-emerald-500/15 pt-6 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          The Golden Rules of Plant Fertilization
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-1.5 shadow-sm">
            <span className="font-bold text-emerald-300 block">1. Pre-Moisten Soil First</span>
            <p className="text-slate-300 leading-relaxed font-ui">
              Never apply fertilizer solutions to bone-dry soil. Fertilizer salts pull water out of dry root membranes through osmosis, burning microscopic root hairs. Water thoroughly 1–2 hours before liquid feeding.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-1.5 shadow-sm">
            <span className="font-bold text-emerald-300 block">2. The "Less is More" Rule</span>
            <p className="text-slate-300 leading-relaxed font-ui">
              Under-fertilizing results in slightly slower growth, but over-fertilizing causes irreversible leaf necrosis, salt crusting, and root rot. Diluting to 25%–50% label strength is the professional botanical standard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#071610] border border-emerald-500/15 space-y-1.5 shadow-sm">
            <span className="font-bold text-emerald-300 block">3. Quarterly Leaching Flush</span>
            <p className="text-slate-300 leading-relaxed font-ui">
              Every 90 days, take potted plants to the sink and flush the root ball with 3x the container volume of clean plain water. This dissolves and removes residual mineral salts before toxicity develops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
