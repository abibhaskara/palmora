import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

const DataContext = createContext(null);

const WEATHER_STATES = ['sunny', 'rainy', 'night'];

const ZONE_DATA = [
  { id: 'A', name: 'PALMORA 1', area: '12.5 ha', trees: 450, status: 'healthy' },
  { id: 'B', name: 'PALMORA 2', area: '10.2 ha', trees: 380, status: 'warning' },
  { id: 'C', name: 'PALMORA 3', area: '14.8 ha', trees: 520, status: 'healthy' },
  { id: 'D', name: 'PALMORA 4', area: '8.6 ha', trees: 310, status: 'critical' },
];

const GROWTH_DATA = [
  { month: 'Aug', growth: 72, target: 80 },
  { month: 'Sep', growth: 78, target: 80 },
  { month: 'Oct', growth: 85, target: 80 },
  { month: 'Nov', growth: 82, target: 85 },
  { month: 'Dec', growth: 90, target: 85 },
  { month: 'Jan', growth: 88, target: 85 },
  { month: 'Feb', growth: 92, target: 90 },
];

function generateSensorHistory(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      time: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      soil: Math.floor(Math.random() * (85 - 55) + 55),
      uv: parseFloat((Math.random() * (9 - 3) + 3).toFixed(1)),
      temp: parseFloat((Math.random() * (33 - 26) + 26).toFixed(1)),
      humidity: Math.floor(Math.random() * (95 - 65) + 65)
    });
  }
  return data;
}
const INITIAL_HISTORY = generateSensorHistory(30);

// Removed hardcoded ALERTS array to use Supabase instead.

function randomBetween(min, max, decimal = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimal));
}

/**
 * Compute plant health score (0–100) from sensor readings.
 *
 * Scoring per parameter — gaussian-like penalty the further from optimal:
 *   soilMoisture : optimal 60–80%  (palm oil range)
 *   humidity     : optimal 70–90%  (transpiration stress below 50%)
 *   temperature  : optimal 24–32°C (metabolic optimum)
 *   lightLevel   : passed as 0–100 normalised index from backend
 *
 * Weights reflect relative importance for palm oil health.
 */
function computeHealthScore({ soilMoisture, humidity, temperature, lightLevel }) {
  // Returns 0–100: 100 inside [lo, hi], linearly penalised outside
  const rangeScore = (val, lo, hi, warnLow, warnHigh) => {
    if (val >= lo && val <= hi) return 100;
    if (val < lo)   return Math.max(0, 100 - ((lo - val)  / (lo - warnLow))  * 100);
    return           Math.max(0, 100 - ((val - hi)        / (warnHigh - hi)) * 100);
  };

  const soilScore  = rangeScore(soilMoisture, 60,  80,  20,  100); // warn <20 or >100
  const humScore   = rangeScore(humidity,     70,  90,  30,  100);
  const tempScore  = rangeScore(temperature,  24,  32,  10,   45);
  // lightLevel from backend: assume 0–100 index (higher = more light available)
  // Optimal range 40–80 (not too dim, not sunburnt)
  const lightScore = lightLevel != null
    ? rangeScore(lightLevel, 40, 80, 0, 100)
    : null;

  // Weighted average — drop lightScore if unavailable
  if (lightScore != null) {
    return parseFloat(
      (soilScore * 0.35 + humScore * 0.25 + tempScore * 0.25 + lightScore * 0.15).toFixed(0)
    );
  }
  return parseFloat(
    (soilScore * 0.40 + humScore * 0.30 + tempScore * 0.30).toFixed(0)
  );
}



/**
 * WMO weather code → { description, emoji }
 * https://open-meteo.com/en/docs#weathervariables
 */
function getWmoInfo(code, isDay) {
  if (code === 0)          return { desc: 'Clear Sky',      emoji: isDay ? '☀️' : '🌙' };
  if (code <= 2)           return { desc: 'Partly Cloudy',  emoji: isDay ? '⛅' : '🌙' };
  if (code === 3)          return { desc: 'Overcast',        emoji: '☁️' };
  if (code <= 48)          return { desc: 'Foggy',           emoji: '🌫️' };
  if (code <= 57)          return { desc: 'Drizzle',         emoji: '🌦️' };
  if (code <= 67)          return { desc: 'Rain',            emoji: '🌧️' };
  if (code <= 77)          return { desc: 'Snow',            emoji: '❄️' };
  if (code <= 82)          return { desc: 'Rain Showers',    emoji: '🌧️' };
  if (code <= 86)          return { desc: 'Snow Showers',    emoji: '❄️' };
  return                          { desc: 'Thunderstorm',    emoji: '⛈️' };
}

