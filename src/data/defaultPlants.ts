import { DashboardPlant } from '../types/botanical';

export const DEFAULT_PLANTS: DashboardPlant[] = [
  {
    id: 'plant-rose-01',
    name: 'Orange Hybrid Tea Rose',
    scientificName: 'Rosa hybrida',
    nickname: 'My Sunshine',
    matchScore: 99.8,
    confidence: 'High Confidence',
    imageUrl: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1000&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=1200&q=85'
    ],
    healthScore: 95,
    vigorIndexLabel: 'Vigor Index',
    mood: 'Resilient',
    hydrationStatus: 'Excellent',
    pathologyRisk: 'Low Risk',
    neuralStress: 'Minimal',
    aiAssessment: {
      mood: 'Resilient',
      points: [
        'Peak blooming phase detected',
        'Recent hydration or dew accumulation observed',
        'Exceptional petal turgidity and color saturation'
      ]
    },
    priorityAdjustments: {
      soilHydro: 'Allow top inch of soil to dry; next watering in 2–3 days',
      luminance: 'Requires sustained full sun exposure for continued bloom production'
    },
    weatherInsight: {
      city: 'Bhimavaram',
      condition: 'Clouds Conditions',
      temp: 29,
      humidity: 73,
      advice: "Warm weather today. Check if Orange Hybrid Tea Rose's soil is dry."
    },
    careEssentials: {
      water: 'Regularly',
      light: 'Bright Indirect',
      temp: '65–80°F',
      air: 'Well Ventilated',
      summary: 'This is a stunning orange hybrid tea rose in full bloom, showcasing a complex layered petal structure and vibrant coral hues. The presence of water droplets indicates high moisture levels and a refreshed physiological state.',
      userRating: 4
    },
    healthOverview: {
      period: 'This Week',
      trend: [
        { date: 'May 14', score: 38, mood: 'Stressed' },
        { date: 'May 21', score: 62, mood: 'Recovering' },
        { date: 'May 28', score: 72, mood: 'Stable' },
        { date: 'Jun 04', score: 70, mood: 'Good' },
        { date: 'Jun 11', score: 95, mood: 'Resilient' }
      ],
      lastWatered: '2 days ago',
      lastFertilized: '10 days ago',
      nextWatering: 'In 2–3 days',
      nextPruning: 'In 12 days'
    },
    timeline: [
      { date: 'May 28', action: 'Identified', type: 'identified', color: 'emerald' },
      { date: 'May 29', action: 'Watered', type: 'watered', color: 'emerald' },
      { date: 'Jun 02', action: 'Fertilized', type: 'fertilized', color: 'amber' },
      { date: 'Jun 10', action: 'Pruned', type: 'pruned', color: 'rose' }
    ],
    aiTip: {
      tip: 'Remove any yellowing leaves at the base to improve air circulation and keep the plant blooming beautifully.',
      guideLink: 'rose-care'
    },
    careInstructions: {
      detailedText: 'Roses require at least 6–8 hours of direct sunlight daily to maintain their vibrant color and bloom strength. They prefer well-draining, slightly acidic soil enriched with organic matter. Water deeply at the base of the plant to avoid wetting the foliage, which can lead to fungal diseases like black spot or powdery mildew. Deadhead spent blooms to encourage new growth and apply a balanced rose fertilizer every 4–6 weeks during the growing season.',
      water: 'Regularly',
      light: 'Bright Indirect',
      temp: '65–80°F',
      air: 'Well Ventilated'
    },
    bioSignature: {
      stomatalConductance: '0.42 mol/m²·s (Optimal)',
      chlorophyllFluorescence: 'Fv/Fm = 0.83 (Pristine)',
      turgorPressure: '0.85 MPa (Full Hydration)',
      photoperiodicPhase: 'Diurnal Peak Synthesis',
      cellularHydrationIndex: 96,
      metabolicEfficiency: 94
    }
  },
  {
    id: 'plant-monstera-02',
    name: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    nickname: 'Swiss Cheese King',
    matchScore: 99.4,
    confidence: 'High Confidence',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=1200&q=85'
    ],
    healthScore: 92,
    vigorIndexLabel: 'Vigor Index',
    mood: 'Thriving',
    hydrationStatus: 'Optimal',
    pathologyRisk: 'Low Risk',
    neuralStress: 'Minimal',
    aiAssessment: {
      mood: 'Thriving',
      points: [
        'New fenestrated leaf node actively unfurling',
        'Strong aerial root development anchored properly',
        'Vibrant dark green chlorophyll distribution'
      ]
    },
    priorityAdjustments: {
      soilHydro: 'Moist but well aerated; water thoroughly once top 2 inches dry',
      luminance: 'Bright, dappled indirect light to prevent leaf scorching'
    },
    weatherInsight: {
      city: 'Bhimavaram',
      condition: 'Tropical Humidity',
      temp: 29,
      humidity: 73,
      advice: 'High humidity is ideal for Monstera fenestration. Mist foliage lightly.'
    },
    careEssentials: {
      water: 'Weekly',
      light: 'Filtered Sunlight',
      temp: '68–85°F',
      air: 'Moderate Humidity',
      summary: 'Remarkable tropical specimen showing pristine fenestrations without edge browning. Aerial roots exhibit robust lignification.',
      userRating: 5
    },
    healthOverview: {
      period: 'This Week',
      trend: [
        { date: 'May 14', score: 75, mood: 'Good' },
        { date: 'May 21', score: 80, mood: 'Good' },
        { date: 'May 28', score: 86, mood: 'Thriving' },
        { date: 'Jun 04', score: 90, mood: 'Thriving' },
        { date: 'Jun 11', score: 92, mood: 'Thriving' }
      ],
      lastWatered: '3 days ago',
      lastFertilized: '14 days ago',
      nextWatering: 'In 3–4 days',
      nextPruning: 'In 20 days'
    },
    timeline: [
      { date: 'May 10', action: 'Identified', type: 'identified', color: 'emerald' },
      { date: 'May 20', action: 'Watered', type: 'watered', color: 'emerald' },
      { date: 'Jun 01', action: 'Rotated', type: 'rotated', color: 'amber' },
      { date: 'Jun 08', action: 'Misted', type: 'watered', color: 'emerald' }
    ],
    aiTip: {
      tip: 'Wipe leaves monthly with a damp cloth to remove dust and maximize photosynthetic absorption.',
      guideLink: 'monstera-care'
    },
    careInstructions: {
      detailedText: 'Monstera deliciosa thrives in warm, humid conditions with generous indirect sunlight. Plant in a loose, peat-based potting mix with perlite or orchid bark. Water when the top half of the soil feels dry, allowing excess moisture to drain freely. Support climbing growth with a sturdy moss pole.',
      water: 'Weekly',
      light: 'Bright Indirect',
      temp: '68–85°F',
      air: 'High Humidity'
    },
    bioSignature: {
      stomatalConductance: '0.38 mol/m²·s',
      chlorophyllFluorescence: 'Fv/Fm = 0.81',
      turgorPressure: '0.90 MPa',
      photoperiodicPhase: 'Vegetative Foliage Surge',
      cellularHydrationIndex: 94,
      metabolicEfficiency: 92
    }
  },
  {
    id: 'plant-peacelily-03',
    name: 'Peace Lily',
    scientificName: 'Spathiphyllum',
    nickname: 'Serena',
    matchScore: 98.6,
    confidence: 'High Confidence',
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=1000&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=1200&q=85'
    ],
    healthScore: 88,
    vigorIndexLabel: 'Vigor Index',
    mood: 'Content',
    hydrationStatus: 'Optimal',
    pathologyRisk: 'Low Risk',
    neuralStress: 'Minimal',
    aiAssessment: {
      mood: 'Content',
      points: [
        'White spathes holding upright posture',
        'Deep emerald leaf sheen with minimal tip burn',
        'Soil moisture retention is balanced'
      ]
    },
    priorityAdjustments: {
      soilHydro: 'Keep consistently damp; avoid letting soil dry out completely',
      luminance: 'Low to moderate indirect light; direct rays will scorch spathes'
    },
    weatherInsight: {
      city: 'Bhimavaram',
      condition: 'Warm Ambient',
      temp: 29,
      humidity: 73,
      advice: 'Humid conditions are perfect for Peace Lilies. Keep away from air conditioners.'
    },
    careEssentials: {
      water: 'Twice Weekly',
      light: 'Low to Medium',
      temp: '65–75°F',
      air: 'Humid & Draft-Free',
      summary: 'Healthy indoor spathe with pure white blooms and glossy lanceolate leaves. Natural air purifier functioning at peak capacity.',
      userRating: 5
    },
    healthOverview: {
      period: 'This Week',
      trend: [
        { date: 'May 14', score: 65, mood: 'Drooping' },
        { date: 'May 21', score: 78, mood: 'Recovered' },
        { date: 'May 28', score: 82, mood: 'Content' },
        { date: 'Jun 04', score: 85, mood: 'Content' },
        { date: 'Jun 11', score: 88, mood: 'Content' }
      ],
      lastWatered: '1 day ago',
      lastFertilized: '21 days ago',
      nextWatering: 'In 1–2 days',
      nextPruning: 'In 30 days'
    },
    timeline: [
      { date: 'May 15', action: 'Identified', type: 'identified', color: 'emerald' },
      { date: 'May 25', action: 'Watered', type: 'watered', color: 'emerald' },
      { date: 'Jun 05', action: 'Cleaned Spathes', type: 'pruned', color: 'rose' }
    ],
    aiTip: {
      tip: 'Use filtered or dechlorinated water to prevent brown leaf tips on your Peace Lily.',
      guideLink: 'peace-lily-care'
    },
    careInstructions: {
      detailedText: 'Peace lilies are tolerant of low light levels and communicate dehydration by drooping dramatically before recovering quickly when watered. Maintain even soil moisture without waterlogging. Keep away from cold drafts.',
      water: 'Twice Weekly',
      light: 'Low to Medium',
      temp: '65–75°F',
      air: 'High Humidity'
    }
  },
  {
    id: 'plant-aloe-04',
    name: 'Aloe Vera',
    scientificName: 'Aloe barbadensis',
    nickname: 'Healer Succulent',
    matchScore: 99.1,
    confidence: 'High Confidence',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1000&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1200&q=85'
    ],
    healthScore: 94,
    vigorIndexLabel: 'Vigor Index',
    mood: 'Robust',
    hydrationStatus: 'Optimal',
    pathologyRisk: 'Minimal',
    neuralStress: 'None',
    aiAssessment: {
      mood: 'Robust',
      points: [
        'Plump, fleshy leaves packed with rich gel matrix',
        'No root rot or soft base discoloration detected',
        'Excellent offset pup propagation underway'
      ]
    },
    priorityAdjustments: {
      soilHydro: 'Soak and dry method; allow complete soil desiccation between waterings',
      luminance: 'Direct or intense bright sun exposure for thick leaf walls'
    },
    weatherInsight: {
      city: 'Bhimavaram',
      condition: 'Sunny Warm',
      temp: 29,
      humidity: 73,
      advice: 'Ensure terracotta pot is draining well after watering.'
    },
    careEssentials: {
      water: 'Bi-Weekly',
      light: 'Direct Sunlight',
      temp: '60–85°F',
      air: 'Dry & Well-Ventilated',
      summary: 'Thick succulent spears with firm outer margins and rich medicinal gel. Exhibits ideal drought tolerance adaptation.',
      userRating: 5
    },
    healthOverview: {
      period: 'This Week',
      trend: [
        { date: 'May 14', score: 90, mood: 'Robust' },
        { date: 'May 21', score: 91, mood: 'Robust' },
        { date: 'May 28', score: 93, mood: 'Robust' },
        { date: 'Jun 04', score: 94, mood: 'Robust' },
        { date: 'Jun 11', score: 94, mood: 'Robust' }
      ],
      lastWatered: '8 days ago',
      lastFertilized: '40 days ago',
      nextWatering: 'In 6 days',
      nextPruning: 'In 45 days'
    },
    timeline: [
      { date: 'May 01', action: 'Identified', type: 'identified', color: 'emerald' },
      { date: 'May 18', action: 'Watered', type: 'watered', color: 'emerald' },
      { date: 'Jun 02', action: 'Offset Pups Harvested', type: 'pruned', color: 'rose' }
    ],
    aiTip: {
      tip: 'Plant in unglazed terracotta with sandy cactus soil to promote rapid root aeration.',
      guideLink: 'aloe-care'
    },
    careInstructions: {
      detailedText: 'Aloe Vera requires very little water and maximum sunlight. Plant in well-draining cactus/succulent soil. Water deeply once every 2–3 weeks, allowing soil to dry out completely. Overwatering is the primary cause of root rot.',
      water: 'Bi-Weekly',
      light: 'Direct Sunlight',
      temp: '60–85°F',
      air: 'Dry & Aerated'
    }
  },
  {
    id: 'plant-rubber-05',
    name: 'Rubber Plant',
    scientificName: 'Ficus elastica',
    nickname: 'Burgundy Giant',
    matchScore: 98.9,
    confidence: 'High Confidence',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=1000&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=1200&q=85'
    ],
    healthScore: 91,
    vigorIndexLabel: 'Vigor Index',
    mood: 'Sturdy',
    hydrationStatus: 'Optimal',
    pathologyRisk: 'Low Risk',
    neuralStress: 'Minimal',
    aiAssessment: {
      mood: 'Sturdy',
      points: [
        'Broad leathery burgundy leaves in prime condition',
        'Strong central stem with upward apical dominance',
        'Healthy apical bud sheath ready for next leaf cycle'
      ]
    },
    priorityAdjustments: {
      soilHydro: 'Let top 2 inches dry out; avoid standing water in saucer',
      luminance: 'Bright indirect light for deep leaf pigment preservation'
    },
    weatherInsight: {
      city: 'Bhimavaram',
      condition: 'Balmy Breeze',
      temp: 29,
      humidity: 73,
      advice: 'Good light conditions today will boost Ficus leaf gloss.'
    },
    careEssentials: {
      water: 'Every 7–10 Days',
      light: 'Bright Filtered',
      temp: '65–80°F',
      air: 'Moderate Humidity',
      summary: 'Impressive architectural houseplant with high glossy shine and stout vertical trunk. Excellent air purification.',
      userRating: 4
    },
    healthOverview: {
      period: 'This Week',
      trend: [
        { date: 'May 14', score: 80, mood: 'Good' },
        { date: 'May 21', score: 84, mood: 'Sturdy' },
        { date: 'May 28', score: 87, mood: 'Sturdy' },
        { date: 'Jun 04', score: 89, mood: 'Sturdy' },
        { date: 'Jun 11', score: 91, mood: 'Sturdy' }
      ],
      lastWatered: '4 days ago',
      lastFertilized: '18 days ago',
      nextWatering: 'In 3–5 days',
      nextPruning: 'In 25 days'
    },
    timeline: [
      { date: 'May 05', action: 'Identified', type: 'identified', color: 'emerald' },
      { date: 'May 19', action: 'Watered', type: 'watered', color: 'emerald' },
      { date: 'Jun 04', action: 'Leaf Polished', type: 'rotated', color: 'amber' }
    ],
    aiTip: {
      tip: 'Prune the top stem during active spring growth to encourage fuller bushy branching.',
      guideLink: 'ficus-care'
    },
    careInstructions: {
      detailedText: 'Ficus elastica prefers bright, indirect light and a well-draining potting medium. Allow the soil surface to dry between waterings. Protect from cold windows and sudden temperature fluctuations.',
      water: 'Every 7–10 Days',
      light: 'Bright Filtered',
      temp: '65–80°F',
      air: 'Moderate Humidity'
    }
  }
];
