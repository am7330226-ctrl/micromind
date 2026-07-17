/**
 * TaskItem.jsx — Single task row with checkbox, rich text, delete button,
 * due date picker, and AI badge + AI reasoning tooltip.
 */

import { useRef } from 'react';
import { useDispatch } from '../store.jsx';
import { parseRichText } from '../utils/parseRichText.js';

// Returns { label, cls } for the due date badge
function getDueDateMeta(dueDate) {
  if (!dueDate) return null;
  const today = new Date().toISOString().split('T')[0];
  if (dueDate < today)  return { label: `⚠ ${dueDate}`, cls: 'due-overdue' };
  if (dueDate === today) return { label: `📅 Today`,    cls: 'due-today' };
  return { label: `📅 ${dueDate}`, cls: 'due-future' };
}

export default function TaskItem({ task, onToggle }) {
  const dispatch = useDispatch();
  const dateInputRef = useRef(null);

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_TASK', id: task.id });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle?.(task.id, !task.completed);
    dispatch({ type: 'TOGGLE_TASK', id: task.id, completing: !task.completed });
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDateChange = (e) => {
    dispatch({ type: 'SET_TASK_DUE_DATE', id: task.id, dueDate: e.target.value || null });
  };

  const dueMeta = getDueDateMeta(task.dueDate);

  return (
    <div
      className={`task-item${task.completed ? ' completed' : ''}`}
      data-id={task.id}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Checkbox */}
      <div
        className={`task-checkbox${task.completed ? ' checked' : ''}`}
        onClick={handleToggle}
        role="checkbox"
        aria-checked={task.completed}
        tabIndex={0}
        onKeyDown={e => e.key === ' ' && handleToggle(e)}
      />

      {/* Task body: text + due date badge */}
      <div className="task-body">
        <span
          className="task-text"
          dangerouslySetInnerHTML={{ __html: parseRichText(task.text) }}
          onClick={e => { if (e.target.tagName === 'A') return; }}
        />
        {dueMeta && (
          <span className={`due-badge ${dueMeta.cls}`}>{dueMeta.label}</span>
        )}
      </div>

      {/* AI sorting badge */}
      {task.aiSorting && (
        <span className="ai-badge sorting">✨ AI sorting…</span>
      )}

      {/* AI reason tooltip */}
      {task.aiReason && !task.aiSorting && (
        <span className="ai-reason-tip" title={task.aiReason}>ⓘ</span>
      )}

      {/* Due date picker — hidden native input triggered by calendar icon */}
      <button
        className="task-date-btn"
        title="Set due date"
        onClick={e => { e.stopPropagation(); dateInputRef.current?.showPicker?.(); dateInputRef.current?.click(); }}
        aria-label="Set due date"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <input
          ref={dateInputRef}
          type="date"
          className="task-date-input"
          value={task.dueDate || ''}
          onChange={handleDateChange}
          onClick={e => e.stopPropagation()}
          tabIndex={-1}
          aria-label="Due date"
        />
      </button>

      {/* Delete */}
      <button
        className="task-delete-btn"
        onClick={handleDelete}
        aria-label="Delete task"
        title="Delete task"
      >
        ✕
      </button>
    </div>
  );
}
