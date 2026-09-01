/**
 * Seasonal Gardening Advice Engine for Floravia Botanical Platform
 * Computes astronomical and meteorological seasonal windows, hardiness heuristics,
 * frost risk projections, and actionable planting/care tips based on date and geographical location.
 */

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonalTask {
  id: string;
  title: string;
  category: 'planting' | 'protection' | 'pruning' | 'soil' | 'harvesting';
  urgency: 'high' | 'medium' | 'info';
  description: string;
  applicablePlants?: string[];
  iconName: 'frost' | 'seedling' | 'sprout' | 'scissors' | 'shovel' | 'sun' | 'droplet' | 'shield' | 'thermometer';
}

export interface PlantingMatrixItem {
  name: string;
  type: 'vegetable' | 'flower' | 'herb' | 'perennial';
  action: 'Start Indoors' | 'Direct Sow' | 'Transplant' | 'Harvest' | 'Overwinter';
  bestWeeks: string;
  notes: string;
}

export interface SeasonalAdviceData {
  season: SeasonName;
  seasonDisplayName: string;
  subSeasonPhase: string; // e.g. "Late Summer Transition", "Early Spring Thaw"
  hemisphere: 'northern' | 'southern';
  monthName: string;
  monthIndex: number;
  frostRiskLevel: 'high' | 'moderate' | 'low' | 'none';
  frostRiskNote: string;
  primaryHighlights: {
    tag: string;
    title: string;
    description: string;
    urgency: 'urgent' | 'recommended' | 'planning';
  }[];
  tasks: SeasonalTask[];
  plantingMatrix: PlantingMatrixItem[];
  foliageAdvice: string;
  soilConditioningTip: string;
  climateZoneEstimate: string;
}

/**
 * Determines whether coordinates are in Northern or Southern hemisphere
 */
export function getHemisphere(latitude: number): 'northern' | 'southern' {
  return latitude < 0 ? 'southern' : 'northern';
}

/**
 * Derives the meteorological season based on month and hemisphere.
 */
export function getSeason(date: Date, hemisphere: 'northern' | 'southern' = 'northern'): SeasonName {
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 7 = Aug, 11 = Dec
  
  if (hemisphere === 'northern') {
    if (month === 2 || month === 3 || month === 4) return 'spring'; // Mar, Apr, May
    if (month === 5 || month === 6 || month === 7) return 'summer'; // Jun, Jul, Aug
    if (month === 8 || month === 9 || month === 10) return 'autumn'; // Sep, Oct, Nov
    return 'winter'; // Dec, Jan, Feb
  } else {
    // Southern hemisphere is flipped 6 months
    if (month === 2 || month === 3 || month === 4) return 'autumn';
    if (month === 5 || month === 6 || month === 7) return 'winter';
    if (month === 8 || month === 9 || month === 10) return 'spring';
    return 'summer';
  }
}

/**
 * Calculates detailed seasonal advice, frost warnings, and actionable checklist
 * based on date, coordinates, and optional live weather data.
 */
