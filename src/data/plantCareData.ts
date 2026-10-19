export type CareDifficulty = 'Beginner Friendly' | 'Easy Care' | 'Moderate';

export interface PlantSpeciesGuide {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  nativeHabitat: string;
  difficulty: CareDifficulty;
  imageUrl: string;
  summary: string;
  quickSpecs: {
    light: string;
    water: string;
    soil: string;
    humidity: string;
  };
  lightRequirement: {
    level: string;
    plainDescription: string;
    idealSpot: string;
  };
  wateringGuidance: {
    routine: string;
    plainDescription: string;
    howToCheck: string;
    dangerSign: string;
  };
  soilAndDrainage: {
    soilType: string;
    plainDescription: string;
    potRecommendation: string;
  };
  temperatureAndHumidity: {
    idealTemp: string;
    humidityNeeds: string;
    plainDescription: string;
  };
  careTips: string[];
  toxicity: {
    isToxic: boolean;
    details: string;
    petSafe: boolean;
  };
  advancedDetails: {
    botanicalFamily: string;
    growthHabit: string;
    propagationMethod: string;
  };
  tags: string[];
}

export interface PlantProblemGuide {
  id: string;
  symptom: string;
  shortDescription: string;
  category: 'watering' | 'light' | 'pests' | 'nutrition' | 'environment';
  severity: 'Low' | 'Moderate' | 'High';
  whatItMeans: string;
  whatToCheck: string[];
  whatToDo: string[];
  whatToAvoid: string[];
  whenToSeekHelp: string;
  relatedPlantIds: string[];
  tags: string[];
}

export interface CareTopicGuide {
  id: string;
  title: string;
  plainHeading: string;
  category: 'watering' | 'sunlight' | 'soil' | 'repotting' | 'pruning' | 'fertilizing';
  summary: string;
  iconName: 'Droplets' | 'Sun' | 'Layers' | 'RefreshCw' | 'Scissors' | 'FlaskConical';
  goldenRule: string;
  actionSteps: {
    title: string;
    description: string;
  }[];
  thingsToAvoid: string[];
  beginnerAdvice: string;
  tags: string[];
}

