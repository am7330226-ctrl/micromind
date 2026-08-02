/**
 * AiDailyBriefing.jsx — Morning Focus Roadmap & Evening Decompression Banner
 *
 * Renders an AI-powered context banner on the Dashboard.
 * Morning (AM): Generates morning focus roadmap based on Q1 matrix & streak.
 * Evening (PM): Audits completed tasks, praises progress, and provides a 1-click
 * evening decompression button to clear remaining inbox noise.
 */

import { useAppState, useDispatch, useAuth } from '../store.jsx';

export default function AiDailyBriefing({ showToast }) {
  const state    = useAppState();
  const dispatch = useDispatch();
  const { auth } = useAuth();

  const userName = auth.name || 'Friend';
  const streak   = state.streak || 0;
  const level    = state.level || 1;
  const tasks    = state.tasks || [];

  const q1Tasks        = tasks.filter(t => t.category === 'q1' && !t.completed);
  const completedToday = tasks.filter(t => t.completed).length;
  const activeInbox    = tasks.filter(t => t.category === 'inbox' && !t.completed);

  const hour = new Date().getHours();
  const isMorning   = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const isEvening   = hour >= 18 || hour < 5;

  const handleEveningDecompress = () => {
    dispatch({ type: 'CLEAR_COMPLETED_INBOX' });
    if (showToast) {
      showToast('🌇 Evening Decompression complete! Unfinished inbox cleared for tomorrow.', '🌙');
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: '20px',
        background: isMorning
          ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(99, 102, 241, 0.08))'
          : isAfternoon
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08))'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.25), rgba(99, 14, 212, 0.15))',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '14px',
          background: isMorning ? '#7c3aed' : isAfternoon ? '#f59e0b' : '#630ed4',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {isMorning ? '🌅' : isAfternoon ? '☀️' : '🌇'}
        </div>

        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            {isMorning ? `Good Morning, ${userName}!` : isAfternoon ? `Afternoon Focus, ${userName}!` : `Evening Decompression, ${userName}!`}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
            {isMorning && (
              <>
                🔥 <strong>{streak}-Day Streak</strong> (Lvl {level}).
                {q1Tasks.length > 0
                  ? ` Focus on your ${q1Tasks.length} Q1 Do-First item${q1Tasks.length > 1 ? 's' : ''} to build early momentum today.`
                  : ' Your Do-First list is clear! Capture raw thoughts in Brain Dump.'}
              </>
            )}

            {isAfternoon && (
              <>
                ⚡ You've completed <strong>{completedToday} task{completedToday !== 1 ? 's' : ''}</strong> today.
                {q1Tasks.length > 0
                  ? ` Top focus: "${q1Tasks[0].text.slice(0, 32)}".`
                  : ' Great energy! Keep your momentum going.'}
              </>
            )}

            {isEvening && (
              <>
                🌙 You accomplished <strong>{completedToday} task{completedToday !== 1 ? 's' : ''}</strong> today.
                {activeInbox.length > 0
                  ? ` You have ${activeInbox.length} raw inbox item${activeInbox.length > 1 ? 's' : ''} remaining.`
                  : ' Inbox is clean and clear for tomorrow! Rest well.'}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {isEvening && activeInbox.length > 0 && (
        <button
          type="button"
          onClick={handleEveningDecompress}
          style={{
            padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
            backgroundColor: '#630ed4', color: '#ffffff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 14, 212, 0.3)', transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          🧹 Decompress Inbox
        </button>
      )}
    </div>
  );
}
