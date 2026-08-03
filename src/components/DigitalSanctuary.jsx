/**
 * DigitalSanctuary.jsx — Mood selector + Soundscape player (Stitch "Card E")
 * Connected to soundEngine.js for REAL Web Audio synthesis!
 */

import { useState, useEffect } from 'react';
import { useDispatch, useAppState } from '../store.jsx';
import { soundEngine } from '../utils/soundEngine.js';

const NowPlayingArt = () => (
  <svg
    viewBox="0 0 48 48"
    style={{ width: '100%', height: '100%', borderRadius: '12px' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" fill="url(#sky)" rx="10" />
    <circle cx="12" cy="12" r="4" fill="#a78bfa" opacity=".6" />
    <circle cx="36" cy="8" r="2" fill="#c4b5fd" opacity=".5" />
    <rect x="0" y="34" width="48" height="14" fill="#14532d" rx="4" />
    <ellipse cx="24" cy="34" rx="12" ry="3" fill="#166534" opacity=".6" />
    {[6, 14, 22, 30, 38].map((x) => (
      <line
        key={x}
        x1={x}
        y1="18"
        x2={x - 1}
        y2="25"
        stroke="#818cf8"
        strokeWidth="0.8"
        opacity=".5"
      />
    ))}
  </svg>
);

const MOODS = [
  { emoji: '😊', label: 'Calm' },
  { emoji: '😐', label: 'Focused' },
  { emoji: '😔', label: 'Overwhelmed' },
];

const SOUNDS = [
  { id: 'rain', icon: 'rainy', label: 'Midnight Rain', desc: 'Rain & thunder' },
  {
    id: 'forest',
    icon: 'forest',
    label: 'Deep Forest',
    desc: 'Birds & leaves',
  },
  { id: 'cafe', icon: 'coffee', label: 'Paris Café', desc: 'Ambient chatter' },
  {
    id: 'space',
    icon: 'blur_circular',
    label: 'Space Drift',
    desc: 'Cosmic drone',
  },
];

export default function DigitalSanctuary({ onOpenPomodoro, showToast }) {
  const state = useAppState();
  const dispatch = useDispatch();

  const savedMood = state.todayMood || null;
  const [mood, setMood] = useState(savedMood);
  const [activeId, setActiveId] = useState('rain');
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeSound = SOUNDS.find((s) => s.id === activeId) || SOUNDS[0];

  useEffect(() => {
    soundEngine.setVolume(volume / 100);
  }, [volume]);

  function handleMood(label) {
    setMood(label);
    dispatch({ type: 'SET_MOOD', mood: label });
    if (showToast) showToast(`Mood logged: ${label}`, '🧘');
  }

  function handleSound(id) {
    setActiveId(id);
    const playing = soundEngine.playTrack(id);
    setIsPlaying(playing);
    if (showToast)
      showToast(`Playing ${SOUNDS.find((s) => s.id === id)?.label}`, '🎧');
  }

  function togglePlayPause() {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
      if (showToast) showToast('Soundscape paused', '⏸️');
    } else {
      const playing = soundEngine.playTrack(activeId);
      setIsPlaying(playing);
      if (showToast) showToast(`Playing ${activeSound.label}`, '🎧');
    }
  }

  return (
    <div
      className="bento-card"
      style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: '#630ed4', fontSize: '24px' }}
        >
          headset
        </span>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            color: '#111c2d',
          }}
        >
          Digital Sanctuary
        </h3>
        {onOpenPomodoro && (
          <button
            type="button"
            onClick={onOpenPomodoro}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#630ed4',
              backgroundColor: 'rgba(234, 221, 255, 0.5)',
              padding: '6px 12px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px' }}
            >
              timer
            </span>
            Pomodoro
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          overflow: 'hidden',
        }}
      >
        {/* Mood Selector */}
        <div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#4a4455',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            Current Mood
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {MOODS.map((m) => {
              const isSelected = mood === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => handleMood(m.label)}
                  style={{
                    flex: 1,
                    minHeight: '90px',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: isSelected ? '#630ed4' : '#f0f3ff',
                    color: isSelected ? '#ffffff' : '#111c2d',
                    border: isSelected
                      ? 'none'
                      : '1px solid rgba(204, 195, 216, 0.4)',
                    boxShadow: isSelected
                      ? '0 8px 20px rgba(99, 14, 212, 0.3)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  aria-pressed={isSelected}
                  aria-label={m.label}
                >
                  <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Soundscapes */}
        <div style={{ overflowY: 'auto' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#4a4455',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            Active Soundscape
          </p>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {SOUNDS.map((s) => {
              const isSelectedTrack = s.id === activeId;
              const isCurrentlyPlaying = isSelectedTrack && isPlaying;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSound(s.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSound(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isCurrentlyPlaying
                      ? 'rgba(234, 221, 255, 0.5)'
                      : '#f8fafc',
                    border: isCurrentlyPlaying
                      ? '1px solid #630ed4'
                      : '1px solid rgba(204, 195, 216, 0.3)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isCurrentlyPlaying
                          ? '#630ed4'
                          : 'rgba(74, 68, 85, 0.08)',
                        color: isCurrentlyPlaying ? '#ffffff' : '#4a4455',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px' }}
                      >
                        {s.icon}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#111c2d',
                          margin: 0,
                        }}
                      >
                        {s.label}
                      </p>
                      {isCurrentlyPlaying && (
                        <p
                          style={{
                            fontSize: '10px',
                            color: '#630ed4',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            margin: '2px 0 0 0',
                          }}
                        >
                          🔊 Playing
                        </p>
                      )}
                      {!isCurrentlyPlaying && (
                        <p
                          style={{
                            fontSize: '11px',
                            color: '#4a4455',
                            opacity: 0.7,
                            margin: '2px 0 0 0',
                          }}
                        >
                          {s.desc}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelectedTrack ? (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      style={{ width: '80px', accentColor: '#630ed4' }}
                      aria-label="Volume"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#4a4455', opacity: 0.5 }}
                    >
                      play_arrow
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Now Playing Bar */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(204, 195, 216, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <NowPlayingArt />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#4a4455',
              margin: '0 0 2px 0',
            }}
          >
            Current Atmosphere
          </p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111c2d',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeSound.label} ·{' '}
            {isPlaying ? 'Playing Ambient Synthesis' : 'Paused'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={togglePlayPause}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#630ed4',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 14, 212, 0.3)',
            }}
            aria-label={isPlaying ? 'Pause Soundscape' : 'Play Soundscape'}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
