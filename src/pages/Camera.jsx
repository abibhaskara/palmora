import { useState } from 'react';
import { Camera as CameraIcon, Image, Scan, ZoomIn, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import './Camera.css';

const CAPTURES = [
    { id: 1, zone: 'A', time: '09:15', status: 'healthy', thumbnail: null },
    { id: 2, zone: 'B', time: '09:30', status: 'warning', thumbnail: null },
    { id: 3, zone: 'C', time: '10:00', status: 'healthy', thumbnail: null },
    { id: 4, zone: 'D', time: '10:15', status: 'pest', thumbnail: null },
];

export default function CameraPage() {
    const { zones } = useData();
    const [activeZone, setActiveZone] = useState('A');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult({
                leafHealth: 92,
                pestDetected: activeZone === 'D',
                nutrientStatus: activeZone === 'B' ? 'deficient' : 'optimal',
                canopyDensity: 78,
            });
        }, 2500);
    };

    return (
        <div className="page camera-page">
            {/* Header */}
            <div className="page-header animate-in">
                <div>
                    <div className="page-title">Live Camera</div>
                    <div className="page-subtitle">AI-Powered Visual Analysis</div>
                </div>
                <div className="camera-page__zone-selector">
                    {zones.map(z => (
                        <button
                            key={z.id}
                            className={`camera-page__zone-btn ${activeZone === z.id ? 'camera-page__zone-btn--active' : ''}`}
                            onClick={() => { setActiveZone(z.id); setAnalysisResult(null); }}
                        >
                            {z.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Feed */}
            <div className="section animate-in animate-delay-1">
                <div className="camera-page__feed glass-card">
                    <div className="camera-page__viewport">
                        <div className="camera-page__placeholder">
                            <div className="camera-page__grid-overlay">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="camera-page__grid-cell" />
                                ))}
                            </div>
                            <div className="camera-page__scan-line" />
                            <div className="camera-page__crosshair">
                                <div className="camera-page__crosshair-v" />
                                <div className="camera-page__crosshair-h" />
                            </div>
                            <CameraIcon size={40} className="camera-page__cam-icon" />
                            <div className="camera-page__feed-label">
                                <span className="camera-page__live-dot" />
                                LIVE — Zone {activeZone}
                            </div>
                            <div className="camera-page__feed-info">
                                <span>1080p • 30fps</span>
                                <span>Node #{activeZone}3</span>
                            </div>
                        </div>
                    </div>

                    <div className="camera-page__controls">
                        <button className="camera-page__ctrl-btn" title="Zoom">
                            <ZoomIn size={18} />
                        </button>
                        <button
                            className="camera-page__ctrl-btn camera-page__ctrl-btn--primary"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            title="AI Analyze"
                        >
                            <Scan size={20} />
                        </button>
                        <button className="camera-page__ctrl-btn" title="Reset">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Analysis Result */}
            {(isAnalyzing || analysisResult) && (
                <div className="section animate-in">
                    <div className="section-header">
                        <span className="section-title">AI Detection Result</span>
                    </div>
                    {isAnalyzing ? (
                        <div className="glass-card camera-page__analyzing">
                            <div className="camera-page__analyzing-spinner" />
                            <span>Analyzing image with AI model...</span>
                        </div>
                    ) : analysisResult && (
                        <div className="glass-card">
                            <div className="camera-page__results">
                                <div className="camera-page__result-item">
                                    <span className="camera-page__result-label">Leaf Health</span>
                                    <span className="camera-page__result-value">{analysisResult.leafHealth}%</span>
                                    <div className="camera-page__result-bar">
                                        <div className="camera-page__result-fill camera-page__result-fill--good" style={{ width: `${analysisResult.leafHealth}%` }} />
                                    </div>
                                </div>
                                <div className="camera-page__result-item">
                                    <span className="camera-page__result-label">Canopy Density</span>
                                    <span className="camera-page__result-value">{analysisResult.canopyDensity}%</span>
                                    <div className="camera-page__result-bar">
                                        <div className="camera-page__result-fill camera-page__result-fill--good" style={{ width: `${analysisResult.canopyDensity}%` }} />
                                    </div>
                                </div>
                                <div className={`camera-page__result-alert ${analysisResult.pestDetected ? 'camera-page__result-alert--danger' : 'camera-page__result-alert--safe'}`}>
                                    {analysisResult.pestDetected ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                    <span>{analysisResult.pestDetected ? 'Pest activity detected! Immediate action recommended.' : 'No pest activity detected.'}</span>
                                </div>
                                <div className={`camera-page__result-alert ${analysisResult.nutrientStatus === 'deficient' ? 'camera-page__result-alert--warning' : 'camera-page__result-alert--safe'}`}>
                                    {analysisResult.nutrientStatus === 'deficient' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                    <span>Nutrient Status: {analysisResult.nutrientStatus === 'deficient' ? 'Deficiency detected (Nitrogen)' : 'Optimal levels'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Captures */}
            <div className="section animate-in animate-delay-3">
                <div className="section-header">
                    <span className="section-title">Recent Captures</span>
                    <span className="section-action">View All</span>
                </div>
                <div className="camera-page__captures">
                    {CAPTURES.map(cap => (
                        <div key={cap.id} className="camera-page__capture glass-card">
                            <div className="camera-page__capture-thumb">
                                <Image size={16} />
                            </div>
                            <div className="camera-page__capture-info">
                                <span className="camera-page__capture-zone">Zone {cap.zone}</span>
                                <span className="camera-page__capture-time">{cap.time}</span>
                            </div>
                            <span className={`badge ${cap.status === 'healthy' ? 'badge--success' : cap.status === 'warning' ? 'badge--warning' : 'badge--danger'}`}>
                                {cap.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
