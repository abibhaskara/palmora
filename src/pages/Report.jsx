import { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileText, MessageCircle, TrendingUp, AlertCircle, Target, Send, Bot, ChevronRight, Loader } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './Report.css';


export default function Report() {
    const { sensorData, alerts, realWeather } = useData();
    const { user, harvestInfo } = useUser();
    const { t } = useLang();
    const [period, setPeriod] = useState('week');
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: 'Hello! I\'m PALMORA AI Assistant. Ask me anything about your plantation data, trends, or recommendations.' },
    ]);
    const [chatInput, setChatInput] = useState('');

    // AI report generation
    const [reportLoading, setReportLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportError, setReportError] = useState(null);

    const generateReport = useCallback(async (p) => {
        setReportLoading(true);
        setReportError(null);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('Missing Gemini API key');
            const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });

            const activeAlerts = alerts.filter(a => !a.read).map(a => `${a.title} (${a.zone})`).join(', ') || 'None';

            const prompt = `You are PALMORA AI, an expert agronomist report generator.

Generate a ${p}ly plantation report based on this live data:

Plant: ${user?.plantName || 'Palm'} (${user?.plantType || 'Palm Oil'})
Harvest: Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays} — ${harvestInfo.daysToHarvest} days left
Soil Moisture: ${sensorData.soilMoisture.toFixed(1)}%
Temperature: ${sensorData.temperature.toFixed(1)}°C
Humidity: ${sensorData.humidity.toFixed(0)}%
UV Index: ${sensorData.uvIndex.toFixed(1)}
Health Score: ${sensorData.healthScore.toFixed(0)}/100
${realWeather.temp != null ? `Weather: ${realWeather.description}, ${realWeather.temp}°C` : ''}
Active Alerts: ${activeAlerts}

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
{
  "summary": "A 2-3 sentence overview of the ${p}.",
  "progress": ["point 1", "point 2", "point 3"],
  "issues": [{"text": "issue description", "severity": "warning or danger"}, ...],
  "futurePlan": ["action 1", "action 2", "action 3"]
}`;

            const result = await model.generateContent(prompt);
            const raw = result.response.text().trim();
            // Strip markdown code fences if present
            const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const parsed = JSON.parse(jsonStr);
            setReportData(parsed);
        } catch (err) {
            console.error('Report generation error:', err);
            setReportError(err.message);
        } finally {
            setReportLoading(false);
        }
    }, [sensorData, alerts, realWeather, user, harvestInfo]);

    useEffect(() => {
        generateReport(period);
    }, [period]); // intentionally not including generateReport to avoid infinite loops

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');

        setTimeout(() => {
            let response = '';
            if (userMsg.toLowerCase().includes('zone d') || userMsg.toLowerCase().includes('pest')) {
                response = 'Zone D has shown elevated pest activity this week, specifically Rhinoceros beetle indicators near the southeastern boundary. I recommend deploying targeted pesticide application and increasing camera monitoring frequency from 6-hour to 2-hour intervals for early detection.';
            } else if (userMsg.toLowerCase().includes('zone b') || userMsg.toLowerCase().includes('moisture') || userMsg.toLowerCase().includes('water')) {
                response = 'Zone B soil moisture has dropped below the 45% threshold. Current reading is 38%. I recommend increasing irrigation frequency by 20% and conducting a soil composition analysis to rule out drainage issues. The sprinkler system for Zone B is currently active.';
            } else if (userMsg.toLowerCase().includes('harvest')) {
                response = 'Based on current data, Zone A is approximately 10 days from optimal harvest. FFB maturity indicators show 80% readiness. I recommend preparing the harvest crew and equipment by day 8. Expected yield for this cycle is approximately 28 tons.';
            } else {
                response = `Based on the ${period}ly analysis, overall plantation health is at 85%. The key focus areas are Zone B moisture management and Zone D pest monitoring. Would you like specific details on any zone or metric?`;
            }
            setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
        }, 1200);
    };

    return (
        <div className="page report">

            {/* Dark green hero header */}
            <div className="page-hero animate-in">
                <div className="page-hero__top">
                    <div>
                        <div className="page-hero__label">Palmora</div>
                        <h1 className="page-hero__title">{t('report_title')}</h1>
                        <p className="page-hero__sub">{t('ai_generated')}</p>
                    </div>
                    <div className="report__header-icon">
                        <FileText size={20} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* White body */}
            <div className="page-body">

            {/* Period Toggle */}
            <div className="section animate-in animate-delay-1">
                <div className="tab-pills">
                    {['week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            className={`tab-pill ${period === p ? 'tab-pill--active' : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                        {p.charAt(0).toUpperCase() + p.slice(1) === 'Week' ? t('week') : p.charAt(0).toUpperCase() + p.slice(1) === 'Month' ? t('month') : t('year')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Auto Summary */}
            <div className="section animate-in animate-delay-2">
                <div className="section-header">
                    <span className="section-title">{t('auto_summarize')}</span>
                    <button className="report__regen-btn" onClick={() => generateReport(period)} disabled={reportLoading}>
                        {reportLoading ? <Loader size={12} className="report__spin" /> : '↻'} {t('generate')}
                    </button>
                </div>
                <div className="glass-card">
                    {reportLoading && <p className="report__loading">{t('generating_report')}</p>}
                    {reportError && <p className="report__error">⚠️ {reportError}</p>}
                    {!reportLoading && reportData && <p className="report__summary">{reportData.summary}</p>}
                </div>
            </div>

            {/* Current Progress */}
            {(reportLoading || (reportData && reportData.progress?.length > 0)) && (
            <div className="section animate-in animate-delay-3">
                <div className="section-header">
                    <span className="section-title">
                        <TrendingUp size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('current_progress')}
                    </span>
                </div>
                <div className="glass-card">
                    {reportLoading && <p className="report__loading">…</p>}
                    {!reportLoading && reportData && (
                        <ul className="report__list">
                            {reportData.progress.map((item, i) => (
                                <li key={i} className="report__list-item report__list-item--success">
                                    <span className="report__list-dot" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            )}

            {/* Issues */}
            {(reportLoading || (reportData && reportData.issues?.length > 0)) && (
            <div className="section animate-in animate-delay-4">
                <div className="section-header">
                    <span className="section-title">
                        <AlertCircle size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('issues')}
                    </span>
                </div>
                <div className="glass-card">
                    {reportLoading && <p className="report__loading">…</p>}
                    {!reportLoading && reportData && (
                        <ul className="report__list">
                            {reportData.issues.map((item, i) => (
                                <li key={i} className={`report__list-item report__list-item--${item.severity}`}>
                                    <span className="report__list-dot" />
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            )}

            {/* Future Plan */}
            {(reportLoading || (reportData && reportData.futurePlan?.length > 0)) && (
            <div className="section animate-in animate-delay-5">
                <div className="section-header">
                    <span className="section-title">
                        <Target size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('future_plan')}
                    </span>
                </div>
                <div className="glass-card">
                    {reportLoading && <p className="report__loading">…</p>}
                    {!reportLoading && reportData && (
                        <ul className="report__list report__list--numbered">
                            {reportData.futurePlan.map((item, i) => (
                                <li key={i} className="report__list-item">
                                    <span className="report__list-num">{i + 1}</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            )}


            {/* AI Chat Panel */}
            {chatOpen && (
                <div className="report__chat animate-in">
                    <div className="report__chat-messages">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`report__chat-msg report__chat-msg--${msg.role}`}>
                                {msg.role === 'ai' && (
                                    <div className="report__chat-avatar">
                                        <Bot size={14} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="report__chat-bubble">{msg.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="report__chat-input-wrap">
                        <input
                            type="text"
                            className="report__chat-input"
                            placeholder={t('ask_plantation')}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        />
                        <button className="report__chat-send" onClick={handleSendChat}>
                            <Send size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            )}
            </div>{/* /page-body */}
        </div>
    );
}