export const PLANT_SPECIES_GUIDES: PlantSpeciesGuide[] = [
  {
    id: 'monstera',
    commonName: 'Monstera (Swiss Cheese Plant)',
    scientificName: 'Monstera deliciosa',
    family: 'Araceae (Arum family)',
    nativeHabitat: 'Tropical rainforests of Southern Mexico and Central America',
    difficulty: 'Easy Care',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    summary: 'Famous for its dramatic leaves that develop natural splits and holes as it grows. Extremely resilient and fast-growing when given good light.',
    quickSpecs: {
      light: 'Bright indirect sunlight',
      water: 'Every 1 to 2 weeks',
      soil: 'Chunky, airy potting mix',
      humidity: 'Enjoys 50% or higher'
    },
    lightRequirement: {
      level: 'Bright, indirect sunlight',
      plainDescription: 'Place your Monstera near a bright window where it receives plenty of daylight, but keep it out of harsh midday sun which can scorch its leaves.',
      idealSpot: 'Within 3 to 6 feet of an east-facing or shaded south-facing window.'
    },
    wateringGuidance: {
      routine: 'Water when the top 2 to 3 inches feel dry',
      plainDescription: 'Test the soil before watering. Push your finger 2 inches into the soil. If it feels dry, water thoroughly until liquid drips from the drainage holes. Empty the saucer so the pot does not sit in water.',
      howToCheck: 'Use your finger or a wooden chopstick. If soil clings damply, wait another 2–3 days.',
      dangerSign: 'Yellow lower leaves accompanied by wet soil usually indicate overwatering.'
    },
    soilAndDrainage: {
      soilType: 'Loose, well-draining houseplant mix',
      plainDescription: 'Soil that lets extra water drain away freely. A mix containing perlite, orchid bark, and peat moss or coco coir keeps roots oxygenated.',
      potRecommendation: 'Always use a container with bottom drainage holes.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 85°F (18°C to 29°C)',
      humidityNeeds: 'Moderate to high (50–70%)',
      plainDescription: 'Prefers warm household temperatures. Keep away from cold winter window drafts or heating vents.'
    },
    careTips: [
      'As your Monstera grows upright, give it a moss pole or trellis for support.',
      'Gently wipe dust off the large leaves once a month with a damp cloth so they can absorb light.',
      'Aerial roots that sprout from the stems can be gently tucked back into the soil or misted.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to cats and dogs if chewed or swallowed. Contains insoluble calcium oxalate crystals that can cause mouth and stomach irritation.'
    },
    advancedDetails: {
      botanicalFamily: 'Araceae',
      growthHabit: 'Hemiepiphytic climbing vine',
      propagationMethod: 'Stem cuttings taken just below a leaf node and aerial root, rooted in water or moist moss.'
    },
    tags: ['monstera', 'swiss cheese', 'deliciosa', 'tropical', 'large leaves', 'vine', 'splits', 'fenestrated']
  },
  {
    id: 'snake_plant',
    commonName: 'Snake Plant (Mother-in-Law\'s Tongue)',
    scientificName: 'Dracaena trifasciata',
    family: 'Asparagaceae (Asparagus family)',
    nativeHabitat: 'Tropical West Africa from Nigeria east to the Congo',
    difficulty: 'Beginner Friendly',
    imageUrl: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=800&q=80',
    summary: 'Nearly indestructible houseplant with upright, sword-like leaves. It forgives low light and weeks of forgotten waterings.',
    quickSpecs: {
      light: 'Low to bright indirect light',
      water: 'Every 2 to 4 weeks (dry out 100%)',
      soil: 'Gritty cactus or succulent mix',
      humidity: 'Average room humidity'
    },
    lightRequirement: {
      level: 'Adapts to almost any light',
      plainDescription: 'Thrives in moderate to bright indirect light, but happily tolerates dim rooms and windowless offices.',
      idealSpot: 'Any corner with ambient light, from bedroom nightstands to bright living rooms.'
    },
    wateringGuidance: {
      routine: 'Water very sparingly',
      plainDescription: 'The biggest threat to a Snake Plant is too much water. Wait until the soil is completely dry all the way to the bottom before watering again. In winter, you may only need to water once a month.',
      howToCheck: 'Pick up the pot. If it feels feather-light and the soil is bone dry, it is ready for water.',
      dangerSign: 'Soft, mushy, or wrinkled yellowing leaves at the base mean the plant is sitting in wet soil.'
    },
    soilAndDrainage: {
      soilType: 'Fast-draining gritty cactus mix',
      plainDescription: 'A porous mix with coarse sand, pumice, or perlite that drains immediately and dries quickly.',
      potRecommendation: 'Terracotta or clay pots are ideal because their porous walls allow moisture to evaporate.'
    },
    temperatureAndHumidity: {
      idealTemp: '60°F to 85°F (15°C to 29°C)',
      humidityNeeds: 'Handles dry indoor air with ease',
      plainDescription: 'Thrives in normal heated home air. Avoid freezing temperatures below 50°F (10°C).'
    },
    careTips: [
      'When in doubt, wait a week before watering. It tolerates drought far better than dampness.',
      'Water around the edge of the pot rather than directly into the center of the leaf rosette to prevent crown rot.',
      'Fertilize lightly only once or twice a year in spring or summer.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Mildly toxic to dogs and cats if chewed. Can cause drooling, vomiting, or diarrhea due to saponins.'
    },
    advancedDetails: {
      botanicalFamily: 'Asparagaceae (formerly Sansevieria)',
      growthHabit: 'Rhizomatous clumping succulent perennial',
      propagationMethod: 'Division of underground rhizomes or leaf blade cuttings in moist soil.'
    },
    tags: ['snake plant', 'sansevieria', 'mother in law', 'low light', 'drought tolerant', 'easy', 'bedroom']
  },
  {
    id: 'pothos',
    commonName: 'Golden Pothos (Devil\'s Ivy)',
    scientificName: 'Epipremnum aureum',
    family: 'Araceae (Arum family)',
    nativeHabitat: 'Mo\'orea in the Society Islands of French Polynesia',
    difficulty: 'Beginner Friendly',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=800&q=80',
    summary: 'The ultimate beginner vine with heart-shaped leaves splashed with gold. Grows quickly in hanging baskets or trailing along bookshelves.',
    quickSpecs: {
      light: 'Low to bright indirect light',
      water: 'Every 1 to 2 weeks',
      soil: 'Standard potting soil',
      humidity: 'Average room air (40–60%)'
    },
    lightRequirement: {
      level: 'Tolerant of low to bright indirect light',
      plainDescription: 'Handles low light well, but leaf colors stay brightest and growth stays fullest in medium indirect daylight.',
      idealSpot: 'On a high shelf, mantle, or hanging near a window.'
    },
    wateringGuidance: {
      routine: 'Water when the top half of the soil feels dry',
      plainDescription: 'Let the top 2 inches dry out between waterings. If the leaves droop slightly and look limp, the plant is telling you it is thirsty.',
      howToCheck: 'Insert your finger into the soil. If the top half feels dry, give it water.',
      dangerSign: 'Yellow leaves with black stems signify soggy, waterlogged soil.'
    },
    soilAndDrainage: {
      soilType: 'Standard houseplant potting mix',
      plainDescription: 'Rich, aerated potting soil with some perlite for drainage.',
      potRecommendation: 'Any pot or hanging basket with drainage holes.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 85°F (18°C to 29°C)',
      humidityNeeds: 'Average household air',
      plainDescription: 'Very forgiving of average indoor conditions. Keep away from cold drafts in winter.'
    },
    careTips: [
      'Trim trailing vines when they get too long. This encourages bushier growth at the crown.',
      'Place trimmed stems in a jar of water on a windowsill to watch roots grow within two weeks.',
      'If leaves lose their golden marbling and turn all green, move the plant to a brighter spot.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to pets if ingested. Contains calcium oxalate crystals which cause mouth swelling and irritation.'
    },
    advancedDetails: {
      botanicalFamily: 'Araceae',
      growthHabit: 'Evergreen trailing/climbing vine',
      propagationMethod: 'Single-node or multi-node stem cuttings rooted readily in plain water.'
    },
    tags: ['pothos', 'devils ivy', 'trailing', 'vine', 'hanging', 'low light', 'easy care', 'beginner']
  },
  {
    id: 'zz_plant',
    commonName: 'ZZ Plant (Zanzibar Gem)',
    scientificName: 'Zamioculcas zamiifolia',
    family: 'Araceae (Arum family)',
    nativeHabitat: 'Drought-prone forests and grasslands of Eastern Africa (Kenya to South Africa)',
    difficulty: 'Beginner Friendly',
    imageUrl: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80',
    summary: 'Features glossy, waxy leaves on arching stems that look polished. Underground potato-like tubers store water, making it extremely drought resistant.',
    quickSpecs: {
      light: 'Low light to bright indirect light',
      water: 'Every 2 to 3 weeks (allow to dry completely)',
      soil: 'Well-draining potting soil with perlite',
      humidity: 'Any indoor humidity'
    },
    lightRequirement: {
      level: 'Extremely versatile light tolerance',
      plainDescription: 'Does great in low light, fluorescent office lighting, or bright indirect light. Avoid harsh direct sun which can yellow its waxy foliage.',
      idealSpot: 'Office desks, bedrooms, dark hallways, or living room tables.'
    },
    wateringGuidance: {
      routine: 'Water only when soil is bone dry',
      plainDescription: 'Its underground tubers store water like a camel. It prefers being neglected rather than over-loved. Water thoroughly, then let it dry out completely.',
      howToCheck: 'Make sure the soil is completely dry from top to bottom before adding more water.',
      dangerSign: 'Yellow, translucent, mushy stems indicate severe overwatering and rotting tubers.'
    },
    soilAndDrainage: {
      soilType: 'Porous potting mix with coarse perlite',
      plainDescription: 'A loose, airy potting mix that drains rapidly so tubers never sit in wet muck.',
      potRecommendation: 'A container with clear drainage holes. Don\'t repot too often; it likes being snug.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 80°F (18°C to 27°C)',
      humidityNeeds: 'Tolerates dry air without issue',
      plainDescription: 'Very comfortable in heated or air-conditioned rooms. Avoid freezing cold drafts.'
    },
    careTips: [
      'Wipe leaves occasionally with a clean damp cloth to remove household dust and keep them glossy.',
      'Only feed with diluted plant food 2 to 3 times a year in spring and summer.',
      'Never leave standing water in the saucer under the pot.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to pets and humans if chewed. Keep away from nibbling pets and wash hands after handling broken stems.'
    },
    advancedDetails: {
      botanicalFamily: 'Araceae',
      growthHabit: 'Rhizomatous perennial herb',
      propagationMethod: 'Division of rhizome clusters or individual leaflet cuttings in well-drained soil.'
    },
    tags: ['zz plant', 'zanzibar gem', 'glossy', 'drought tolerant', 'office', 'low light', 'neglect']
  },
  {
    id: 'spider_plant',
    commonName: 'Spider Plant (Ribbon Plant)',
    scientificName: 'Chlorophytum comosum',
    family: 'Asparagaceae (Asparagus family)',
    nativeHabitat: 'Tropical and Southern Africa',
    difficulty: 'Beginner Friendly',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=800&q=80',
    summary: 'A classic favorite with gracefully arching striped leaves. Famous for producing miniature baby plants ("spiderettes") on long trailing stems, and completely pet safe!',
    quickSpecs: {
      light: 'Medium to bright indirect sunlight',
      water: 'Every 1 to 2 weeks',
      soil: 'Standard, loose potting soil',
      humidity: 'Moderate (40–60%)'
    },
    lightRequirement: {
      level: 'Bright, indirect daylight',
      plainDescription: 'Enjoys plenty of indirect light. Keep away from harsh direct midday sun, which can bleach and crisp the striped leaves.',
      idealSpot: 'In a hanging planter or high plant stand near an east or west window.'
    },
    wateringGuidance: {
      routine: 'Water when the top inch of soil is dry',
      plainDescription: 'Water evenly when the surface soil feels dry to the touch. Spider plants are sensitive to fluoride and salts in hard tap water which can cause brown leaf tips.',
      howToCheck: 'Touch the soil surface. If dry, water with filtered, distilled, or rainwater if tap water is heavily chlorinated.',
      dangerSign: 'Pale, washed-out limp leaves usually mean the plant is parched.'
    },
    soilAndDrainage: {
      soilType: 'Light, well-draining houseplant soil',
      plainDescription: 'Standard indoor potting soil with good aeration.',
      potRecommendation: 'Plastic or glazed ceramic pot with drainage.'
    },
    temperatureAndHumidity: {
      idealTemp: '60°F to 75°F (15°C to 24°C)',
      humidityNeeds: 'Average indoor humidity',
      plainDescription: 'Comfortable in most household rooms, including kitchens and bathrooms with indirect light.'
    },
    careTips: [
      'Snip off miniature baby plantlets and plant them in small pots to share with friends and family.',
      'Brown tips on the very ends of leaves are harmless and can be trimmed with clean scissors.',
      'Repot in spring if thick white tuberous roots push the plant up out of its pot.'
    ],
    toxicity: {
      isToxic: false,
      petSafe: true,
      details: 'Certified non-toxic to cats and dogs by the ASPCA. 100% pet-friendly plant for animal lovers!'
    },
    advancedDetails: {
      botanicalFamily: 'Asparagaceae',
      growthHabit: 'Clumping perennial with stoloniferous runners',
      propagationMethod: 'Rooting offset plantlets directly in moist potting mix or water.'
    },
    tags: ['spider plant', 'pet safe', 'non toxic', 'hanging', 'baby plants', 'beginner', 'safe for cats']
  },
  {
    id: 'peace_lily',
    commonName: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    family: 'Araceae (Arum family)',
    nativeHabitat: 'Tropical rainforests of Central and South America',
    difficulty: 'Easy Care',
    imageUrl: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=800&q=80',
    summary: 'A graceful tropical plant with deep green leaves and elegant white blooms (spathes). It clearly signals thirst by dramatically drooping, then bounces back quickly after water.',
    quickSpecs: {
      light: 'Low to medium indirect light',
      water: 'Once a week (keep slightly moist)',
      soil: 'Rich, moisture-retaining potting mix',
      humidity: 'Enjoys higher humidity (50–70%)'
    },
    lightRequirement: {
      level: 'Low to medium indirect light',
      plainDescription: 'One of the best flowering houseplants for low-light rooms. Keep completely out of direct sun, which burns the foliage.',
      idealSpot: 'In a room with filtered light, a few feet away from a window.'
    },
    wateringGuidance: {
      routine: 'Keep soil evenly moist, not soggy',
      plainDescription: 'Water when the top inch of soil feels dry, or when you notice the leaves start to gently sag. It will perk back up within hours of a good drink.',
      howToCheck: 'Feel the top soil with your finger. If it feels slightly dry and leaves droop, water thoroughly.',
      dangerSign: 'Yellow leaves with black tips can indicate hard mineral salts in tap water or standing in water.'
    },
    soilAndDrainage: {
      soilType: 'Moisture-retaining, well-aerated potting mix',
      plainDescription: 'Rich soil containing peat moss or coco coir that holds gentle moisture while letting excess drain.',
      potRecommendation: 'Container with drainage holes to prevent root rot.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 80°F (18°C to 27°C)',
      humidityNeeds: 'Appreciates higher humidity',
      plainDescription: 'Loves warm rooms. Sensitive to cold air drafts and air conditioners below 60°F (15°C).'
    },
    careTips: [
      'If your Peace Lily is not blooming, move it to a slightly brighter spot with indirect daylight.',
      'Wipe dust off broad dark leaves once a month to keep them shiny and healthy.',
      'Use filtered room-temperature water if your tap water contains high chlorine.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to pets if chewed. Contains insoluble calcium oxalates that irritate the mouth and throat.'
    },
    advancedDetails: {
      botanicalFamily: 'Araceae',
      growthHabit: 'Herbaceous clumping evergreen',
      propagationMethod: 'Division of root clumps during spring repotting.'
    },
    tags: ['peace lily', 'spathiphyllum', 'flowering', 'white flowers', 'dramatic', 'low light', 'air purifying']
  },
  {
    id: 'fiddle_leaf_fig',
    commonName: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    family: 'Moraceae (Fig or Mulberry family)',
    nativeHabitat: 'Lowland tropical rainforests of Western Africa (Cameroon to Sierra Leone)',
    difficulty: 'Moderate',
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
    summary: 'A stunning indoor focal plant with massive violin-shaped leaves. It rewards consistent care, bright light, and staying in one spot.',
    quickSpecs: {
      light: 'Lots of bright indirect sunlight',
      water: 'Every 7 to 10 days',
      soil: 'Rich, chunky well-draining soil',
      humidity: 'Moderate to high (40–60%)'
    },
    lightRequirement: {
      level: 'Very bright indirect light',
      plainDescription: 'Needs plenty of natural daylight. Place it right next to an east-facing window or a few feet from a south or west window.',
      idealSpot: 'Within 2 to 4 feet of a bright window with unobstructed sky view.'
    },
    wateringGuidance: {
      routine: 'Water when top 2 inches dry out',
      plainDescription: 'Water thoroughly until water runs out the bottom drainage holes, then discard extra water from the saucer. Let the top 2 inches dry out before watering again.',
      howToCheck: 'Stick your finger 2 inches into the soil. If moist, wait a few days.',
      dangerSign: 'Large brown spots in the center of leaves often indicate overwatering and poor drainage.'
    },
    soilAndDrainage: {
      soilType: 'Chunky, nutrient-rich potting mix',
      plainDescription: 'Mix with bark chips, perlite, and potting soil to allow rapid drainage and healthy air pockets around roots.',
      potRecommendation: 'Sturdy heavy pot with ample drainage holes.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 80°F (18°C to 27°C)',
      humidityNeeds: 'Moderate to high',
      plainDescription: 'Avoid moving it frequently. Dislikes temperature fluctuations, AC vents, or cold winter drafts.'
    },
    careTips: [
      'Pick one ideal bright spot in your home and leave it there; Fiddle Leaf Figs drop leaves when moved frequently.',
      'Dust the large violin-shaped leaves monthly with a damp microfiber cloth so they can absorb light.',
      'Rotate the pot a quarter-turn each month so the trunk grows straight and foliage develops evenly.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to pets. The milky sap inside stems causes oral and skin irritation.'
    },
    advancedDetails: {
      botanicalFamily: 'Moraceae',
      growthHabit: 'Broadleaf evergreen banyan tree',
      propagationMethod: 'Stem tip cuttings or air layering during warm active growing months.'
    },
    tags: ['fiddle leaf fig', 'ficus lyrata', 'tree', 'large leaves', 'statement plant', 'bright light']
  },
  {
    id: 'rubber_tree',
    commonName: 'Rubber Tree (Rubber Plant)',
    scientificName: 'Ficus elastica',
    family: 'Moraceae (Fig or Mulberry family)',
    nativeHabitat: 'Tropical rainforests of Eastern India, Nepal, Bhutan, and Indonesia',
    difficulty: 'Easy Care',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
    summary: 'Features thick, glossy, leathery leaves in rich burgundy or deep green. Sturdy, architectural, and much easier to care for than other indoor trees.',
    quickSpecs: {
      light: 'Medium to bright indirect light',
      water: 'Every 1 to 2 weeks',
      soil: 'Aerated well-draining soil',
      humidity: 'Average room humidity'
    },
    lightRequirement: {
      level: 'Medium to bright indirect light',
      plainDescription: 'Grows best in bright daylight with a little gentle morning sun. Avoid harsh afternoon sun which can fade dark leaves.',
      idealSpot: 'Near a window with sheer curtains or next to an east-facing window.'
    },
    wateringGuidance: {
      routine: 'Water when top half of soil is dry',
      plainDescription: 'Let the top 2 to 3 inches of soil dry out between waterings. Reduce watering noticeably during winter months.',
      howToCheck: 'Feel the top few inches. Water only when it feels crumbly and dry.',
      dangerSign: 'Yellowing lower leaves dropping suddenly can signal overwatering or sudden cold.'
    },
    soilAndDrainage: {
      soilType: 'Standard potting mix with extra perlite',
      plainDescription: 'Well-draining indoor potting mix that never stays soggy.',
      potRecommendation: 'Container with drainage holes.'
    },
    temperatureAndHumidity: {
      idealTemp: '65°F to 80°F (18°C to 27°C)',
      humidityNeeds: 'Average household air',
      plainDescription: 'Comfortable in most heated and cooled indoor spaces. Keep away from cold drafty doors.'
    },
    careTips: [
      'Wipe down leaves with a soft damp cloth to keep their glossy shine and help the plant breathe.',
      'Pruning the top stem in spring encourages the tree to branch out and form a fuller canopy.',
      'Wear gardening gloves when pruning, as the milky white sap can cause skin irritation.'
    ],
    toxicity: {
      isToxic: true,
      petSafe: false,
      details: 'Toxic to pets. The milky latex sap causes digestive upset and skin irritation.'
    },
    advancedDetails: {
      botanicalFamily: 'Moraceae',
      growthHabit: 'Evergreen banyan tree with stout aerial roots',
      propagationMethod: 'Stem cuttings or air-layering in warm, humid conditions.'
    },
    tags: ['rubber tree', 'rubber plant', 'ficus elastica', 'burgundy', 'glossy leaves', 'indoor tree']
  }
];

