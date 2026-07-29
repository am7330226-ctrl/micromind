/**
 * TimelineCard.jsx — Today's task timeline (Stitch "Card D")
 * Shows completed + upcoming tasks as a vertical timeline.
 * Uses robust inline styles for visual layout consistency.
 */

import { useMemo } from 'react';
import { useAppState } from '../store.jsx';

const PRIORITY_META = {
  urgent:    { color: '#a04100', bg: 'rgba(160, 65, 0, 0.05)',   border: '#a04100', dot: '#a04100', badgeBg: 'rgba(160, 65, 0, 0.12)', label: 'Do First'  },
  important: { color: '#630ed4', bg: 'rgba(99, 14, 212, 0.05)',  border: '#630ed4', dot: '#630ed4', badgeBg: 'rgba(99, 14, 212, 0.12)', label: 'Schedule'  },
  delegate:  { color: '#005b3d', bg: 'rgba(0, 91, 61, 0.05)',    border: '#005b3d', dot: '#005b3d', badgeBg: 'rgba(0, 91, 61, 0.12)',   label: 'Delegate'  },
  inbox:     { color: '#4a4455', bg: '#f0f3ff',                  border: '#ccc3d8', dot: '#ccc3d8', badgeBg: '#e7eeff',                 label: 'Inbox'     },
  eliminate: { color: '#4a4455', bg: '#f0f3ff',                  border: '#ccc3d8', dot: '#ccc3d8', badgeBg: '#e7eeff',                 label: 'Avoid'     },
};

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimelineCard() {
  const state = useAppState();
  const tasks = (state.tasks || []).filter(t => t && typeof t === 'object');

  const entries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const completed = tasks
      .filter(t => t.completed && t.completedAt?.startsWith(todayStr))
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    const upcoming = tasks
      .filter(t => !t.completed)
      .slice(0, 4);

    return [...completed, ...upcoming].slice(0, 8);
  }, [tasks]);

  const PLACEHOLDER = [
    { id: 'p1', text: 'Deep Work: UI Design',    priority: 'important', completed: true,  completedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'p2', text: 'Team Strategy Sync',      priority: 'urgent',    completed: true,  completedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'p3', text: 'Digital Detox Break 🌿', priority: 'delegate',  completed: true,  completedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'p4', text: 'Draft Newsletter',        priority: 'inbox',     completed: false, completedAt: null },
  ];

  const display = entries.length > 0 ? entries : PLACEHOLDER;

  return (
    <div className="bento-card" style={{ height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ color: '#630ed4', fontSize: '24px' }}>view_timeline</span>
        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, fontFamily: 'Outfit, sans-serif', color: '#111c2d' }}>
          Today's Timeline
        </h3>
      </div>

      {/* Timeline items list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Dashed background line */}
        <div style={{
          position: 'absolute', left: '47px', top: '10px', bottom: '10px',
          width: '1px', borderLeft: '1px dashed #ccc3d8', zIndex: 0
        }} />

        {display.map((task, idx) => {
          const meta = PRIORITY_META[task.priority] || PRIORITY_META.inbox;
          const upcoming = !task.completed;
          return (
            <div key={task.id || idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1,
              opacity: upcoming ? 0.6 : 1
            }}>
              {/* Time Label */}
              <div style={{ width: '40px', textAlign: 'right', flexShrink: 0, paddingTop: '2px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4455', margin: 0 }}>
                  {formatTime(task.completedAt) || '—'}
                </p>
              </div>

              {/* Dot */}
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', backgroundColor: meta.dot,
                border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${meta.dot}40`,
                flexShrink: 0, marginTop: '3px'
              }} />

              {/* Task Detail Box */}
              <div style={{
                flex: 1, backgroundColor: meta.bg, borderLeft: `4px solid ${meta.border}`,
                padding: '10px 14px', borderRadius: '0 14px 14px 0', display: 'flex', flexDirection: 'column', gap: '6px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111c2d', margin: 0, lineHeight: '1.4' }}>
                  {task.text}
                </h4>
                {task.priority && (
                  <div>
                    <span style={{
                      display: 'inline-block', fontSize: '10px', fontWeight: '700',
                      textTransform: 'uppercase', color: meta.color, backgroundColor: meta.badgeBg,
                      padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em'
                    }}>
                      {meta.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
