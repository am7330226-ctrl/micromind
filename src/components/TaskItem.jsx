/**
 * TaskItem.jsx — Single task row with checkbox, rich text, delete button,
 * due date picker, AI badge, AI reasoning tooltip, time estimate badge,
 * and AI subtask breakdown accordion.
 */

import { useRef, useState, useCallback } from 'react';
import { useDispatch } from '../store.jsx';
import { parseRichText } from '../utils/parseRichText.js';
import { generateSubtasks } from '../utils/aiBreakdown.js';
import { formatMinutes } from '../utils/estimateTaskTime.js';

// Returns { label, cls } for the due date badge
function getDueDateMeta(dueDate) {
  if (!dueDate) return null;
  const today = new Date().toISOString().split('T')[0];
  if (dueDate < today)  return { label: `⚠ ${dueDate}`, cls: 'due-overdue' };
  if (dueDate === today) return { label: `📅 Today`,    cls: 'due-today' };
  return { label: `📅 ${dueDate}`, cls: 'due-future' };
}

export default function TaskItem({ task, onToggle, showBreakdown = false }) {
  const dispatch     = useDispatch();
  const dateInputRef = useRef(null);

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [subtasksOpen,   setSubtasksOpen]   = useState(false);
  const [editingTime,    setEditingTime]    = useState(false);
  const [timeInputVal,   setTimeInputVal]   = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────
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

  const handleRowClick = () => {
    dispatch({ type: 'SET_SELECTED_TASK', id: task.id });
  };

  // ── AI Breakdown ───────────────────────────────────────────────────────────
  const handleBreakdown = useCallback(async (e) => {
    e.stopPropagation();
    if (task.breakdownLoading) return;

    // If subtasks already exist, just toggle accordion
    if ((task.subtasks || []).length > 0) {
      setSubtasksOpen(o => !o);
      return;
    }

    // Generate new subtasks
    dispatch({ type: 'SET_TASK_BREAKDOWN_LOADING', id: task.id, loading: true });
    setSubtasksOpen(true);

    try {
      const subtaskTexts = await generateSubtasks(task.text);
      subtaskTexts.forEach(text => {
        dispatch({ type: 'ADD_SUBTASK', id: task.id, text });
      });
    } catch {
      // Silently fail — show generic fallback in accordion
    } finally {
      dispatch({ type: 'SET_TASK_BREAKDOWN_LOADING', id: task.id, loading: false });
    }
  }, [task, dispatch]);

  // ── Time Estimate Edit ─────────────────────────────────────────────────────
  const handleTimeBadgeClick = (e) => {
    e.stopPropagation();
    setTimeInputVal(String(task.timeEstimate?.minutes || 15));
    setEditingTime(true);
  };

  const handleTimeSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const minutes = Math.max(1, Math.min(480, parseInt(timeInputVal, 10) || 15));
    dispatch({ type: 'SET_TASK_TIME_ESTIMATE', id: task.id, estimate: { minutes, label: formatMinutes(minutes) } });
    setEditingTime(false);
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setEditingTime(false); }
  };

  // ── Subtask Handlers ───────────────────────────────────────────────────────
  const handleSubtaskToggle = (e, subtaskId, completed) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_SUBTASK', id: task.id, subtaskId, completed: !completed });
  };

  const handleSubtaskDelete = (e, subtaskId) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SUBTASK', id: task.id, subtaskId });
  };

  const dueMeta   = getDueDateMeta(task.dueDate);
  const subtasks  = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const timeLabel = task.timeEstimate?.label || null;

  return (
    <div className={`task-item-wrapper${task.completed ? ' completed' : ''}`}>
      {/* ── Main Task Row ──────────────────────────────────────────────────── */}
      <div
        className={`task-item${task.completed ? ' completed' : ''}`}
        data-id={task.id}
        draggable
        onDragStart={handleDragStart}
        onClick={handleRowClick}
        style={{ cursor: 'pointer' }}
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

        {/* ── Right-side Metadata & Actions Container ───────────────────────── */}
        <div className="task-actions" onClick={e => e.stopPropagation()}>
          {/* ── Time Estimate Badge ──────────────────────────────────────────── */}
          {timeLabel && !task.completed && (
            editingTime ? (
              <form
                className="time-edit-form"
                onSubmit={handleTimeSubmit}
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="number"
                  className="time-edit-input"
                  value={timeInputVal}
                  min={1}
                  max={480}
                  autoFocus
                  onChange={e => setTimeInputVal(e.target.value)}
                  onKeyDown={handleTimeKeyDown}
                  onBlur={handleTimeSubmit}
                  aria-label="Edit time estimate in minutes"
                  placeholder="min"
                />
                <span className="time-edit-unit">min</span>
              </form>
            ) : (
              <button
                className="time-estimate-badge"
                onClick={handleTimeBadgeClick}
                title="Click to edit time estimate"
                aria-label={`Estimated time: ${timeLabel}. Click to edit.`}
              >
                ⏱ {timeLabel}
              </button>
            )
          )}

          {/* AI sorting badge */}
          {task.aiSorting && (
            <span className="ai-badge sorting">✨ AI sorting…</span>
          )}

          {/* AI reason tooltip */}
          {task.aiReason && !task.aiSorting && (
            <span className="ai-reason-tip" title={task.aiReason}>ⓘ</span>
          )}

          {/* ✨ Breakdown Button */}
          {showBreakdown && !task.completed && (
            <button
              className={`breakdown-btn${task.breakdownLoading ? ' loading' : ''}${hasSubtasks ? ' has-subtasks' : ''}`}
              onClick={handleBreakdown}
              title={hasSubtasks ? 'Toggle subtasks' : 'AI: Break into sub-tasks'}
              aria-label={hasSubtasks ? 'Toggle subtasks' : 'Generate AI subtasks'}
            >
              {task.breakdownLoading ? (
                <span className="breakdown-spinner" />
              ) : hasSubtasks ? (
                <span>{subtasksOpen ? '▾' : '▸'} {subtasks.length} steps</span>
              ) : (
                <span>✨ Breakdown</span>
              )}
            </button>
          )}

          {/* Compact Pill Date Picker Button */}
          <button
            className="task-date-btn"
            title="Set due date"
            onClick={e => { e.stopPropagation(); dateInputRef.current?.showPicker?.(); dateInputRef.current?.click(); }}
            aria-label="Set due date"
          >
            <span>📅</span>
            <span className="task-date-label">{task.dueDate || 'Date'}</span>
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

          {/* Delete Button */}
          <button
            className="task-delete-btn"
            onClick={handleDelete}
            aria-label="Delete task"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Subtask Accordion ──────────────────────────────────────────────── */}
      {hasSubtasks && subtasksOpen && (
        <div className="subtask-accordion" role="list" aria-label="Sub-tasks">
          {subtasks.map(subtask => (
            <div
              key={subtask.id}
              className={`subtask-item${subtask.completed ? ' completed' : ''}`}
              role="listitem"
            >
              <div
                className={`subtask-checkbox${subtask.completed ? ' checked' : ''}`}
                onClick={e => handleSubtaskToggle(e, subtask.id, subtask.completed)}
                role="checkbox"
                aria-checked={subtask.completed}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && handleSubtaskToggle(e, subtask.id, subtask.completed)}
              />
              <span className="subtask-text">{subtask.text}</span>
              <button
                className="subtask-delete-btn"
                onClick={e => handleSubtaskDelete(e, subtask.id)}
                aria-label={`Delete subtask: ${subtask.text}`}
              >✕</button>
            </div>
          ))}

          {/* Loading skeleton when generating */}
          {task.breakdownLoading && (
            <>
              <div className="subtask-skeleton" />
              <div className="subtask-skeleton short" />
              <div className="subtask-skeleton" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
