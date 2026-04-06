import { useState } from 'react';
import { Settings as SettingsIcon, Droplets, Bell, Globe, Info, RefreshCw, Sliders, ChevronRight, Battery, Wifi, Shield, LogOut, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useLang } from '../context/LanguageContext';
import SprinklerControl from '../components/SprinklerControl';
import SolarPowerGauge from '../components/SolarPowerGauge';
import './Settings.css';

export default function Settings() {
    const { solarPower, zones, sensorData, alerts, unreadAlertCount, markAlertRead } = useData();
    const { user, logout } = useUser();
    const { lang, changeLang, t } = useLang();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [autoIrrigation, setAutoIrrigation] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState('3');
    const [showAlerts, setShowAlerts] = useState(false);

    return (
        <div className="page settings">

            {/* Dark green hero header */}
            <div className="page-hero animate-in">
                <div className="page-hero__top">
                    <div>
                        <div className="page-hero__label">Palmora</div>
                        <h1 className="page-hero__title">{t('settings_title')}</h1>
                        <p className="page-hero__sub">{t('system_config')}</p>
                    </div>
                    <div className="settings__header-icon">
                        <SettingsIcon size={20} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* White body */}
            <div className="page-body">

            {/* Sprinkler Control */}
            <div className="section animate-in animate-delay-1">
                <div className="section-header">
                    <span className="section-title">
                        <Droplets size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('sprinkler_control')}
                    </span>
                </div>
                <div className="settings__sprinklers">
                    {zones.map(zone => (
                        <SprinklerControl key={zone.id} zoneId={zone.id} zoneName={zone.name} />
                    ))}
                </div>
            </div>

            {/* Auto Irrigation */}
            <div className="section animate-in animate-delay-2">
                <div className="glass-card settings__option">
                    <div className="settings__option-info">
                        <Sliders size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('auto_irrigation')}</span>
                            <span className="settings__option-desc">{t('auto_irrigation_desc')}</span>
                        </div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={autoIrrigation} onChange={() => setAutoIrrigation(!autoIrrigation)} />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            {/* Power System */}
            <div className="section animate-in animate-delay-3">
                <SolarPowerGauge
                    percentage={solarPower.percentage}
                    solarOutput={solarPower.solarOutput}
                    piezoOutput={solarPower.piezoOutput}
                    charging={solarPower.charging}
                />
            </div>

            {/* Notifications */}
            <div className="section animate-in animate-delay-4">
                <div className="section-header">
                    <span className="section-title">
                        <Bell size={14} strokeWidth={1.5} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {t('notifications')}
                    </span>
                    {unreadAlertCount > 0 && (
                        <span className="badge badge--danger">{unreadAlertCount} new</span>
                    )}
                </div>

                <div className="glass-card settings__option" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="settings__option-info">
                        <Bell size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('push_notifications')}</span>
                            <span className="settings__option-desc">{t('receive_alerts')}</span>
                        </div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />
                        <span className="toggle-slider" />
                    </label>
                </div>

                <button
                    className="glass-card settings__option settings__option--clickable"
                    onClick={() => setShowAlerts(!showAlerts)}
                >
                    <div className="settings__option-info">
                        <Bell size={18} strokeWidth={1.5} className="settings__option-icon" />
                        <div>
                            <span className="settings__option-label">{t('alert_history')}</span>
                            <span className="settings__option-desc">{alerts.length} {t('alerts')}</span>
                        </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.5} className={`settings__chevron ${showAlerts ? 'settings__chevron--open' : ''}`} />
                </button>

                {showAlerts && (
                    <div className="settings__alerts animate-in">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className={`settings__alert ${alert.read ? '' : 'settings__alert--unread'}`}
                                onClick={() => markAlertRead(alert.id)}
                            >
                                <span className={`badge ${alert.type === 'warning' ? 'badge--warning' : alert.type === 'danger' ? 'badge--danger' : alert.type === 'success' ? 'badge--success' : 'badge--info'}`}>
                                    {alert.type}
                                </span>
                                <div className="settings__alert-content">
                                    <span className="settings__alert-title">{alert.title}</span>
                                    <span className="settings__alert-meta">{alert.zone} • {alert.time}</span>
                                </div>
                                {!alert.read && <span className="settings__alert-dot" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* System Config */}
            <div className="section animate-in">
                <div className="section-header">
                    <span className="section-title">{t('system')}</span>
                </div>

                <div className="settings__options-group glass-card">
                    <div className="settings__option-row">
                        <RefreshCw size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('refresh_interval')}</span>
                        <select
                            className="settings__select"
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(e.target.value)}
                        >
                            <option value="1">1 sec</option>
                            <option value="3">3 sec</option>
                            <option value="5">5 sec</option>
                            <option value="10">10 sec</option>
                        </select>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Globe size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('language')}</span>
                        <select
                            className="settings__select"
                            value={lang}
                            onChange={(e) => changeLang(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="id">Bahasa Indonesia</option>
                            <option value="ms">Bahasa Melayu</option>
                        </select>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Wifi size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('network_status')}</span>
                        <span className="badge badge--success">{t('connected')}</span>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Battery size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('battery')}</span>
                        <span className="settings__option-value">{Math.round(solarPower.percentage)}%</span>
                    </div>

                    <div className="settings__divider" />

                    <div className="settings__option-row">
                        <Shield size={16} strokeWidth={1.5} className="settings__option-icon--sm" />
                        <span className="settings__option-label">{t('firmware')}</span>
                        <span className="settings__option-value">v2.4.1</span>
                    </div>
                </div>
            </div>

            {/* Account */}
            <div className="section animate-in">
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'linear-gradient(135deg,rgba(76,175,80,0.2),rgba(129,199,132,0.08))',
                        border: '1px solid rgba(76,175,80,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <User size={18} strokeWidth={1.5} style={{ color: '#81c784' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{user?.name || 'User'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{user?.email || '—'}</div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.25)',
                            color: '#ef5350', borderRadius: 10, padding: '8px 14px',
                            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        title="Reset account data and re-run onboarding"
                    >
                        <LogOut size={14} strokeWidth={2} /> {t('reset')}
                    </button>
                </div>
            </div>

            {/* About */}
            <div className="section animate-in">
                <div className="glass-card settings__about">
                    <Info size={16} strokeWidth={1.5} className="settings__about-icon" />
                    <div>
                        <span className="settings__about-title">PALMORA</span>
                        <span className="settings__about-desc">{t('about_desc')}</span>
                        <span className="settings__about-version">Version 1.0.0 • © 2026</span>
                    </div>
                </div>
            </div>
            </div>{/* /page-body */}
        </div>
    );
}
