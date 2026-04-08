import { useState, useCallback, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './context/DataContext';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import LivingNavbar from './components/LivingNavbar';
import AIChatbot from './components/AIChatbot';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Report from './pages/Report';
import Settings from './pages/Settings';
import Account from './pages/Account';
import './App.css';

/* ── Route order — determines slide direction ───────────────── */
const ROUTE_ORDER = ['/', '/analysis', '/report', '/settings', '/account'];

export const NavDirectionContext = createContext({ direction: 0 });
export function useNavDirection() { return useContext(NavDirectionContext); }

/* ── Animated page wrapper ──────────────────────────────────── */
const variants = {
  enter: (dir) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 },
  },
  exit: (dir) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
};

function AnimatedRoutes({ direction }) {
  const location = useLocation();

  return (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ width: '100%', willChange: 'transform' }}
      >
        <Routes location={location}>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/report"   element={<Report />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account"  element={<Account />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/** Inner shell — simplified to bypass auth/onboarding */
function AppShell() {
  const [direction, setDirection] = useState(0);
  const prevIndexRef = useRef(0);

  /* Called by LivingNavbar before navigating to compute direction */
  const handleNavChange = useCallback((toPath) => {
    const toIndex = ROUTE_ORDER.indexOf(toPath);
    const fromIndex = prevIndexRef.current;
    const dir = toIndex >= fromIndex ? 1 : -1;
    setDirection(dir);
    prevIndexRef.current = toIndex;
  }, []);

  return (
    <NavDirectionContext.Provider value={{ direction, onNavChange: handleNavChange }}>
      <div className="app-container" style={{ overflowX: 'hidden', overflowY: 'auto', position: 'relative' }}>
        <AnimatedRoutes direction={direction} />
      </div>
      <div className="fixed-overlay-wrapper">
        <div className="fixed-overlay-content">
          <div className="fixed-nav-cluster">
            <LivingNavbar />
            <AIChatbot />
          </div>
        </div>
      </div>
    </NavDirectionContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <DataProvider>
          <LanguageProvider>
            <AppShell />
          </LanguageProvider>
        </DataProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
