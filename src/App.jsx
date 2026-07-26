/**
 * App.jsx — Root component. Assembles all panels and modals.
 */

import './index.css';
import { useState, useEffect } from 'react';
import { AppStateProvider, useAuth, useAppState, useDispatch } from './store.jsx';
import { useToast } from './hooks/useToast.js';
import { THEMES, getSavedThemeId, applyTheme } from './utils/themes.js';
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

  // Apply the saved theme from ThemeSelector on first mount
  // This ensures the correct body class + CSS vars are set before first paint.
  useEffect(() => {
    const savedId = getSavedThemeId();
    const theme   = THEMES.find(t => t.id === savedId) || THEMES[0];
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
