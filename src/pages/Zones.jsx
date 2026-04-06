import { useState } from 'react';
import { Heart, Sun, Droplets, Zap, ChevronRight, MapPin, Layers } from 'lucide-react';
import { useData } from '../context/DataContext';
import StatCard from '../components/StatCard';
import './Zones.css';

const ZONE_COLORS = {
    A: '#2D5F2D',
    B: '#c18f2f',
    C: '#3a9e8f',
    D: '#c0594e',
};

const ZONE_STATUS_MAP = {
    healthy: { label: 'Healthy', badge: 'badge--success' },
    warning: { label: 'Warning', badge: 'badge--warning' },
    critical: { label: 'Critical', badge: 'badge--danger' },
};

export default function Zones() {
    const { sensorData, zones } = useData();
    const [selectedZone, setSelectedZone] = useState(null);

    return (
        <div className="page zones">
            {/* Header */}
            <div className="page-header animate-in">
                <div>
                    <div className="page-title">Map Zones</div>
                    <div className="page-subtitle">Monitor plantation areas</div>
                </div>
                <div className="zones__icon-btn">
                    <Layers size={20} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="section animate-in animate-delay-1">
                <div className="stat-grid stat-grid--3">
                    <StatCard
                        icon={Heart}
                        label="Health"
                        value={sensorData.healthScore.toFixed(0)}
                        compact
                    />
                    <StatCard
                        icon={Sun}
                        label="UV Index"
                        value={sensorData.uvIndex.toFixed(1)}
                        compact
                        status={sensorData.uvIndex > 8 ? 'danger' : sensorData.uvIndex > 6 ? 'warning' : undefined}
                    />
                    <StatCard
                        icon={Droplets}
                        label="Humidity"
                        value={`${sensorData.humidity.toFixed(0)}%`}
                        compact
                    />
                </div>
            </div>

            {/* AI Analysis Button */}
            <div className="section animate-in animate-delay-2">
                <button className="zones__ai-btn btn btn--primary btn--full btn--lg">
                    <Zap size={18} />
                    AI ANALYSIS
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Map Visualization */}
            <div className="section animate-in animate-delay-3">
                <div className="section-header">
                    <span className="section-title">Map Zoning</span>
                    <span className="section-action">Expand</span>
                </div>
                <div className="glass-card zones__map">
                    <div className="zones__map-grid">
                        {zones.map((zone) => {
                            const status = ZONE_STATUS_MAP[zone.status];
                            return (
                                <div
                                    key={zone.id}
                                    className={`zones__map-zone ${selectedZone === zone.id ? 'zones__map-zone--selected' : ''}`}
                                    style={{ '--zone-color': ZONE_COLORS[zone.id] }}
                                    onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                                >
                                    <MapPin size={14} style={{ color: ZONE_COLORS[zone.id] }} />
                                    <span className="zones__map-zone-label">{zone.name}</span>
                                    <div className={`zones__map-zone-dot zones__map-zone-dot--${zone.status}`} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="zones__map-bg">
                        <svg viewBox="0 0 200 200" className="zones__map-svg">
                            <rect x="10" y="10" width="85" height="85" rx="8" fill={`${ZONE_COLORS.A}15`} stroke={`${ZONE_COLORS.A}40`} strokeWidth="1" />
                            <rect x="105" y="10" width="85" height="85" rx="8" fill={`${ZONE_COLORS.B}15`} stroke={`${ZONE_COLORS.B}40`} strokeWidth="1" />
                            <rect x="10" y="105" width="85" height="85" rx="8" fill={`${ZONE_COLORS.C}15`} stroke={`${ZONE_COLORS.C}40`} strokeWidth="1" />
                            <rect x="105" y="105" width="85" height="85" rx="8" fill={`${ZONE_COLORS.D}15`} stroke={`${ZONE_COLORS.D}40`} strokeWidth="1" />
                            <text x="52" y="55" textAnchor="middle" fill={`${ZONE_COLORS.A}80`} fontSize="11" fontWeight="600">A</text>
                            <text x="147" y="55" textAnchor="middle" fill={`${ZONE_COLORS.B}80`} fontSize="11" fontWeight="600">B</text>
                            <text x="52" y="150" textAnchor="middle" fill={`${ZONE_COLORS.C}80`} fontSize="11" fontWeight="600">C</text>
                            <text x="147" y="150" textAnchor="middle" fill={`${ZONE_COLORS.D}80`} fontSize="11" fontWeight="600">D</text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Zone Cards */}
            <div className="section animate-in animate-delay-4">
                <div className="section-header">
                    <span className="section-title">Zone Details</span>
                </div>
                <div className="stat-grid">
                    {zones.map((zone) => {
                        const status = ZONE_STATUS_MAP[zone.status];
                        return (
                            <div
                                key={zone.id}
                                className={`zones__card glass-card ${selectedZone === zone.id ? 'zones__card--selected' : ''}`}
                                style={{ '--zone-color': ZONE_COLORS[zone.id] }}
                                onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                            >
                                <div className="zones__card-header">
                                    <span className="zones__card-name">{zone.name}</span>
                                    <span className={`badge ${status.badge}`}>{status.label}</span>
                                </div>
                                <div className="zones__card-stats">
                                    <div className="zones__card-stat">
                                        <span className="zones__card-stat-value">{zone.area}</span>
                                        <span className="zones__card-stat-label">Area</span>
                                    </div>
                                    <div className="zones__card-stat">
                                        <span className="zones__card-stat-value">{zone.trees}</span>
                                        <span className="zones__card-stat-label">Trees</span>
                                    </div>
                                </div>
                                <div className="zones__card-bar">
                                    <div
                                        className="zones__card-bar-fill"
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
    );
}
