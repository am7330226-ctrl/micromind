/**
 * TaskDetailPanel.jsx — Slide-out side panel for task details.
 * Shows rich-text notes, sub-checklist, and due date.
 */

import { useState, useEffect, useRef } from 'react';
import { useAppState, useDispatch, generateId } from '../store.jsx';

export default function TaskDetailPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  
  const { selectedTaskId, tasks } = state;
  const task = tasks.find(t => t.id === selectedTaskId);

  // Local state for notes to prevent typing lag, synced on blur/unmount
  const [localNotes, setLocalNotes] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  
  // Sync local notes when task changes
  useEffect(() => {
    if (task) {
      setLocalNotes(task.notes || '');
    }
  }, [task?.id]); // Only run when the selected task ID changes

  const handleClose = () => {
    // Save notes before closing
    if (task && localNotes !== (task.notes || '')) {
      dispatch({ type: 'UPDATE_TASK_NOTES', id: task.id, notes: localNotes });
    }
    dispatch({ type: 'SET_SELECTED_TASK', id: null });
  };

  const handleNotesBlur = () => {
    if (task && localNotes !== (task.notes || '')) {
      dispatch({ type: 'UPDATE_TASK_NOTES', id: task.id, notes: localNotes });
    }
  };

  const handleAddSubtask = (e) => {
    if (e.key === 'Enter' && subtaskInput.trim()) {
      dispatch({ type: 'ADD_SUBTASK', id: task.id, text: subtaskInput.trim() });
      setSubtaskInput('');
    }
  };

  if (!task) {
    return (
      <div className={`task-detail-backdrop ${selectedTaskId ? 'visible' : ''}`} onClick={handleClose}>
         <div className={`task-detail-panel ${selectedTaskId ? 'open' : ''}`} onClick={e => e.stopPropagation()}></div>
      </div>
    );
  }

  return (
    <div className={`task-detail-backdrop visible`} onClick={handleClose}>
      <div className={`task-detail-panel open`} onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h3 className="detail-title">{task.text}</h3>
          <button className="detail-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="detail-content">
          {/* Due Date Section */}
          <div className="detail-section">
            <div className="detail-section-label">DUE DATE</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                className="detail-date-input"
                value={task.dueDate || ''}
                onChange={(e) => dispatch({ type: 'SET_TASK_DUE_DATE', id: task.id, dueDate: e.target.value || null })}
              />
              {task.dueDate && (
                <button 
                  className="text-btn" 
                  style={{ fontSize: '0.75rem', color: '#dc2626' }}
                  onClick={() => dispatch({ type: 'SET_TASK_DUE_DATE', id: task.id, dueDate: null })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="detail-section">
            <div className="detail-section-label">NOTES</div>
            <textarea
              className="detail-notes-input"
              placeholder="Add details, links, or context..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
            />
          </div>

          {/* Subtasks Section */}
          <div className="detail-section">
            <div className="detail-section-label">SUB-TASKS</div>
            
            <div className="subtask-list">
              {(task.subtasks || []).map(sub => (
                <div key={sub.id} className={`subtask-item ${sub.completed ? 'completed' : ''}`}>
                  <div 
                    className={`task-checkbox ${sub.completed ? 'checked' : ''}`}
                    onClick={() => dispatch({ type: 'TOGGLE_SUBTASK', id: task.id, subtaskId: sub.id, completed: !sub.completed })}
                  />
                  <span className="subtask-text">{sub.text}</span>
                  <button 
                    className="task-delete-btn" 
                    style={{ opacity: 1 }}
                    onClick={() => dispatch({ type: 'DELETE_SUBTASK', id: task.id, subtaskId: sub.id })}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <input
              type="text"
              className="subtask-input"
              placeholder="Add a sub-task and press Enter..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleAddSubtask}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
