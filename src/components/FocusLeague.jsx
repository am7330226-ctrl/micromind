/**
 * FocusLeague.jsx — Gamification leaderboard card (Stitch "Card F")
 * Shows user rank, friends' XP, and next-reward milestone.
 * Styled with theme-aware classes for dark mode glass surfaces.
 */

import { useAppState, useAuth } from '../store.jsx';

const MOCK_LEADERBOARD = [
  { rank: 2, name: 'Sarah K.',  xp: 720, level: 4, streak: 8  },
  { rank: 3, name: 'Marcus V.', xp: 690, level: 4, streak: 5  },
  { rank: 4, name: 'Priya S.',  xp: 640, level: 3, streak: 12 },
];

const NEXT_REWARD_XP   = 1000;
const NEXT_REWARD_LABEL = 'Deep Focus Soundpack 🔓';

export default function FocusLeague() {
  const state    = useAppState();
  const { auth } = useAuth();
  const userXp   = state.xp    || 0;
  const userLvl  = state.level || 1;
  const userName = auth.name || 'You';

  const pct = Math.min(100, Math.round((userXp / NEXT_REWARD_XP) * 100));

  return (
    <div className="bento-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span className="material-symbols-outlined" style={{ color: '#a04100', fontSize: '24px' }}>leaderboard</span>
        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Focus League
        </h3>
      </div>

      {/* #1 — The user */}
      <div className="leaderboard-item user-rank-card" style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
        backgroundColor: 'rgba(99, 14, 212, 0.15)', borderRadius: '16px',
        border: '1px solid rgba(99, 14, 212, 0.3)', marginBottom: '12px'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#630ed4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          fontWeight: '700', fontSize: '14px', flexShrink: 0, lineHeight: '36px', textAlign: 'center'
        }}>
          1
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName} (You)
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(99, 14, 212, 0.2)', borderRadius: '6px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: '#630ed4', borderRadius: '6px', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '14px', flexShrink: 0 }}>{userXp} XP</span>
      </div>

      {/* Other players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MOCK_LEADERBOARD.map(p => (
          <div key={p.rank} className="leaderboard-item" style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
            borderRadius: '16px', transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 14, 212, 0.1)',
              color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '14px', flexShrink: 0, lineHeight: '36px', textAlign: 'center'
            }}>
              {p.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Lvl {p.level} · 🔥{p.streak}d
              </div>
            </div>
            <span style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', flexShrink: 0 }}>{p.xp} XP</span>
          </div>
        ))}
      </div>

      {/* Next reward */}
      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <div className="reward-box" style={{ padding: '14px', borderRadius: '16px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
            Next reward at {NEXT_REWARD_XP} XP — {NEXT_REWARD_XP - userXp > 0 ? `${NEXT_REWARD_XP - userXp} to go!` : 'Unlocked!'}
          </p>
          <p style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '14px', margin: 0 }}>{NEXT_REWARD_LABEL}</p>
        </div>
      </div>
    </div>
  );
}
