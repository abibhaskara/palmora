import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Mail, BookOpen } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/analysis', icon: CalendarDays, label: 'Calendar' },
    { path: '/report', icon: Mail, label: 'Mail' },
    { path: '/settings', icon: BookOpen, label: 'Library' },
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav__inner">
                {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
                    const isActive = location.pathname === path;

                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
                        >
                            <div className="bottom-nav__icon-wrap">
                                {isActive && <div className="bottom-nav__active-bg" />}
                                <Icon
                                    size={20}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    className="bottom-nav__icon"
                                />
                            </div>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
