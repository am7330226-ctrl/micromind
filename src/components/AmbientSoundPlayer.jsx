/**
 * AmbientSoundPlayer.jsx — Ambient Soundscapes Drawer
 * Connected to soundEngine.js for real Web Audio API synthesis.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/soundEngine.js';

const TRACKS = [
  { id: 'rain', emoji: '🌧️', name: 'Rain', desc: 'Gentle rainfall & hiss' },
  { id: 'forest', emoji: '🌲', name: 'Forest', desc: 'Crickets & soft wind' },
  { id: 'cafe', emoji: '☕', name: 'Cozy Cafe', desc: 'Murmur & cup clinks' },
  {
    id: 'space',
    emoji: '🌊',
    name: 'Brown Noise',
    desc: 'Deep, soothing rumble',
  },
];

export default function AmbientSoundPlayer({ showToast }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onOutside);
      document.addEventListener('touchstart', onOutside);
    }
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [open]);

  const handleTrack = useCallback(
    (id) => {
      if (activeId === id && soundEngine.isPlaying) {
        soundEngine.stop();
        setActiveId(null);
        if (showToast) showToast('Ambient sound stopped', '🔇');
      } else {
        soundEngine.playTrack(id);
        setActiveId(id);
        const t = TRACKS.find((tr) => tr.id === id);
        if (showToast)
          showToast(`Playing ${t?.name} ambient loop`, t?.emoji || '🎶');
      }
    },
    [activeId, showToast],
  );

  const handleVolume = (v) => {
    const val = parseFloat(v);
    setVolume(val);
    soundEngine.setVolume(val);
    if (muted && val > 0) {
      setMuted(false);
      soundEngine.setMute(false);
    }
  };

  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMute(next);
  };

  const isPlaying = activeId !== null && soundEngine.isPlaying;

  return (
    <div
      className="ambient-player-container"
      ref={panelRef}
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        id="ambient-noise-btn"
        className={`utility-tool-btn${isPlaying ? ' active-tool' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Ambient Soundscapes"
        aria-label="Ambient Sound Player"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: isPlaying ? 'rgba(99, 14, 212, 0.15)' : '#f0f3ff',
          border: isPlaying
            ? '1px solid #630ed4'
            : '1px solid rgba(204,195,216,0.3)',
          color: isPlaying ? '#630ed4' : '#111c2d',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        <span>{isPlaying ? '🎵' : '🎧'}</span>
        <span style={{ fontWeight: '500' }}>
          {isPlaying ? 'Playing' : 'Audio'}
        </span>
      </button>

      {open && (
        <div
          className="ambient-drawer"
          role="dialog"
          aria-label="Ambient Sound Player"
          style={{
            position: 'absolute',
            right: 0,
            top: '44px',
            width: '280px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(204,195,216,0.4)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎧</span>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111c2d',
                  }}
                >
                  Ambient Soundscapes
                </div>
                <div style={{ fontSize: '11px', color: '#4a4455' }}>
                  Web Audio Synthesis
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4a4455',
                fontSize: '16px',
              }}
              aria-label="Close audio player"
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {TRACKS.map((t) => {
              const isSelected = activeId === t.id && isPlaying;
              return (
                <div
                  key={t.id}
                  onClick={() => handleTrack(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'rgba(234, 221, 255, 0.5)'
                      : '#f8fafc',
                    border: isSelected
                      ? '1px solid #630ed4'
                      : '1px solid rgba(204,195,216,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{t.emoji}</span>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#111c2d',
                        }}
                      >
                        {t.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#4a4455' }}>
                        {t.desc}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isSelected ? '#630ed4' : '#4a4455',
                    }}
                  >
                    {isSelected ? '⏸️' : '▶️'}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(204,195,216,0.3)',
            }}
          >
            <button
              type="button"
              onClick={handleMute}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolume(e.target.value)}
              style={{ flex: 1, accentColor: '#630ed4' }}
              aria-label="Volume"
            />
          </div>
        </div>
      )}
    </div>
  );
}
