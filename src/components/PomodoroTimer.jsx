/**
 * PomodoroTimer.jsx — Full Pomodoro timer widget with SVG ring, task linking,
 * mode switching (Focus / Short Break / Long Break), and session tracking.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState, useDispatch } from '../store.jsx';

const POMO_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const POMO_LABELS    = { focus: 'Focus Time', short: 'Short Break', long: 'Long Break' };
const RING_R = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R; // ≈ 552.9

export default function PomodoroTimer({ open, onClose, showToast }) {
  const state    = useAppState();
  const dispatch = useDispatch();


  const [mode,        setMode]        = useState('focus');
  const [secsLeft,    setSecsLeft]    = useState(POMO_DURATIONS.focus);
  const [totalSecs,   setTotalSecs]   = useState(POMO_DURATIONS.focus);
  const [running,     setRunning]     = useState(false);
  const [sessions,    setSessions]    = useState(0);
  const [linkedId,    setLinkedId]    = useState(null);

  const intervalRef  = useRef(null);

  // Derive focus tasks from state
  const focusTasks = ['focus-1', 'focus-2', 'focus-3']
    .map(key => {
      const id = state.focusSlots?.[key];
      return id ? state.tasks.find(t => t.id === id) : null;
    })
    .filter(Boolean);

  // ── Mode switch ──────────────────────────────────────────────
  const switchMode = useCallback((newMode) => {
    if (running) return;
    setMode(newMode);
    setSecsLeft(POMO_DURATIONS[newMode]);
    setTotalSecs(POMO_DURATIONS[newMode]);
  }, [running]);

  // ── Timer tick ───────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerDone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Browser tab title ────────────────────────────────────────
  useEffect(() => {
    if (running) {
      const m = Math.floor(secsLeft / 60).toString().padStart(2, '0');
      const s = (secsLeft % 60).toString().padStart(2, '0');
      document.title = `${m}:${s} — MicroMind`;
    } else {
      document.title = 'MicroMind - Daily Mental Declutter';
    }
    return () => { document.title = 'MicroMind - Daily Mental Declutter'; };
  }, [running, secsLeft]);

  function handleTimerDone() {
    setRunning(false);
    if (mode === 'focus') {
      const newSessions = Math.min(sessions + 1, 8);
      setSessions(newSessions);
      dispatch({ type: 'SET_POMODORO_SESSIONS', sessions: newSessions });
    }
    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('MicroMind 🍅', {
        body: mode === 'focus' ? 'Focus session done! Time for a break.' : 'Break over! Ready to focus?',
      });
    }
    const msg = mode === 'focus'
      ? `🎉 Focus session done! ${sessions + (mode === 'focus' ? 1 : 0)} session(s) today.`
      : '✅ Break over — ready to focus again!';
    showToast(msg, '🍅');
    const next = mode === 'focus' ? 'short' : 'focus';
    switchMode(next);
  }

  const handleStartPause = () => setRunning(r => !r);

  const handleReset = () => {
    setRunning(false);
    setSecsLeft(POMO_DURATIONS[mode]);
    setTotalSecs(POMO_DURATIONS[mode]);
  };

  const handleSkip = () => {
    setRunning(false);
    const next = mode === 'focus' ? 'short' : 'focus';
    switchMode(next);
  };

  const handleLinkTask = (taskId) => {
    setLinkedId(prev => prev === taskId ? null : taskId);
  };

  // ── Ring ─────────────────────────────────────────────────────
  const ratio  = secsLeft / (totalSecs || 1);
  const offset = RING_CIRCUMFERENCE * (1 - ratio);

  // ── Display ──────────────────────────────────────────────────
  const mm = Math.floor(secsLeft / 60).toString().padStart(2, '0');
  const ss = (secsLeft % 60).toString().padStart(2, '0');

  const linkedTask = focusTasks.find(t => t.id === linkedId);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="pomodoro-backdrop visible" onClick={onClose} id="pomodoro-backdrop" />

      {/* Widget panel */}
      <div id="pomodoro-widget" className={`pomodoro-widget open mode-${mode}${running ? ' running' : ''}`}>
        {/* Header */}
        <div className="pomodoro-header">
          <div>
            <h3 className="pomodoro-title">Pomodoro</h3>
            <p className="pomodoro-subtitle">Deep Focus Timer</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="pomodoro-close" onClick={onClose} id="pomodoro-close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="pomo-mode-tabs">
          {['focus', 'short', 'long'].map(m => (
            <button
              key={m}
              className={`pomo-mode-btn${mode === m ? ' active' : ''}`}
              data-mode={m}
              onClick={() => switchMode(m)}
              disabled={running}
            >
              {m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        {/* Ring timer */}
        <div className="pomo-ring-wrap">
          <svg className="pomo-ring" viewBox="0 0 200 200">
            <circle className="pomo-ring-bg" cx="100" cy="100" r={RING_R} />
            <circle
              id="pomo-ring-fill"
              className="pomo-ring-fill"
              cx="100" cy="100" r={RING_R}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="pomo-time-display">
            <span id="pomo-time" className="pomo-time">{mm}:{ss}</span>
            <span id="pomo-mode-label" className="pomo-mode-label">{POMO_LABELS[mode]}</span>
          </div>
        </div>

        {/* Session dots */}
        <div id="pomo-session-dots" className="pomo-session-dots">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className={`pomo-dot${i < sessions ? ' filled' : ''}`} />
          ))}
        </div>

        {/* Controls */}
        <div className="pomo-controls">
          <button className="pomo-ctrl-btn pomo-secondary" onClick={handleReset} title="Reset" id="pomo-reset-btn">⟲</button>
          <button className="pomo-ctrl-btn pomo-primary" onClick={handleStartPause} id="pomo-start-btn">
            <span id="pomo-play-icon">{running ? '⏸' : '▶'}</span>
            <span id="pomo-start-label">{running ? 'Pause' : secsLeft < totalSecs ? 'Resume' : 'Start'}</span>
          </button>
          <button className="pomo-ctrl-btn pomo-secondary" onClick={handleSkip} title="Skip" id="pomo-skip-btn">⏭</button>
        </div>

        {/* Linked task */}
        <div className="pomo-task-info">
          <span className="pomodoro-task-label" id="pomodoro-task-label">
            {linkedTask ? `▶ ${linkedTask.text.slice(0, 40)}` : 'No task selected'}
          </span>
        </div>

        {/* Focus task picker */}
        <div className="pomo-task-picker">
          <span className="pomo-task-picker-label">Link a Focus Task</span>
          <div className="pomo-focus-slots" id="pomo-focus-slots">
            {focusTasks.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '4px 0' }}>
                Drag tasks into the Focus slots first.
              </p>
            ) : (
              focusTasks.map((task, idx) => (
                <button
                  key={task.id}
                  className={`pomo-slot-btn${linkedId === task.id ? ' active-slot' : ''}`}
                  onClick={() => handleLinkTask(task.id)}
                >
                  <span className="pomo-slot-num">{idx + 1}</span>
                  <span className="pomo-slot-text">{task.text.slice(0, 36)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