export const PLANT_PROBLEM_GUIDES: PlantProblemGuide[] = [
  {
    id: 'yellow_leaves',
    symptom: 'Yellow Leaves',
    shortDescription: 'Leaves losing their green color and turning pale or yellow',
    category: 'watering',
    severity: 'Moderate',
    whatItMeans: 'Yellowing leaves (called chlorosis) happen when a plant loses chlorophyll. It is the most common plant symptom, but it does NOT always mean one single thing. Most often it is caused by overwatering, poor drainage, or natural aging of older lower leaves.',
    whatToCheck: [
      'Check the soil moisture deep down: Push your finger 2 inches into the soil. Is it wet, soggy, or dry?',
      'Check which leaves are yellowing: Are only the oldest, lowest leaves at the very base turning yellow? (This is often normal leaf aging).',
      'Check leaf texture: Are the yellow leaves soft, mushy, or limp (signs of overwatering), or are they crisp and dry (signs of underwatering or sunburn)?',
      'Check pot drainage: Is water trapped in the decorative outer pot or saucer?'
    ],
    whatToDo: [
      'If soil is soggy: Stop watering immediately. Allow the soil to dry out. Empty any standing water from the saucer.',
      'If the pot has no drainage holes: Repot into a container with drainage holes using fresh, airy potting mix.',
      'If soil is bone dry: Give the plant a thorough, slow drink of water until liquid flows out the bottom.',
      'If only 1 or 2 bottom leaves are yellowing naturally: Snip them off with clean scissors so the plant puts energy into fresh leaves.'
    ],
    whatToAvoid: [
      'Do not apply fertilizer to a plant with yellowing leaves; fertilizer can burn damaged roots.',
      'Do not keep watering on a rigid calendar schedule without checking soil moisture first.'
    ],
    whenToSeekHelp: 'If yellowing spreads quickly to new growth or leaves become black and mushy at the stem base.',
    relatedPlantIds: ['monstera', 'pothos', 'snake_plant', 'peace_lily'],
    tags: ['yellow leaves', 'chlorosis', 'overwatering', 'watering problem', 'soggy soil', 'root rot']
  },
  {
    id: 'brown_leaf_tips',
    symptom: 'Brown Leaf Tips & Crispy Edges',
    shortDescription: 'Dry, brown, or papery edges on leaf tips and borders',
    category: 'environment',
    severity: 'Low',
    whatItMeans: 'Brown tips usually happen when moisture cannot reach the furthest ends of the leaf tissue. This is commonly caused by dry indoor air (low humidity), allowing the soil to get too dry, or mineral buildup from tap water.',
    whatToCheck: [
      'Check air humidity and heating: Is the plant near an air conditioner, heat vent, or radiator?',
      'Check tap water type: Does your city tap water have high chlorine, fluoride, or hard mineral salts?',
      'Check watering consistency: Did the plant dry out completely and stay parched between waterings?',
      'Check fertilizer history: Have you applied full-strength fertilizer recently? (Fertilizer salt burn can scorch tips).'
    ],
    whatToDo: [
      'Boost humidity: Group plants together, run a small room humidifier, or place on a pebble tray with water.',
      'Switch water: For sensitive plants like Spider Plants or Peace Lilies, use filtered, distilled, or rainwater.',
      'Flush the soil: Once every few months, pour plenty of water through the pot to wash away accumulated mineral salts.',
      'Tidy up: Trim only the brown crispy edge with clean scissors, leaving a tiny sliver of brown to avoid cutting into live green tissue.'
    ],
    whatToAvoid: [
      'Do not mist leaves late in the evening; standing water on leaves overnight can encourage fungal spots.',
      'Do not cut into healthy green leaf tissue when trimming brown edges.'
    ],
    whenToSeekHelp: 'If brown patches are accompanied by a yellow halo and spreading across the leaf center, which may indicate a fungal issue.',
    relatedPlantIds: ['spider_plant', 'peace_lily', 'monstera'],
    tags: ['brown tips', 'crispy leaves', 'dry edges', 'humidity', 'tap water', 'minerals']
  },
  {
    id: 'drooping_leaves',
    symptom: 'Drooping, Limp, or Wilting Leaves',
    shortDescription: 'Stems and foliage sagging, softening, or collapsing',
    category: 'watering',
    severity: 'Moderate',
    whatItMeans: 'Plant cells stay firm through water pressure (called turgor pressure). When cells lose water, stems sag. This happens when the plant is very thirsty, OR ironically when roots have rotted from too much water and can no longer absorb moisture.',
    whatToCheck: [
      'Feel the soil: Is the soil completely dry and shrinking from the edges of the pot, or is it damp and heavy?',
      'Lift the pot: Does the pot feel extremely light (thirsty) or very heavy (waterlogged)?',
      'Look for recovery: If you water a thirsty plant, it should perk up within 2 to 6 hours.'
    ],
    whatToDo: [
      'If soil is bone dry: Water thoroughly. For very dry soil that repels water, bottom-water by placing the pot in a bowl of water for 20 minutes.',
      'If soil is wet and plant still droops: Carefully slide the plant out of its pot. Inspect the roots. Healthy roots are firm and white or tan. Rotting roots are brown, slimy, and smell foul.',
      'For root rot: Trim away mushy dark roots with clean shears, rinse remaining roots, and repot into fresh dry soil.'
    ],
    whatToAvoid: [
      'Do not assume drooping always means "needs more water" without touching the soil first.',
      'Do not let plants sit in standing runoff water inside decorative pots.'
    ],
    whenToSeekHelp: 'If roots smell sour or mushy and the plant does not perk up 24 hours after watering.',
    relatedPlantIds: ['peace_lily', 'pothos', 'fiddle_leaf_fig'],
    tags: ['drooping', 'wilting', 'limp leaves', 'thirsty', 'dehydrated', 'root rot']
  },
  {
    id: 'common_pests',
    symptom: 'Common Plant Pests (Flies, Webs, or Cotton Spots)',
    shortDescription: 'Tiny insects, webbing, or sticky residue on foliage or soil',
    category: 'pests',
    severity: 'Moderate',
    whatItMeans: 'Common indoor pests include fungus gnats (tiny soil flies), spider mites (tiny specks with fine webs), and mealybugs (white cottony clusters). They enter homes through open windows or new store-bought plants.',
    whatToCheck: [
      'Tiny fruit-fly-like bugs flying around soil: These are Fungus Gnats. They feed on decaying organic matter in constantly wet soil.',
      'Fine cobwebs under leaves and dusty speckles: These are Spider Mites, which love warm, dry indoor air.',
      'White cotton-like fuzzy clumps tucked into stem joints: These are Mealybugs.'
    ],
    whatToDo: [
      'Isolate the affected plant from other houseplants to prevent pests from spreading.',
      'For Fungus Gnats: Allow the top 2 inches of soil to dry out completely. Place yellow sticky traps near the soil to catch adults.',
      'For Mealybugs: Dip a cotton swab in 70% rubbing alcohol and dab directly onto each white bug to dissolve them instantly.',
      'For Spider Mites: Wipe down both sides of leaves with a damp cloth, then spray with neem oil or insecticidal soap diluted in water.'
    ],
    whatToAvoid: [
      'Do not spray oil or insecticidal soap on plants sitting in direct hot sunlight, which can burn leaves.',
      'Do not keep soil perpetually damp; let it dry out between waterings.'
    ],
    whenToSeekHelp: 'If an infestation covers an entire plant and home remedies do not stop it after 2 to 3 weeks.',
    relatedPlantIds: ['monstera', 'pothos', 'fiddle_leaf_fig', 'rubber_tree'],
    tags: ['pests', 'bugs', 'fungus gnats', 'spider mites', 'mealybugs', 'insects', 'webs', 'sticky']
  },
  {
    id: 'slow_growth',
    symptom: 'Slow Growth or No New Leaves',
    shortDescription: 'Plant has stopped growing or producing fresh shoots',
    category: 'light',
    severity: 'Low',
    whatItMeans: 'During autumn and winter, most houseplants naturally rest and slow down their growth. If growth stops during spring or summer, it is usually due to insufficient sunlight, cramped roots, or lack of nutrients.',
    whatToCheck: [
      'Check the season: Is it winter? If yes, slow growth is completely normal and healthy.',
      'Check the light: Has the plant been moved to a darker corner where it gets very little daylight?',
      'Check the roots: Turn the pot over. Are roots densely circling the inside or growing out of the drainage holes? (Rootbound).',
      'Check feeding: Has it been more than a year since the plant received fresh soil or diluted fertilizer?'
    ],
    whatToDo: [
      'Move the plant to a spot with brighter, indirect sunlight.',
      'In spring or summer, apply a gentle balanced plant food diluted to half strength once a month.',
      'If roots are tightly packed, repot in spring into a new pot that is 1 to 2 inches larger in diameter.'
    ],
    whatToAvoid: [
      'Do not force winter growth with heavy fertilizer; plants need their natural seasonal rest period.',
      'Do not jump into an oversized pot when repotting; excess wet soil around small roots causes rot.'
    ],
    whenToSeekHelp: 'If new leaves that do emerge are deformed, black, or quickly die off.',
    relatedPlantIds: ['monstera', 'zz_plant', 'snake_plant', 'rubber_tree'],
    tags: ['slow growth', 'stunted', 'no new leaves', 'dormancy', 'rootbound', 'fertilizer', 'light']
  }
];

