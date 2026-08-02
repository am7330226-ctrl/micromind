/**
 * AiCopilot.jsx — Interactive MicroMind AI Copilot Chat Drawer
 *
 * Features:
 * 1. Floating Bot Button (FAB) at bottom-right.
 * 2. Glassmorphism Chat Drawer widget.
 * 3. App Control & Function Calling Execution (addNewTask, moveTask, startPomodoroTimer, answerHowToQuestion).
 * 4. Explicit Error Logging & Toast Notifications.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useDispatch, useAuth, createTask } from '../store.jsx';
import { sendCopilotMessage, getApiKey, setApiKey } from '../utils/aiCopilotService.js';
import { generateSubtasks } from '../utils/aiBreakdown.js';

export default function AiCopilot({ showToast, onOpenPomodoro }) {
  const state    = useAppState();
  const dispatch = useDispatch();
  const { auth } = useAuth();

  const [isOpen, setIsOpen]           = useState(false);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [keyInput, setKeyInput]       = useState('');
  const [messages, setMessages]       = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${auth.name || 'there'}! I'm your **MicroMind AI Copilot**. I can manage your tasks, trigger focus timers, and break down complex goals. What shall we tackle today?`,
      action: null,
      timestamp: Date.now(),
    },
  ]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    setApiKey(keyInput);
    setShowKeySettings(false);
    if (showToast) {
      showToast(keyInput.trim() ? 'Gemini API Key saved! Copilot online 🚀' : 'API Key removed (offline mode)', '🔑');
    }
  };

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ── Execute App Function Calls ─────────────────────────────────────────────
  const executeToolCall = async (call) => {
    try {
      const { name, args } = call;

      if (name === 'addNewTask') {
        const taskObj = {
          completed: false,
          text: args.title || 'New Task',
          ...createTask(args.title || 'New Task', args.priority || 'inbox'),
        };
        if (args.duration) {
          taskObj.timeEstimate = {
            minutes: args.duration,
            label: args.duration >= 60 ? `${args.duration / 60}h` : `${args.duration}m`,
          };
        }
        dispatch({ type: 'ADD_TASK', payload: taskObj, task: taskObj });
        if (showToast) showToast(`Added task: "${taskObj.text}"`, '✨');
        return `Added task "${taskObj.text}" to ${args.priority === 'q1' ? 'Do First' : 'Inbox'}`;
      }

      if (name === 'moveTask') {
        const tasks = state.tasks || [];
        const match = tasks.find(t => t.id === args.taskId || t.text.toLowerCase().includes(String(args.taskId).toLowerCase()));
        if (match) {
          dispatch({ type: 'MOVE_TASK', id: match.id, category: args.newPriority || 'q1' });
          if (showToast) showToast(`Moved "${match.text}"`, '⚡');
          return `Moved "${match.text}" to ${args.newPriority || 'Q1'}`;
        }
      }

      if (name === 'startPomodoroTimer') {
        if (onOpenPomodoro) onOpenPomodoro();
        if (showToast) showToast(`Pomodoro Timer opened (${args.minutes || 25}m)`, '🍓');
        return `Started ${args.minutes || 25}m Pomodoro session`;
      }

      if (name === 'answerHowToQuestion') {
        return `Guidance for ${args.topic}: ${args.advice}`;
      }

      return null;
    } catch (err) {
      console.error('AI Copilot Tool Execution Error:', err);
      return null;
    }
  };

  // ── Handle Send Message ───────────────────────────────────────────────────
  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const { responseText, toolCalls, error } = await sendCopilotMessage(
        text,
        messages.slice(-6),
        state,
        auth.name
      );

      if (error && showToast) {
        showToast('Copilot offline mode active', '⚠️');
      }

      const executedActions = [];
      for (const call of toolCalls) {
        const result = await executeToolCall(call);
        if (result) executedActions.push(result);
      }

      // Check if user asked to break down tasks
      if (text.toLowerCase().includes('break down') || text.toLowerCase().includes('breakdown')) {
        const q1Tasks = (state.tasks || []).filter(t => t.category === 'q1' && !t.completed);
        if (q1Tasks.length > 0) {
          for (const task of q1Tasks.slice(0, 2)) {
            const subtasks = await generateSubtasks(task.text);
            subtasks.forEach(subtext => {
              dispatch({ type: 'ADD_SUBTASK', id: task.id, text: subtext });
            });
          }
          executedActions.push(`Generated sub-tasks for Do First priority items`);
        }
      }

      const botMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: responseText,
        executedActions,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('AI Copilot Error:', err);
      if (showToast) showToast('Copilot is currently offline. Check your API key.', '⚠️');

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: "Copilot is currently offline. You can still ask me to add tasks or start timers!",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSend(promptText);
  };

  return (
    <>
      {/* 🤖 Floating AI Assistant Button (FAB) */}
      <button
        type="button"
        id="copilot-fab-btn"
        className={`copilot-fab${isOpen ? ' active' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        title="MicroMind AI Copilot"
        aria-label="Toggle AI Copilot Drawer"
        aria-expanded={isOpen}
      >
        <span className="fab-sparkle">✨</span>
        <span className="fab-icon">🤖</span>
        <span className="fab-label">Copilot</span>
        <span className="fab-pulse-dot" />
      </button>

      {/* ── Slide-over AI Copilot Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="copilot-drawer"
            role="dialog"
            aria-label="MicroMind AI Copilot Chat"
          >
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-header-info">
                <div className="copilot-avatar">
                  <span>🤖</span>
                  <span className="copilot-online-dot" />
                </div>
                <div>
                  <div className="copilot-title">MicroMind AI Copilot</div>
                  <div className="copilot-subtitle">Context-Aware App Assistant</div>
                </div>
              </div>
              <div className="copilot-header-actions">
                <button
                  type="button"
                  className="copilot-icon-btn"
                  onClick={() => {
                    setKeyInput(getApiKey());
                    setShowKeySettings(s => !s);
                  }}
                  title="Configure Gemini API Key"
                  aria-label="Configure Gemini API Key"
                >🔑</button>
                <button
                  type="button"
                  className="copilot-icon-btn"
                  onClick={() => setMessages([
                    {
                      id: String(Date.now()),
                      role: 'assistant',
                      content: "Chat cleared! How can I assist you with your tasks?",
                      timestamp: Date.now(),
                    },
                  ])}
                  title="Clear Chat"
                  aria-label="Clear chat messages"
                >🗑️</button>
                <button
                  type="button"
                  className="copilot-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close AI Copilot Drawer"
                >✕</button>
              </div>
            </div>

            {/* API Key Inline Configuration Form */}
            {showKeySettings && (
              <form onSubmit={handleSaveKey} style={{ padding: '10px 14px', backgroundColor: 'rgba(99, 14, 212, 0.08)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="password"
                  placeholder="Paste Gemini API Key (AIzaSy...)"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <button type="submit" style={{ padding: '6px 12px', borderRadius: '8px', background: '#630ed4', color: '#fff', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  Save
                </button>
              </form>
            )}

            {/* Quick Action Prompt Chips */}
            <div className="copilot-quick-chips">
              <button type="button" className="copilot-chip" onClick={() => handleQuickPrompt("➕ Add task: Learn React (45m)")}>
                ➕ Add React Task
              </button>
              <button type="button" className="copilot-chip" onClick={() => handleQuickPrompt("✨ Break down my Do First tasks")}>
                ✨ Breakdown Q1
              </button>
              <button type="button" className="copilot-chip" onClick={() => handleQuickPrompt("⏱️ Start 25m Pomodoro timer")}>
                ⏱️ 25m Timer
              </button>
            </div>

            {/* Messages Body */}
            <div className="copilot-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`copilot-msg-row ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">🤖</div>
                  )}
                  <div className="msg-content-wrapper">
                    <div
                      className="msg-bubble"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />

                    {/* Executed Action Badges */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="copilot-action-badges">
                        {msg.executedActions.map((act, i) => (
                          <div key={i} className="action-badge">
                            <span>⚡ Executed:</span> {act}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="copilot-msg-row assistant">
                  <div className="msg-avatar">🤖</div>
                  <div className="msg-bubble loading-bubble">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form className="copilot-input-form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <input
                ref={inputRef}
                type="text"
                className="copilot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Copilot or command: 'add task...', 'timer'..."
                aria-label="AI Copilot input"
                disabled={loading}
              />
              <button
                type="submit"
                className="copilot-send-btn"
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                ➔
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
