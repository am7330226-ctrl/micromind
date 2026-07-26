/**
 * App.jsx — Root component. Assembles all panels and modals.
 */

import './index.css';
import { useState, useEffect } from 'react';
import { AppStateProvider, useAuth, useAppState, useDispatch } from './store.jsx';
import { useToast } from './hooks/useToast.js';
import Header from './components/Header.jsx';
import BrainDump from './components/BrainDump.jsx';
import EisenhowerMatrix from './components/EisenhowerMatrix.jsx';
import MoodWidget from './components/MoodWidget.jsx';
import HabitTracker from './components/HabitTracker.jsx';
import PomodoroTimer from './components/PomodoroTimer.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import AuthModal from './components/AuthModal.jsx';
import CompletedArchive from './components/CompletedArchive.jsx';
import TaskDetailPanel from './components/TaskDetailPanel.jsx';
import MobileBottomDock from './components/MobileBottomDock.jsx';

function AppInner() {
  const { auth, login, loginGuest, logout } = useAuth();
  const { toasts, showToast }   = useToast();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pomodoroOpen,  setPomodoroOpen]  = useState(false);

  // Show auth screen if no token
  if (!auth.token) {
    return <AuthModal onAuthSuccess={login} onGuestSuccess={loginGuest} />;
  }

  return (
    <AppContent
      showToast={showToast}
      toasts={toasts}
      analyticsOpen={analyticsOpen}
      setAnalyticsOpen={setAnalyticsOpen}
      pomodoroOpen={pomodoroOpen}
      setPomodoroOpen={setPomodoroOpen}
      onLogout={logout}
      userName={auth.name}
    />
  );
}

// Separate component so we can access state/dispatch after auth check
function AppContent({ showToast, toasts, analyticsOpen, setAnalyticsOpen, pomodoroOpen, setPomodoroOpen, onLogout, userName }) {
  const state    = useAppState();
  const dispatch = useDispatch();

  const [lightMode, setLightMode] = useState(() => {
    const saved = localStorage.getItem('micromind_theme');
    return saved === 'light';
  });

  // Sync light and dark mode classes on mount and when changed
  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      localStorage.setItem('micromind_theme', 'light');
    } else {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('micromind_theme', 'dark');
    }
  }, [lightMode]);

  // ── Auto daily reset when a new day is detected ───────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = state.lastResetDate;
    if (lastReset && lastReset !== today) {
      dispatch({ type: 'DAILY_RESET' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-wrapper">
      <Header
        userName={userName}
        onLogout={onLogout}
        showToast={showToast}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        onOpenPomodoro={() => setPomodoroOpen(o => !o)}
        lightMode={lightMode}
        setLightMode={setLightMode}
      />

      <main className="app-main">
        {/* Left column */}
        <div className="column-left">
          <BrainDump showToast={showToast} />
          <MoodWidget showToast={showToast} />
          <HabitTracker showToast={showToast} />
        </div>

        {/* Right: Eisenhower matrix + completed archive below */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <EisenhowerMatrix showToast={showToast} />
          <CompletedArchive />
        </div>
      </main>

      {/* Modals & overlays */}
      <PomodoroTimer
        open={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        showToast={showToast}
      />
      <AnalyticsDashboard
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />
      <TaskDetailPanel />

      <MobileBottomDock
        onOpenPomodoro={() => setPomodoroOpen(o => !o)}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        onReset={() => {
          dispatch({ type: 'DAILY_RESET' });
          if (showToast) showToast('Daily reset performed! Habits reset & completed tasks archived.', '🌙');
        }}
        lightMode={lightMode}
        setLightMode={setLightMode}
        showToast={showToast}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppInner />
    </AppStateProvider>
  );
}
