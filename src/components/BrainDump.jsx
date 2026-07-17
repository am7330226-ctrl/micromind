/**
 * BrainDump.jsx — The left-panel capture input and inbox task list.
 * Handles task creation, AI auto-sort triggering, and keyboard shortcuts.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppState, useDispatch, createTask } from '../store.jsx';
import TaskItem from './TaskItem.jsx';

const CONFIDENCE_THRESHOLD = 0.60;
const CATEGORY_NAMES = { q1: 'Do First', q2: 'Schedule', q3: 'Delegate', q4: "Don't Do" };

export default function BrainDump({ showToast }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const workerRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [aiStatus, setAiStatus] = useState('loading'); // loading | ready | error
  const [aiProgress, setAiProgress] = useState(0);
  const [aiReady, setAiReady] = useState(false);

  const inboxTasks = state.tasks.filter(t => t.category === 'inbox');

  // ── AI Worker ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      setAiStatus('error');
      return;
    }
    try {
      const worker = new Worker('/ai-worker.js', { type: 'module' });
      workerRef.current = worker;

      worker.addEventListener('message', (e) => {
        const { type, status, taskId, category, score, error, progress } = e.data;

        if (type === 'status') {
          if (status === 'loading') setAiStatus('loading');
          if (status === 'ready')  { setAiStatus('ready'); setAiReady(true); }
          if (status === 'error')  setAiStatus('error');
        }

        if (type === 'progress' && progress !== undefined) {
          setAiProgress(Math.round(progress));
        }

        if (type === 'result' && taskId) {
          dispatch({ type: 'SET_TASK_AI_SORTING', id: taskId, value: false });
          if (!error && score >= CONFIDENCE_THRESHOLD && category) {
            dispatch({ type: 'MOVE_TASK', id: taskId, category });
            const taskText = state.tasks.find(t => t.id === taskId)?.text ?? '';
            showToast(`Sorted "${taskText.slice(0, 28)}…" → ${CATEGORY_NAMES[category]}`, '🤖');
          }
        }
      });

      worker.postMessage({ type: 'load' });
      return () => worker.terminate();
    } catch (err) {
      console.warn('AI Worker failed:', err);
      setAiStatus('error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcut: / to focus input ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current &&
          e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Add task ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    const task = createTask(text);
    dispatch({ type: 'ADD_TASK', payload: task });
    setInputValue('');

    // Trigger AI auto-sort if model is ready
    if (workerRef.current && aiReady) {
      dispatch({ type: 'SET_TASK_AI_SORTING', id: task.id, value: true });
      workerRef.current.postMessage({ type: 'classify', taskId: task.id, text });
    }
  }, [inputValue, aiReady, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') inputRef.current?.blur();
  };

  const handleClearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED_INBOX' });
    showToast('Cleared completed inbox tasks!', '🧹');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const statusLabel = { loading: 'AI Loading…', ready: '✦ AI Ready', error: 'AI Unavailable' }[aiStatus];

  return (
    <div className="glass-panel brain-dump-panel">
      <div className="panel-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Brain Dump
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="helper-badge">Frictionless Capture</span>
          <span className={`ai-status-chip ai-status-${aiStatus}`} title="Local AI Auto-Sort">
            <span className="ai-status-dot" />
            <span>{statusLabel}</span>
          </span>
        </div>
      </div>

      {/* AI Progress Bar */}
      {aiStatus === 'loading' && (
        <div className="ai-progress-bar-wrap">
          <div className="ai-progress-track">
            <div className="ai-progress-fill" style={{ width: `${aiProgress}%` }} />
          </div>
          <span className="ai-progress-label">
            Downloading AI model (first time only)… {aiProgress}%
          </span>
        </div>
      )}

      {/* Input */}
      <div className="dump-input-container">
        <input
          ref={inputRef}
          id="dump-input"
          type="text"
          placeholder="Type a task and hit Enter — AI will auto-sort it! (Press / to focus)"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button className="dump-submit-btn" onClick={handleAdd} aria-label="Add task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      {/* Inbox */}
      <div className="inbox-header">
        <h3>Unsorted Thoughts ({inboxTasks.length})</h3>
        {inboxTasks.some(t => t.completed) && (
          <button className="text-btn" onClick={handleClearCompleted}>Clear Completed</button>
        )}
      </div>

      <div className="task-list">
        {inboxTasks.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            All thoughts captured. Inbox is clear!
          </div>
        ) : (
          inboxTasks.map(task => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
