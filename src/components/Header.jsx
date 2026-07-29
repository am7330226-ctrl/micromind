/**
 * Header.jsx — App top bar with brand, date, analytics/zen/ambient controls,
 * daily reset, user info, and logout.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useAppState } from '../store.jsx';
import PwaInstallPrompt from './PwaInstallPrompt.jsx';
import VoiceBriefing from './VoiceBriefing.jsx';
import AmbientSoundPlayer from './AmbientSoundPlayer.jsx';
import ThemeSelector from './ThemeSelector.jsx';

// ── Component ─────────────────────────────────────────────────────
export default function Header({ userName, onLogout, showToast, onOpenAnalytics, onOpenPomodoro }) {
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── Zen Mode ───────────────────────────────
  const toggleZen = () => {
    const next = !zenMode;
    setZenMode(next);
    document.body.classList.toggle('zen-mode', next);
    if (showToast) showToast(next ? 'Zen Mode activated' : 'Zen Mode deactivated', '🧘');
  };

  // Daily reset handler
  const handleReset = () => {
    dispatch({ type: 'DAILY_RESET' });
    if (showToast) showToast('Daily reset performed! Habits reset & completed tasks archived.', '🌙');
  };

  // ── Progress ratio ──────────────────────────────────────────────────────
  const tasks = (state.tasks || []).filter(task => task && typeof task === 'object');
  const total = tasks.length;
  const done  = tasks.filter(task => task && task.completed).length;
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
                type="button"
                className="user-avatar-btn"
                onClick={() => setMenuOpen(o => !o)}
                title={`Signed in as ${userName}. Tap for options`}
                aria-label="User Account Menu"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                {userName.charAt(0).toUpperCase()}
              </button>

              <div className="header-user desktop-user-info">
                <span className="user-name">{userName.split(' ')[0]}</span>
                <button type="button" className="signout-btn" onClick={onLogout} aria-label="Sign out">Sign Out</button>
              </div>

              {menuOpen && (
                <div className="user-popover-menu" role="menu" aria-label="User profile options">
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
                    type="button"
                    className="popover-signout-btn"
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    aria-label="Sign Out"
                    role="menuitem"
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
          <div className="streak-badge" title="Day streak" aria-label={`Current streak: ${state.streak || 0} days`}>
            🔥 <span id="streak-count">{state.streak || 0}</span>
          </div>
          <span className="utility-divider">•</span>
          <div className="level-badge" title={`${xp} XP total`} aria-label={`Level ${level}, ${Math.round(levelProgress)}% to next level`}>
            <span className="level-label">Lvl {level}</span>
            <div className="level-xp-bar">
              <div className="level-xp-fill" style={{ width: `${levelProgress}%` }}></div>
            </div>
          </div>
          <span className="utility-divider">•</span>
          <div className="progress-badge" title={`${done}/${total} tasks completed`} aria-label={`Daily progress: ${pct}% (${done} of ${total} tasks completed)`}>
            <span>Progress: <strong>{pct}%</strong></span>
          </div>
        </div>

        {/* Right: Toolbox Buttons */}
        <div className="utility-right">
          {/* 🔊 Voice AI Briefing */}
          <VoiceBriefing showToast={showToast} />

          <button
            type="button"
            id="pomodoro-toggle-btn"
            className="utility-tool-btn"
            onClick={onOpenPomodoro}
            title="Pomodoro Focus Timer"
            aria-label="Open Pomodoro Focus Timer"
          >
            <span>🍓</span>
            <span>Pomodoro</span>
          </button>

          <button
            type="button"
            id="analytics-toggle-btn"
            className="utility-tool-btn"
            onClick={onOpenAnalytics}
            title="Analytics & Productivity Insights"
            aria-label="Open Analytics & Productivity Insights"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>

          {/* 🎧 Ambient Sound Player */}
          <AmbientSoundPlayer showToast={showToast} />

          {/* 🎨 XP Theme Selector */}
          <ThemeSelector showToast={showToast} />

          <button
            type="button"
            id="daily-reset-btn"
            className="utility-tool-btn utility-reset-btn"
            onClick={handleReset}
            title="Daily Reset — Archive completed tasks & reset habits"
            aria-label="Perform Daily Reset to archive tasks and reset habits"
          >
            <span>⚡</span>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
