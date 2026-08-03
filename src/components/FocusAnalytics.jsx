/**
 * FocusAnalytics.jsx — Weekly focus bar chart + stats (Stitch "Card C")
 * Derives data from completed tasks in the store.
 * Uses explicit inline styles for responsive bar chart rendering.
 */

import { useMemo } from 'react';
import { useAppState } from '../store.jsx';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function FocusAnalytics() {
  const state = useAppState();
  const tasks = (state.tasks || []).filter((t) => t && typeof t === 'object');

  const weekData = useMemo(() => {
    const today = new Date();
    const todayDow = today.getDay(); // 0=Sun … 6=Sat
    const buckets = new Array(7).fill(0);
    tasks.forEach((t) => {
      if (!t.completed || !t.completedAt) return;
      const d = new Date(t.completedAt);
      const dow = (d.getDay() + 6) % 7; // shift so Mon=0
      buckets[dow] += t.timeEstimate?.minutes || 30;
    });
    const todayIdx = (todayDow + 6) % 7;
    return buckets.map((mins, i) => ({
      label: DAY_LABELS[i],
      mins,
      isToday: i === todayIdx,
    }));
  }, [tasks]);

  const maxMins = Math.max(...weekData.map((d) => d.mins), 60);
  const todayMins = weekData.find((d) => d.isToday)?.mins || 0;
  const totalHrs = (weekData.reduce((s, d) => s + d.mins, 0) / 60).toFixed(1);
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const ratio = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="bento-card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: '#630ed4', fontSize: '24px' }}
        >
          monitoring
        </span>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            color: '#111c2d',
          }}
        >
          Focus Analytics
        </h3>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px',
          height: '160px',
          marginBottom: '20px',
        }}
      >
        {weekData.map(({ label, mins, isToday }) => {
          const heightPct =
            maxMins > 0 ? Math.max(12, Math.round((mins / maxMins) * 100)) : 12;
          return (
            <div
              key={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#f0f3ff',
                  borderRadius: '8px 8px 0 0',
                  position: 'relative',
                  flex: 1,
                  maxHeight: '130px',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    backgroundColor: isToday
                      ? '#630ed4'
                      : 'rgba(99, 14, 212, 0.35)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: isToday
                      ? '0 4px 12px rgba(99, 14, 212, 0.25)'
                      : 'none',
                  }}
                  title={`${(mins / 60).toFixed(1)}h`}
                />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: isToday ? '#630ed4' : '#4a4455',
                }}
              >
                {isToday ? 'TODAY' : label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat cards */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f0f3ff',
            borderRadius: '14px',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: '700',
              color: '#4a4455',
              margin: '0 0 4px 0',
            }}
          >
            Total Hours
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111c2d',
              margin: 0,
            }}
          >
            {totalHrs}h
          </p>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f0f3ff',
            borderRadius: '14px',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: '700',
              color: '#4a4455',
              margin: '0 0 4px 0',
            }}
          >
            Task Ratio
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#630ed4',
              margin: 0,
            }}
          >
            {ratio}%
          </p>
        </div>
      </div>
    </div>
  );
}