export const CARE_TOPIC_GUIDES: CareTopicGuide[] = [
  {
    id: 'watering_fundamentals',
    title: 'Watering 101: How to Water Without Guessing',
    plainHeading: 'How and when should you water your plant?',
    category: 'watering',
    iconName: 'Droplets',
    summary: 'The number one cause of houseplant problems is overwatering. Learn how to tell when your plant actually needs a drink using simple physical checks.',
    goldenRule: 'Never water on a rigid calendar schedule. Always check soil moisture with your finger first.',
    actionSteps: [
      {
        title: 'Step 1: The Finger Test',
        description: 'Push your index finger 1 to 2 inches deep into the soil. If it feels cool and damp with soil clinging to your skin, wait a few days. If it feels dry and warm, it is time to water.'
      },
      {
        title: 'Step 2: Lift the Pot (Weight Check)',
        description: 'Get familiar with how heavy your pot feels when freshly watered compared to when bone dry. A light pot usually needs water.'
      },
      {
        title: 'Step 3: Water Thoroughly',
        description: 'Pour water evenly over the soil surface until you see it drain out of the drainage holes at the bottom. This ensures deep roots receive moisture.'
      },
      {
        title: 'Step 4: Empty the Saucer',
        description: 'After 15 minutes, dump out any pooled water in the saucer. Houseplant roots need oxygen and will suffocate if they sit in standing water.'
      }
    ],
    thingsToAvoid: [
      'Don\'t give small sips of water every day; this creates shallow, weak roots.',
      'Don\'t use ice cubes to water tropical plants; ice-cold temperatures shock warm tropical roots.',
      'Don\'t leave pots sitting in puddles inside decorative cachepots.'
    ],
    beginnerAdvice: 'When in doubt, wait one more day. Most houseplants recover much faster from slight underwatering than from soggy overwatering.',
    tags: ['watering', 'finger test', 'drainage', 'bottom watering', 'overwatering', 'moisture']
  },
  {
    id: 'sunlight_basics',
    title: 'How Much Sunlight Does Your Plant Need?',
    plainHeading: 'Understanding light levels in your home',
    category: 'sunlight',
    iconName: 'Sun',
    summary: 'Light is food for plants through photosynthesis. Demystify terms like "bright indirect light" with simple real-world room examples.',
    goldenRule: 'Bright indirect light means the plant can see the open sky, but the sun cannot directly touch and scorch its leaves.',
    actionSteps: [
      {
        title: 'Direct Sunlight',
        description: 'Sunbeams shine directly through the glass and hit the leaves. Great for cacti, succulents, and citrus trees. Can sunburn thin-leaved tropicals.'
      },
      {
        title: 'Bright Indirect Light',
        description: 'The sweet spot for 90% of houseplants. A bright room near a window, or protected by a sheer white curtain. Your hand casts a soft, fuzzy shadow.'
      },
      {
        title: 'Medium to Low Light',
        description: 'Spots further away from windows, or north-facing rooms. Great for tolerant champions like Snake Plants, ZZ Plants, and Pothos.'
      },
      {
        title: 'The Shadow Test',
        description: 'Hold your hand 12 inches above a piece of paper where the plant sits. A sharp shadow means high/direct light. A soft fuzzy shadow means bright indirect light. A faint or absent shadow means low light.'
      }
    ],
    thingsToAvoid: [
      'Don\'t place tropical foliage in intense direct midday sun without acclimating them first.',
      'Don\'t keep plants in pitch-black rooms without supplemental plant grow lights.'
    ],
    beginnerAdvice: 'If your plant is stretching with long, thin, weak stems ("getting leggy"), it is reaching for more light. Move it closer to a window.',
    tags: ['sunlight', 'bright indirect', 'low light', 'window', 'shadow test', 'lighting', 'burn']
  },
  {
    id: 'soil_and_drainage',
    title: 'Which Soil Should You Use?',
    plainHeading: 'Soil that lets extra water drain away safely',
    category: 'soil',
    iconName: 'Layers',
    summary: 'Why outdoor garden dirt suffocates indoor plants, and how to choose an airy potting mix that keeps roots healthy and oxygenated.',
    goldenRule: 'Healthy roots need oxygen just as much as water. Soil must contain air pockets and drain quickly.',
    actionSteps: [
      {
        title: 'Why Garden Soil Fails Indoors',
        description: 'Dirt from your backyard turns into a dense, heavy brick inside a container. It compacts, traps water, and suffocates roots.'
      },
      {
        title: 'The Standard Indoor Houseplant Mix',
        description: 'Look for potting mixes containing peat moss or coco coir (for moisture retention) combined with perlite or pumice (for aeration and drainage).'
      },
      {
        title: 'Chunky Tropical Aroid Mix',
        description: 'For Monsteras and Philodendrons, add orchid bark and coarse perlite to create loose, chunky soil that mimics tree bark in the wild.'
      },
      {
        title: 'Cactus & Succulent Mix',
        description: 'Contains coarse sand, pumice, and gravel. Dries very quickly to prevent rot in desert plants.'
      }
    ],
    thingsToAvoid: [
      'Don\'t put rocks in the bottom of a pot without drainage holes; this raises the water table and actually causes root rot faster.',
      'Always pick pots that have real drainage holes.'
    ],
    beginnerAdvice: 'If water takes more than 10 seconds to soak into the soil and pools on top, the soil has become compacted. Aerate it gently with a chopstick.',
    tags: ['soil', 'potting mix', 'perlite', 'drainage', 'aroid mix', 'succulent soil', 'aeration']
  },
  {
    id: 'repotting_safely',
    title: 'When and How to Repot Your Plant',
    plainHeading: 'Giving your plant room to grow without shocking it',
    category: 'repotting',
    iconName: 'RefreshCw',
    summary: 'Plants only need repotting every 1 to 2 years. Learn the telltale signs that your plant has outgrown its pot and how to transfer it safely.',
    goldenRule: 'When sizing up, choose a new pot only 1 to 2 inches larger in diameter than the current one.',
    actionSteps: [
      {
        title: 'Signs It Is Time to Repot',
        description: 'Roots are growing out of the bottom drainage holes, water runs straight through without soaking in, or the plant dries out every 2 days.'
      },
      {
        title: 'Choose the Right Pot Size',
        description: 'Moving a plant into a pot that is too large means extra soil holds excess water, which leads to root rot. Go up just 1 to 2 inches.'
      },
      {
        title: 'Best Timing: Spring and Summer',
        description: 'Repot during the active growing season when the plant has plenty of daylight to recover and grow fresh roots.'
      },
      {
        title: 'Gentle Step-by-Step Repotting',
        description: 'Gently loosen the root ball with your fingers, place fresh potting mix in the new pot, set the plant at the same depth as before, fill around the sides, and water lightly.'
      }
    ],
    thingsToAvoid: [
      'Don\'t yank a plant out by its stems; gently squeeze the sides of plastic nursery pots or slide a butter knife around the edge.',
      'Don\'t fertilize immediately after repotting; let fresh roots settle in for 4 weeks first.'
    ],
    beginnerAdvice: 'If your plant is happy, growing well, and holding moisture for a week, you don\'t need to repot yet! Many plants prefer being slightly snug.',
    tags: ['repotting', 'pot size', 'rootbound', 'transplanting', 'spring', 'containers']
  },
  {
    id: 'pruning_and_cleaning',
    title: 'How and Why to Prune Your Houseplants',
    plainHeading: 'Trimming dead growth and encouraging bushier leaves',
    category: 'pruning',
    iconName: 'Scissors',
    summary: 'Pruning helps your plant conserve energy, removes yellowing leaves, and stimulates full, bushy growth rather than long skinny stems.',
    goldenRule: 'Always use clean, sharp shears or scissors, and cut just above a leaf node.',
    actionSteps: [
      {
        title: 'Step 1: Sanitize Your Tools',
        description: 'Wipe scissors or pruning shears with rubbing alcohol or wash with soapy water to avoid transferring plant bacteria.'
      },
      {
        title: 'Step 2: Remove Dying Foliage',
        description: 'Cut yellow, brown, or dry dead leaves off at the base of their stem. This frees up energy for new shoots.'
      },
      {
        title: 'Step 3: Cut Above a Leaf Node',
        description: 'A leaf node is the small bump where a leaf meets the stem. Cutting right above a node triggers dormant buds to produce fresh stems.'
      },
      {
        title: 'Step 4: Clean the Leaves',
        description: 'Dust blocks sunlight. Wipe leaves every month with a damp microfiber cloth to keep them breathing and absorbing light.'
      }
    ],
    thingsToAvoid: [
      'Don\'t remove more than 25% of a plant\'s foliage at one time.',
      'Don\'t use dull household kitchen scissors that crush plant stems.'
    ],
    beginnerAdvice: 'Healthy clippings from Pothos or Monstera don\'t have to be thrown away! Pop them into a glass of clean water to grow new baby plants.',
    tags: ['pruning', 'shears', 'trimming', 'dusting', 'leaf node', 'bushy growth', 'propagation']
  },
  {
    id: 'plant_nutrition_basics',
    title: 'Plant Food & Nutrition: How Much is Enough?',
    plainHeading: 'Understanding fertilizer without complicated chemistry',
    category: 'fertilizing',
    iconName: 'FlaskConical',
    summary: 'Plants make their own sugar from sunlight, but need soil nutrients (Nitrogen, Phosphorus, Potassium) to build strong stems and vibrant leaves.',
    goldenRule: 'Fertilize only during active spring and summer growth. Less is more—dilute to half strength.',
    actionSteps: [
      {
        title: 'What N-P-K Numbers Mean',
        description: 'Nitrogen (N) makes lush green leaves. Phosphorus (P) supports strong roots and blooms. Potassium (K) keeps the entire plant hardy.'
      },
      {
        title: 'Dilute to Half Strength',
        description: 'Houseplants in indoor pots need much less fertilizer than outdoor crops. Always dilute liquid fertilizer with twice as much water as the bottle suggests.'
      },
      {
        title: 'Pre-Moisten Soil First',
        description: 'Never pour fertilizer into bone-dry soil; dry roots absorb concentrated salts too fast, causing root damage. Water lightly first.'
      },
      {
        title: 'Pause in Winter',
        description: 'When daylight hours decrease in autumn and winter, stop feeding completely until active new growth restarts in spring.'
      }
    ],
    thingsToAvoid: [
      'Don\'t think fertilizer can fix a dying plant; if a plant is struggling with rot or low light, fertilizer will make it worse.',
      'Never fertilize carnivorous plants (like Venus flytraps), which get all their food from bugs.'
    ],
    beginnerAdvice: 'Want precise numbers for your exact species? Switch over to our interactive Fertilizer Calculator tab anytime!',
    tags: ['fertilizer', 'plant food', 'npk', 'dilution', 'spring feeding', 'root burn', 'liquid nutrients']
  }
];

