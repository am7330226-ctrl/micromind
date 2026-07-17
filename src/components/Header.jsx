/**
 * Header.jsx — App top bar with brand, date, analytics/zen/ambient controls,
 * daily reset, user info, and logout.
 */

import { useState, useRef } from 'react';
import { useDispatch, useAppState } from '../store.jsx';

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
export default function Header({ userName, onLogout, onOpenAnalytics, onOpenPomodoro }) {
  const dispatch = useDispatch();
  const state    = useAppState();

  const [zenMode,   setZenMode]   = useState(false);
  const [ambient,   setAmbient]   = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── Zen Mode ──────────────────────────────────────────────────
  const toggleZen = () => {
    const next = !zenMode;
    setZenMode(next);
    if (next) {
      document.body.classList.add('zen-mode');
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.body.classList.remove('zen-mode');
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    }
  };

  // ── Ambient Noise ─────────────────────────────────────────────
  const toggleAmbient = () => {
    const next = !ambient;
    setAmbient(next);
    if (next) startAmbientNoise(); else stopAmbientNoise();
  };

  // ── Daily Reset ───────────────────────────────────────────────
  const handleReset = () => {
    if (window.confirm('Perform daily reset? Completed tasks will be archived and habits reset.')) {
      dispatch({ type: 'DAILY_RESET' });
    }
  };

  // ── Progress (tasks) ──────────────────────────────────────────
  const allTasks  = state.tasks || [];
  const done      = allTasks.filter(t => t.completed).length;
  const total     = allTasks.length;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);
  const R         = 24;
  const circ      = 2 * Math.PI * R;
  const offset    = circ - (pct / 100) * circ;

  // ── Gamification (XP & Level) ──────────────────────────────────
  const xp = state.xp || 0;
  const level = state.level || 1;
  const xpBase = (level - 1) * (level - 1) * 100;
  const nextXp = level * level * 100;
  const levelProgress = Math.max(0, Math.min(100, ((xp - xpBase) / (nextXp - xpBase)) * 100));

  const iconBtn = {
    width: 34, height: 34,
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem',
    transition: 'var(--transition)',
    fontFamily: 'inherit',
  };

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">🧠</div>
        <div>
          <span className="brand-name">MicroMind</span>
          <span className="brand-tagline"> · Daily Mental Declutter</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Date */}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {today}
        </span>

        {/* Progress ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={`${done}/${total} tasks done`}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle
              id="progress-circle"
              cx="28" cy="28" r={R}
              fill="none"
              stroke="var(--color-indigo)"
              strokeWidth="4"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div>
            <div id="progress-percentage" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-indigo)', lineHeight: 1 }}>{pct}%</div>
            <div id="task-ratio" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1 }}>{done}/{total}</div>
          </div>
        </div>

        {/* Streak */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(245,158,11,.1)', borderRadius:'999px', padding:'4px 10px', fontSize:'0.8rem', fontWeight:600, color:'#d97706' }} title="Day streak">
          🔥 <span id="streak-count">{state.streak || 0}</span>
        </div>

        {/* Level & XP */}
        <div className="level-badge" title={`${xp} XP total`}>
          <div className="level-label">Lvl {level}</div>
          <div className="level-xp-bar">
            <div className="level-xp-fill" style={{ width: `${levelProgress}%` }}></div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button id="pomodoro-toggle-btn" style={iconBtn} onClick={onOpenPomodoro} title="Pomodoro Timer">🍅</button>
          <button id="analytics-toggle-btn" style={iconBtn} onClick={onOpenAnalytics} title="Analytics">📊</button>
          <button
            id="ambient-noise-btn"
            style={{ ...iconBtn, ...(ambient ? { background: 'rgba(79,70,229,.12)', color: 'var(--color-indigo)', borderColor: 'rgba(79,70,229,.25)' } : {}) }}
            onClick={toggleAmbient}
            title={ambient ? 'Stop Ambient Noise' : 'Play Ambient Noise'}
          >🎧</button>
          <button
            id="zen-mode-btn"
            style={{ ...iconBtn, ...(zenMode ? { background: 'rgba(79,70,229,.12)', color: 'var(--color-indigo)', borderColor: 'rgba(79,70,229,.25)' } : {}) }}
            onClick={toggleZen}
            title={zenMode ? 'Exit Zen Mode' : 'Zen Mode'}
          >{zenMode ? '⊡' : '⊞'}</button>
          <button
            id="daily-reset-btn"
            style={{ ...iconBtn }}
            onClick={handleReset}
            title="Daily Reset"
          >🌙</button>
        </div>

        {/* User */}
        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              color: 'white', fontWeight: 700, fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {userName.split(' ')[0]}
            </span>
            <button
              onClick={onLogout}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--text-muted)', background: 'var(--color-bg)',
                border: '1px solid var(--color-border)', borderRadius: '8px',
                cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'inherit',
              }}
            >Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
