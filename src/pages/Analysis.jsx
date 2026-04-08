import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Brain, Heart, Sun, Droplets, Zap, ChevronRight, MapPin, TrendingUp, AlertTriangle, ShieldCheck, Bug, Loader } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import StatCard from '../components/StatCard';
import './Analysis.css';

const ZONE_COLORS = {
    A: '#4CAF50',
    B: '#FF9800',
    C: '#26A69A',
    D: '#EF5350',
};

const ZONE_STATUS_MAP = {
    healthy: { labelKey: 'healthy', badge: 'badge--success' },
    warning: { labelKey: 'warning', badge: 'badge--warning' },
    critical: { labelKey: 'critical', badge: 'badge--danger' },
};

const AI_INSIGHTS = [
    {
        type: 'success',
        icon: ShieldCheck,
        titleKey: 'canopy_coverage',
        topic: 'canopy coverage and growth patterns',
    },
    {
        type: 'warning',
        icon: AlertTriangle,
        titleKey: 'soil_moisture_alert',
        topic: 'soil moisture levels and irrigation needs',
    },
    {
        type: 'danger',
        icon: Bug,
        titleKey: 'pest_activity',
        topic: 'pest activity detection and prevention',
    },
    {
        type: 'info',
        icon: TrendingUp,
        titleKey: 'harvest_forecast',
        topic: 'harvest timeline and readiness',
    },
];

