import { WeatherData } from '../services/weather';
import { DashboardPlant } from '../types/botanical';

export interface WeatherDynamicCare {
  waterAdvice: string;
  lightAdvice: string;
  tempAdvice: string;
  airAdvice: string;
  summary: string;
  isLowHumidity: boolean;
  mistingRecommendation: string;
  humidityDeltaNotice?: string;
  urgencyLevel: 'optimal' | 'moderate' | 'critical';
}

/**
 * Dynamically computes adjusted Care Essentials advice calibrated to the active plant and local ambient weather metrics.
 */
export function calculateDynamicCareEssentials(
  plant: DashboardPlant,
  weather: { city: string; condition: string; temp: number; humidity: number }
): WeatherDynamicCare {
  const humidity = weather.humidity;
  const temp = weather.temp;
  const condition = (weather.condition || '').toLowerCase();
  const plantName = plant.nickname || plant.name;

  const isLowHumidity = humidity < 40;
  const isVeryDry = humidity < 25;
  const isHighHumidity = humidity > 75;
  const isHot = temp >= 30;
  const isCold = temp < 15;
  const isRainy = condition.includes('rain') || condition.includes('drizzle');

  let urgencyLevel: 'optimal' | 'moderate' | 'critical' = 'optimal';
  if (isVeryDry || (isLowHumidity && isHot)) {
    urgencyLevel = 'critical';
  } else if (isLowHumidity || isHot || isCold) {
    urgencyLevel = 'moderate';
  }

  // 1. Dynamic Water Advice
  let waterAdvice = plant.careEssentials.water || 'Regularly';
  if (isLowHumidity && isHot) {
    waterAdvice = 'Every 1–2 days (High Evaporation)';
  } else if (isLowHumidity) {
    waterAdvice = 'Check soil every 2 days';
  } else if (isRainy || isHighHumidity) {
    waterAdvice = 'Moderate / Every 4–5 days';
  }

  // 2. Dynamic Light Advice
  let lightAdvice = plant.careEssentials.light || 'Bright Indirect';
  if (isHot && isLowHumidity) {
    lightAdvice = 'Filtered / Shaded from scorching noon rays';
  } else if (condition.includes('cloud') || condition.includes('overcast')) {
    lightAdvice = 'Max Ambient Daylight / Bright Window';
  }

  // 3. Dynamic Temp Advice
  let tempAdvice = `${temp}°C (${temp >= 18 && temp <= 28 ? 'Optimal Range' : temp > 28 ? 'Elevated Heat' : 'Cooler Air'})`;

  // 4. Dynamic Air / Humidity Advice
  let airAdvice = plant.careEssentials.air || 'Well Ventilated';
  if (isLowHumidity) {
    airAdvice = `Dry Air (${humidity}%) • Boost Misting 2x Daily`;
  } else if (isHighHumidity) {
    airAdvice = `High Humidity (${humidity}%) • Ensure Air Flow`;
  } else {
    airAdvice = `Balanced (${humidity}%) • Good Circulation`;
  }

  // 5. Dynamic Misting Recommendation
  let mistingRecommendation = '';
  if (isVeryDry) {
    mistingRecommendation = `Critical dry air alert (${humidity}% humidity in ${weather.city}). Immediate deep foliar misting recommended morning and evening to maintain cellular turgor.`;
  } else if (isLowHumidity) {
    mistingRecommendation = `Local humidity in ${weather.city} has dropped to ${humidity}% (below the 40% botanical threshold). Increase foliar misting for ${plantName} to 2–3 times daily or place a pebble tray to prevent foliar crisping.`;
  } else {
    mistingRecommendation = `Ambient humidity at ${humidity}% is in the comfortable growth zone for ${plantName}. Maintain standard hydration cycles.`;
  }

  // 6. Dynamic Narrative Summary
  let summary = '';
  if (isLowHumidity && isHot) {
    summary = `Atmospheric sensors in ${weather.city} detect arid conditions (${humidity}% humidity, ${temp}°C). The rate of transpirational water loss in ${plantName} is elevated. Increase leaf misting, verify potting moisture depth, and shield tender petal margins from desiccating heat.`;
  } else if (isLowHumidity) {
    summary = `Microclimate update for ${weather.city}: Ambient humidity is currently ${humidity}% (<40% threshold). ${plantName} requires supplemental foliar misting or proximity humidity buffering to sustain peak leaf turgidity and avoid edge browning.`;
  } else if (isRainy) {
    summary = `Rainy conditions in ${weather.city} with ${humidity}% humidity. High ambient moisture lowers transpiration. Hold off on additional watering today to protect ${plantName}'s roots against over-saturation.`;
  } else {
    summary = plant.careEssentials.summary || `Current ambient parameters in ${weather.city} (${temp}°C, ${humidity}% RH) are supportive for ${plantName}. Continue regular care and balanced illumination.`;
  }

  return {
    waterAdvice,
    lightAdvice,
    tempAdvice,
    airAdvice,
    summary,
    isLowHumidity,
    mistingRecommendation,
    humidityDeltaNotice: isLowHumidity ? `Humidity is ${40 - humidity}% below optimal 40% baseline` : undefined,
    urgencyLevel
  };
}
