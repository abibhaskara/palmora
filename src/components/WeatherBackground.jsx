import { useData } from '../context/DataContext';
import './WeatherBackground.css';

export default function WeatherBackground() {
    const { weatherState } = useData();

    return (
        <div className={`weather-bg weather-bg--${weatherState}`}>
            <div className="weather-bg__gradient" />

            {weatherState === 'sunny' && (
                <div className="weather-bg__particles weather-bg__particles--sunny">
                    <div className="sun-glow" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="sun-ray" style={{
                            '--ray-angle': `${i * 60}deg`,
                            '--ray-delay': `${i * 0.3}s`,
                        }} />
                    ))}
                </div>
            )}

            {weatherState === 'rainy' && (
                <div className="weather-bg__particles weather-bg__particles--rainy">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="raindrop" style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: 0.2 + Math.random() * 0.4,
                        }} />
                    ))}
                </div>
            )}

            {weatherState === 'night' && (
                <div className="weather-bg__particles weather-bg__particles--night">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="star" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 60}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            width: `${1 + Math.random() * 2}px`,
                            height: `${1 + Math.random() * 2}px`,
                        }} />
                    ))}
                    <div className="moon" />
                </div>
            )}

            <div className="weather-bg__noise" />
        </div>
    );
}
