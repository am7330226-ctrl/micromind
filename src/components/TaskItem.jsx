/**
 * TaskItem.jsx — Single task row with checkbox, rich text, delete button,
 * due date picker, 1-Tap Category Selector Pill, AI breakdown accordion,
 * and time estimate badge.
 * (HTML5 Drag & Drop removed; replaced with 1-Tap Category Selector Pill).
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useDispatch, useAppState } from '../store.jsx';
import { parseRichText } from '../utils/parseRichText.js';
import { generateSubtasks } from '../utils/aiBreakdown.js';
import { formatMinutes } from '../utils/estimateTaskTime.js';

const CATEGORIES_META = {
  inbox: { id: 'inbox', label: 'Inbox',    emoji: '📥', color: '#4a4455', bg: '#e7eeff' },
  q1:    { id: 'q1',    label: 'Do First', emoji: '🔥', color: '#a04100', bg: 'rgba(160, 65, 0, 0.1)' },
  q2:    { id: 'q2',    label: 'Schedule', emoji: '📅', color: '#630ed4', bg: 'rgba(99, 14, 212, 0.1)' },
  q3:    { id: 'q3',    label: 'Delegate', emoji: '🤝', color: '#005b3d', bg: 'rgba(0, 91, 61, 0.1)' },
  q4:    { id: 'q4',    label: 'Avoid',    emoji: '🗑️', color: '#4a4455', bg: '#f0f3ff' },
};

const CATEGORIES_LIST = [
  CATEGORIES_META.inbox,
  CATEGORIES_META.q1,
  CATEGORIES_META.q2,
  CATEGORIES_META.q3,
  CATEGORIES_META.q4,
];

function getDueDateMeta(dueDate) {
  if (!dueDate) return null;
  const today = new Date().toISOString().split('T')[0];
  if (dueDate < today)  return { label: `⚠ ${dueDate}`, cls: 'due-overdue' };
  if (dueDate === today) return { label: `📅 Today`,    cls: 'due-today' };
  return { label: `📅 ${dueDate}`, cls: 'due-future' };
}

export default function TaskItem({ task, onToggle, showBreakdown = false, showToast }) {
  const dispatch     = useDispatch();
  const state        = useAppState();
  const dateInputRef = useRef(null);
  const popoverRef   = useRef(null);

  const [subtasksOpen,     setSubtasksOpen]     = useState(false);
  const [editingTime,      setEditingTime]      = useState(false);
  const [timeInputVal,     setTimeInputVal]     = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  // Close category dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setCategoryMenuOpen(false);
      }
    }
    if (categoryMenuOpen) {
      document.addEventListener('mousedown', onOutsideClick);
      document.addEventListener('touchstart', onOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('touchstart', onOutsideClick);
    };
  }, [categoryMenuOpen]);

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_TASK', id: task.id });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle?.(task.id, !task.completed);
    dispatch({ type: 'TOGGLE_TASK', id: task.id, completing: !task.completed });
  };

  const handleSelectCategory = (catId) => {
    setCategoryMenuOpen(false);
    if (task.category === catId) return;

    // Check Q1 limit (max 3 active tasks in Q1)
    if (catId === 'q1') {
      const activeQ1Count = (state.tasks || []).filter(t => t.category === 'q1' && !t.completed).length;
      if (activeQ1Count >= 3) {
        if (showToast) showToast('Q1 is full! Finish something first 🔥', '⛔');
        return;
      }
    }

    dispatch({ type: 'MOVE_TASK', id: task.id, category: catId });
    const targetMeta = CATEGORIES_META[catId] || CATEGORIES_META.inbox;
    if (showToast) showToast(`Moved to ${targetMeta.label}`, targetMeta.emoji);
  };

  const handleDateChange = (e) => {
    dispatch({ type: 'SET_TASK_DUE_DATE', id: task.id, dueDate: e.target.value || null });
  };

  const handleRowClick = () => {
    dispatch({ type: 'SET_SELECTED_TASK', id: task.id });
  };

  const handleBreakdown = useCallback(async (e) => {
    e.stopPropagation();
    if (task.breakdownLoading) return;

    if ((task.subtasks || []).length > 0) {
      setSubtasksOpen(o => !o);
      return;
    }

    dispatch({ type: 'SET_TASK_BREAKDOWN_LOADING', id: task.id, loading: true });
    setSubtasksOpen(true);

    try {
      const subtaskTexts = await generateSubtasks(task.text);
      subtaskTexts.forEach(text => {
        dispatch({ type: 'ADD_SUBTASK', id: task.id, text });
      });
    } catch {
      // Fallback
    } finally {
      dispatch({ type: 'SET_TASK_BREAKDOWN_LOADING', id: task.id, loading: false });
    }
  }, [task, dispatch]);

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

  const handleSubtaskToggle = (e, subtaskId, completed) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_SUBTASK', id: task.id, subtaskId, completed: !completed });
  };

  const handleSubtaskDelete = (e, subtaskId) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SUBTASK', id: task.id, subtaskId });
  };

  const catMeta   = CATEGORIES_META[task.category] || CATEGORIES_META.inbox;
  const dueMeta   = getDueDateMeta(task.dueDate);
  const subtasks  = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const timeLabel = task.timeEstimate?.label || null;

  return (
    <div className={`task-item-wrapper${task.completed ? ' completed' : ''}`}>
      <div
        className={`task-item${task.completed ? ' completed' : ''}`}
        data-id={task.id}
        onClick={handleRowClick}
        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
      >
        {/* Row 1: Checkbox + Task Text Body + Category Selector Pill */}
        <div className="task-item-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div
              className={`task-checkbox${task.completed ? ' checked' : ''}`}
              onClick={handleToggle}
              role="checkbox"
              aria-checked={task.completed}
              tabIndex={0}
              onKeyDown={e => e.key === ' ' && handleToggle(e)}
            />

            <div className="task-body" style={{ flex: 1, minWidth: 0 }}>
              <span
                className="task-text"
                dangerouslySetInnerHTML={{ __html: parseRichText(task.text) }}
                onClick={e => { if (e.target.tagName === 'A') return; }}
              />
              {dueMeta && (
                <span className={`due-badge ${dueMeta.cls}`}>{dueMeta.label}</span>
              )}
            </div>
          </div>

          {/* 1-Tap Category Selector Pill */}
          <div ref={popoverRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen(o => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                border: '1px solid rgba(204, 195, 216, 0.4)', cursor: 'pointer',
                backgroundColor: catMeta.bg, color: catMeta.color, transition: 'all 0.15s ease'
              }}
              title="Click to change category"
              aria-label={`Category: ${catMeta.label}`}
            >
              <span>{catMeta.emoji}</span>
              <span>{catMeta.label}</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
            </button>

            {/* Category Popover Dropdown */}
            {categoryMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                backgroundColor: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, rgba(204, 195, 216, 0.4))',
                borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: '6px', zIndex: 999, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                {CATEGORIES_LIST.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 10px', borderRadius: '8px', border: 'none',
                      backgroundColor: task.category === cat.id ? 'rgba(99,14,212,0.1)' : 'transparent',
                      color: task.category === cat.id ? '#630ed4' : 'var(--text-primary, #111c2d)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Actions & Badges Toolbar */}
        <div className="task-actions" onClick={e => e.stopPropagation()}>
          {timeLabel && !task.completed && (
            editingTime ? (
              <form className="time-edit-form" onSubmit={handleTimeSubmit} onClick={e => e.stopPropagation()}>
                <input
                  type="number"
                  className="time-edit-input"
                  value={timeInputVal}
                  min={1} max={480}
                  autoFocus
                  onChange={e => setTimeInputVal(e.target.value)}
                  onBlur={handleTimeSubmit}
                  aria-label="Edit time estimate in minutes"
                />
                <span className="time-edit-unit">min</span>
              </form>
            ) : (
              <button type="button" className="time-estimate-badge" onClick={handleTimeBadgeClick}>
                ⏱ {timeLabel}
              </button>
            )
          )}

          {task.aiSorting && <span className="ai-badge sorting">✨ AI sorting…</span>}
          {task.aiReason && !task.aiSorting && <span className="ai-reason-tip" title={task.aiReason}>ⓘ</span>}

          {showBreakdown && !task.completed && (
            <button
              type="button"
              className={`breakdown-btn${task.breakdownLoading ? ' loading' : ''}${hasSubtasks ? ' has-subtasks' : ''}`}
              onClick={handleBreakdown}
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

          <button
            type="button"
            className="task-date-btn"
            onClick={e => { e.stopPropagation(); dateInputRef.current?.showPicker?.(); dateInputRef.current?.click(); }}
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
            />
          </button>

          <button type="button" className="task-delete-btn" onClick={handleDelete} title="Delete task">
            ✕
          </button>
        </div>
      </div>

      {/* Subtask Accordion */}
      {hasSubtasks && subtasksOpen && (
        <div className="subtask-accordion" role="list">
          {subtasks.map(subtask => (
            <div key={subtask.id} className={`subtask-item${subtask.completed ? ' completed' : ''}`}>
              <div
                className={`subtask-checkbox${subtask.completed ? ' checked' : ''}`}
                onClick={e => handleSubtaskToggle(e, subtask.id, subtask.completed)}
              />
              <span className="subtask-text">{subtask.text}</span>
              <button
                type="button"
                className="subtask-delete-btn"
                onClick={e => handleSubtaskDelete(e, subtask.id)}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
