/**
 * Header.jsx — App top bar with brand, date, analytics/zen/ambient controls,
 * daily reset, user info, and logout.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useAppState } from '../store.jsx';
import PwaInstallPrompt from './PwaInstallPrompt.jsx';
import VoiceBriefing from './VoiceBriefing.jsx';

// ── Ambient Noise helpers (Web Audio API) ──────────────────────────────────
let audioCtx = null;
let ambientSource = null;
let ambientGain = null;

function startAmbientNoise() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const sr = audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, sr * 2, sr);
  const out = buf.getChannelData(0);
  for (let i = 0; i < sr * 2; i++) out[i] = Math.random() * 2 - 1;
  ambientSource = audioCtx.createBufferSource();
  ambientSource.buffer = buf;
  ambientSource.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 2);
  ambientSource.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(audioCtx.destination);
  ambientSource.start(0);
}

function stopAmbientNoise() {
  if (ambientGain && ambientSource) {
    const t = audioCtx.currentTime;
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, t);
    ambientGain.gain.linearRampToValueAtTime(0, t + 1);
    ambientSource.stop(t + 1);
    setTimeout(() => { ambientSource = null; ambientGain = null; }, 1100);
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function Header({ userName, onLogout, showToast, onOpenAnalytics, onOpenPomodoro, lightMode, setLightMode }) {
  const dispatch = useDispatch();
  const state    = useAppState();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const [zenMode, setZenMode] = useState(false);
  const [ambient, setAmbient] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── Zen Mode ──────────────────────────────────────────────────
  const toggleZen = () => {
    const next = !zenMode;
    setZenMode(next);
    document.body.classList.toggle('zen-mode', next);
    if (showToast) showToast(next ? 'Zen Mode activated' : 'Zen Mode deactivated', '🧘');
  };

  // Toggle ambient noise
  const toggleAmbient = () => {
    if (ambient) {
      stopAmbientNoise();
      setAmbient(false);
      if (showToast) showToast('Ambient noise stopped', '🎧');
    } else {
      startAmbientNoise();
      setAmbient(true);
      if (showToast) showToast('Brown noise audio playing', '🎧');
    }
  };

  // Daily reset handler
  const handleReset = () => {
    dispatch({ type: 'DAILY_RESET' });
    if (showToast) showToast('Daily reset performed! Habits reset & completed tasks archived.', '🌙');
  };

  // ── Progress ratio ──────────────────────────────────────────────────────
  const tasks = state.tasks || [];
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  const R     = 20;
  const circ  = 2 * Math.PI * R;
  const offset = circ - (pct / 100) * circ;

  // ── Gamification (XP & Level) ──────────────────────────────────
  const xp = state.xp || 0;
  const level = state.level || 1;
  const xpBase = (level - 1) * (level - 1) * 100;
  const nextXp = level * level * 100;
  const levelProgress = Math.max(0, Math.min(100, ((xp - xpBase) / (nextXp - xpBase)) * 100));

  return (
    <header className="app-header two-tier-header">
      {/* TOP ROW: Brand identity + User avatar & PWA Install */}
      <div className="header-top-row">
        <div className="brand">
          <div className="brand-icon">🧠</div>
          <div>
            <span className="brand-name">MicroMind</span>
            <span className="brand-tagline"> · Daily Mental Declutter</span>
          </div>
        </div>

        <div className="header-top-right">
          <div className="desktop-pwa-install">
            <PwaInstallPrompt showToast={showToast} />
          </div>

          {userName && (
            <div className="avatar-menu-container" ref={menuRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setMenuOpen(o => !o)}
                title={`Signed in as ${userName}. Tap for options`}
                aria-label="User Account Menu"
              >
                {userName.charAt(0).toUpperCase()}
              </button>

              <div className="header-user desktop-user-info">
                <span className="user-name">{userName.split(' ')[0]}</span>
                <button className="signout-btn" onClick={onLogout}>Sign Out</button>
              </div>

              {menuOpen && (
                <div className="user-popover-menu">
                  <div className="popover-user-info">
                    <div className="popover-avatar">{userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="popover-name">{userName}</div>
                      <div className="popover-status">Active Session</div>
                    </div>
                  </div>

                  <div className="popover-divider" />

                  <div className="popover-item">
                    <PwaInstallPrompt showToast={showToast} />
                  </div>

                  <div className="popover-divider" />

                  <button
                    className="popover-signout-btn"
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: Compact Utility Toolbar */}
      <div className="header-bottom-row">
        {/* Left: Productivity Metrics */}
        <div className="utility-left">
          <span className="header-date">{today}</span>
          <span className="utility-divider">•</span>
          <div className="streak-badge" title="Day streak">
            🔥 <span id="streak-count">{state.streak || 0}</span>
          </div>
          <span className="utility-divider">•</span>
          <div className="level-badge" title={`${xp} XP total`}>
            <span className="level-label">Lvl {level}</span>
            <div className="level-xp-bar">
              <div className="level-xp-fill" style={{ width: `${levelProgress}%` }}></div>
            </div>
          </div>
          <span className="utility-divider">•</span>
          <div className="progress-badge" title={`${done}/${total} tasks completed`}>
            <span>Progress: <strong>{pct}%</strong></span>
          </div>
        </div>

        {/* Right: Toolbox Buttons */}
        <div className="utility-right">
          {/* 🔊 Voice AI Briefing */}
          <VoiceBriefing showToast={showToast} />

          <button
            id="pomodoro-toggle-btn"
            className="utility-tool-btn"
            onClick={onOpenPomodoro}
            title="Pomodoro Focus Timer"
          >
            <span>🍓</span>
            <span>Pomodoro</span>
          </button>

          <button
            id="analytics-toggle-btn"
            className="utility-tool-btn"
            onClick={onOpenAnalytics}
            title="Analytics & Productivity Insights"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>

          <button
            id="ambient-noise-btn"
            className={`utility-tool-btn${ambient ? ' active-tool' : ''}`}
            onClick={toggleAmbient}
            title={ambient ? 'Stop Ambient Noise' : 'Play Ambient Noise'}
          >
            <span>🎧</span>
            <span>{ambient ? 'Audio Playing' : 'Audio'}</span>
          </button>

          <button
            id="theme-toggle-btn"
            className={`utility-tool-btn${lightMode ? ' active-tool' : ''}`}
            onClick={() => setLightMode(m => !m)}
            title={lightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span>{lightMode ? '☀️' : '🌙'}</span>
            <span>{lightMode ? 'Light' : 'Theme'}</span>
          </button>

          <button
            id="daily-reset-btn"
            className="utility-tool-btn utility-reset-btn"
            onClick={handleReset}
            title="Daily Reset — Archive completed tasks & reset habits"
          >
            <span>⚡</span>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
