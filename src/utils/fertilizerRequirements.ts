export interface SpeciesFertilizerProfile {
  speciesPattern: string; // Regex or lowercase substring
  commonName: string;
  intervalDays: number;
  npkRatio: string;
  fertilizerType: string;
  dosage: string;
  dilution: string;
  applicationMethod: string;
  preferredSeason: string;
  winterCare: string;
  macronutrientFocus: 'Nitrogen (Foliage)' | 'Phosphorus (Blooms)' | 'Potassium (Roots)' | 'Balanced NPK' | 'Low-Nitrogen Mineral';
  tips: string[];
}

export const SPECIES_FERTILIZER_DATABASE: SpeciesFertilizerProfile[] = [
  {
    speciesPattern: 'rosa|rose',
    commonName: 'Rose (Rosa)',
    intervalDays: 14,
    npkRatio: '10-15-10 or 12-4-8',
    fertilizerType: 'Rose Bloom Booster & Micronutrients',
    dosage: '1 tablespoon per gallon',
    dilution: 'Half strength during active vegetative cycle; full strength at bud set',
    applicationMethod: 'Soil drench around root dripline (avoid foliar contact)',
    preferredSeason: 'Spring through Late Summer (March – August)',
    winterCare: 'Withhold all fertilizers 6 weeks prior to first autumn frost to harden canes',
    macronutrientFocus: 'Phosphorus (Blooms)',
    tips: [
      'High phosphorus stimulates abundant flowering and saturated petal pigmentation.',
      'Always water soil thoroughly 2 hours prior to liquid feeding to prevent root burn.',
      'Add chelated iron if leaves show interveinal chlorosis (yellowing with green veins).'
    ]
  },
  {
    speciesPattern: 'monstera',
    commonName: 'Monstera Deliciosa',
    intervalDays: 28,
    npkRatio: '20-20-20 or 3-1-2',
    fertilizerType: 'Balanced Tropical Foliage Elixir',
    dosage: '1/2 teaspoon per gallon of water',
    dilution: '50% recommended strength on moist potting mix',
    applicationMethod: 'Water-in drench during regular watering routine',
    preferredSeason: 'Spring & Summer (Bi-weekly to monthly during active unfurling)',
    winterCare: 'Pause or reduce to once every 60–75 days in low-light winter dormancy',
    macronutrientFocus: 'Nitrogen (Foliage)',
    tips: [
      'Balanced nitrogen accelerates fenestration sizing on maturing leaf plates.',
      'Nutrient absorption peaks in 65–85°F ambient temperatures with bright filtered sun.',
      'Misting aerial roots with 10% diluted kelp meal promotes thick adventitious anchoring.'
    ]
  },
  {
    speciesPattern: 'ficus|fig',
    commonName: 'Ficus / Fiddle Leaf Fig',
    intervalDays: 30,
    npkRatio: '3-1-2',
    fertilizerType: 'High-Nitrogen Ficus Liquid Feed',
    dosage: '1/2 teaspoon per gallon',
    dilution: 'Dilute with room temperature filtered water',
    applicationMethod: 'Pour evenly around the root perimeter until runoff begins',
    preferredSeason: 'Spring to Early Autumn',
    winterCare: 'Do not fertilize during winter dormancy to prevent salt toxicity',
    macronutrientFocus: 'Nitrogen (Foliage)',
    tips: [
      'The 3-1-2 NPK ratio matches natural ficus canopy metabolic demand.',
      'Flush pot with plain distilled water every 3 months to prevent mineral salt crystallization.'
    ]
  },
  {
    speciesPattern: 'sansevieria|dracaena trifasciata|snake plant',
    commonName: 'Snake Plant / Sansevieria',
    intervalDays: 60,
    npkRatio: '10-10-10 or 8-8-8',
    fertilizerType: 'Slow-Release Succulent Granules or Mild Liquid',
    dosage: '1/4 teaspoon per gallon',
    dilution: 'Quarter-strength dilution only',
    applicationMethod: 'Light soil application, avoiding the central crown rosette',
    preferredSeason: 'Late Spring and Mid Summer only (2 times per year)',
    winterCare: 'Strictly zero fertilization during autumn/winter',
    macronutrientFocus: 'Low-Nitrogen Mineral',
    tips: [
      'Extremely sensitive to over-fertilization; fewer nutrients are safer than excess.',
      'Avoid liquid pooling in the center leaves to eliminate soft rot risk.'
    ]
  },
  {
    speciesPattern: 'epipremnum|pothos|devil\'s ivy',
    commonName: 'Pothos (Epipremnum)',
    intervalDays: 30,
    npkRatio: '20-20-20',
    fertilizerType: 'General Houseplant Liquid Concentrate',
    dosage: '1/2 recommended dose',
    dilution: 'Half-strength monthly',
    applicationMethod: 'Sub-irrigation or surface watering',
    preferredSeason: 'Spring through September',
    winterCare: 'Feed once every 60 days if plant is actively growing under artificial grow lights',
    macronutrientFocus: 'Balanced NPK',
    tips: [
      'Maintains vibrant variegated marbling when balanced potassium is present.',
      'Pale or undersized leaves indicate nitrogen depletion in older soil.'
    ]
  },
  {
    speciesPattern: 'spathiphyllum|peace lily',
    commonName: 'Peace Lily (Spathiphyllum)',
    intervalDays: 45,
    npkRatio: '20-20-20 or 15-30-15',
    fertilizerType: 'Gentle Organic Liquid Plant Food',
    dosage: '1/4 teaspoon per gallon',
    dilution: 'Quarter-to-half strength',
    applicationMethod: 'Apply to damp soil after regular irrigation',
    preferredSeason: 'Spring and Summer bloom cycles',
    winterCare: 'Withhold fertilizer in winter; flush soil to remove brown leaf-tip salts',
    macronutrientFocus: 'Balanced NPK',
    tips: [
      'Very sensitive to synthetic fertilizer salts which cause black or brown leaf tips.',
      'Organic fish emulsion or liquid kelp provides gentle trace minerals.'
    ]
  },
  {
    speciesPattern: 'orchid|phalaenopsis',
    commonName: 'Orchid (Phalaenopsis)',
    intervalDays: 14,
    npkRatio: '20-20-20 (Urea-Free)',
    fertilizerType: 'Specialized Orchid Fertilizer',
    dosage: '1/4 strength weekly / bi-weekly',
    dilution: 'Weakly, weekly application method',
    applicationMethod: 'Flush through bark media, draining 100% of excess standing liquid',
    preferredSeason: 'Year-round during active root and leaf growth',
    winterCare: 'Switch to bloom booster (10-30-20) when flower spikes emerge in autumn',
    macronutrientFocus: 'Potassium (Roots)',
    tips: [
      'Urea-free nitrogen is required as bark media lacks soil microbes to break down urea.',
      'Never fertilize a completely dry orchid root system; wet roots green first.'
    ]
  },
  {
    speciesPattern: 'succulent|cactus|cacti|crassula|aloe|echeveria',
    commonName: 'Succulents & Cacti',
    intervalDays: 60,
    npkRatio: '2-7-7 or 5-10-10',
    fertilizerType: 'Low-Nitrogen Cactus & Succulent Nutrient Mix',
    dosage: '1/4 strength per feeding',
    dilution: 'Quarter strength in filtered water',
    applicationMethod: 'Bottom watering soak or gentle base application',
    preferredSeason: 'Spring and Early Summer (max 2–3 times/year)',
    winterCare: 'Keep completely dry and unfertilized during winter dormancy',
    macronutrientFocus: 'Low-Nitrogen Mineral',
    tips: [
      'High nitrogen causes soft, weak, elongated growth prone to splitting and rot.',
      'High potassium and calcium strengthen epidermal cell walls against pests.'
    ]
  }
];

