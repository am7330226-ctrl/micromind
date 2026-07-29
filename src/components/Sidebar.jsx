/**
 * Sidebar.jsx — Collapsible left navigation panel
 * Converted from Stitch HTML with React state replacing jQuery scripts.
 * - Desktop: fixed 260px wide, always visible
 * - Mobile: hidden by default, slides in via hamburger toggle in Header
 */

import { useAppState } from '../store.jsx';

const NAV_ITEMS = [
  { icon: 'dashboard',  label: 'Dashboard',        active: true },
  { icon: 'psychology', label: 'Brain Dump',        active: false },
  { icon: 'grid_view',  label: 'Priority Matrix',   active: false },
  { icon: 'bar_chart',  label: 'Focus Analytics',   active: false },
  { icon: 'schedule',   label: 'Timeline',          active: false },
];

export default function Sidebar({ isOpen, onClose, onNewEntry }) {
  const state = useAppState();
  const level  = state.level  || 1;
  const xp     = state.xp     || 0;
  const streak = state.streak || 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed left-0 top-0 h-full flex flex-col p-6 z-50',
          'bg-[#f0f3ff]/90 dark:bg-[#1a1a2e]/90 backdrop-blur-xl',
          'border-r border-[#ccc3d8]/40 shadow-xl',
          'transition-transform duration-300 ease-in-out',
          'w-[260px]',
          // Mobile: off-screen unless open; desktop: always on-screen
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#630ed4] to-[#7c3aed] flex items-center justify-center text-white shadow-lg shadow-[#630ed4]/30">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-[#630ed4] font-headline">MicroMind</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#4a4455] font-bold">Digital Sanctuary</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={onClose}
              className={[
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left',
                'active:scale-95 font-label-md text-[14px] font-medium',
                item.active
                  ? 'bg-[#630ed4] text-white shadow-lg shadow-[#630ed4]/25'
                  : 'text-[#4a4455] hover:bg-[#dee8ff]/60 dark:hover:bg-white/10',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-6 space-y-2">
          {/* XP / Level Badge */}
          <div className="mb-4 px-4 py-3 bg-white/50 dark:bg-white/5 rounded-xl border border-[#ccc3d8]/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#4a4455]">Lvl {level}</span>
              <span className="text-[10px] font-bold text-[#630ed4]">{xp} XP</span>
            </div>
            <div className="h-1.5 bg-[#e7eeff] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#630ed4] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (xp % 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-[#4a4455] mt-1">🔥 {streak}-day streak</p>
          </div>

          {/* New Entry Button */}
          <button
            type="button"
            onClick={onNewEntry}
            className="w-full bg-[#630ed4] text-white rounded-xl py-3 px-4 text-[14px] font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#630ed4]/20 hover:shadow-[#630ed4]/30 hover:bg-[#7c3aed] transition-all active:scale-95 mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Entry
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 text-[#4a4455] px-4 py-2 hover:bg-[#dee8ff]/60 rounded-xl transition-all text-[14px] font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Settings
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 text-[#4a4455] px-4 py-2 hover:bg-[#dee8ff]/60 rounded-xl transition-all text-[14px] font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            Support
          </button>
        </div>
      </aside>
    </>
  );
}
