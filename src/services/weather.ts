export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  city: string;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not set');
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  
  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    icon: data.weather[0].icon,
    humidity: data.main.humidity,
    city: data.name
  };
}

export async function getWeatherForecast(lat: number, lon: number): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return "Forecast data unavailable (API key missing).";

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) return "Forecast data currently unreachable.";

    const data = await response.json();
    // Summarize the next 3 days (approx 24 points if 3-hour intervals)
    const dailyForecasts = data.list.slice(0, 24); 
    const avgHumidity = Math.round(dailyForecasts.reduce((acc: number, curr: any) => acc + curr.main.humidity, 0) / dailyForecasts.length);
    const maxTemp = Math.max(...dailyForecasts.map((f: any) => f.main.temp));
    const rainyIntervals = dailyForecasts.filter((f: any) => f.weather[0].main.toLowerCase().includes('rain')).length;

    return `3-DAY_PROJECTION:
  - EXPECTED_PEAK_TEMP: ${Math.round(maxTemp)}°C
  - AGGREGATE_HUMIDITY_INDEX: ${avgHumidity}%
  - PRECIPITATION_PROBABILITY: ${rainyIntervals > 0 ? "HIGH" : "LOW"}`;
  } catch (err) {
    console.error("Forecast Error:", err);
    return "Error synthesizing forecast data.";
  }
}

export const POPULAR_CITY_WEATHER: Record<string, WeatherData> = {
  'Bhimavaram': { city: 'Bhimavaram', temp: 29, humidity: 73, condition: 'Clouds Conditions', icon: '04d' },
  'Phoenix (Arid Desert)': { city: 'Phoenix (Arid Desert)', temp: 34, humidity: 24, condition: 'Clear Sky / Arid', icon: '01d' },
  'Denver (Low Humidity)': { city: 'Denver (Low Humidity)', temp: 26, humidity: 32, condition: 'Dry Alpine Air', icon: '01d' },
  'Dubai (Dry Heat)': { city: 'Dubai (Dry Heat)', temp: 38, humidity: 28, condition: 'High Desert Heat', icon: '01d' },
  'Hyderabad': { city: 'Hyderabad', temp: 28, humidity: 55, condition: 'Partly Cloudy', icon: '02d' },
  'Bangalore': { city: 'Bangalore', temp: 25, humidity: 62, condition: 'Mild Breeze', icon: '03d' },
  'San Francisco': { city: 'San Francisco', temp: 18, humidity: 68, condition: 'Coastal Fog', icon: '50d' },
  'London': { city: 'London', temp: 19, humidity: 65, condition: 'Overcast Skies', icon: '04d' },
  'Tokyo': { city: 'Tokyo', temp: 24, humidity: 70, condition: 'Temperate Rain', icon: '10d' },
  'Singapore': { city: 'Singapore', temp: 31, humidity: 82, condition: 'Tropical Humidity', icon: '09d' },
  'Sydney': { city: 'Sydney', temp: 22, humidity: 58, condition: 'Sunny Oceanic', icon: '01d' },
};

export async function getWeatherForCity(cityName: string): Promise<WeatherData> {
  if (POPULAR_CITY_WEATHER[cityName]) {
    return POPULAR_CITY_WEATHER[cityName];
  }
  return {
    city: cityName,
    temp: 27,
    humidity: 50,
    condition: 'Pleasant Microclimate',
    icon: '02d'
  };
}

export function getWateringAdvice(weather: WeatherData, plantName: string): { advice: string; intensity: 'low' | 'medium' | 'high' } {
  // Simple heuristic logic for watering based on weather
  const isHot = weather.temp > 28;
  const isDry = weather.humidity < 40;
  const isRainy = weather.condition.toLowerCase().includes('rain');

  if (isRainy) {
    return {
      advice: `It's raining in ${weather.city}! Skip watering for ${plantName} today to avoid root rot.`,
      intensity: 'low'
    };
  }

  if (isHot && isDry) {
    return {
      advice: `High heat & low humidity in ${weather.city}. ${plantName} might need extra hydration today.`,
      intensity: 'high'
    };
  }

  if (isHot) {
    return {
      advice: `Warm weather today. Check if ${plantName}'s soil is dry.`,
      intensity: 'medium'
    };
  }

  return {
    advice: `Standard conditions in ${weather.city}. Follow your regular watering schedule for ${plantName}.`,
    intensity: 'medium'
  };
}