export const DEFAULT_FERTILIZER_PROFILE: SpeciesFertilizerProfile = {
  speciesPattern: 'default',
  commonName: 'General Houseplant',
  intervalDays: 30,
  npkRatio: '10-10-10 or 20-20-20',
  fertilizerType: 'Balanced All-Purpose Liquid Houseplant Food',
  dosage: '1/2 teaspoon per gallon of water',
  dilution: '50% label strength on moist soil',
  applicationMethod: 'Water-in application during scheduled watering cycle',
  preferredSeason: 'Spring and Summer (Monthly)',
  winterCare: 'Pause or reduce frequency by half during low-light winter months',
  macronutrientFocus: 'Balanced NPK',
  tips: [
    'Always ensure soil is slightly moist before fertilizing to protect delicate root hairs.',
    'Follow a "less is more" rule: under-fertilizing is much safer than over-fertilizing.'
  ]
};

/**
 * Finds the matching species fertilizer profile based on plant name or scientific name
 */
export function getSpeciesFertilizerProfile(plantName: string, scientificName: string): SpeciesFertilizerProfile {
  const query = `${plantName} ${scientificName}`.toLowerCase();
  
  const found = SPECIES_FERTILIZER_DATABASE.find(profile => {
    const regex = new RegExp(profile.speciesPattern, 'i');
    return regex.test(query);
  });

  return found || DEFAULT_FERTILIZER_PROFILE;
}

