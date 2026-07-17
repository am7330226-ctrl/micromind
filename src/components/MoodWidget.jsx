/**
 * MoodWidget.jsx — Daily mood tracker with 5-star rating.
 */

import { useState } from 'react';
import { useAppState, useDispatch } from '../store.jsx';

const MOOD_LABELS = ['', 'Exhausted', 'Low', 'Okay', 'Good', 'Energized'];
const MOOD_EMOJIS = ['', '😩', '😔', '😐', '😊', '⚡'];

export default function MoodWidget({ showToast }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [hovered, setHovered] = useState(0);

  const currentMood = state.moodToday || 0;

  const handleClick = (val) => {
    const newMood = currentMood === val ? 0 : val;
    dispatch({ type: 'SET_MOOD', mood: newMood });
    if (newMood > 0) {
      showToast(`Mood set: ${MOOD_LABELS[newMood]} ${'⭐'.repeat(newMood)}`, '😊');
    }
  };

  return (
    <div className="glass-panel mood-panel">
      <div className="panel-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          Today's Mood
        </h2>
        <span className="helper-badge">How are you feeling?</span>
      </div>

      <div className="mood-stars" id="mood-stars">
        {[1, 2, 3, 4, 5].map((val) => {
          const isActive = val <= currentMood;
          const isHovered = val <= hovered && hovered > 0 && val > currentMood;
          return (
            <button
              key={val}
              className={`mood-star${isActive ? ' active' : ''}${isHovered ? ' hovered' : ''}`}
              data-value={val}
              title={MOOD_LABELS[val]}
              onClick={() => handleClick(val)}
              onMouseEnter={() => setHovered(val)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`Mood: ${MOOD_LABELS[val]}`}
            >
              {MOOD_EMOJIS[val]}
            </button>
          );
        })}
      </div>

      {currentMood > 0 && (
        <p className="mood-feedback" id="mood-feedback">
          {MOOD_LABELS[currentMood]}
        </p>
      )}
    </div>
  );
}