export interface CareRoutineStep {
  stepNumber: number;
  title: string;
  frequency: string;
  description: string;
  actionText: string;
  actionTab: 'garden' | 'calendar' | 'chat';
  icon: string;
}

export const CARE_ROUTINE_STEPS: CareRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Weekly Soil Check (The Finger Test)',
    frequency: 'Once a week on the same day',
    description: 'Pick a relaxed day like Saturday morning. Walk around your home and touch the soil of each plant. Only water the ones that are dry.',
    actionText: 'Open Care Calendar',
    actionTab: 'calendar',
    icon: 'Droplets'
  },
  {
    stepNumber: 2,
    title: 'Add Houseplants to My Garden',
    frequency: 'Once per plant specimen',
    description: 'Track plant health, watering history, and growth milestones in Floravia so you never forget when you last cared for each specimen.',
    actionText: 'View My Garden',
    actionTab: 'garden',
    icon: 'Sprout'
  },
  {
    stepNumber: 3,
    title: 'Monthly Quarter-Turn for Balanced Growth',
    frequency: 'First weekend of every month',
    description: 'Plants naturally lean toward the window. Give each pot a 90-degree quarter turn each month so foliage grows evenly on all sides.',
    actionText: 'Set a Reminder',
    actionTab: 'calendar',
    icon: 'RefreshCw'
  },
  {
    stepNumber: 4,
    title: 'Ask Sage for Microclimate Advice',
    frequency: 'Whenever you notice unusual changes',
    description: 'Have a personalized question about your room, season, or humidity? Ask Sage, your botanical AI companion, for instant practical steps.',
    actionText: 'Ask Sage AI',
    actionTab: 'chat',
    icon: 'Sparkles'
  }
];

