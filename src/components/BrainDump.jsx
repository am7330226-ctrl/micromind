/**
 * BrainDump.jsx — The left-panel capture input and inbox task list.
 * Handles task creation, 1-Click AI Auto-Sorting, Web Speech API voice capture,
 * and keyboard shortcuts.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppState, useDispatch, createTask } from '../store.jsx';
import { parseMultiTaskVoiceDump } from '../utils/aiCopilotService.js';
import TaskItem from './TaskItem.jsx';

const CONFIDENCE_THRESHOLD = 0.6;

export default function BrainDump({ showToast }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [inputValue, setInputValue] = useState('');
  const [aiStatus, setAiStatus] = useState('ready'); // ready | sorting | sorted
  const [isListening, setIsListening] = useState(false);
  const [sortBtnText, setSortBtnText] = useState('✨ AI Auto-Sort');

  const inboxTasks = (state.tasks || []).filter(
    (t) => t && t.category === 'inbox',
  );

  // ── 1-Click AI Auto-Sort ──────────────────────────────────────────────────
  const handleAiAutoSortAll = () => {
    const unsorted = inboxTasks.filter((t) => !t.completed);
    if (unsorted.length === 0) {
      if (showToast)
        showToast('No unsorted tasks in Inbox! All clear 🎉', '📥');
      return;
    }

    setSortBtnText('✨ Sorting…');

    let q1Count = (state.tasks || []).filter(
      (t) => t.category === 'q1' && !t.completed,
    ).length;
    let sortedCount = 0;

    unsorted.forEach((task) => {
      const text = (task.text || '').toLowerCase();
      let target = 'q2'; // default Schedule

      if (
        /\b(urgent|asap|critical|client|deadline|bug|crash|fix|emergency|important)\b/.test(
          text,
        )
      ) {
        // Enforce Q1 limit (max 3)
        if (q1Count < 3) {
          target = 'q1';
          q1Count++;
        } else {
          target = 'q2';
        }
      } else if (
        /\b(meeting|call|sync|review|email|forward|schedule|ask|delegate)\b/.test(
          text,
        )
      ) {
        target = 'q3';
      } else if (
        /\b(newsletter|social|browse|game|video|junk|clean)\b/.test(text)
      ) {
        target = 'q4';
      } else if (
        /\b(plan|strategy|roadmap|learn|study|read|exercise|gym|workout|project|build)\b/.test(
          text,
        )
      ) {
        target = 'q2';
      }

      dispatch({ type: 'MOVE_TASK', id: task.id, category: target });
      sortedCount++;
    });

    setSortBtnText('✨ Sorted!');
    if (showToast)
      showToast(
        `✨ AI Auto-Sorted ${sortedCount} task${sortedCount !== 1 ? 's' : ''} into quadrants!`,
        '🚀',
      );

    setTimeout(() => {
      setSortBtnText('✨ AI Auto-Sort');
    }, 1200);
  };

  // ── Speech-to-Text (Voice Capture) ────────────────────────────────────────
  const toggleListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast)
        showToast('Speech recognition not supported in browser', '⚠️');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = async (e) => {
        const transcript = e.results[0][0]?.transcript;
        if (transcript) {
          setInputValue(transcript);
          if (showToast) showToast(`Voice captured: "${transcript}"`, '🎙️');

          // Multi-task parsing if transcript contains multiple items
          if (/\b(?:and|then|also|plus)\b|[,.;]/i.test(transcript)) {
            const parsedItems = await parseMultiTaskVoiceDump(transcript);
            if (parsedItems.length > 1) {
              parsedItems.forEach((item) => {
                const task = createTask(item.title, item.priority || 'inbox');
                if (item.duration) {
                  task.timeEstimate = {
                    minutes: item.duration,
                    label: `${item.duration}m`,
                  };
                }
                dispatch({ type: 'ADD_TASK', payload: task });
              });
              setInputValue('');
              if (showToast)
                showToast(
                  `✨ Auto-parsed ${parsedItems.length} tasks from voice recording!`,
                  '🚀',
                );
            }
          }
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Focus keyboard shortcut '/'
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAdd = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    const task = createTask(text);
    dispatch({ type: 'ADD_TASK', payload: task });
    setInputValue('');
  }, [inputValue, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') inputRef.current?.blur();
  };

  const handleClearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED_INBOX' });
    if (showToast) showToast('Cleared completed inbox tasks!', '🧹');
  };

  return (
    <div className="glass-panel brain-dump-panel">
      <div
        className="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Brain Dump
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 1-Click ✨ AI Auto-Sort Button */}
          <button
            type="button"
            onClick={handleAiAutoSortAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: '#630ed4',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(99, 14, 212, 0.25)',
              transition: 'all 0.2s ease',
            }}
            title="Auto-sort all inbox tasks into quadrants based on AI intent"
          >
            {sortBtnText}
          </button>

          <span className="helper-badge">Frictionless Capture</span>
        </div>
      </div>

      {/* Input & Voice Controls */}
      <div className="dump-input-container">
        <input
          ref={inputRef}
          id="dump-input"
          type="text"
          placeholder={
            isListening
              ? '🎙️ Listening… Speak your task out loud'
              : 'Type a task and hit Enter (Press / to focus)'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          className={`mic-btn${isListening ? ' listening' : ''}`}
          onClick={toggleListening}
          title={
            isListening
              ? 'Stop listening'
              : 'Speak task out loud (Speech-to-Text)'
          }
          aria-label={
            isListening
              ? 'Stop voice listening'
              : 'Start voice speech-to-text input'
          }
          id="voice-input-btn"
        >
          🎙️
        </button>
        <button
          type="button"
          className="dump-submit-btn"
          onClick={handleAdd}
          aria-label="Add task to inbox"
          id="dump-submit-btn"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Inbox Header */}
      <div
        className="inbox-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--text-primary, #1e293b)',
            margin: 0,
          }}
        >
          Unsorted Thoughts ({inboxTasks.length})
        </h3>
        {inboxTasks.some((t) => t.completed) && (
          <button
            type="button"
            className="text-btn"
            onClick={handleClearCompleted}
            aria-label="Clear completed inbox tasks"
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="task-list">
        {inboxTasks.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            All thoughts captured. Inbox is clear!
          </div>
        ) : (
          inboxTasks.map((task) => (
            <TaskItem key={task.id} task={task} showToast={showToast} />
          ))
        )}
      </div>
    </div>
  );
}
