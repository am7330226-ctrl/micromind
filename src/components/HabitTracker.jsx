/**
 * HabitTracker.jsx — Daily habit checklist with click toggles.
 */

import { useAppState, useDispatch } from '../store.jsx';

export default function HabitTracker({ showToast }) {
  const state = useAppState();
  const dispatch = useDispatch();

  const habits = state.habits || [];

  const handleToggle = (habitId) => {
    dispatch({ type: 'TOGGLE_HABIT', id: habitId });
  };

  const doneCount = habits.filter(h => h.done).length;

  return (
    <div className="glass-panel habits-panel">
      <div className="panel-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Daily Habits
        </h2>
        <span className="helper-badge">{doneCount}/{habits.length} done</span>
      </div>

      <div className="habits-container" id="habits-container">
        {habits.map(habit => (
          <div
            key={habit.id}
            className={`habit-item${habit.done ? ' done' : ''}`}
            onClick={() => handleToggle(habit.id)}
            role="checkbox"
            aria-checked={habit.done}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleToggle(habit.id)}
          >
            <span className="habit-dot" />
            <span className="habit-emoji">{habit.emoji}</span>
            <span className="habit-label">{habit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
