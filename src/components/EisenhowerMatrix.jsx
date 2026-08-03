/**
 * EisenhowerMatrix.jsx — The 2×2 priority matrix.
 * Redesigned 1:1 to match the clean white floating card layout with 5px vertical
 * colored accent stripes, uppercase subtitles, count badges, and dashed drop-zone empty states.
 */

import { useAppState } from '../store.jsx';
import { sumFocusTime } from '../utils/estimateTaskTime.js';
import TaskItem from './TaskItem.jsx';

const QUADRANTS = [
  {
    id: 'q1',
    num: '01',
    label: 'Do First',
    subtitle: 'URGENT & IMPORTANT',
    emoji: '🔥',
    accentColor: '#f97316',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
  {
    id: 'q2',
    num: '02',
    label: 'Schedule',
    subtitle: 'IMPORTANT, NOT URGENT',
    emoji: '📅',
    accentColor: '#3b82f6',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
  {
    id: 'q3',
    num: '03',
    label: 'Delegate',
    subtitle: 'URGENT, NOT IMPORTANT',
    emoji: '🤝',
    accentColor: '#eab308',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
  {
    id: 'q4',
    num: '04',
    label: "Don't Do",
    subtitle: 'NOT URGENT & NOT IMPORTANT',
    emoji: '🗑️',
    accentColor: '#78350f',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
];

function Quadrant({ quadrant, tasks, showToast }) {
  const focusTime = quadrant.id === 'q1' ? sumFocusTime(tasks) : null;

  return (
    <div
      className={`quadrant ${quadrant.id}`}
      style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '20px',
        borderLeft: `5px solid ${quadrant.accentColor}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        borderTop: '1px solid var(--border-color, #e2e8f0)',
        borderRight: '1px solid var(--border-color, #e2e8f0)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        className="quadrant-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: quadrant.accentColor,
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1,
            }}
          >
            {quadrant.num}
          </span>
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{quadrant.emoji}</span>
              <span>{quadrant.label}</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '3px',
              }}
            >
              {quadrant.subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {quadrant.id === 'q1' && focusTime?.label && (
            <span
              className="q1-focus-time-badge"
              style={{
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                color: '#c2410c',
              }}
              title={`Estimated total focus time: ${focusTime.label}`}
              aria-label={`Estimated total focus time for Do First tasks: ${focusTime.label}`}
            >
              ⏱ {focusTime.label}
            </span>
          )}

          <span
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: quadrant.badgeBg,
              color: quadrant.badgeColor,
              fontSize: '12px',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1,
            }}
          >
            {tasks.filter((t) => !t.completed).length}
            {quadrant.id === 'q1' ? '/3' : ''}
          </span>
        </div>
      </div>

      {/* Task List / Dashed Drop Zone */}
      <div className="task-list" style={{ minHeight: '140px' }}>
        {tasks.length === 0 ? (
          <div
            style={{
              border: '2px dashed var(--border-color, #cbd5e1)',
              borderRadius: '16px',
              padding: '36px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              backgroundColor: 'rgba(241, 245, 249, 0.3)',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '28px', color: '#93c5fd' }}>★</span>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                maxWidth: '180px',
              }}
            >
              Select category pill on a task
              <br />
              to move it here
            </div>
          </div>
        ) : (
          tasks.map((task) => (
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
    (state.tasks || []).filter((t) => t && t.category === qId);

  return (
    <div
      className="glass-panel eisenhower-matrix-container"
      id="section-priority-matrix"
    >
      <div className="matrix-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2
            className="section-title"
            style={{
              fontSize: '24px',
              fontWeight: '700',
              fontFamily: 'Outfit, sans-serif',
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
            }}
          >
            Priority Matrix
          </h2>
          <p
            className="section-subtitle"
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '0 0 6px 0',
            }}
          >
            1-Tap category pills to categorize tasks into the Eisenhower
            quadrants
          </p>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '800',
              color: '#d97706',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            EISENHOWER METHOD
          </div>
        </div>
      </div>

      <div
        className="matrix-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {QUADRANTS.map((q) => (
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
