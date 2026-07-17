/**
 * EisenhowerMatrix.jsx — The 2×2 priority matrix with drag-and-drop support.
 */

import { useState, useCallback } from 'react';
import { useAppState, useDispatch } from '../store.jsx';
import TaskItem from './TaskItem.jsx';

const QUADRANTS = [
  {
    id: 'q1',
    label: 'Do First',
    subtitle: 'Urgent & Important',
    emoji: '🔥',
  },
  {
    id: 'q2',
    label: 'Schedule',
    subtitle: 'Important, Not Urgent',
    emoji: '📅',
  },
  {
    id: 'q3',
    label: 'Delegate',
    subtitle: 'Urgent, Not Important',
    emoji: '🤝',
  },
  {
    id: 'q4',
    label: "Don't Do",
    subtitle: 'Not Urgent & Not Important',
    emoji: '🗑️',
  },
];

function Quadrant({ quadrant, tasks, showToast }) {
  const dispatch = useDispatch();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      dispatch({ type: 'MOVE_TASK', id: taskId, category: quadrant.id });
      showToast(`Moved to ${quadrant.label}`, quadrant.emoji);
    }
  }, [dispatch, quadrant, showToast]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  return (
    <div
      className={`quadrant ${quadrant.id}${dragOver ? ' drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
    >
      <div className="quadrant-header">
        <span className="quadrant-dot" />
        <div>
          <div className="quadrant-label">{quadrant.emoji} {quadrant.label}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {quadrant.subtitle}
          </div>
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
            <TaskItem key={task.id} task={task} />
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
