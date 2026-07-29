/**
 * DigitalSanctuary.jsx — Mood selector + Soundscape player (Stitch "Card E")
 * Replaces jQuery `:contains()` with React state for selectedMood & activeSound.
 * Uses DiceBear-style inline SVG for now-playing artwork (no external images).
 */

import { useState } from 'react';
import { useDispatch, useAppState } from '../store.jsx';

const MOODS = [
  { emoji: '😊', label: 'Calm'        },
  { emoji: '😐', label: 'Focused'     },
  { emoji: '😔', label: 'Overwhelmed' },
];

const SOUNDS = [
  { id: 'rain',   icon: 'rainy',  label: 'Midnight Rain', desc: 'Rain & thunder'      },
  { id: 'forest', icon: 'forest', label: 'Deep Forest',   desc: 'Birds & leaves'      },
  { id: 'cafe',   icon: 'coffee', label: 'Paris Café',    desc: 'Ambient chatter'     },
  { id: 'space',  icon: 'blur_circular', label: 'Space Drift', desc: 'Cosmic drone'   },
];

export default function DigitalSanctuary({ onOpenPomodoro }) {
  const state    = useAppState();
  const dispatch = useDispatch();

  const savedMood   = state.todayMood || null;
  const [mood,       setMood]       = useState(savedMood);
  const [activeId,   setActiveId]   = useState('rain');
  const [volume,     setVolume]     = useState(45);
  const [remaining,  setRemaining]  = useState('45m remaining');

  const activeSound = SOUNDS.find(s => s.id === activeId) || SOUNDS[0];

  function handleMood(label) {
    setMood(label);
    dispatch({ type: 'SET_MOOD', mood: label });
  }

  function handleSound(id) {
    setActiveId(id);
    setRemaining('45m remaining');
  }

  // Inline SVG art for now-playing — avoids external googleusercontent URLs
  const NowPlayingArt = () => (
    <svg viewBox="0 0 48 48" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill="url(#sky)" rx="10"/>
      <circle cx="12" cy="12" r="4" fill="#a78bfa" opacity=".6"/>
      <circle cx="36" cy="8"  r="2" fill="#c4b5fd" opacity=".5"/>
      <rect x="0" y="34" width="48" height="14" fill="#14532d" rx="4"/>
      <ellipse cx="24" cy="34" rx="12" ry="3" fill="#166534" opacity=".6"/>
      {/* Rain drops */}
      {[6,14,22,30,38].map(x => (
        <line key={x} x1={x} y1="18" x2={x-1} y2="25" stroke="#818cf8" strokeWidth="0.8" opacity=".5"/>
      ))}
    </svg>
  );

  return (
    <div className="bento-card flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <span className="material-symbols-outlined text-[#630ed4]">headset</span>
        <h3 className="text-[20px] font-semibold font-headline">Digital Sanctuary</h3>
        {onOpenPomodoro && (
          <button
            type="button"
            onClick={onOpenPomodoro}
            className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[#630ed4] bg-[#eaddff]/40 hover:bg-[#eaddff]/70 px-3 py-1.5 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">timer</span>
            Pomodoro
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
        {/* Mood Selector */}
        <div>
          <p className="text-[12px] font-bold text-[#4a4455] uppercase tracking-widest mb-4">Current Mood</p>
          <div className="flex gap-3">
            {MOODS.map(m => (
              <button
                key={m.label}
                type="button"
                onClick={() => handleMood(m.label)}
                className={[
                  'flex-1 aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95',
                  mood === m.label
                    ? 'bg-[#630ed4] text-white shadow-lg shadow-[#630ed4]/25'
                    : 'bg-[#f0f3ff] hover:bg-[#eaddff]/40 border border-[#ccc3d8]/30',
                ].join(' ')}
                aria-pressed={mood === m.label}
                aria-label={m.label}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className={[
                  'text-[11px] font-bold',
                  mood === m.label ? 'text-white' : 'text-[#4a4455]',
                ].join(' ')}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Soundscapes */}
        <div className="overflow-y-auto">
          <p className="text-[12px] font-bold text-[#4a4455] uppercase tracking-widest mb-4">Active Soundscape</p>
          <div className="space-y-2">
            {SOUNDS.map(s => {
              const isActive = s.id === activeId;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSound(s.id)}
                  onKeyDown={e => e.key === 'Enter' && handleSound(s.id)}
                  className={[
                    'flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all group',
                    isActive
                      ? 'bg-[#eaddff]/30 border-[#630ed4]/20'
                      : 'bg-[#f0f3ff] border-[#ccc3d8]/20 hover:border-[#630ed4]/30',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className={[
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      isActive ? 'bg-[#630ed4]/10 text-[#630ed4]' : 'bg-[#4a4455]/10 text-[#4a4455]',
                    ].join(' ')}>
                      <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#111c2d]">{s.label}</p>
                      {isActive && <p className="text-[10px] text-[#630ed4] font-bold uppercase">Playing</p>}
                      {!isActive && <p className="text-[10px] text-[#4a4455]/60">{s.desc}</p>}
                    </div>
                  </div>
                  {isActive
                    ? <input
                        type="range"
                        min={0} max={100}
                        value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="w-20 accent-[#630ed4]"
                        aria-label="Volume"
                        onClick={e => e.stopPropagation()}
                      />
                    : <span className="material-symbols-outlined text-[#4a4455]/50 group-hover:text-[#630ed4] transition-colors">play_arrow</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Now Playing Bar */}
      <div className="mt-4 pt-4 border-t border-[#ccc3d8]/20 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
          <NowPlayingArt />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-[#4a4455]">Current Atmosphere</p>
          <p className="text-[14px] font-medium text-[#111c2d] truncate">{activeSound.label} · {remaining}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-[#e7eeff] flex items-center justify-center hover:bg-[#dee8ff] transition-colors"
            aria-label="Skip to next"
          >
            <span className="material-symbols-outlined text-[18px]">skip_next</span>
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-[#630ed4] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#630ed4]/25"
            aria-label="Pause"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
          </button>
        </div>
      </div>
    </div>
  );
}
