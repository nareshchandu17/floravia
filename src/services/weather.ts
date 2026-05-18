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
