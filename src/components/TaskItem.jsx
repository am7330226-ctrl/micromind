/**
 * TaskItem.jsx — Single task row with checkbox, rich text, delete button, and AI badge.
 */

import { useDispatch } from '../store.jsx';
import { parseRichText } from '../utils/parseRichText.js';

export default function TaskItem({ task, onToggle }) {
  const dispatch = useDispatch();

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_TASK', id: task.id });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle?.(task.id, !task.completed);
    dispatch({ type: 'TOGGLE_TASK', id: task.id, completing: !task.completed });
  };

  return (
    <div className={`task-item${task.completed ? ' completed' : ''}`} data-id={task.id}>
      {/* Checkbox */}
      <div
        className={`task-checkbox${task.completed ? ' checked' : ''}`}
        onClick={handleToggle}
        role="checkbox"
        aria-checked={task.completed}
        tabIndex={0}
        onKeyDown={e => e.key === ' ' && handleToggle(e)}
      />

      {/* Rich text */}
      <span
        className="task-text"
        dangerouslySetInnerHTML={{ __html: parseRichText(task.text) }}
        onClick={e => {
          // Don't trigger on link clicks
          if (e.target.tagName === 'A') return;
        }}
      />

      {/* AI sorting badge */}
      {task.aiSorting && (
        <span className="ai-badge sorting">✨ AI sorting…</span>
      )}

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
