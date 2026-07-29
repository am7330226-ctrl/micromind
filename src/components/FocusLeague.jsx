/**
 * FocusLeague.jsx — Gamification leaderboard card (Stitch "Card F")
 * Shows user rank, friends' XP, and next-reward milestone.
 * Wired to store for live xp + level data.
 */

import { useAppState } from '../store.jsx';

const MOCK_LEADERBOARD = [
  { rank: 2, name: 'Sarah K.',  xp: 720, level: 4, streak: 8  },
  { rank: 3, name: 'Marcus V.', xp: 690, level: 4, streak: 5  },
  { rank: 4, name: 'Priya S.',  xp: 640, level: 3, streak: 12 },
];

const NEXT_REWARD_XP   = 1000;
const NEXT_REWARD_LABEL = 'Deep Focus Soundpack 🔓';

export default function FocusLeague() {
  const state    = useAppState();
  const userXp   = state.xp    || 0;
  const userLvl  = state.level || 1;
  const userName = state.userName || 'You';

  const pct = Math.min(100, Math.round((userXp / NEXT_REWARD_XP) * 100));

  return (
    <div className="bento-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-[#a04100]">leaderboard</span>
        <h3 className="text-[20px] font-semibold font-headline">Focus League</h3>
      </div>

      {/* #1 — The user */}
      <div className="flex items-center gap-4 p-3 bg-[#eaddff]/30 rounded-2xl border border-[#630ed4]/10 mb-2">
        <div className="w-10 h-10 rounded-full bg-[#630ed4] flex items-center justify-center text-white font-bold text-sm shrink-0">
          1
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[#111c2d] truncate">{userName} (You)</p>
          <div className="w-full h-1.5 bg-[#e7eeff] rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[#630ed4] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="font-bold text-[#630ed4] shrink-0 text-sm">{userXp} XP</span>
      </div>

      {/* Other players */}
      <div className="space-y-2">
        {MOCK_LEADERBOARD.map(p => (
          <div key={p.rank} className="flex items-center gap-4 p-3 hover:bg-[#f0f3ff] rounded-2xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#e7eeff] text-[#4a4455] flex items-center justify-center font-bold text-sm shrink-0">
              {p.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#4a4455] truncate">{p.name}</p>
              <p className="text-[12px] text-[#4a4455]/60">Lvl {p.level} · 🔥{p.streak}d</p>
            </div>
            <span className="font-bold text-[#4a4455]/50 shrink-0 text-sm">{p.xp} XP</span>
          </div>
        ))}
      </div>

      {/* Next reward */}
      <div className="mt-auto pt-6">
        <div className="p-4 bg-[#f0f3ff] rounded-2xl border border-dashed border-[#ccc3d8]">
          <p className="text-[12px] text-center text-[#4a4455] mb-1">
            Next reward at {NEXT_REWARD_XP} XP — {NEXT_REWARD_XP - userXp > 0 ? `${NEXT_REWARD_XP - userXp} to go!` : 'Unlocked!'}
          </p>
          <p className="text-center font-bold text-[#630ed4] text-sm">{NEXT_REWARD_LABEL}</p>
        </div>
      </div>
    </div>
  );
}
