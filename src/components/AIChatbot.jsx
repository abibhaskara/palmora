import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import './AIChatbot.css';

const QUICK_PROMPTS = {
    en: [
        "Analyze the overall plantation health.",
        "Are there any irrigation risks today?",
        "Evaluate pest threats in Zone D.",
        "Project harvest readiness.",
    ],
    id: [
        "Analisis kesehatan perkebunan secara keseluruhan.",
        "Apakah ada risiko irigasi hari ini?",
        "Evaluasi ancaman hama di Zona D.",
        "Proyeksikan kesiapan panen.",
    ],
    ms: [
        "Analisis kesihatan ladang secara keseluruhan.",
        "Adakah terdapat risiko pengairan hari ini?",
        "Nilaikan ancaman perosak di Zon D.",
        "Ramalkan kesediaan tuaian.",
    ],
};

function buildSystemContext(sensorData, zones, alerts, harvestInfo, realWeather, lang) {
    const zonesSummary = zones.map(z =>
        `Zone ${z.id} (${z.name}): ${z.area}, ${z.trees} trees, status=${z.status}`
    ).join('; ');

    const alertsSummary = alerts
        .filter(a => !a.read)
        .map(a => `[${a.type.toUpperCase()}] ${a.title}`)
        .join('; ') || 'No active alerts';

    const weatherContext = realWeather?.temp != null
        ? `Location: ${realWeather.city || 'Unknown'}. Condition: ${realWeather.description}, Temp: ${realWeather.temp}°C, Humidity: ${realWeather.humidity}%, Wind: ${realWeather.windSpeed} km/h`
        : `Simulated weather active.`;

    return `You are PALMORA AI, an expert Agronomist and Data Analyst for a smart palm oil plantation.
Your core directive is to ANALYZE the provided telemetric data, IDENTIFY correlations, PREDICT risks (e.g., pests, drought), and RECOMMEND specific, actionable interventions. Do not just repeat the data — interpret it.

### LIVE TELEMETRY STREAM
- Soil Moisture: ${sensorData.soilMoisture.toFixed(1)}% (Optimal: 50-70%)
- Temperature: ${sensorData.temperature.toFixed(1)}°C (Optimal: 24-32°C)
- Humidity: ${sensorData.humidity.toFixed(0)}% (Optimal: 70-90%)
- UV Index: ${sensorData.uvIndex.toFixed(1)}
- Wind Speed: ${sensorData.windSpeed.toFixed(0)} km/h
- Overall Health Score: ${sensorData.healthScore.toFixed(0)}/100
- Rainfall Rate: ${sensorData.rainfall > 0 ? sensorData.rainfall.toFixed(1) + ' mm/h' : '0 mm/h'}

### ATMOSPHERIC CONTEXT
${weatherContext}

### HARVEST PROJECTION
Day ${harvestInfo.currentDay}/${harvestInfo.totalCycleDays}. Days until optimal harvest: ${harvestInfo.daysToHarvest}.

### CRITICAL ALERTS
${alertsSummary}

### INSTRUCTIONS:
1. Cross-reference soil moisture with rainfall/weather to advise on irrigation.
2. Evaluate temperature/humidity interplay to assess pest/fungal risks (e.g., Ganoderma).
3. Be concise, authoritative, and structure your analysis with bullet points and bold text for readability.
4. If asked a general question, synthesize a brief "State of the Plantation" report.
5. Use emojis strategically to signify status (🟢 🟡 🔴).
6. LANGUAGE RULE — CRITICAL: You MUST write your ENTIRE response in ${lang === 'id' ? 'Indonesian (Bahasa Indonesia). Do NOT use English under any circumstances.' : lang === 'ms' ? 'Malay (Bahasa Melayu). Do NOT use English under any circumstances.' : 'English. Do NOT use Indonesian or Malay.'} This rule overrides everything else.`;
}

