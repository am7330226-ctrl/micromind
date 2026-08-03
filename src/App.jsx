/**
 * App.jsx — Root component.
 * Assembles collapsible sidebar, streamlined header, bento grid layout, and modals.
 * Includes section IDs for sidebar smooth navigation.
 */

import './index.css';
import { useState, useEffect } from 'react';
import {
  AppStateProvider,
  useAuth,
  useAppState,
  useDispatch,
} from './store.jsx';
import { useToast } from './hooks/useToast.js';
import { THEMES, getSavedThemeId, applyTheme } from './utils/themes.js';

import AiDailyBriefing from './components/AiDailyBriefing.jsx';
import {
  checkSmartReminders,
  requestNotificationPermission,
} from './utils/aiNotificationEngine.js';
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
import AiCopilot from './components/AiCopilot.jsx';

// Stitch Bento Cards
import Sidebar from './components/Sidebar.jsx';
import FocusLeague from './components/FocusLeague.jsx';
import FocusAnalytics from './components/FocusAnalytics.jsx';
import TimelineCard from './components/TimelineCard.jsx';
import DigitalSanctuary from './components/DigitalSanctuary.jsx';

function AppInner() {
  const { auth, login, loginGuest, logout } = useAuth();
  const { toasts, showToast } = useToast();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);

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

function AppContent({
  showToast,
  toasts,
  analyticsOpen,
  setAnalyticsOpen,
  pomodoroOpen,
  setPomodoroOpen,
  onLogout,
  userName,
}) {
  const state = useAppState();
  const dispatch = useDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedId = getSavedThemeId();
    const theme = THEMES.find((t) => t.id === savedId) || THEMES[0];
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = state.lastResetDate;
    if (lastReset && lastReset !== today) {
      dispatch({ type: 'DAILY_RESET' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestNotificationPermission();
    const interval = setInterval(() => {
      checkSmartReminders(state, showToast);
    }, 60000);
    return () => clearInterval(interval);
  }, [state, showToast]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const firstName = (userName || 'there').split(' ')[0];

  const urgentCount = (state.tasks || []).filter(
    (t) => t && t.priority === 'urgent' && !t.completed,
  ).length;

  const streak = state.streak || 0;
  const xp = state.xp || 0;
  const level = state.level || 1;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main, #f4f6fc)',
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showToast={showToast}
        onNewEntry={() => {
          setSidebarOpen(false);
          document
            .getElementById('section-brain-dump')
            ?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            document.getElementById('dump-input')?.focus();
          }, 300);
        }}
      />

      {/* Main Content Area */}
      <div
        className="main-with-sidebar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <Header
          userName={userName}
          onLogout={onLogout}
          showToast={showToast}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          onOpenPomodoro={() => setPomodoroOpen((o) => !o)}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        <main
          style={{
            padding: '32px 24px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* AI Morning Briefing & Evening Decompression Banner */}
          <AiDailyBriefing showToast={showToast} />

          {/* Welcome Banner — Dashboard Anchor */}
          <div
            id="section-dashboard"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '32px',
              width: '100%',
              position: 'relative',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--text-primary, #1e293b)',
                  margin: '0 0 6px 0',
                  lineHeight: '1.2',
                }}
              >
                {greeting}, {firstName}! 🧠
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary, #64748b)',
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {urgentCount > 0 ? (
                  <>
                    You have{' '}
                    <span style={{ color: '#a04100', fontWeight: '700' }}>
                      {urgentCount} urgent item{urgentCount !== 1 ? 's' : ''}
                    </span>{' '}
                    in Do First quadrant.
                  </>
                ) : (
                  <>All caught up — great focus today! 🎉</>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '16px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '24px' }}>🔥</span>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-secondary, #64748b)',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '2px',
                    }}
                  >
                    Current Streak
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--text-primary, #1e293b)',
                      lineHeight: '1.2',
                    }}
                  >
                    {streak}-Day Streak
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#630ed4',
                  color: '#ffffff',
                  borderRadius: '16px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 16px rgba(99,14,212,0.25)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '22px',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  military_tech
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#eaddff',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '2px',
                    }}
                  >
                    Level Progress
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      lineHeight: '1.2',
                    }}
                  >
                    Lvl {level} ({xp} XP)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Row 1: BrainDump (8) + FocusLeague (4, spans 2 rows) */}
            <div id="section-brain-dump" className="md:col-span-8">
              <BrainDump showToast={showToast} />
            </div>
            <div
              id="section-focus-league"
              className="md:col-span-4 md:row-span-2"
            >
              <FocusLeague />
            </div>

            {/* Row 1B: Priority Matrix (8) */}
            <div id="section-priority-matrix" className="md:col-span-8">
              <EisenhowerMatrix showToast={showToast} />
            </div>

            {/* Row 2: FocusAnalytics (4) */}
            <div id="section-focus-analytics" className="md:col-span-4">
              <FocusAnalytics />
            </div>

            {/* Row 3: Timeline (5) + DigitalSanctuary (7) */}
            <div id="section-timeline" className="md:col-span-5">
              <TimelineCard />
            </div>
            <div id="section-digital-sanctuary" className="md:col-span-7">
              <DigitalSanctuary onOpenPomodoro={() => setPomodoroOpen(true)} />
            </div>

            {/* Row 4: Widgets */}
            <div className="md:col-span-4">
              <MoodWidget showToast={showToast} />
            </div>
            <div className="md:col-span-8">
              <HabitTracker showToast={showToast} />
            </div>

            {/* Row 5: Archive */}
            <div className="md:col-span-12">
              <CompletedArchive />
            </div>
          </div>
        </main>

        {/* Modals & Overlays */}
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
          onOpenPomodoro={() => setPomodoroOpen((o) => !o)}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          onReset={() => {
            dispatch({ type: 'DAILY_RESET' });
            if (showToast)
              showToast(
                'Daily reset performed! Habits reset & completed tasks archived.',
                '🌙',
              );
          }}
          showToast={showToast}
        />

        <AiCopilot
          showToast={showToast}
          onOpenPomodoro={() => setPomodoroOpen(true)}
        />

        <ToastContainer toasts={toasts} />
      </div>
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
