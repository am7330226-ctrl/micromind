/**
 * EisenhowerMatrix.jsx — The 2×2 priority matrix with drag-and-drop support.
 * Enhanced with AI Total Focus Time display in Q1 (Do First) header.
 */

import { useState, useCallback } from 'react';
import { useAppState, useDispatch } from '../store.jsx';
import { sumFocusTime } from '../utils/estimateTaskTime.js';
import TaskItem from './TaskItem.jsx';

const QUADRANTS = [
  {
    id: 'q1',
    num: '01',
    label: 'Do First',
    subtitle: 'Urgent & Important',
    emoji: '🔥',
  },
  {
    id: 'q2',
    num: '02',
    label: 'Schedule',
    subtitle: 'Important, Not Urgent',
    emoji: '📅',
  },
  {
    id: 'q3',
    num: '03',
    label: 'Delegate',
    subtitle: 'Urgent, Not Important',
    emoji: '🤝',
  },
  {
    id: 'q4',
    num: '04',
    label: "Don't Do",
    subtitle: 'Not Urgent & Not Important',
    emoji: '🗑️',
  },
];

function Quadrant({ quadrant, tasks, showToast }) {
  const dispatch = useDispatch();
  const [dragOver, setDragOver] = useState(false);

  const Q1_LIMIT = 3;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // WIP limit: block drops into Q1 if already at limit
    if (quadrant.id === 'q1') {
      const currentQ1Count = tasks.filter(t => !t.completed).length;
      const isAlreadyInQ1 = tasks.some(t => t.id === taskId);
      if (!isAlreadyInQ1 && currentQ1Count >= Q1_LIMIT) {
        showToast(`Q1 is full! Finish something first 🔥`, '⛔');
        return;
      }
    }

    dispatch({ type: 'MOVE_TASK', id: taskId, category: quadrant.id });
    showToast(`Moved to ${quadrant.label}`, quadrant.emoji);
  }, [dispatch, quadrant, showToast, tasks]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  // ── Total Focus Time for Q1 ────────────────────────────────────────────────
  const focusTime = quadrant.id === 'q1' ? sumFocusTime(tasks) : null;

  return (
    <div
      className={`quadrant ${quadrant.id}${dragOver ? ' drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
    >
      <div className="quadrant-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="editorial-num">{quadrant.num}</span>
          <div>
            <div className="quadrant-title">{quadrant.emoji} {quadrant.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {quadrant.subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Total Focus Time badge for Q1 */}
          {quadrant.id === 'q1' && focusTime?.label && (
            <span
              className="q1-focus-time-badge"
              title={`Estimated total focus time: ${focusTime.label}`}
            >
              ⏱ {focusTime.label}
            </span>
          )}
          {quadrant.id === 'q1' && (
            <span className={`quadrant-count${tasks.filter(t => !t.completed).length >= Q1_LIMIT ? ' wip-full' : ''}`}>
              {tasks.filter(t => !t.completed).length}/{Q1_LIMIT}
            </span>
          )}
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '12px 0' }}>
            <span style={{ fontSize: '1.1rem' }}>✦</span>
            Drop tasks here
          </div>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              showBreakdown={quadrant.id === 'q1'}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function EisenhowerMatrix({ showToast }) {
  const state = useAppState();

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Priority Matrix
        </h2>
        <span className="helper-badge">Eisenhower Method</span>
      </div>
      <div className="matrix-grid">
        {QUADRANTS.map(q => (
          <Quadrant
            key={q.id}
            quadrant={q}
            tasks={state.tasks.filter(t => t.category === q.id)}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}
