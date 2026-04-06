import { useLang } from '../context/LanguageContext';
import './SolarPowerGauge.css';

export default function SolarPowerGauge({ percentage, solarOutput, piezoOutput, charging }) {
    const { t } = useLang();
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="solar-gauge glass-card">
            <div className="solar-gauge__header">
                <span className="section-title">{t('power_system')}</span>
                <span className={`badge ${charging ? 'badge--success' : 'badge--warning'}`}>
                    {charging ? `⚡ ${t('charging')}` : `🔋 ${t('battery')}`}
                </span>
            </div>

            <div className="solar-gauge__body">
                <div className="solar-gauge__ring">
                    <svg viewBox="0 0 100 100" className="solar-gauge__svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
                        <circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke="url(#gaugeGrad)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 50 50)"
                            className="solar-gauge__progress"
                        />
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--accent-green)" />
                                <stop offset="100%" stopColor="var(--accent-green-light)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="solar-gauge__center">
                        <span className="solar-gauge__pct">{Math.round(percentage)}</span>
                        <span className="solar-gauge__pct-symbol">%</span>
                    </div>
                </div>

                <div className="solar-gauge__sources">
                    <div className="solar-gauge__source">
                        <div className="solar-gauge__source-icon">☀️</div>
                        <div className="solar-gauge__source-info">
                            <span className="solar-gauge__source-label">{t('solar')}</span>
                            <span className="solar-gauge__source-value">{solarOutput.toFixed(1)} kW</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