export interface FertilizerScheduleCalculation {
  profile: SpeciesFertilizerProfile;
  lastFertilizedDate: Date;
  lastFertilizedFormatted: string;
  nextDueDate: Date;
  nextDueDateFormatted: string;
  daysRemaining: number;
  daysElapsed: number;
  progressPercent: number;
  status: 'optimal' | 'due-soon' | 'due-today' | 'overdue';
  statusLabel: string;
  statusColor: string;
}

/**
 * Calculates last fertilization date and next due date based on plant data and species requirements
 */
export function calculateFertilizerSchedule(
  plantName: string,
  scientificName: string,
  lastFertilizedRaw?: string,
  customIntervalDays?: number
): FertilizerScheduleCalculation {
  const profile = getSpeciesFertilizerProfile(plantName, scientificName);
  const effectiveInterval = customIntervalDays && customIntervalDays > 0 ? customIntervalDays : profile.intervalDays;
  
  const today = new Date();
  let lastDate = new Date();

  if (lastFertilizedRaw) {
    const rawLower = lastFertilizedRaw.toLowerCase().trim();
    if (rawLower.includes('just now') || rawLower.includes('today')) {
      lastDate = new Date();
    } else if (rawLower.includes('yesterday')) {
      lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 1);
    } else if (rawLower.includes('day') && /\d+/.test(rawLower)) {
      const match = rawLower.match(/(\d+)/);
      const daysAgo = match ? parseInt(match[1], 10) : 10;
      lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - daysAgo);
    } else if (rawLower.includes('week') && /\d+/.test(rawLower)) {
      const match = rawLower.match(/(\d+)/);
      const weeksAgo = match ? parseInt(match[1], 10) : 2;
      lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - (weeksAgo * 7));
    } else if (rawLower.includes('month') && /\d+/.test(rawLower)) {
      const match = rawLower.match(/(\d+)/);
      const monthsAgo = match ? parseInt(match[1], 10) : 1;
      lastDate = new Date();
      lastDate.setMonth(lastDate.getMonth() - monthsAgo);
    } else {
      // Try parsing date string like "2026-08-11" or "Aug 11"
      const parsed = Date.parse(lastFertilizedRaw);
      if (!isNaN(parsed)) {
        lastDate = new Date(parsed);
      } else {
        // Default fallback: 10 days ago
        lastDate = new Date();
        lastDate.setDate(lastDate.getDate() - 10);
      }
    }
  } else {
    // Default fallback: 10 days ago
    lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 10);
  }

  // Calculate Next Due Date
  const nextDueDate = new Date(lastDate);
  nextDueDate.setDate(nextDueDate.getDate() + effectiveInterval);

  // Time diff calculation
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / msPerDay));
  const diffDays = Math.ceil((nextDueDate.getTime() - today.getTime()) / msPerDay);
  const daysRemaining = diffDays;

  // Progress percentage of the feeding cycle (0% to 100%)
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / effectiveInterval) * 100)));

  // Determine status
  let status: 'optimal' | 'due-soon' | 'due-today' | 'overdue' = 'optimal';
  let statusLabel = `Due in ${daysRemaining} days`;
  let statusColor = 'text-emerald-400';

  if (daysRemaining < 0) {
    status = 'overdue';
    const overdueDays = Math.abs(daysRemaining);
    statusLabel = `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
    statusColor = 'text-rose-400';
  } else if (daysRemaining === 0) {
    status = 'due-today';
    statusLabel = 'Feeding Due Today!';
    statusColor = 'text-amber-400';
  } else if (daysRemaining <= 3) {
    status = 'due-soon';
    statusLabel = `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
    statusColor = 'text-amber-300';
  } else {
    status = 'optimal';
    statusLabel = `Due in ${daysRemaining} days`;
    statusColor = 'text-emerald-400';
  }

  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  return {
    profile: {
      ...profile,
      intervalDays: effectiveInterval
    },
    lastFertilizedDate: lastDate,
    lastFertilizedFormatted: daysElapsed === 0 ? 'Today' : daysElapsed === 1 ? 'Yesterday' : `${daysElapsed} days ago (${shortDateFormatter.format(lastDate)})`,
    nextDueDate,
    nextDueDateFormatted: dateFormatter.format(nextDueDate),
    daysRemaining,
    daysElapsed,
    progressPercent,
    status,
    statusLabel,
    statusColor
  };
}
