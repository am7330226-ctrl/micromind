/**
 * App.jsx — Root component. Assembles all panels and modals.
 */

import './index.css';
import { useState } from 'react';
import { AppStateProvider, useAuth } from './store.jsx';
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

function AppInner() {
  const { auth, login, logout } = useAuth();
  const { toasts, showToast }   = useToast();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pomodoroOpen,  setPomodoroOpen]  = useState(false);

  // Show auth screen if no token
  if (!auth.token) {
    return <AuthModal onAuthSuccess={login} />;
  }

  return (
    <div className="app-wrapper">
      <Header
        userName={auth.name}
        onLogout={logout}
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

        {/* Right: Eisenhower matrix */}
        <EisenhowerMatrix showToast={showToast} />
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
