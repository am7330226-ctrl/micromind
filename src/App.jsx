/**
 * App.jsx — Root component.
 * Updated with Stitch sidebar layout + new bento grid cards:
 *   Sidebar | Header | main bento (BrainDump, FocusLeague, PriorityMatrix,
 *   FocusAnalytics, TimelineCard, DigitalSanctuary) + existing modals.
 */

import './index.css';
import { useState, useEffect } from 'react';
import { AppStateProvider, useAuth, useAppState, useDispatch } from './store.jsx';
import { useToast } from './hooks/useToast.js';
import { THEMES, getSavedThemeId, applyTheme } from './utils/themes.js';

// Existing components
import Header          from './components/Header.jsx';
import BrainDump       from './components/BrainDump.jsx';
import EisenhowerMatrix from './components/EisenhowerMatrix.jsx';
import MoodWidget      from './components/MoodWidget.jsx';
import HabitTracker    from './components/HabitTracker.jsx';
import PomodoroTimer   from './components/PomodoroTimer.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import ToastContainer  from './components/ToastContainer.jsx';
import AuthModal       from './components/AuthModal.jsx';
import CompletedArchive from './components/CompletedArchive.jsx';
import TaskDetailPanel from './components/TaskDetailPanel.jsx';
import MobileBottomDock from './components/MobileBottomDock.jsx';
import AiCopilot       from './components/AiCopilot.jsx';

// ── New Stitch-converted components ──────────────────────────────────────────
import Sidebar          from './components/Sidebar.jsx';
import FocusLeague      from './components/FocusLeague.jsx';
import FocusAnalytics   from './components/FocusAnalytics.jsx';
import TimelineCard     from './components/TimelineCard.jsx';
import DigitalSanctuary from './components/DigitalSanctuary.jsx';

function AppInner() {
  const { auth, login, loginGuest, logout } = useAuth();
  const { toasts, showToast } = useToast();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pomodoroOpen,  setPomodoroOpen]  = useState(false);

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
  showToast, toasts,
  analyticsOpen, setAnalyticsOpen,
  pomodoroOpen,  setPomodoroOpen,
  onLogout, userName,
}) {
  const state    = useAppState();
  const dispatch = useDispatch();

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply the saved theme from ThemeSelector on first mount
  useEffect(() => {
    const savedId = getSavedThemeId();
    const theme   = THEMES.find(t => t.id === savedId) || THEMES[0];
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto daily reset when a new day is detected
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = state.lastResetDate;
    if (lastReset && lastReset !== today) {
      dispatch({ type: 'DAILY_RESET' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
               'Good Evening';

  const firstName = (userName || 'there').split(' ')[0];

  // Urgent tasks count
  const urgentCount = (state.tasks || []).filter(
    t => t && t.priority === 'urgent' && !t.completed
  ).length;

  // Streak / XP
  const streak = state.streak || 0;
  const xp     = state.xp     || 0;
  const level  = state.level  || 1;

  return (
    <div className="flex min-h-screen bg-[#f4f6fc] dark:bg-[#121212]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewEntry={() => {
          setSidebarOpen(false);
          // Focus the BrainDump textarea
          document.querySelector('.brain-dump-input')?.focus();
        }}
      />

      {/* Main wrapper — offset by sidebar on desktop */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[260px]">
        {/* Header with Stitch top bar + original bottom bar */}
        <Header
          userName={userName}
          onLogout={onLogout}
          showToast={showToast}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          onOpenPomodoro={() => setPomodoroOpen(o => !o)}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
        <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto w-full">

          {/* Welcome Header — Stitch style */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold font-headline text-[#111c2d] dark:text-[#f8fafc] mb-1">
                {greeting}, {firstName}! 🧠
              </h2>
              <p className="text-[#4a4455] text-[16px]">
                {urgentCount > 0
                  ? <>You have <span className="text-[#a04100] font-bold">{urgentCount} urgent item{urgentCount !== 1 ? 's' : ''}</span> in Do First quadrant.</>
                  : <>All caught up — great focus today! 🎉</>
                }
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white border border-[#ccc3d8]/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-[10px] text-[#4a4455] font-bold uppercase tracking-wider">Current Streak</p>
                  <p className="text-[20px] font-bold text-[#111c2d] leading-tight">{streak}-Day Streak</p>
                </div>
              </div>
              <div className="bg-[#630ed4] text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg shadow-[#630ed4]/20">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <div>
                  <p className="text-[10px] text-[#eaddff] font-bold uppercase tracking-wider">Level Progress</p>
                  <p className="text-[20px] font-bold leading-tight">Lvl {level} ({xp} XP)</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── BENTO GRID ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Row 1: BrainDump (8) + FocusLeague (4, spans 2 rows) */}
            <div className="md:col-span-8">
              <BrainDump showToast={showToast} />
            </div>
            <div className="md:col-span-4 md:row-span-2">
              <FocusLeague />
            </div>

            {/* Row 1B: Priority Matrix (8) */}
            <div className="md:col-span-8">
              <EisenhowerMatrix showToast={showToast} />
            </div>

            {/* Row 2: FocusAnalytics (4) */}
            <div className="md:col-span-4">
              <FocusAnalytics />
            </div>

            {/* Row 3: Timeline (5) + DigitalSanctuary (7) */}
            <div className="md:col-span-5">
              <TimelineCard />
            </div>
            <div className="md:col-span-7">
              <DigitalSanctuary onOpenPomodoro={() => setPomodoroOpen(true)} />
            </div>

            {/* Row 4: Original left column widgets */}
            <div className="md:col-span-4">
              <MoodWidget showToast={showToast} />
            </div>
            <div className="md:col-span-8">
              <HabitTracker showToast={showToast} />
            </div>

            {/* Row 5: Completed archive full width */}
            <div className="md:col-span-12">
              <CompletedArchive />
            </div>
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
