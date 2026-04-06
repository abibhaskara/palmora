import { useState, useRef } from 'react';
import { useUser, PLANT_TYPES } from '../context/UserContext';
import './Onboarding.css';

import dahliaImg    from '../assets/dahlia.png';
import nestFernImg  from '../assets/nest_fern.png';
import palmImg      from '../assets/palm.png';
import garberaImg   from '../assets/pink_gerbera.png';
import succulentImg from '../assets/succulent.png';
import bananaImg    from '../assets/young_banana.png';

const TOTAL_STEPS = 4; // intro(3slides), auth, device, plant

/* ── Intro slides ─────────────────────────────────────── */
const INTRO_SLIDES = [
  {
    icon: '🌿',
    title: 'Welcome to PALMORA',
    desc: 'Your smart companion for monitoring plant health in real-time — powered by IoT sensors and AI.',
  },
  {
    icon: '📡',
    title: 'Connect Your Sensors',
    desc: 'Pair IoT nodes to track soil moisture, humidity, temperature, and light levels across every zone.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Insights',
    desc: 'Ask PALMORA AI to analyze telemetry, predict risks, and recommend the perfect care routine.',
  },
];

/* ── Plant presets ────────────────────────────────────── */
const PRESETS = [
  { name: 'Palm Oil',     src: palmImg      },
  { name: 'Banana',       src: bananaImg    },
  { name: 'Dahlia',       src: dahliaImg    },
  { name: 'Succulent',    src: succulentImg },
  { name: 'Pink Gerbera', src: garberaImg   },
  { name: 'Nest Fern',    src: nestFernImg  },
];