export interface SearchResultItem {
  type: 'plant' | 'problem' | 'topic';
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  snippet: string;
  data: PlantSpeciesGuide | PlantProblemGuide | CareTopicGuide;
}

export function searchPlantCareContent(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Plants
  for (const plant of PLANT_SPECIES_GUIDES) {
    const matchesCommon = plant.commonName.toLowerCase().includes(q);
    const matchesScientific = plant.scientificName.toLowerCase().includes(q);
    const matchesSummary = plant.summary.toLowerCase().includes(q);
    const matchesTags = plant.tags.some(t => t.toLowerCase().includes(q));
    const matchesLight = plant.lightRequirement.plainDescription.toLowerCase().includes(q);
    const matchesWater = plant.wateringGuidance.plainDescription.toLowerCase().includes(q);

    if (matchesCommon || matchesScientific || matchesSummary || matchesTags || matchesLight || matchesWater) {
      results.push({
        type: 'plant',
        id: plant.id,
        title: plant.commonName,
        subtitle: plant.scientificName,
        badge: plant.difficulty,
        badgeColor: plant.difficulty === 'Beginner Friendly' ? 'emerald' : 'amber',
        snippet: plant.summary,
        data: plant
      });
    }
  }

  // 2. Search Problems & Symptoms
  for (const problem of PLANT_PROBLEM_GUIDES) {
    const matchesSymptom = problem.symptom.toLowerCase().includes(q);
    const matchesDesc = problem.shortDescription.toLowerCase().includes(q);
    const matchesMeans = problem.whatItMeans.toLowerCase().includes(q);
    const matchesTags = problem.tags.some(t => t.toLowerCase().includes(q));
    const matchesTodo = problem.whatToDo.some(t => t.toLowerCase().includes(q));

    if (matchesSymptom || matchesDesc || matchesMeans || matchesTags || matchesTodo) {
      results.push({
        type: 'problem',
        id: problem.id,
        title: problem.symptom,
        subtitle: `Plant Problem • ${problem.category.toUpperCase()}`,
        badge: `${problem.severity} Severity`,
        badgeColor: problem.severity === 'High' ? 'rose' : problem.severity === 'Moderate' ? 'amber' : 'emerald',
        snippet: problem.whatItMeans,
        data: problem
      });
    }
  }

  // 3. Search Core Topics
  for (const topic of CARE_TOPIC_GUIDES) {
    const matchesTitle = topic.title.toLowerCase().includes(q);
    const matchesHeading = topic.plainHeading.toLowerCase().includes(q);
    const matchesSummary = topic.summary.toLowerCase().includes(q);
    const matchesRule = topic.goldenRule.toLowerCase().includes(q);
    const matchesTags = topic.tags.some(t => t.toLowerCase().includes(q));

    if (matchesTitle || matchesHeading || matchesSummary || matchesRule || matchesTags) {
      results.push({
        type: 'topic',
        id: topic.id,
        title: topic.title,
        subtitle: topic.plainHeading,
        badge: topic.category.toUpperCase(),
        badgeColor: 'emerald',
        snippet: topic.goldenRule,
        data: topic
      });
    }
  }

  return results;
}