export interface MicroclimateActionItem {
  category: 'Sunlight' | 'Ventilation' | 'Hydration' | 'Atmosphere';
  headline: string;
  detail: string;
  badge: string;
  isWarning: boolean;
  iconType: 'sun' | 'wind' | 'droplet' | 'gauge';
}

export interface MicroclimateAdvice {
  city: string;
  temp: number;
  humidity: number;
  condition: string;
  headline: string;
  primaryAdvice: string;
  secondaryAdvice: string;
  sunlightAdvice: string;
  ventilationAdvice: string;
  hydrationAdvice: string;
  vpdIndex: string;
  vpdStatus: 'low' | 'optimal' | 'high';
  vpdDescription: string;
  urgencyLevel: 'caution' | 'warning' | 'optimal';
  actionItems: MicroclimateActionItem[];
  summary: string;
}

/**
 * Calculates tailored micro-climate advice for indoor & patio plants
 * based on ambient temperature, relative humidity, and weather conditions.
 */
export function getMicroclimateTailoredAdvice(weather: WeatherData, plantName: string = 'your plant'): MicroclimateAdvice {
  const { temp, humidity, condition, city } = weather;
  const isHot = temp >= 30;
  const isCold = temp < 18;
  const isHighHumidity = humidity >= 70;
  const isLowHumidity = humidity <= 38;
  const isSunny = condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sun') || condition.toLowerCase().includes('arid');
  const isRainy = condition.toLowerCase().includes('rain');

  // Vapor Pressure Deficit (VPD) in kPa:
  // Saturation vapor pressure: es = 0.61078 * exp((17.27 * T) / (T + 237.3))
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (humidity / 100);
  const vpdVal = Math.max(0.1, Number((es - ea).toFixed(2)));
  const vpdIndex = `${vpdVal} kPa`;

  let vpdStatus: 'low' | 'optimal' | 'high' = 'optimal';
  let vpdDescription = 'Optimal vegetative transpiration zone (0.8–1.2 kPa). Stomata operate at peak metabolic balance.';

  if (vpdVal < 0.6) {
    vpdStatus = 'low';
    vpdDescription = 'Low evaporative demand due to high ambient humidity. Stomatal transpiration is sluggish; moisture lingers on foliage.';
  } else if (vpdVal > 1.3) {
    vpdStatus = 'high';
    vpdDescription = 'High evaporative tension from arid conditions. Rapid moisture loss through foliage increases dehydration stress.';
  }

  // 1. Tailored Sunlight Advice:
  let sunlightAdvice = 'Provide bright, indirect sunlight. Ambient illumination is optimal for photosynthesis.';
  let sunlightBadge = 'Filtered Light';
  let sunlightIsWarning = false;

  if (isHot || (isSunny && temp >= 28)) {
    sunlightAdvice = 'Avoid direct sunlight today: High thermal irradiance may cause chlorophyll photo-oxidation and tip leaf scorch.';
    sunlightBadge = 'Avoid Direct Sunlight';
    sunlightIsWarning = true;
  } else if (isRainy || condition.toLowerCase().includes('cloud') || condition.toLowerCase().includes('overcast')) {
    sunlightAdvice = 'Diffused overcast light: Shift shade-tolerant and light-sensitive plants closer to ambient window exposure.';
    sunlightBadge = 'Diffused Light';
  }

  // 2. Tailored Ventilation Advice:
  let ventilationAdvice = 'Standard ambient airflow: Natural room circulation supports steady transpiration.';
  let ventilationBadge = 'Standard Airflow';
  let ventilationIsWarning = false;

  if (isHighHumidity) {
    ventilationAdvice = 'High humidity: Increase ventilation and room air exchange to discourage powdery mildew and fungal spore germination.';
    ventilationBadge = 'Increase Ventilation';
    ventilationIsWarning = true;
  } else if (isLowHumidity) {
    ventilationAdvice = 'Dry stagnant air: Shield foliage from active HVAC blowers and heater exhaust to prevent desiccating moisture loss.';
    ventilationBadge = 'Shield from Dry Drafts';
    ventilationIsWarning = true;
  }

  // 3. Tailored Hydration Advice:
  let hydrationAdvice = 'Standard hydration routine: Verify the top 2 inches of soil are dry before rehydrating.';
  let hydrationBadge = 'Standard Hydration';
  let hydrationIsWarning = false;

  if (isRainy) {
    hydrationAdvice = `Atmospheric moisture is high from rain in ${city}. Delay scheduled watering by 24–48 hours to preserve root oxygen.`;
    hydrationBadge = 'Delay Watering';
    hydrationIsWarning = false;
  } else if (isHot && isLowHumidity) {
    hydrationAdvice = 'Dual stress detected (High heat & dry air). Provide deep root hydration plus morning foliar misting.';
    hydrationBadge = 'Hydrate & Mist';
    hydrationIsWarning = true;
  } else if (isLowHumidity) {
    hydrationAdvice = 'Low humidity alert: Mist leaves or place a pebble humidity tray beneath the pot to maintain cellular turgor.';
    hydrationBadge = 'Foliar Misting Needed';
    hydrationIsWarning = true;
  }

  // 4. Determine Primary Headline:
  let headline = 'Balanced microclimate: Transpiration in equilibrium';
  let urgencyLevel: 'caution' | 'warning' | 'optimal' = 'optimal';

  if (isHighHumidity) {
    headline = 'High humidity: Increase ventilation';
    urgencyLevel = 'caution';
  } else if (isHot || (isSunny && temp >= 28)) {
    headline = 'Avoid direct sunlight today';
    urgencyLevel = 'warning';
  } else if (isLowHumidity) {
    headline = 'Low humidity: Boost ambient moisture';
    urgencyLevel = 'caution';
  } else if (isCold) {
    headline = 'Chilly microclimate: Guard against cold drafts';
    urgencyLevel = 'caution';
  }

  const actionItems: MicroclimateActionItem[] = [
    {
      category: 'Sunlight',
      headline: isHot || (isSunny && temp >= 28) ? 'Avoid direct sunlight today' : 'Maintain bright filtered exposure',
      detail: sunlightAdvice,
      badge: sunlightBadge,
      isWarning: sunlightIsWarning,
      iconType: 'sun'
    },
    {
      category: 'Ventilation',
      headline: isHighHumidity ? 'High humidity: Increase ventilation' : isLowHumidity ? 'Shield from drying air streams' : 'Circulate fresh ambient air',
      detail: ventilationAdvice,
      badge: ventilationBadge,
      isWarning: ventilationIsWarning,
      iconType: 'wind'
    },
    {
      category: 'Hydration',
      headline: isLowHumidity ? 'Elevate foliar misting' : isRainy ? 'Delay soil watering' : 'Standard hydration check',
      detail: hydrationAdvice,
      badge: hydrationBadge,
      isWarning: hydrationIsWarning,
      iconType: 'droplet'
    },
    {
      category: 'Atmosphere',
      headline: `Vapor Pressure Deficit: ${vpdIndex}`,
      detail: vpdDescription,
      badge: `${vpdStatus.toUpperCase()} VPD`,
      isWarning: vpdStatus !== 'optimal',
      iconType: 'gauge'
    }
  ];

  return {
    city,
    temp,
    humidity,
    condition,
    headline,
    primaryAdvice: headline,
    secondaryAdvice: isHighHumidity
      ? `Elevated moisture in ${city} (${humidity}% RH) slows natural foliar evaporation. Space canopies apart.`
      : isHot
        ? `Thermal peaks in ${city} (${temp}°C) risk foliar scorching. Filter direct solar rays through sheer curtains.`
        : isLowHumidity
          ? `Dry air detected in ${city} (${humidity}% RH). Mist leaves to maintain turgor pressure.`
          : `Current atmospheric parameters in ${city} (${temp}°C, ${humidity}% RH) provide a healthy vegetative window.`,
    sunlightAdvice,
    ventilationAdvice,
    hydrationAdvice,
    vpdIndex,
    vpdStatus,
    vpdDescription,
    urgencyLevel,
    actionItems,
    summary: `${city} Microclimate: ${headline}. Follow tailored sunlight, ventilation, and watering protocols to keep ${plantName} in optimal health.`
  };
}