/* ── Helper ───────────────────────────────────────────── */
function HarvestHint({ plantType, customCycleDays }) {
  if (!plantType || !PLANT_TYPES[plantType]) return null;
  const cycleDays = (plantType === 'Custom' && customCycleDays) ? Number(customCycleDays) : PLANT_TYPES[plantType].cycleDays;
  const daysToHarvest = PLANT_TYPES[plantType].daysToHarvest; // simple fallback or ratio
  return (
    <div className="ob__harvest-hint">
      🌾 <strong>{plantType}</strong> harvest cycle is <strong>{cycleDays} days</strong>.
      First harvest window opens in ~<strong>{daysToHarvest} days</strong> after planting.
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const { updateUser, signUp, signIn } = useUser();

  // step: 0=intro, 1=auth, 2=device, 3=plant
  const [step, setStep] = useState(0);
  const [slide, setSlide] = useState(0);

  // Auth
  const [authMode, setAuthMode] = useState('create'); // 'create' | 'login'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhoto, setAuthPhoto] = useState(null); // { src, file }
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Device
  const [deviceState, setDeviceState] = useState('idle'); // idle | scanning | found | connected

  // Plant
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [customPhoto, setCustomPhoto] = useState(null); // { src, file }
  const [plantName, setPlantName] = useState('');
  const [plantType, setPlantType] = useState('Palm Oil');
  const [customCycleDays, setCustomCycleDays] = useState(90);
  const fileInputRef = useRef(null);

  /* ── Navigation ───────────────────────────────────────── */
  const goNext = () => setStep(s => s + 1);
  const goPrev = () => setStep(s => Math.max(0, s - 1));

  /* ── Auth submit ──────────────────────────────────────── */
  const handleAuth = async () => {
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    if (authMode === 'create' && !authName.trim()) {
      setAuthError('Please enter your name.');
      return;
    }
    
    setAuthLoading(true);
    try {
      if (authMode === 'create') {
        await signUp(authEmail, authPassword, authName || 'Farmer', authPhoto?.src || null);
      } else {
        await signIn(authEmail, authPassword);
      }
      goNext();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  /* ── Device connect ───────────────────────────────────── */
  const handleConnect = () => {
    setDeviceState('scanning');
    setTimeout(() => setDeviceState('found'), 3000);
  };

  /* ── Photo upload ─────────────────────────────────────── */
  const handleFileChange = (e, type = 'plant') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === 'auth') {
        setAuthPhoto({ src: ev.target.result, name: file.name });
      } else {
        setCustomPhoto({ src: ev.target.result, name: file.name });
        setSelectedPreset(null);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ── Final submit ─────────────────────────────────────── */
  const handleFinish = () => {
    const photoSrc = customPhoto?.src ?? selectedPreset?.src ?? palmImg;
    const name = plantName.trim() || selectedPreset?.name || 'My Plant';

    updateUser({
      name: authName || 'User',
      email: authEmail,
      avatarUrl: authPhoto?.src || null,
      plantName: name,
      plantType,
      customCycleDays: plantType === 'Custom' ? customCycleDays : null,
      plantPhotoUrl: photoSrc,
      plantedAt: new Date().toISOString(),
      onboarded: true,
    });
    onComplete();
  };

  const activePhoto = customPhoto?.src ?? selectedPreset?.src ?? palmImg;

  /* ── Step 0: Intro ────────────────────────────────────── */
  const renderIntro = () => (
    <>
      <div className="ob__body">
        <div className="ob__hero">
          <div className="ob__icon">{INTRO_SLIDES[slide].icon}</div>
          <div className="ob__slide-title">{INTRO_SLIDES[slide].title}</div>
          <div className="ob__slide-desc">{INTRO_SLIDES[slide].desc}</div>
        </div>
        <div className="ob__dots">
          {INTRO_SLIDES.map((_, i) => (
            <div key={i} className={`ob__dot ${i === slide ? 'ob__dot--active' : ''}`}
              onClick={() => setSlide(i)} />
          ))}
        </div>
      </div>
      <div className="ob__footer">
        <button className="ob__btn ob__btn--primary" onClick={() => {
          if (slide < INTRO_SLIDES.length - 1) setSlide(s => s + 1);
          else goNext();
        }}>
          {slide < INTRO_SLIDES.length - 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </>
  );

  /* ── Step 1: Auth ─────────────────────────────────────── */
  const renderAuth = () => (
    <>
      <div className="ob__body">
        <div>
          <div className="ob__label">Step 1 of 3</div>
          <div className="ob__title">Your Account</div>
          <div className="ob__sub">Sign in or create a free account</div>
        </div>

        {authMode === 'create' && (
          <div className="ob__auth-photo-wrap">
            <div className="ob__auth-avatar">
              <img src={authPhoto?.src || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'} alt="Avatar" />
              <label className="ob__avatar-edit">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'auth')} />
                <span className="ob__avatar-icon">📸</span>
              </label>
            </div>
            <div className="ob__avatar-hint">Add a profile photo</div>
          </div>
        )}

        <div className="ob__tabs">
          <button className={`ob__tab ${authMode === 'create' ? 'ob__tab--active' : ''}`}
            onClick={() => setAuthMode('create')}>Create Account</button>
          <button className={`ob__tab ${authMode === 'login'  ? 'ob__tab--active' : ''}`}
            onClick={() => setAuthMode('login')}>Log In</button>
        </div>
        <div className="ob__form">
          {authMode === 'create' && (
            <div className="ob__field">
              <label className="ob__field-label">Your Name</label>
              <input className="ob__input" placeholder="e.g. Alex" value={authName}
                onChange={e => setAuthName(e.target.value)} />
            </div>
          )}
          <div className="ob__field">
            <label className="ob__field-label">Email</label>
            <input className="ob__input" type="email" placeholder="you@email.com"
              value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          </div>
          <div className="ob__field">
            <label className="ob__field-label">Password</label>
            <input className="ob__input" type="password" placeholder="••••••••"
              value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          </div>
          {authError && <div className="ob__error">{authError}</div>}
        </div>
      </div>
      <div className="ob__footer">
        <button className="ob__btn ob__btn--primary" onClick={handleAuth} disabled={authLoading}>
          {authLoading ? 'Please wait...' : 'Continue'}
        </button>
        <button className="ob__btn ob__btn--ghost" onClick={goPrev} disabled={authLoading}>← Back</button>
      </div>
    </>
  );

  /* ── Step 2: Connect Device ───────────────────────────── */
  const renderDevice = () => (
    <>
      <div className="ob__body">
        <div>
          <div className="ob__label">Step 2 of 3</div>
          <div className="ob__title">Connect Device</div>
          <div className="ob__sub">Pair your IoT sensor node</div>
        </div>
        <div className="ob__device">
          <div className="ob__device-ring">
            <div className="ob__device-inner">
              {deviceState === 'connected' ? '✅' : deviceState === 'scanning' ? '📡' : deviceState === 'found' ? '🔍' : '🔌'}
            </div>
          </div>
          <div className={`ob__device-status ${deviceState === 'connected' ? 'ob__device-status--connected' : ''}`}>
            {deviceState === 'idle'      && 'Tap the button to begin pairing'}
            {deviceState === 'scanning'  && 'Scanning for devices…'}
            {deviceState === 'found'     && '1 Device found nearby:'}
            {deviceState === 'connected' && '✓ Sensor node connected!'}
          </div>

          {deviceState === 'found' && (
            <button className="ob__found-device-btn animate-in" onClick={() => setDeviceState('connected')}>
              <span className="ob__found-icon">📡</span>
              <div style={{ textAlign: 'left' }}>
                <div className="ob__found-name">PALMORA 1</div>
                <div className="ob__found-id">ID: PLM-08X2</div>
              </div>
              <div className="ob__found-signal">lll</div>
            </button>
          )}
        </div>
      </div>
      <div className="ob__footer">
        {deviceState !== 'connected' ? (
          <button className="ob__btn ob__btn--primary"
            onClick={handleConnect} disabled={deviceState === 'scanning'}>
            {deviceState === 'scanning' ? 'Connecting…' : 'Connect to Device'}
          </button>
        ) : (
          <button className="ob__btn ob__btn--primary" onClick={goNext}>Continue →</button>
        )}
        <button className="ob__btn ob__btn--ghost" onClick={() => { setDeviceState('idle'); goPrev(); }}>
          ← Back
        </button>
        <button className="ob__btn ob__btn--ghost" onClick={goNext}
          style={{ paddingTop: 0, fontSize: 12 }}>
          Skip for now
        </button>
      </div>
    </>
  );

  /* ── Step 3: Plant Setup ──────────────────────────────── */
  const renderPlant = () => (
    <>
      <div className="ob__body">
        <div>
          <div className="ob__label">Step 3 of 3</div>
          <div className="ob__title">Your Plant</div>
          <div className="ob__sub">Set up your first plant profile</div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: 24, overflow: 'hidden',
            border: '2px solid rgba(76,175,80,0.4)',
            boxShadow: '0 8px 32px rgba(76,175,80,0.2)',
          }}>
            <img src={activePhoto} alt="plant"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Photo picker */}
        <div className="ob__field">
          <label className="ob__field-label">Photo</label>
          <div className="ob__plant-photo-row">
            {/* Upload card */}
            <label className="ob__preset ob__preset--upload">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
              <span style={{ fontSize: 20 }}>📷</span>
              <span>Upload</span>
            </label>
            {/* Presets */}
            {PRESETS.map(p => (
              <div key={p.name}
                className={`ob__preset ${selectedPreset?.name === p.name && !customPhoto ? 'ob__preset--selected' : ''}`}
                onClick={() => { setSelectedPreset(p); setCustomPhoto(null); }}>
                <img src={p.src} alt={p.name} />
              </div>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="ob__field">
          <label className="ob__field-label">Plant Name</label>
          <input className="ob__input" placeholder={selectedPreset?.name || 'My Plant'}
            value={plantName} onChange={e => setPlantName(e.target.value)} />
        </div>

        {/* Type */}
        <div className="ob__field">
          <label className="ob__field-label">Plant Type</label>
          <select className="ob__select" value={plantType}
            onChange={e => setPlantType(e.target.value)}>
            {Object.keys(PLANT_TYPES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {plantType === 'Custom' && (
          <div className="ob__field animate-in">
            <label className="ob__field-label">Custom Harvest Cycle (Days)</label>
            <input 
              className="ob__input" 
              type="number" 
              value={customCycleDays} 
              onChange={e => setCustomCycleDays(e.target.value)} 
              placeholder="e.g. 90"
            />
          </div>
        )}

        <HarvestHint plantType={plantType} customCycleDays={customCycleDays} />
      </div>
      <div className="ob__footer">
        <button className="ob__btn ob__btn--primary" onClick={handleFinish}>
          Start Monitoring 🌱
        </button>
        <button className="ob__btn ob__btn--ghost" onClick={goPrev}>← Back</button>
      </div>
    </>
  );

  const stepContent = [renderIntro, renderAuth, renderDevice, renderPlant];

  return (
    <div className="ob">
      {/* Progress bar — skip for intro step */}
      {step > 0 && (
        <div className="ob__progress">
          {[1, 2, 3].map(i => (
            <div key={i} className={`ob__progress-dot ${step >= i ? 'ob__progress-dot--active' : ''}`} />
          ))}
        </div>
      )}
      {stepContent[step]?.()}
    </div>
  );
}
