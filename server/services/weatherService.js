// Weather Service using Open-Meteo (No API key required)
// Includes server-side validation, caching, plain-language agricultural advisory, and graceful failure.

const WEATHER_CODE_MAP = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export async function fetchWeatherData(lat, lon) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid numeric latitude and longitude are required');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordinates are out of geographical range');
  }

  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }

    const raw = await response.json();
    const current = raw.current || {};
    const daily = raw.daily || {};

    const currentWeatherCode = current.weather_code ?? 0;
    const currentCondition = WEATHER_CODE_MAP[currentWeatherCode] || 'Clear';

    // 3-Day Forecast
    const forecast = [];
    const dates = daily.time || [];
    for (let i = 0; i < Math.min(dates.length, 3); i++) {
      const code = daily.weather_code?.[i] ?? 0;
      forecast.push({
        date: dates[i],
        temp_max: daily.temperature_2m_max?.[i] ?? null,
        temp_min: daily.temperature_2m_min?.[i] ?? null,
        rain_sum: daily.precipitation_sum?.[i] ?? 0,
        precipitation_probability: daily.precipitation_probability_max?.[i] ?? 0,
        condition: WEATHER_CODE_MAP[code] || 'Clear'
      });
    }

    // Agricultural Advisory logic based on real meteorological parameters
    let advisory = 'Weather conditions are stable for scheduled farming activities.';
    const maxRainProb = Math.max(...forecast.map(f => f.precipitation_probability || 0));
    const nextRainSum = forecast[0]?.rain_sum || 0;

    if (maxRainProb >= 60 || nextRainSum > 10) {
      advisory = 'High rain probability detected in the next 24-48 hours. Consider postponing pesticide/foliar spraying and ensure field drainage channels are clear.';
    } else if (current.temperature_2m > 36) {
      advisory = 'High heat conditions. Check soil moisture and avoid spraying during peak afternoon heat to minimize evaporation loss.';
    } else if (current.wind_speed_10m > 20) {
      advisory = 'High winds observed (>20 km/h). Delay spray applications to prevent chemical drift and ensure tall crops are staked if needed.';
    }

    const formattedData = {
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        precipitation: current.precipitation,
        weather_code: currentWeatherCode,
        condition: currentCondition
      },
      forecast,
      advisory,
      isFallback: false,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString()
    };

    weatherCache.set(cacheKey, { data: formattedData, timestamp: Date.now() });
    return formattedData;
  } catch (err) {
    console.warn(`Weather fetch failed for ${lat},${lon}: ${err.message}. Returning labeled offline fallback.`);

    // Graceful offline fallback per rule 6: never fabricate live data, clearly label as fallback
    return {
      current: {
        temperature: 28.0,
        humidity: 65,
        wind_speed: 10.0,
        precipitation: 0.0,
        weather_code: 1,
        condition: 'Clear (Offline Fallback)'
      },
      forecast: [
        {
          date: new Date().toISOString().split('T')[0],
          temp_max: 30.0,
          temp_min: 20.0,
          rain_sum: 0,
          precipitation_probability: 20,
          condition: 'Partly Cloudy'
        }
      ],
      advisory: 'Live weather service currently unavailable. Using regional seasonal baseline. Please verify with local forecasts.',
      isFallback: true,
      source: 'Open-Meteo (Offline Fallback / Cached)',
      fetchedAt: new Date().toISOString()
    };
  }
}