export function calculateSeasonalAdvice(
  date: Date = new Date(),
  latitude: number = 37.7749, // Default approx San Francisco
  currentTemp?: number,
  humidity?: number,
  cityName?: string
): SeasonalAdviceData {
  const hemisphere = getHemisphere(latitude);
  const month = date.getMonth();
  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month];

  const season = getSeason(date, hemisphere);

  // Sub-phase computation
  let subSeasonPhase = '';
  let seasonDisplayName = '';

  if (season === 'spring') {
    seasonDisplayName = 'Spring Awakening';
    subSeasonPhase = month % 3 === 2 ? 'Early Spring Thaw & Awakening' : month % 3 === 3 ? 'Mid-Spring Peak Growth' : 'Late Spring Canopy Expansion';
  } else if (season === 'summer') {
    seasonDisplayName = 'Summer Flourish';
    subSeasonPhase = month === 7 || (hemisphere === 'southern' && month === 1) 
      ? 'Late Summer Heat & Transition' 
      : month === 5 || (hemisphere === 'southern' && month === 11) 
      ? 'Early Summer Vigor' 
      : 'Mid-Summer Heat Management';
  } else if (season === 'autumn') {
    seasonDisplayName = 'Autumn Harvest & Rest';
    subSeasonPhase = month === 8 || (hemisphere === 'southern' && month === 2) 
      ? 'Early Autumn Prep & Transition' 
      : month === 9 || (hemisphere === 'southern' && month === 3) 
      ? 'Mid-Autumn Frost Preparation' 
      : 'Late Autumn Final Harvest & Winterizing';
  } else {
    seasonDisplayName = 'Winter Dormancy & Protection';
    subSeasonPhase = month === 11 || (hemisphere === 'southern' && month === 5) 
      ? 'Early Winter Cold Settling' 
      : month === 0 || (hemisphere === 'southern' && month === 6) 
      ? 'Deep Winter Dormancy' 
      : 'Late Winter Awakening & Planning';
  }

  // Frost risk assessment
  let frostRiskLevel: 'high' | 'moderate' | 'low' | 'none' = 'none';
  let frostRiskNote = 'No immediate frost danger in your current microclimate.';

  const isTransitionToCold = (hemisphere === 'northern' && (month >= 8 || month <= 3)) ||
                             (hemisphere === 'southern' && (month >= 2 && month <= 9));

  if (currentTemp !== undefined) {
    if (currentTemp <= 2) {
      frostRiskLevel = 'high';
      frostRiskNote = `Active frost alert (${currentTemp}°C)! Cover tender foliage, fleece citrus/succulents, and suspend wet watering.`;
    } else if (currentTemp <= 6) {
      frostRiskLevel = 'moderate';
      frostRiskNote = `Near-frost temperatures (${currentTemp}°C). Monitor overnight cold drops and prepare protective cloches.`;
    } else if (isTransitionToCold) {
      frostRiskLevel = 'low';
      frostRiskNote = 'Mild conditions today, but keep winterizing supplies and frost cloth on standby.';
    }
  } else if (season === 'autumn' || season === 'winter') {
    frostRiskLevel = season === 'winter' ? 'high' : 'moderate';
    frostRiskNote = season === 'winter' 
      ? 'Winter season active: insulate root balls, guard against freezing winds, and mulch heavily.' 
      : 'Autumn frost window approaching: complete final harvests and harvest sensitive herbs.';
  }

  // Primary Action Highlights
  const primaryHighlights: SeasonalAdviceData['primaryHighlights'] = [];

  if (season === 'spring') {
    primaryHighlights.push({
      tag: 'Seed Starting',
      title: 'Start Seedlings Indoors',
      description: 'Sow warm-season tomatoes, peppers, and tender annuals in seed trays 6-8 weeks before your last expected frost.',
      urgency: 'urgent'
    });
    primaryHighlights.push({
      tag: 'Soil Vitality',
      title: 'Aerate & Top-Dress with Compost',
      description: 'Wake up garden beds by top-dressing with 2 inches of aged organic compost as soil temperatures cross 12°C.',
      urgency: 'recommended'
    });
    primaryHighlights.push({
      tag: 'Hardening Off',
      title: 'Acclimate Young Starts',
      description: 'Gradually expose indoor seedlings to outdoor breeze and dappled sunlight for 1-2 hours daily before transplanting.',
      urgency: 'planning'
    });
  } else if (season === 'summer') {
    if (month === 7 || (hemisphere === 'southern' && month === 1)) {
      // Late Summer
      primaryHighlights.push({
        tag: 'Fall Sowing',
        title: 'Start Fall Crop Seedlings Now',
        description: 'Sow autumn brassicas (kale, broccoli), spinach, carrots, and winter radishes for a prolific secondary autumn harvest.',
        urgency: 'urgent'
      });
      primaryHighlights.push({
        tag: 'Hydration Strategy',
        title: 'Deep Early-Morning Irrigation',
        description: 'Water at root level before 9:00 AM to minimize evaporation and prevent fungal mildew on warm summer evenings.',
        urgency: 'recommended'
      });
      primaryHighlights.push({
        tag: 'Bloom Extension',
        title: 'Deadhead Spent Flowers',
        description: 'Regularly snip faded blossoms on dahlias, roses, and salvias to redirect energy into autumn flush blooms.',
        urgency: 'planning'
      });
    } else {
      primaryHighlights.push({
        tag: 'Heat Shield',
        title: 'Apply 3-Inch Root Mulch',
        description: 'Shield root zones from scorching solar heat and lock in critical soil moisture using straw, bark, or leaf mulch.',
        urgency: 'urgent'
      });
      primaryHighlights.push({
        tag: 'Pest Surveillance',
        title: 'Monitor Spider Mites & Thrips',
        description: 'Dry heat promotes rapid mite breeding. Inspect leaf undersides weekly and rinse with gentle water spray.',
        urgency: 'recommended'
      });
    }
  } else if (season === 'autumn') {
    primaryHighlights.push({
      tag: 'Frost Protection',
      title: 'Prepare for First Frost',
      description: 'Assemble horticultural fleece, burlap wraps, and frost blankets. Bring tender potted tropicals and houseplants indoors.',
      urgency: 'urgent'
    });
    primaryHighlights.push({
      tag: 'Spring Bulbs',
      title: 'Plant Spring-Flowering Bulbs',
      description: 'Bury tulip, daffodil, allium, and crocus bulbs 2-3x their height deep into well-draining autumn soil.',
      urgency: 'recommended'
    });
    primaryHighlights.push({
      tag: 'Soil Cover',
      title: 'Sow Winter Cover Crops',
      description: 'Plant crimson clover, winter rye, or hairy vetch to fix nitrogen and prevent heavy rain soil erosion.',
      urgency: 'planning'
    });
  } else {
    // Winter
    primaryHighlights.push({
      tag: 'Cold Guard',
      title: 'Protect Crown & Root Zones',
      description: 'Pile loose mulch or straw over perennial crowns. Wrap potted terra cotta planters with bubble wrap to prevent frost cracking.',
      urgency: 'urgent'
    });
    primaryHighlights.push({
      tag: 'Indoor Care',
      title: 'Scale Back Indoor Watering',
      description: 'Houseplants enter slow winter metabolism. Allow top 50% of soil to dry out between waterings and boost misting.',
      urgency: 'recommended'
    });
    primaryHighlights.push({
      tag: 'Dormant Pruning',
      title: 'Prune Deciduous Trees & Fruit Canes',
      description: 'Sterilize shears and shape fruit trees, dormant roses, and deciduous shrubs while branch architecture is fully exposed.',
      urgency: 'planning'
    });
  }

  // Actionable Seasonal Tasks Checklist
  const tasks: SeasonalTask[] = [];

  if (season === 'spring') {
    tasks.push(
      {
        id: 'task-spr-1',
        title: 'Start tomato, pepper & eggplant seeds under grow lights',
        category: 'planting',
        urgency: 'high',
        description: 'Use seed starting mix with bottom heating mat (21-24°C) for maximum germination rate.',
        iconName: 'seedling'
      },
      {
        id: 'task-spr-2',
        title: 'Prune winter-damaged twigs and deadwood',
        category: 'pruning',
        urgency: 'medium',
        description: 'Cut back dead stems cleanly above an outward-facing bud with sanitized bypass pruners.',
        iconName: 'scissors'
      },
      {
        id: 'task-spr-3',
        title: 'Direct-sow cool-season peas, radishes, and spinach',
        category: 'planting',
        urgency: 'high',
        description: 'Plant as soon as soil can be worked and is not soggy.',
        iconName: 'sprout'
      },
      {
        id: 'task-spr-4',
        title: 'Apply balanced slow-release organic fertilizer',
        category: 'soil',
        urgency: 'medium',
        description: 'Feed hungry perennials and emerging rose shoots with a balanced 4-4-4 or 5-5-5 organic blend.',
        iconName: 'shovel'
      }
    );
  } else if (season === 'summer') {
    tasks.push(
      {
        id: 'task-sum-1',
        title: 'Install 50% shade cloth over tender leafy greens',
        category: 'protection',
        urgency: 'medium',
        description: 'Prevents lettuce and coriander from premature bolting during intense midday UV spikes.',
        iconName: 'sun'
      },
      {
        id: 'task-sum-2',
        title: 'Start fall garden seedlings (Brassicas, Beets, Chard)',
        category: 'planting',
        urgency: 'high',
        description: 'Starting in late summer ensures strong root establishment before cooler autumn days.',
        iconName: 'seedling'
      },
      {
        id: 'task-sum-3',
        title: 'Inspect irrigation emitters and drip lines for clogs',
        category: 'soil',
        urgency: 'medium',
        description: 'Ensure uniform moisture delivery to prevent blossom end rot in fruiting crops.',
        iconName: 'droplet'
      },
      {
        id: 'task-sum-4',
        title: 'Prune tomato suckers to maximize airflow and sunlight',
        category: 'pruning',
        urgency: 'info',
        description: 'Pinch small lateral side-shoots to channel energy into ripening fruit clusters.',
        iconName: 'scissors'
      }
    );
  } else if (season === 'autumn') {
    tasks.push(
      {
        id: 'task-aut-1',
        title: 'Prepare frost cloth & insulate exposed container planters',
        category: 'protection',
        urgency: 'high',
        description: 'Have stakes and floating row covers ready before the first forecasted sub-zero night.',
        iconName: 'frost'
      },
      {
        id: 'task-aut-2',
        title: 'Plant garlic cloves and spring-blooming bulbs',
        category: 'planting',
        urgency: 'high',
        description: 'Plant individual garlic cloves pointed-end up 2 inches deep in fertile, composted soil.',
        iconName: 'sprout'
      },
      {
        id: 'task-aut-3',
        title: 'Collect falling leaves for carbon-rich leaf mold compost',
        category: 'soil',
        urgency: 'medium',
        description: 'Shred autumn leaves to create moisture-retentive, crumbly leaf mulch for next spring.',
        iconName: 'shovel'
      },
      {
        id: 'task-aut-4',
        title: 'Transition tender potted citrus & tropicals indoors',
        category: 'protection',
        urgency: 'high',
        description: 'Hose down leaves to remove outdoor pests before placing near a bright south-facing window.',
        iconName: 'shield'
      }
    );
  } else {
    // Winter
    tasks.push(
      {
        id: 'task-win-1',
        title: 'Check heavy snow accumulation on evergreen boughs',
        category: 'protection',
        urgency: 'high',
        description: 'Gently brush off heavy wet snow with a broom from below to prevent branch breakage.',
        iconName: 'frost'
      },
      {
        id: 'task-win-2',
        title: 'Perform structural dormant pruning on fruit trees',
        category: 'pruning',
        urgency: 'medium',
        description: 'Remove crossing branches, water sprouts, and diseased limbs while sap flow is minimal.',
        iconName: 'scissors'
      },
      {
        id: 'task-win-3',
        title: 'Clean, sharpen & oil garden tools and bypass pruners',
        category: 'soil',
        urgency: 'info',
        description: 'Scrub rust with steel wool, sharpen blades with a whetstone, and coat metal with mineral oil.',
        iconName: 'shovel'
      },
      {
        id: 'task-win-4',
        title: 'Start slow-germinating seeds (Echinacea, Rosemary, Peppers)',
        category: 'planting',
        urgency: 'medium',
        description: 'Give long-season perennials and chill-stratified herbs an early jump under lights.',
        iconName: 'seedling'
      }
    );
  }

  // Planting Matrix
  const plantingMatrix: PlantingMatrixItem[] = [];

  if (season === 'spring') {
    plantingMatrix.push(
      { name: 'Tomatoes & Sweet Peppers', type: 'vegetable', action: 'Start Indoors', bestWeeks: 'Weeks 1-4', notes: 'Maintain 22°C soil for rapid sprouting' },
      { name: 'Snap Peas & Sugar Pods', type: 'vegetable', action: 'Direct Sow', bestWeeks: 'Weeks 1-3', notes: 'Plant in cool, damp soil with trellis' },
      { name: 'Sweet Basil & Parsley', type: 'herb', action: 'Start Indoors', bestWeeks: 'Weeks 2-4', notes: 'Requires high light & warm temperatures' },
      { name: 'Zinnias & Cosmos', type: 'flower', action: 'Direct Sow', bestWeeks: 'Weeks 3-4', notes: 'Sow after soil warms past 16°C' }
    );
  } else if (season === 'summer') {
    plantingMatrix.push(
      { name: 'Kale & Collard Greens', type: 'vegetable', action: 'Start Indoors', bestWeeks: 'Weeks 1-3', notes: 'Cool in shade; perfect for autumn harvest' },
      { name: 'Carrots & Beets', type: 'vegetable', action: 'Direct Sow', bestWeeks: 'Weeks 2-4', notes: 'Keep seed bed moist with burlap until germination' },
      { name: 'Cilantro & Dill (Fall Crop)', type: 'herb', action: 'Direct Sow', bestWeeks: 'Weeks 3-4', notes: 'Will thrive in cooler autumn weather without bolting' },
      { name: 'Pansies & Violas', type: 'flower', action: 'Start Indoors', bestWeeks: 'Weeks 1-2', notes: 'Prepare sturdy transplants for cool-weather color' }
    );
  } else if (season === 'autumn') {
    plantingMatrix.push(
      { name: 'Hardneck & Softneck Garlic', type: 'vegetable', action: 'Direct Sow', bestWeeks: 'Weeks 2-4', notes: 'Plant 4-6 weeks before ground freeze' },
      { name: 'Spring Bulbs (Tulips/Narcissus)', type: 'flower', action: 'Direct Sow', bestWeeks: 'Weeks 1-4', notes: 'Chill bulbs if in warm southern zones' },
      { name: 'Winter Spinach & Mache', type: 'vegetable', action: 'Direct Sow', bestWeeks: 'Weeks 1-2', notes: 'Extremely cold-tolerant winter salad greens' },
      { name: 'Rosemary & Lavender', type: 'herb', action: 'Overwinter', bestWeeks: 'Weeks 1-3', notes: 'Mulch root zone; avoid winter wet feet' }
    );
  } else {
    // Winter
    plantingMatrix.push(
      { name: 'Onions & Leeks from Seed', type: 'vegetable', action: 'Start Indoors', bestWeeks: 'Weeks 2-4', notes: 'Needs 10-12 weeks under lights before spring transplant' },
      { name: 'Alpine Strawberries', type: 'perennial', action: 'Start Indoors', bestWeeks: 'Weeks 1-3', notes: 'Surface sow tiny seeds with high humidity' },
      { name: 'Delphinium & Lavender (Stratified)', type: 'flower', action: 'Start Indoors', bestWeeks: 'Weeks 1-2', notes: 'Cold-moist stratify in fridge for 3 weeks' },
      { name: 'Winter Microgreens (Arugula/Radish)', type: 'herb', action: 'Start Indoors', bestWeeks: 'Weekly', notes: 'Fast 10-day indoor windowsill harvest' }
    );
  }

  const foliageAdvice = season === 'autumn'
    ? 'Foliage is naturally reducing chlorophyll production. Minimize high-nitrogen feeding to prevent weak, frost-vulnerable new shoots.'
    : season === 'winter'
    ? 'Indoor air from home heating drops humidity drastically. Group tropical plants together and mist foliage to preserve turgor pressure.'
    : season === 'spring'
    ? 'Rapid new foliage flush requires adequate micronutrients (Iron, Magnesium) and consistent moisture to establish sturdy cell walls.'
    : 'High solar radiation can cause scorch on unshielded leaves. Maintain consistent hydration to support transpiration cooling.';

  const soilConditioningTip = season === 'autumn'
    ? 'Top-dress all bare garden beds with 3 inches of shredded organic leaves or straw to preserve microbial soil life throughout freezing cycles.'
    : season === 'winter'
    ? 'Avoid walking on or digging wet/frozen soil to prevent severe soil compaction and root asphyxiation.'
    : season === 'spring'
    ? 'Incorporate rich vermicompost and mycorrhizal fungi when digging new planting holes to supercharge root inoculations.'
    : 'Apply organic compost tea early in the month to boost beneficial mycorrhizae during heavy summer nutrient uptake.';

  return {
    season,
    seasonDisplayName,
    subSeasonPhase,
    hemisphere,
    monthName,
    monthIndex: month,
    frostRiskLevel,
    frostRiskNote,
    primaryHighlights,
    tasks,
    plantingMatrix,
    foliageAdvice,
    soilConditioningTip,
    climateZoneEstimate: latitude > 45 ? 'Cool Temperate (Zones 4-6)' : latitude > 30 ? 'Warm Temperate / Subtropical (Zones 7-9)' : 'Tropical / Equatorial (Zones 10-12)'
  };
}
