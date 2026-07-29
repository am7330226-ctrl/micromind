/**
 * Header.jsx — App top bar with brand, date, analytics/zen/ambient controls,
 * daily reset, user info, and logout.
 * Updated with Stitch-style top bar: breadcrumb, search, DiceBear avatar, and
 * hamburger button for mobile sidebar toggle.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useAppState } from '../store.jsx';
import PwaInstallPrompt from './PwaInstallPrompt.jsx';
import VoiceBriefing from './VoiceBriefing.jsx';
import AmbientSoundPlayer from './AmbientSoundPlayer.jsx';
import ThemeSelector from './ThemeSelector.jsx';

// ── Component ─────────────────────────────────────────────────────
export default function Header({
  userName,
  onLogout,
  showToast,
  onOpenAnalytics,
  onOpenPomodoro,
  onToggleSidebar,
}) {
  const dispatch = useDispatch();
  const state    = useAppState();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search,     setSearch]     = useState('');
  const menuRef   = useRef(null);
  const searchRef = useRef(null);

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
  const xp    = state.xp    || 0;
  const level = state.level || 1;
  const xpBase  = (level - 1) * (level - 1) * 100;
  const nextXp  = level * level * 100;
  const levelProgress = Math.max(0, Math.min(100, ((xp - xpBase) / (nextXp - xpBase)) * 100));

  // DiceBear avatar URL — replaces external googleusercontent image
  const avatarUrl = userName
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=630ed4&textColor=ffffff&fontSize=40`
    : null;

  return (
    <header className="app-header two-tier-header">
      {/* ── STITCH TOP BAR ──────────────────────────────────────────── */}
      <div
        className={[
          'h-14 flex justify-between items-center px-4 md:px-8',
          'bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md',
          'border-b border-[#ccc3d8]/30 shadow-sm',
        ].join(' ')}
      >
        {/* Left: Hamburger (mobile) + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="md:hidden p-1.5 rounded-lg hover:bg-[#f0f3ff] transition-colors"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-[#630ed4] text-[22px]">menu</span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-[#4a4455] font-medium hidden sm:block">Dashboard</span>
            <span className="material-symbols-outlined text-[#4a4455] text-[14px] hidden sm:block">chevron_right</span>
            <span className="text-[#630ed4] font-bold">Overview</span>
          </div>
        </div>

        {/* Right: Search + quick actions + avatar */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search bar — expands on mobile tap */}
          <div
            className={[
              'relative flex items-center bg-[#f0f3ff] rounded-full border transition-all duration-300',
              searchOpen
                ? 'border-[#630ed4]/50 w-44 md:w-52'
                : 'border-[#ccc3d8]/20 w-8 md:w-44',
            ].join(' ')}
          >
            <button
              type="button"
              className="pl-2.5 shrink-0"
              onClick={() => { setSearchOpen(true); searchRef.current?.focus(); }}
              aria-label="Open search"
            >
              <span className="material-symbols-outlined text-[#4a4455] text-[18px]">search</span>
            </button>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false); }}
              placeholder="Search insights..."
              className={[
                'bg-transparent border-none outline-none text-[13px] text-[#111c2d] placeholder-[#4a4455]/50 pr-3 transition-all duration-300',
                searchOpen ? 'w-full py-1.5 opacity-100' : 'w-0 opacity-0 py-0',
              ].join(' ')}
              aria-label="Search"
            />
          </div>

          {/* Pomodoro shortcut */}
          <button
            type="button"
            id="pomodoro-toggle-btn"
            className="p-1.5 rounded-full hover:bg-[#f0f3ff] transition-colors hidden sm:flex"
            onClick={onOpenPomodoro}
            title="Pomodoro Focus Timer"
            aria-label="Open Pomodoro Focus Timer"
          >
            <span className="text-lg">🍓</span>
          </button>

          {/* Analytics shortcut */}
          <button
            type="button"
            id="analytics-toggle-btn"
            className="p-1.5 rounded-full hover:bg-[#f0f3ff] transition-colors hidden sm:flex"
            onClick={onOpenAnalytics}
            title="Analytics & Productivity Insights"
            aria-label="Open Analytics"
          >
            <span className="text-lg">📊</span>
          </button>

          {/* Stitch-style streak badge */}
          <div
            className="hidden md:flex items-center gap-2 bg-white border border-[#ccc3d8]/30 rounded-2xl px-3 py-1.5 shadow-sm"
            title="Current streak"
          >
            <span className="text-lg">🔥</span>
            <span className="text-[13px] font-bold text-[#111c2d]">{state.streak || 0}d</span>
          </div>

          {/* Stitch-style XP badge */}
          <div
            className="hidden md:flex items-center gap-2 bg-[#630ed4] text-white rounded-2xl px-3 py-1.5 shadow-lg shadow-[#630ed4]/20"
            title={`${xp} XP total`}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            <span className="text-[13px] font-bold">Lvl {level} · {xp} XP</span>
          </div>

          {/* Avatar + dropdown */}
          <div ref={menuRef} className="relative flex items-center gap-2 ml-1 border-l border-[#ccc3d8]/30 pl-3">
            <button
              type="button"
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#630ed4]/20 hover:border-[#630ed4]/50 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              title={`Signed in as ${userName}. Tap for options`}
              aria-label="User Account Menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#630ed4] flex items-center justify-center text-white text-sm font-bold">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <span className="text-[13px] font-medium text-[#111c2d] hidden lg:block">
              {(userName || '').split(' ')[0]}
            </span>

            {/* Dropdown */}
            {menuOpen && (
              <div
                className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-[#ccc3d8]/30 min-w-[180px] z-50 overflow-hidden"
                role="menu"
                aria-label="User profile options"
              >
                <div className="px-4 py-3 bg-[#f0f3ff]">
                  <p className="text-[13px] font-bold text-[#111c2d]">{userName}</p>
                  <p className="text-[11px] text-[#4a4455]">Active Session</p>
                </div>
                <div className="p-2">
                  <div className="px-2 py-1">
                    <PwaInstallPrompt showToast={showToast} />
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 text-[13px] font-medium transition-colors"
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    aria-label="Sign Out"
                    role="menuitem"
                  >
                    <span>🚪</span><span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ORIGINAL BOTTOM ROW: Compact Utility Toolbar ─────────── */}
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
          <VoiceBriefing showToast={showToast} />

          <button
            type="button"
            id="pomodoro-toggle-btn-bottom"
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
            id="analytics-toggle-btn-bottom"
            className="utility-tool-btn"
            onClick={onOpenAnalytics}
            title="Analytics & Productivity Insights"
            aria-label="Open Analytics & Productivity Insights"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>

          <AmbientSoundPlayer showToast={showToast} />

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