/** WMO code + isDay → sunny / rainy / night theme state */
function mapWmoToTheme(code, isDay) {
  if (code >= 51) return 'rainy';   // all precipitation
  if (!isDay)     return 'night';
  return 'sunny';
}

export function DataProvider({ children }) {
  const [weatherState, setWeatherState] = useState('sunny');
  const [realWeather, setRealWeather] = useState({
    city: null,
    country: null,
    description: null,
    emoji: null,
    temp: null,
    feelsLike: null,
    humidity: null,
    windSpeed: null,
    uvIndex: null,
    loading: true,
    error: null,
  });

  const [sensorData, setSensorData] = useState({
    soilMoisture: 67,
    temperature: 31,
    humidity: 78,
    uvIndex: 7.2,
    rainfall: 0,
    windSpeed: 12,
    healthScore: 85,
  });
  const [solarPower, setSolarPower] = useState({
    percentage: 82,
    solarOutput: 4.2,
    piezoOutput: 0.3,
    totalCapacity: 5.0,
    charging: true,
  });
  const [sprinklers, setSprinklers] = useState({
    A: false, B: false, C: false, D: false,
  });
  const [zones] = useState(ZONE_DATA);
  const [growthData] = useState(GROWTH_DATA);
  const [sensorHistory] = useState(INITIAL_HISTORY);
  const [alerts, setAlerts] = useState([]);
  // harvestInfo is now owned by UserContext (derived from plant type + plantedAt)


  // Backend integration (Supabase)
  const { user } = useUser();
  const [nodes, setNodes] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const backendConnectedRef = useRef(false);

  const fetchSensorData = useCallback(async () => {
    if (!user?.plantId) return;

    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('plant_id', user.plantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return;

      const latest = data[0];

      setSensorData(prev => ({
        ...prev,
        soilMoisture: latest.soil_moisture,
        temperature: latest.temperature,
        humidity: latest.humidity,
        uvIndex: latest.uv_index,
        windSpeed: latest.wind_speed,
        healthScore: latest.health_score,
      }));

      if (!backendConnectedRef.current) {
        console.info('[PALMORA API] Connected to Supabase DB');
        backendConnectedRef.current = true;
        setBackendConnected(true);
      }
    } catch (err) {
      if (backendConnectedRef.current) {
        console.warn('[PALMORA API] Database unreachable:', err.message);
        backendConnectedRef.current = false;
        setBackendConnected(false);
      }
    }
  }, [user?.plantId]);

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        // Map postgres schema to UI schema
        setAlerts(data.map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          zone: 'PALMORA 1', // mock zone for now
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: a.is_read
        })));
      }
    } catch (err) {
      console.error('Error fetching alerts:', err.message);
    }
  }, [user?.id]);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    if (!user?.plantId) return;
    
    fetchSensorData();
    fetchAlerts();
    
    const sensorChannel = supabase
      .channel('sensor-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `plant_id=eq.${user.plantId}`,
        },
        (payload) => {
          const newRow = payload.new;
          setSensorData(prev => ({
            ...prev,
            soilMoisture: newRow.soil_moisture,
            temperature: newRow.temperature,
            humidity: newRow.humidity,
            uvIndex: newRow.uv_index,
            windSpeed: newRow.wind_speed,
            healthScore: newRow.health_score,
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !backendConnectedRef.current) {
           backendConnectedRef.current = true;
           setBackendConnected(true);
        }
      });

    const alertChannel = supabase
      .channel('alert-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const a = payload.new;
          const newAlert = {
            id: a.id,
            type: a.type,
            title: a.title,
            zone: 'PALMORA 1',
            time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: a.is_read
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sensorChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [user?.plantId, user?.id, fetchSensorData, fetchAlerts]);

  /**
   * Fetch real weather from Open-Meteo (no API key) +
   * city name from Nominatim (OpenStreetMap, no API key)
   */
  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      // 1️⃣  Weather data — Open-Meteo (completely free, no key)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
        `&hourly=uv_index&forecast_days=1` +
        `&wind_speed_unit=kmh&timezone=auto`
      );
      if (!weatherRes.ok) throw new Error(`Open-Meteo error ${weatherRes.status}`);
      const wData = await weatherRes.json();

      const cur = wData.current;
      const code = cur.weather_code;
      const isDay = cur.is_day === 1;

      // UV index: grab current hour from hourly array
      const currentHour = new Date().getHours();
      const uvIndex = wData.hourly?.uv_index?.[currentHour] ?? null;

      const { desc, emoji } = getWmoInfo(code, isDay);
      const theme = mapWmoToTheme(code, isDay);

      // 2️⃣  City name — Nominatim reverse geocode (free, no key)
      let city = null, country = null;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'PALMORA/1.0' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          city = geoData.address?.city
            || geoData.address?.town
            || geoData.address?.village
            || geoData.address?.county
            || null;
          country = geoData.address?.country_code?.toUpperCase() ?? null;
        }
      } catch { /* city stays null — non-fatal */ }

      const realTemp = Math.round(cur.temperature_2m);
      const realHumidity = Math.round(cur.relative_humidity_2m);
      const realWind = Math.round(cur.wind_speed_10m);
      const realUv = uvIndex !== null ? parseFloat(uvIndex.toFixed(1)) : null;

      setWeatherState(theme);
      setRealWeather({
        city,
        country,
        description: desc,
        emoji,
        temp: realTemp,
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: realHumidity,
        windSpeed: realWind,
        uvIndex: realUv,
        loading: false,
        error: null,
      });

      // Seed sensor data with actual readings
      setSensorData(prev => ({
        ...prev,
        temperature: cur.temperature_2m,
        humidity: realHumidity,
        rainfall: theme === 'rainy' ? randomBetween(2, 15) : 0,
        windSpeed: realWind,
        uvIndex: realUv ?? (isDay ? randomBetween(4, 9) : 0),
      }));
    } catch (err) {
      setRealWeather(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  // Auto-detect location on mount, refresh every 10 minutes
  useEffect(() => {
    const doFetch = () => {
      if (!navigator.geolocation) {
        setRealWeather(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => setRealWeather(prev => ({
          ...prev, loading: false,
          error: 'Location access denied — using demo data',
        })),
        { timeout: 10000 }
      );
    };

    doFetch();
    const refresh = setInterval(doFetch, 10 * 60 * 1000);
    return () => clearInterval(refresh);
  }, [fetchWeather]);

  // Real-time sensor micro-fluctuations (stays in sync with real seeded values)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => {
        const next = {
          soilMoisture: Math.max(20, Math.min(95, prev.soilMoisture + randomBetween(-2, 2))),
          temperature: Math.max(15, Math.min(45, prev.temperature + randomBetween(-0.2, 0.2))),
          humidity: Math.max(30, Math.min(99, prev.humidity + randomBetween(-0.3, 0.3))),
          uvIndex: Math.max(0, Math.min(11, prev.uvIndex + randomBetween(-0.1, 0.1))),
          rainfall: weatherState === 'rainy' ? randomBetween(0, 15) : 0,
          windSpeed: Math.max(0, Math.min(80, prev.windSpeed + randomBetween(-0.5, 0.5))),
        };
        // Recalculate health score from actual sensor values (lightLevel not available here)
        next.healthScore = computeHealthScore({
          soilMoisture: next.soilMoisture,
          humidity:     next.humidity,
          temperature:  next.temperature,
          lightLevel:   null,
        });
        return next;
      });

      setSolarPower(prev => ({
        ...prev,
        percentage: Math.max(10, Math.min(100, prev.percentage + randomBetween(-0.5, 0.8))),
        solarOutput: weatherState === 'night' ? 0 : randomBetween(2, 5),
        piezoOutput: weatherState === 'rainy' ? randomBetween(0.2, 1.2) : randomBetween(0, 0.3),
        charging: weatherState !== 'night',
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [weatherState]);

  const toggleSprinkler = useCallback((zoneId) => {
    setSprinklers(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }, []);

  const cycleWeather = useCallback(() => {
    setWeatherState(prev => {
      const idx = WEATHER_STATES.indexOf(prev);
      return WEATHER_STATES[(idx + 1) % WEATHER_STATES.length];
    });
  }, []);

  const markAlertRead = useCallback(async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    try {
      await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    } catch (e) {
      console.error('Failed to mark alert as read', e);
    }
  }, []);

  const unreadAlertCount = alerts.filter(a => !a.read).length;

  return (
    <DataContext.Provider value={{
      weatherState,
      setWeatherState,
      cycleWeather,
      realWeather,
      sensorData,
      solarPower,
      sprinklers,
      toggleSprinkler,
      zones,
      growthData,
      sensorHistory,
      alerts,
      markAlertRead,
      unreadAlertCount,
      nodes,
      backendConnected,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
