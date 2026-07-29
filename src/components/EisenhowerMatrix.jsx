/**
 * EisenhowerMatrix.jsx — The 2×2 priority matrix.
 * Enhanced with AI Total Focus Time display in Q1 (Do First) header.
 * Drag-and-drop removed in favor of 1-Tap Category Selector Pills.
 */

import { useAppState } from '../store.jsx';
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
  const focusTime = quadrant.id === 'q1' ? sumFocusTime(tasks) : null;

  return (
    <div className={`quadrant ${quadrant.id}`}>
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
          {quadrant.id === 'q1' && focusTime?.label && (
            <span
              className="q1-focus-time-badge"
              title={`Estimated total focus time: ${focusTime.label}`}
              aria-label={`Estimated total focus time for Do First tasks: ${focusTime.label}`}
            >
              ⏱ {focusTime.label}
            </span>
          )}

          <span className="task-count">
            {tasks.filter(t => !t.completed).length}
            {quadrant.id === 'q1' ? '/3' : ''}
          </span>
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <span>✦</span>
            Select category pill on a task to move it here
          </div>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              showBreakdown
              showToast={showToast}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function EisenhowerMatrix({ showToast }) {
  const state = useAppState();

  const getQuadrantTasks = (qId) =>
    (state.tasks || []).filter(t => t && t.category === qId);

  return (
    <div className="glass-panel eisenhower-matrix-container">
      <div className="matrix-header">
        <div>
          <h2 className="section-title">Priority Matrix</h2>
          <p className="section-subtitle">
            1-Tap category pills to categorize tasks into the Eisenhower quadrants
          </p>
        </div>
        <span className="eisenhower-tag">Eisenhower Method</span>
      </div>

      <div className="matrix-grid">
        {QUADRANTS.map(q => (
          <Quadrant
            key={q.id}
            quadrant={q}
            tasks={getQuadrantTasks(q.id)}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}
