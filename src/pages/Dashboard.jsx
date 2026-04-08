
import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Droplets, Thermometer, Sun, Wind, Leaf, Zap, Bell, ChevronDown, Calendar, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavDirection } from '../App';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import SolarPowerGauge from '../components/SolarPowerGauge';
import './Dashboard.css';

import palmImg from '../assets/palm.png';


const TIME_RANGES = ['3 Days', '1 Week', '1 Month', 'Custom'];

const SENSOR_HISTORY = {
  '3 Days': [],
  '1 Week': [],
  '1 Month': [],
};

// Return empty data to reset the chart
const generateDailyData = () => {
  return [];
};

const DAILY_DATA = generateDailyData();
export default function Dashboard() {
  const { realWeather, sensorData, solarPower, growthData, alerts, markAlertRead } = useData();
  const { user, harvestInfo } = useUser();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { onNavChange } = useNavDirection();

  const plantPhoto = user?.plantPhotoUrl || palmImg;
  const plantName = user?.plantName || 'Palm';

  const fields = [{
    name: plantName,
    desc: `Monitor ${user?.plantType || 'plant'} growth, watering and harvest.`,
    img: plantPhoto
  }];

  // AI Analysis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const runAnalysis = async () => {
    if (aiLoading) return;
    setAiLoading(true); setAiResult(null); setAiError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('Missing Gemini API key');
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

      const activeAlerts = alerts.filter(a => !a.read)
        .map(a => `[${a.type.toUpperCase()}] ${a.title}`).join('\n') || 'None';

      const prompt = `You are PALMORA AI, an expert agronomist. Analyze this real-time plantation data.

Plant: ${user?.plantName || 'Palm'} (${user?.plantType || 'Palm Oil'})
Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} — ${harvestInfo.daysToHarvest} days left

Sensor Data:
- Soil Moisture: ${sensorData.soilMoisture.toFixed(1)}% (optimal 60–80%)
- Temperature: ${sensorData.temperature.toFixed(1)}°C (optimal 24–32°C)
- Humidity: ${sensorData.humidity.toFixed(0)}% (optimal 70–90%)
- UV Index: ${sensorData.uvIndex.toFixed(1)}, Wind: ${sensorData.windSpeed.toFixed(0)} km/h
- Health Score: ${sensorData.healthScore.toFixed(0)}/100
${realWeather.temp != null ? `Weather: ${realWeather.description}, ${realWeather.temp}°C` : ''}
Active Alerts: ${activeAlerts}

Give 3–5 bullet points using 🟢🟡🔴 for status. End with one action recommendation. Be very concise.
LANGUAGE RULE — CRITICAL: Respond ENTIRELY in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia). Do NOT use English.' : lang === 'ms' ? 'Malay (Bahasa Melayu). Do NOT use English.' : 'English.'}`;

      const result = await model.generateContent(prompt);
      setAiResult(result.response.text());
    } catch (err) {
      setAiError('⚠️ ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const harvestProgress = (harvestInfo.currentDay / harvestInfo.totalCycleDays) * 100;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : hour < 21 ? 'Good Evening' : 'Good Night';

  const [selectedField, setSelectedField] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addDeviceState, setAddDeviceState] = useState(null); // null | 'idle' | 'scanning' | 'not_found'
  const [chartRange, setChartRange] = useState('1 Week');
  const [chartDropOpen, setChartDropOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const getChartData = () => {
    if (chartRange === 'Custom') {
      if (!customFrom || !customTo) return [];
      return DAILY_DATA.filter(d => d.date >= customFrom && d.date <= customTo);
    }
    return SENSOR_HISTORY[chartRange] || [];
  };

  const chartData = getChartData();

  const heroStats = [
    { label: t('health'), value: `${sensorData.healthScore.toFixed(0)}` },
    { label: t('uptime'), value: t('connected'), status: true, small: true },
    { label: t('plant_age'), value: `${harvestInfo.currentDay} ${t('days')}` },
  ];

  return (
    <div className="page dashboard-v2">

      {/* ── NOTIFICATION OVERLAY ── */}
      {notifOpen && (
        <div className="dv2-notif-overlay" onClick={() => setNotifOpen(false)}>
          <div className="dv2-notif-panel" onClick={e => e.stopPropagation()}>
            <div className="dv2-notif-panel__header">
              <span className="dv2-notif-panel__title">{t('notifications')}</span>
              <button className="dv2-notif-panel__close" onClick={() => setNotifOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="dv2-notif-panel__list">
              {alerts.length === 0 && (
                <div className="dv2-notif-panel__empty">{t('no_notifications')}</div>
              )}
              {alerts.map(a => (
                <div
                  key={a.id}
                  className={`dv2-notif-item ${a.read ? 'dv2-notif-item--read' : ''}`}
                  onClick={() => markAlertRead(a.id)}
                >
                  <div className={`dv2-notif-item__dot dv2-notif-item__dot--${a.type}`} />
                  <div className="dv2-notif-item__body">
                    <span className="dv2-notif-item__title">{a.title}</span>
                    <span className="dv2-notif-item__meta">{a.zone} · {a.time}</span>
                  </div>
                  {!a.read && <Check size={14} className="dv2-notif-item__check" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD DEVICE MODAL ── */}
      {addDeviceState !== null && (
        <div className="dv2-notif-overlay" onClick={() => setAddDeviceState(null)}>
          <div className="dv2-notif-panel" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111' }}>Connect New Device</h2>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px', lineHeight: 1.4 }}>Pair your IoT sensor node to add a new plant to PALMORA</p>
            
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', 
              background: addDeviceState === 'not_found' ? '#fff5f5' : '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', marginBottom: '16px',
              animation: addDeviceState === 'scanning' ? 'pulse 1.5s infinite' : 'none',
              transition: 'all 0.3s'
            }}>
               {addDeviceState === 'idle' && '🔌'}
               {addDeviceState === 'scanning' && '📡'}
               {addDeviceState === 'not_found' && '❌'}
            </div>

            <div style={{ marginBottom: '24px', fontSize: '14px', color: addDeviceState === 'not_found' ? '#ef5350' : '#444', fontWeight: 500 }}>
               {addDeviceState === 'idle' && 'Tap the button to begin pairing'}
               {addDeviceState === 'scanning' && 'Scanning for devices…'}
               {addDeviceState === 'not_found' && 'No device available nearby'}
            </div>

            <button 
              style={{ background: '#4caf50', color: '#fff', padding: '16px', borderRadius: '16px', border: 'none', width: '100%', fontSize: '15px', fontWeight: 'bold', cursor: addDeviceState === 'scanning' ? 'not-allowed' : 'pointer', opacity: addDeviceState === 'scanning' ? 0.7 : 1, transition: 'opacity 0.2s' }}
              disabled={addDeviceState === 'scanning'}
              onClick={() => {
                if(addDeviceState === 'scanning') return;
                setAddDeviceState('scanning');
                setTimeout(() => {
                  setAddDeviceState('not_found');
                }, 3000);
              }}
            >
              {addDeviceState === 'not_found' ? 'Try Again' : addDeviceState === 'scanning' ? 'Connecting...' : 'Scan'}
            </button>
          </div>
        </div>
      )}
      {/* ── HERO ───────────────────────────────────────── */}
      <div className="dv2-hero">
        <img src={plantPhoto} className="dv2-hero__bg" alt="hero" />
        <div className="dv2-hero__overlay" />

        {/* Top bar */}
        <div className="dv2-hero__topbar animate-in">
          <div
            className="dv2-hero__user"
            onClick={() => {
              onNavChange('/account');
              navigate('/account');
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="dv2-hero__avatar">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" />
                : <Leaf size={16} strokeWidth={1.5} />}
            </div>
            <div>
              <div className="dv2-hero__hi">{t('hi')}</div>
              <div className="dv2-hero__name">{user?.name || 'Farmer'}</div>
            </div>
          </div>
          <div className="dv2-hero__bell-wrap">
            <button className="dv2-hero__bell" aria-label="Notifications" onClick={() => setNotifOpen(o => !o)}>
              <Bell size={18} strokeWidth={1.5} />
              {alerts.filter(a => !a.read).length > 0 && (
                <span className="dv2-hero__bell-dot" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="dv2-hero__title-wrap animate-in animate-delay-1">
          <h1 className="dv2-hero__title">
            {t('welcome_to')}<br />
            <span>PALMORA</span>
          </h1>
        </div>

        {/* Stat pills */}
        <div className="dv2-hero__pills animate-in animate-delay-2">
          {heroStats.map(s => (
            <div key={s.label} className="dv2-hero__pill">
              <span className="dv2-hero__pill-label">{s.label}</span>
              <span className={`dv2-hero__pill-value ${s.small ? 'dv2-hero__pill-value--sm' : ''}`}>
                {'status' in s && <span className={`dv2-status-dot ${s.status ? 'dv2-status-dot--on' : 'dv2-status-dot--off'}`} />}
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHITE BODY ─────────────────────────────────── */}
      <div className="dv2-body">

        {/* My Fields — Dropdown + Live Sensors */}
        <div className="dv2-section-header animate-in animate-delay-2">
          <span className="dv2-section-title">{t('my_fields')}</span>
          <span className="dv2-section-action">{
            realWeather.temp != null ? `${realWeather.temp}°C · ${realWeather.description}` : 'Live Data'
          }</span>
        </div>

        {/* Dropdown selector */}
        <div className="dv2-dropdown-wrap animate-in animate-delay-2">
          <button
            className={`dv2-dropdown-trigger ${dropdownOpen ? 'dv2-dropdown-trigger--open' : ''}`}
            onClick={() => setDropdownOpen(o => !o)}
          >
            <img src={fields[selectedField]?.img || palmImg} alt="" className="dv2-dropdown-thumb" />
            <div className="dv2-dropdown-info">
              <span className="dv2-dropdown-name">{fields[selectedField]?.name}</span>
              <span className="dv2-dropdown-desc">{fields[selectedField]?.desc}</span>
            </div>
            <ChevronDown size={20} className={`dv2-dropdown-chevron ${dropdownOpen ? 'dv2-dropdown-chevron--open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="dv2-dropdown-list">
              {fields.map((card, i) => (
                <button
                  key={i}
                  className={`dv2-dropdown-item ${i === selectedField ? 'dv2-dropdown-item--active' : ''}`}
                  onClick={() => { setSelectedField(i); setDropdownOpen(false); }}
                >
                  <img src={card.img} alt="" className="dv2-dropdown-item-thumb" />
                  <div>
                    <span className="dv2-dropdown-item-name">{card.name}</span>
                    <span className="dv2-dropdown-item-desc">{card.desc}</span>
                  </div>
                </button>
              ))}
              <div 
                className="dv2-dropdown-item"
                style={{ justifyContent: 'center', color: '#4caf50', borderTop: '1px solid #f0f0f0', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => {
                  setDropdownOpen(false);
                  setAddDeviceState('idle');
                }}
              >
                + Add Plant
              </div>
            </div>
          )}
        </div>

        {/* Live sensor card for selected field */}
        <div className="dv2-field-live animate-in animate-delay-3">
          <div className="dv2-field-live__hero">
            <img src={fields[selectedField]?.img || palmImg} alt={fields[selectedField]?.name} className="dv2-field-live__img" />
            <div className="dv2-field-live__badge">
              <Leaf size={12} />
              <span>Live</span>
            </div>
          </div>
          <div className="dv2-field-live__sensors">
            {[
              { icon: Droplets, label: 'Soil', value: `${sensorData.soilMoisture.toFixed(0)}%`, ok: sensorData.soilMoisture >= 60 && sensorData.soilMoisture <= 80 },
              { icon: Leaf, label: 'Health', value: `${sensorData.healthScore.toFixed(0)}/100`, ok: sensorData.healthScore >= 75 },
              { icon: Sun, label: 'UV', value: sensorData.uvIndex.toFixed(1), ok: sensorData.uvIndex <= 7 },
              { icon: Thermometer, label: 'Temp', value: `${sensorData.temperature.toFixed(1)}°C`, ok: sensorData.temperature >= 24 && sensorData.temperature <= 32 },
              { icon: Droplets, label: 'Humidity', value: `${sensorData.humidity.toFixed(0)}%`, ok: sensorData.humidity >= 70 && sensorData.humidity <= 90 },
              { icon: Wind, label: 'Wind', value: `${sensorData.windSpeed.toFixed(0)} km/h`, ok: true },
            ].map(s => (
              <div key={s.label} className={`dv2-field-sensor ${s.ok ? '' : 'dv2-field-sensor--warn'}`}>
                <s.icon size={14} strokeWidth={1.5} className="dv2-field-sensor__icon" />
                <span className="dv2-field-sensor__value">{s.value}</span>
                <span className="dv2-field-sensor__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>


        {/* ── AI Analysis button ── */}
        <div className="animate-in" style={{ marginBottom: 8 }}>
          <button
            className={`dv2-ai-btn ${aiResult || aiLoading ? 'dv2-ai-btn--active' : ''}`}
            onClick={runAnalysis}
            disabled={aiLoading}
            aria-label="Run AI analysis"
          >
            <div className="dv2-ai-btn__header">
              <Zap size={16} strokeWidth={1.5} />
              <span>AI ANALYSIS</span>
              {aiLoading
                ? <div className="dv2-ai-spinner" />
                : <span className="dv2-ai-hint">{aiResult ? '↻ Re-analyze' : t('tap_to_analyze')}</span>}
            </div>
            {aiLoading && <div className="dv2-ai-loading">{t('analyzing')}</div>}
            {!aiLoading && aiResult && (
              <div className="dv2-ai-result">
                {aiResult.split('\n').filter(line => line.trim()).map((line, i) => (
                  <span key={i}>{line.split(/\*\*(.*?)\*\*/).map((p, j) =>
                    j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}<br /></span>
                ))}
              </div>
            )}
            {!aiLoading && aiError && <div className="dv2-ai-result" style={{ color: '#ef5350' }}>{aiError}</div>}
            {!aiLoading && !aiResult && !aiError && (
              <div className="dv2-ai-desc">
                {t('ai_analysis_desc')}
              </div>
            )}
          </button>
        </div>

        {/* ── Harvest Progress ── */}
        <div className="dv2-section-header animate-in">
          <span className="dv2-section-title">{t('harvest_progress')}</span>
          <span className="dv2-section-action">{harvestInfo.daysToHarvest} {t('days_left')}</span>
        </div>

        <div className="dv2-harvest animate-in">
          <div className="dv2-harvest__info">
            <span className="dv2-harvest__plant">{plantName}</span>
            <span className="dv2-harvest__pct">{harvestProgress.toFixed(0)}%</span>
          </div>
          <div className="dv2-harvest__detail">
            {t('day')} {harvestInfo.currentDay} {t('of')} {harvestInfo.totalCycleDays}
          </div>
          <div className="dv2-harvest__bar">
            <div className="dv2-harvest__fill" style={{ width: `${harvestProgress}%` }} />
          </div>
        </div>

        {/* ── Sensor History Chart ── */}
        <div className="dv2-section-header animate-in">
          <span className="dv2-section-title">{t('sensor_history')}</span>
          <div className="dv2-chart-range-wrap">
            <button
              className={`dv2-chart-range-btn ${chartDropOpen ? 'dv2-chart-range-btn--open' : ''}`}
              onClick={() => setChartDropOpen(o => !o)}
            >
              {chartRange}
              <ChevronDown size={14} className={`dv2-chart-range-chevron ${chartDropOpen ? 'dv2-chart-range-chevron--open' : ''}`} />
            </button>
            {chartDropOpen && (
              <div className="dv2-chart-range-list">
                {TIME_RANGES.map(r => (
                  <button
                    key={r}
                    className={`dv2-chart-range-item ${chartRange === r ? 'dv2-chart-range-item--active' : ''}`}
                    onClick={() => { setChartRange(r); setChartDropOpen(false); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {chartRange === 'Custom' && (
          <div className="dv2-custom-dates animate-in">
            <div className="dv2-date-field">
              <Calendar size={14} />
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <span className="dv2-date-sep">–</span>
            <div className="dv2-date-field">
              <Calendar size={14} />
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="dv2-chart animate-in">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 10 }} domain={[40, 100]} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 10 }} domain={[0, 12]} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #f0f0f0',
                      borderRadius: 14,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: 12,
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="soil" name="Soil Moisture %" stroke="#4caf50" strokeWidth={2.5} dot={{ r: 4, fill: '#4caf50', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="uv" name="UV Index" stroke="#ff9800" strokeWidth={2.5} dot={{ r: 4, fill: '#ff9800', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="dv2-chart__legend">
                <span><span className="dv2-legend-dot dv2-legend-dot--soil" />Soil Moisture</span>
                <span><span className="dv2-legend-dot dv2-legend-dot--uv" />UV Index</span>
              </div>
            </>
          ) : (
            <div className="dv2-chart__empty">
              <span>📊</span>
              <p>{t('no_data')}</p>
              {chartRange === 'Custom' && <p className="dv2-chart__empty-hint">{t('select_date_range')}</p>}
            </div>
          )}
        </div>

        {/* ── Solar ── */}
        <div className="animate-in" style={{ marginBottom: 24 }}>
          <SolarPowerGauge
            percentage={solarPower.percentage}
            solarOutput={solarPower.solarOutput}
            piezoOutput={solarPower.piezoOutput}
            charging={solarPower.charging}
          />
        </div>

      </div>
    </div>
  );
}
