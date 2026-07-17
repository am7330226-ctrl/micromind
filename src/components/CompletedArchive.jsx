/**
 * CompletedArchive.jsx — Collapsible panel showing tasks completed today,
 * grouped by quadrant. Resets on daily reset.
 */

import { useState } from 'react';
import { useAppState, useDispatch } from '../store.jsx';

const QUAD_NAMES = { q1: '🔥 Do First', q2: '📅 Schedule', q3: '🤝 Delegate', q4: '🗑️ Don\'t Do', inbox: '📥 Inbox' };

export default function CompletedArchive() {
  const state    = useAppState();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const archive = state.completedArchive || [];
  if (archive.length === 0) return null;

  // Group by category
  const groups = {};
  archive.forEach(item => {
    const cat = item.category || 'inbox';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const handleClear = () => {
    if (window.confirm('Clear today\'s completed task archive?')) {
      dispatch({ type: 'CLEAR_ARCHIVE' });
    }
  };

  return (
    <div className="glass-panel completed-archive-panel">
      <div className="panel-header" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(o => !o)}>
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Completed Today
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="helper-badge">{archive.length} task{archive.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
        </div>
      </div>

      {open && (
        <div className="archive-body">
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat} className="archive-group">
              <div className="archive-group-label">{QUAD_NAMES[cat] || cat}</div>
              {items.map(item => (
                <div key={item.id} className="archive-item">
                  <span className="archive-check">✓</span>
                  <span className="archive-text">{item.text}</span>
                  {item.dueDate && (
                    <span className="archive-due">📅 {item.dueDate}</span>
                  )}
                  <span className="archive-time">
                    {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <button className="text-btn" style={{ marginTop: 8, fontSize: '0.75rem', color: '#dc2626' }} onClick={handleClear}>
            Clear Archive
          </button>
        </div>
      )}
    </div>
  );
}
