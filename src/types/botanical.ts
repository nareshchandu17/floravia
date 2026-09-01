export interface DashboardPlant {
  id: string;
  name: string;
  scientificName: string;
  nickname?: string;
  matchScore: number;
  confidence: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
  imageUrl: string;
  galleryImages: string[];
  healthScore: number;
  vigorIndexLabel: string;
  mood: string;
  hydrationStatus: 'Optimal' | 'Excellent' | 'Dry' | 'Overwatered';
  pathologyRisk: 'Low Risk' | 'Minimal' | 'Moderate' | 'High Risk';
  neuralStress: 'Minimal' | 'None' | 'Moderate' | 'High';
  aiAssessment: {
    mood: string;
    points: string[];
  };
  priorityAdjustments: {
    soilHydro: string;
    luminance: string;
  };
  weatherInsight: {
    city: string;
    condition: string;
    temp: number;
    humidity: number;
    advice: string;
  };
  careEssentials: {
    water: string;
    light: string;
    temp: string;
    air: string;
    summary: string;
    userRating?: number;
  };
  healthOverview: {
    period: string;
    trend: { date: string; score: number; mood?: string }[];
    lastWatered: string;
    lastFertilized: string;
    nextWatering: string;
    nextPruning: string;
  };
  timeline: {
    date: string;
    action: string;
    type: 'identified' | 'watered' | 'fertilized' | 'pruned' | 'rotated';
    color: string;
  }[];
  aiTip: {
    tip: string;
    guideLink?: string;
  };
  careInstructions: {
    detailedText: string;
    water: string;
    light: string;
    temp: string;
    air: string;
  };
  bioSignature?: {
    stomatalConductance: string;
    chlorophyllFluorescence: string;
    turgorPressure: string;
    photoperiodicPhase: string;
    cellularHydrationIndex: number;
    metabolicEfficiency: number;
  };
}

export interface CareCalendarEvent {
  id: string;
  plantId: string;
  plantName: string;
  scientificName?: string;
  type: 'water' | 'fertilize' | 'prune' | 'mist' | 'repot';
  date: string;
  time?: string;
  completed: boolean;
  notes?: string;
  googleEventId?: string;
  googleCalendarSynced?: boolean;
  googleCalendarHtmlLink?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'Fertilizers' | 'Tools' | 'Pots & Soil' | 'Smart Sensors';
  price: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  inStock: boolean;
}