export default function AIChatbot() {
    const { sensorData, zones, alerts, realWeather } = useData();
    const { harvestInfo } = useUser();
    const { lang, t } = useLang();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    const sendMessage = async (text) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        setInput('');
        setError(null);

        const userMsg = { role: 'user', content: messageText, id: Date.now() };
        // Immediately update UI
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            setError('⚠️ Invalid or missing Gemini API Key in .env');
            setIsLoading(false);
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                // This call now always gets the freshest React state (sensorData, etc)
                systemInstruction: buildSystemContext(sensorData, zones, alerts, harvestInfo, realWeather, lang),
            });

            // Map our UI messages state to Gemini history format
            // EXCLUDE the message we just added to the UI array, because Gemini expects it in sendMessage()
            const history = messages.filter(m => !m.isError).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            const freshChat = model.startChat({
                history: history,
                generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
            });

            const result = await freshChat.sendMessage(messageText);
            const responseText = result.response.text();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                id: Date.now() + 1,
            }]);
        } catch (err) {
            console.error("Gemini Error:", err);
            const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('QUOTA');
            const errMsg = err.message?.includes('API_KEY_INVALID')
                ? '⚠️ API Key is invalid. Check VITE_GEMINI_API_KEY.'
                : is429
                ? '⚠️ Project quota exhausted. Try again later or use a different Google Cloud project.'
                : '⚠️ Analysis failed: ' + err.message;

            setError(errMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errMsg,
                id: Date.now() + 1,
                isError: true,
            }]);
            
            // Force re-init on next message if it was a critical error like 429
            setChat(null); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleReset = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <>
            <div className={`ai-chat-panel ${isOpen ? 'ai-chat-panel--open' : ''}`}>
                <div className="ai-chat-header">
                    <div className="ai-chat-header__info">
                        <div className="ai-chat-header__avatar">
                            <Sparkles size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="ai-chat-header__name">PALMORA AI Analyst</div>

                        </div>
                    </div>
                    <div className="ai-chat-header__actions">
                        {messages.length > 0 && (
                            <button className="ai-chat-icon-btn" onClick={handleReset} title="Reset Analysis">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                        )}
                        <button className="ai-chat-icon-btn" onClick={() => setIsOpen(false)}>
                            <ChevronDown size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="ai-chat-messages">
                    {messages.length === 0 && (
                        <div className="ai-chat-empty">
                            <div className="ai-chat-empty__icon">
                                <Sparkles size={28} strokeWidth={1.5} />
                            </div>
                            <div className="ai-chat-empty__title">{t('data_analysis_engine', 'Data Analysis Engine')}</div>
                            <div className="ai-chat-empty__desc">
                                {t('monitoring_telemetry', 'I am monitoring the live telemetry of your plantation. Ask me to deeply analyze the structural health, yield projections, or environmental risks.')}
                            </div>
                            <div className="ai-chat-quick-prompts">
                                {(QUICK_PROMPTS[lang] || QUICK_PROMPTS.en).map((prompt, i) => (
                                    <button key={i} className="ai-chat-quick-btn" onClick={() => sendMessage(prompt)}>
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-chat-message ai-chat-message--${msg.role} ${msg.isError ? 'ai-chat-message--error' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="ai-chat-message__avatar">
                                    <Sparkles size={12} strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="ai-chat-message__bubble ai-chat-message__bubble--markdown">
                                {/* Basic markdown rendering for bold text and line breaks that Gemini uses */}
                                {msg.content.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                        <br />
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="ai-chat-message ai-chat-message--assistant">
                            <div className="ai-chat-message__avatar"><Sparkles size={12} strokeWidth={1.5} /></div>
                            <div className="ai-chat-message__bubble ai-chat-message__bubble--loading">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-chat-input-area">
                    {error && !messages.some(m => m.isError) && (
                        <div className="ai-chat-error">{error}</div>
                    )}
                    <div className="ai-chat-input-row">
                        <textarea
                            ref={inputRef}
                            className="ai-chat-input"
                            placeholder={t('request_telemetry', 'Request telemetry analysis…')}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            className={`ai-chat-send-btn ${(!input.trim() || isLoading) ? 'ai-chat-send-btn--disabled' : ''}`}
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? <Loader2 size={16} strokeWidth={2} className="ai-chat-spinner" /> : <Send size={16} strokeWidth={2} />}
                        </button>
                    </div>
                </div>
            </div>

            <div 
                className={`ai-chat-backdrop ${isOpen ? 'ai-chat-backdrop--open' : ''}`} 
                onClick={() => setIsOpen(false)} 
            />

            <button
                className={`ai-chat-fab ${isOpen ? 'ai-chat-fab--open' : ''}`}
                onClick={() => setIsOpen(v => !v)}
                aria-label="Open AI Analyst"
            >
                {isOpen ? <X size={22} strokeWidth={2} /> : <Bot size={22} strokeWidth={1.5} />}
            </button>
        </>
    );
}