export default function Analysis() {
    const { sensorData, zones, realWeather } = useData();
    const { user, harvestInfo } = useUser();
    const { t, lang } = useLang();
    const [selectedZone, setSelectedZone] = useState(null);
    const [expandedInsight, setExpandedInsight] = useState(null);
    const [insightDescs, setInsightDescs] = useState({});
    const [insightLoading, setInsightLoading] = useState({});

    const generateInsightDesc = useCallback(async (idx, topic) => {
        if (insightDescs[idx]) return; // already generated
        setInsightLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('Missing API key');
            const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `You are PALMORA AI agronomist. Write a concise 2-sentence insight about "${topic}" for a ${user?.plantType || 'Palm Oil'} plantation.

Live data:
- Soil Moisture: ${sensorData.soilMoisture.toFixed(1)}%
- Temperature: ${sensorData.temperature.toFixed(1)}°C
- Humidity: ${sensorData.humidity.toFixed(0)}%
- UV Index: ${sensorData.uvIndex.toFixed(1)}
- Health Score: ${sensorData.healthScore.toFixed(0)}/100
- Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} (${harvestInfo.daysToHarvest} days left)
${realWeather?.temp != null ? `- Weather: ${realWeather.description}, ${realWeather.temp}°C` : ''}

Respond with ONLY the 2-sentence insight, no formatting.
LANGUAGE RULE — CRITICAL: Write ENTIRELY in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia). Do NOT use English.' : lang === 'ms' ? 'Malay (Bahasa Melayu). Do NOT use English.' : 'English.'}`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            setInsightDescs(prev => ({ ...prev, [idx]: text }));
        } catch (err) {
            setInsightDescs(prev => ({ ...prev, [idx]: `Unable to generate insight: ${err.message}` }));
        } finally {
            setInsightLoading(prev => ({ ...prev, [idx]: false }));
        }
    }, [sensorData, harvestInfo, user, realWeather, insightDescs]);

    const handleInsightClick = (idx, topic) => {
        const isExpanded = expandedInsight === idx;
        setExpandedInsight(isExpanded ? null : idx);
        if (!isExpanded) {
            generateInsightDesc(idx, topic);
        }
    };

    return (
        <div className="page analysis">

            {/* Dark green hero header */}
            <div className="page-hero animate-in">
                <div className="page-hero__top">
                    <div>
                        <div className="page-hero__label">Palmora</div>
                        <h1 className="page-hero__title">{t('ai_analysis')}</h1>
                        <p className="page-hero__sub">{t('smart_insights')}</p>
                    </div>
                    <div className="analysis__brain-badge">
                        <Brain size={20} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="page-hero__pills">
                    <div className="page-hero__pill">
                        <span className="page-hero__pill-label">{t('health')}</span>
                        <span className="page-hero__pill-value">{sensorData.healthScore.toFixed(0)}</span>
                    </div>
                    <div className="page-hero__pill">
                        <span className="page-hero__pill-label">{t('uv')}</span>
                        <span className="page-hero__pill-value">{sensorData.uvIndex.toFixed(1)}</span>
                    </div>
                    <div className="page-hero__pill">
                        <span className="page-hero__pill-label">{t('humidity')}</span>
                        <span className="page-hero__pill-value">{sensorData.humidity.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* White body */}
            <div className="page-body">

            {/* AI Insights */}
            <div className="section animate-in animate-delay-2">
                <div className="section-header">
                    <span className="section-title">{t('ai_insights')}</span>
                    <span className="badge badge--success">
                        <Zap size={10} strokeWidth={1.5} /> {t('live')}
                    </span>
                </div>
                <div className="analysis__insights">
                    {AI_INSIGHTS.map((insight, idx) => {
                        const Icon = insight.icon;
                        const isExpanded = expandedInsight === idx;
                        return (
                            <div
                                key={idx}
                                className={`analysis__insight analysis__insight--${insight.type} ${isExpanded ? 'analysis__insight--expanded' : ''}`}
                                onClick={() => handleInsightClick(idx, insight.topic)}
                            >
                                <div className="analysis__insight-header">
                                    <div className={`analysis__insight-icon analysis__insight-icon--${insight.type}`}>
                                        <Icon size={16} strokeWidth={1.5} />
                                    </div>
                                    <span className="analysis__insight-title">{t(insight.titleKey)}</span>
                                    <ChevronRight size={14} strokeWidth={1.5} className={`analysis__insight-chevron ${isExpanded ? 'analysis__insight-chevron--open' : ''}`} />
                                </div>
                                {isExpanded && (
                                    <p className="analysis__insight-desc">
                                        {insightLoading[idx]
                                            ? <span className="analysis__insight-loading"><Loader size={12} className="analysis__spin" /> {t('generating_insight')}</span>
                                            : insightDescs[idx] || '…'
                                        }
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Zone Map */}
            <div className="section animate-in animate-delay-3">
                <div className="section-header">
                    <span className="section-title">{t('zone_overview')}</span>
                    <span className="section-action">{zones.length} {t('zones')}</span>
                </div>
                <div className="glass-card">
                    <div className="analysis__zone-grid">
                        {zones.map((zone) => {
                            const status = ZONE_STATUS_MAP[zone.status];
                            const isSelected = selectedZone === zone.id;
                            return (
                                <div
                                    key={zone.id}
                                    className={`analysis__zone-card ${isSelected ? 'analysis__zone-card--selected' : ''}`}
                                    style={{ '--zone-color': ZONE_COLORS[zone.id] }}
                                    onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                                >
                                    <div className="analysis__zone-header">
                                        <MapPin size={14} strokeWidth={1.5} style={{ color: ZONE_COLORS[zone.id] }} />
                                        <span className="analysis__zone-name">{zone.name}</span>
                                        <span className={`badge ${status.badge}`}>{status.label}</span>
                                    </div>
                                    <div className="analysis__zone-stats">
                                        <div className="analysis__zone-stat">
                                            <span className="analysis__zone-stat-value">{zone.area}</span>
                                            <span className="analysis__zone-stat-label">Area</span>
                                        </div>
                                        <div className="analysis__zone-stat">
                                            <span className="analysis__zone-stat-value">{zone.trees}</span>
                                            <span className="analysis__zone-stat-label">Trees</span>
                                        </div>
                                    </div>
                                    <div className="analysis__zone-bar">
                                        <div
                                            className="analysis__zone-bar-fill"
                                            style={{
                                                width: `${zone.status === 'healthy' ? 85 : zone.status === 'warning' ? 58 : 32}%`,
                                                background: ZONE_COLORS[zone.id],
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            </div>{/* /page-body */}
        </div>
    );
}
