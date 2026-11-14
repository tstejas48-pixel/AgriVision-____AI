// Weather via Open-Meteo (free, no API key). Falls back to clearly-labelled sample data when offline.
const CACHE_KEY = 'agrivision.weather.v1';
const TTL = 30 * 60 * 1000;

export const WMO = (code) => {
  if (code === 0) return { text: 'Clear sky', icon: 'sun' };
  if (code <= 2) return { text: 'Partly cloudy', icon: 'sun' };
  if (code === 3) return { text: 'Cloudy', icon: 'cloud' };
  if (code === 45 || code === 48) return { text: 'Foggy', icon: 'cloud' };
  if (code >= 51 && code <= 67) return { text: 'Rain', icon: 'rain' };
  if (code >= 71 && code <= 77) return { text: 'Cold / snow', icon: 'cloud' };
  if (code >= 80 && code <= 82) return { text: 'Rain showers', icon: 'rain' };
  if (code >= 95) return { text: 'Thunderstorm', icon: 'rain' };
  return { text: 'Cloudy', icon: 'cloud' };
};

async function getJSON(url, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function geocode(district, state) {
  const tryName = async (name) => {
    const d = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`);
    const list = (d.results || []).filter((r) => r.country_code === 'IN');
    return list.find((r) => state && r.admin1 && r.admin1.toLowerCase().includes(state.toLowerCase().split(' ')[0])) || list[0];
  };
  return (district && (await tryName(district))) || (state && (await tryName(state))) || null;
}

export function sample() {
  return {
    sample: true,
    place: 'Sample location',
    temp: 29, humidity: 62, wind: 9, rainChance: 20, code: 1,
    days: [
      { label: 'Today', max: 33, min: 22, rain: 20, code: 1 },
      { label: 'Tomorrow', max: 32, min: 22, rain: 30, code: 2 },
      { label: 'Day 3', max: 31, min: 21, rain: 55, code: 61 },
    ],
  };
}

export async function loadWeather(user, { force = false } = {}) {
  const key = `${user.district}|${user.state}`;
  if (!force) {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (c && c.key === key && Date.now() - c.at < TTL) return c.data;
    } catch { /* ignore */ }
  }
  try {
    const place = await geocode(user.district, user.state);
    // default: central India if user has no location (guest)
    const lat = place?.latitude ?? 23.25;
    const lon = place?.longitude ?? 77.41;
    const w = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
    );
    const labels = ['Today', 'Tomorrow', 'Day 3'];
    const data = {
      sample: false,
      place: place ? `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}` : 'Central India (default)',
      temp: Math.round(w.current.temperature_2m),
      humidity: Math.round(w.current.relative_humidity_2m),
      wind: Math.round(w.current.wind_speed_10m),
      code: w.current.weather_code,
      rainChance: w.daily.precipitation_probability_max?.[0] ?? 0,
      days: w.daily.time.map((_, i) => ({
        label: labels[i],
        max: Math.round(w.daily.temperature_2m_max[i]),
        min: Math.round(w.daily.temperature_2m_min[i]),
        rain: w.daily.precipitation_probability_max?.[i] ?? 0,
        code: w.daily.weather_code[i],
      })),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, at: Date.now(), data }));
    return data;
  } catch {
    return sample();
  }
}

/** Plain-language farming advice from the weather. */
export function advice(w) {
  if (w.rainChance >= 60) return { icon: 'rain', text: 'Rain is likely. Please don’t spray or add fertilizer today.' };
  if (w.wind >= 20) return { icon: 'wind', text: 'It is windy. Wait for calm air before spraying.' };
  if (w.temp >= 38) return { icon: 'thermometer', text: 'Very hot today. Water your crop in the evening.' };
  if (w.humidity >= 80) return { icon: 'alert', text: 'Air is very humid. Check leaves for fungus.' };
  return { icon: 'check', text: 'Good day for field work. Spray early morning or evening.' };
}
