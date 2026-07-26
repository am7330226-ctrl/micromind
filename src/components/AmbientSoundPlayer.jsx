/**
 * AmbientSoundPlayer.jsx — Ambient Soundscapes Modal
 *
 * Provides 4 ambient sound loops using Web Audio API synthesis.
 * Includes: Rain 🌧️, Forest 🌲, Cozy Cafe ☕, Brown Noise 🌊
 * Controls: Play/Stop per track, master volume slider, mute toggle.
 *
 * All sounds are generated via Web Audio API — no external files needed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Web Audio Engine ──────────────────────────────────────────────────────────
class AmbientEngine {
  constructor() {
    this.ctx       = null;
    this.gainNode  = null;
    this.nodes     = [];  // currently playing oscillators/sources
    this.muted     = false;
    this.volume    = 0.6;
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v) {
    this.volume = v;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.1);
    }
  }

  setMute(muted) {
    this.muted = muted;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop(); } catch(_) {} });
    this.nodes = [];
  }

  // Brown noise (all frequencies equal power in log scale → deep, soothing)
  playBrownNoise() {
    const ctx = this._ensureCtx();
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5; // amplify brown noise
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    const lp   = ctx.createBiquadFilter();
    lp.type    = 'lowpass';
    lp.frequency.value = 300;
    src.connect(lp);
    lp.connect(this.gainNode);
    src.start();
    this.nodes.push(src);
  }

  // Rain: high-freq white noise + gentle low rumble
  playRain() {
    const ctx = this._ensureCtx();
    // White noise base
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    // Band-pass to get that rain "hiss"
    const bp   = ctx.createBiquadFilter();
    bp.type    = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.8;
    src.connect(bp);
    bp.connect(this.gainNode);
    src.start();
    this.nodes.push(src);

    // LFO for rainfall rhythm
    const lfo    = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3 + Math.random() * 0.2, ctx.currentTime);
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();
    this.nodes.push(lfo);
  }

  // Forest: gentle wind (low brown) + crickets (high-freq pulses)
  playForest() {
    const ctx = this._ensureCtx();
    // Wind
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = (last + 0.03 * w) / 1.03;
        last = d[i];
        d[i] *= 2;
      }
    }
    const wind   = ctx.createBufferSource();
    wind.buffer  = buf;
    wind.loop    = true;
    const lp     = ctx.createBiquadFilter();
    lp.type      = 'lowpass';
    lp.frequency.value = 500;
    wind.connect(lp);
    lp.connect(this.gainNode);
    wind.start();
    this.nodes.push(wind);

    // Crickets: amplitude-modulated sine
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type      = 'sine';
    osc.frequency.value = 3200;
    oscGain.gain.value  = 0.05;
    const lfo     = ctx.createOscillator();
    const lfoG    = ctx.createGain();
    lfo.type      = 'sine';
    lfo.frequency.value = 14;
    lfoG.gain.value = 0.05;
    lfo.connect(lfoG);
    lfoG.connect(oscGain.gain);
    osc.connect(oscGain);
    oscGain.connect(this.gainNode);
    osc.start();
    lfo.start();
    this.nodes.push(osc, lfo);
  }

  // Cozy cafe: low ambient murmur + gentle clinking
  playCafe() {
    const ctx = this._ensureCtx();
    // Background chatter: bandpass-filtered noise
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    const bp   = ctx.createBiquadFilter();
    bp.type    = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 0.5;
    const bpGain = ctx.createGain();
    bpGain.gain.value = 0.3;
    src.connect(bp);
    bp.connect(bpGain);
    bpGain.connect(this.gainNode);
    src.start();
    this.nodes.push(src);

    // Gentle cup clink: short sine bursts via LFO-controlled oscillator
    const clink    = ctx.createOscillator();
    const clinkGain = ctx.createGain();
    clink.type       = 'sine';
    clink.frequency.value = 880;
    clinkGain.gain.value  = 0;
    const lfo      = ctx.createOscillator();
    const lfoGain  = ctx.createGain();
    lfo.type       = 'sine';
    lfo.frequency.value = 0.12 + Math.random() * 0.06;
    lfoGain.gain.value  = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(clinkGain.gain);
    clink.connect(clinkGain);
    clinkGain.connect(this.gainNode);
    clink.start();
    lfo.start();
    this.nodes.push(clink, lfo);
  }

  play(trackId) {
    this.stop();
    switch (trackId) {
      case 'rain':    this.playRain();       break;
      case 'forest':  this.playForest();     break;
      case 'cafe':    this.playCafe();       break;
      case 'brown':   this.playBrownNoise(); break;
      default: break;
    }
  }
}

const engine = new AmbientEngine();

// ── Track definitions ─────────────────────────────────────────────────────────
const TRACKS = [
  { id: 'rain',   emoji: '🌧️',  name: 'Rain',       desc: 'Gentle rainfall & hiss' },
  { id: 'forest', emoji: '🌲',  name: 'Forest',     desc: 'Crickets & soft wind' },
  { id: 'cafe',   emoji: '☕',  name: 'Cozy Cafe',  desc: 'Murmur & cup clinks' },
  { id: 'brown',  emoji: '🌊',  name: 'Brown Noise',desc: 'Deep, soothing rumble' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AmbientSoundPlayer({ trigger, showToast }) {
  const [open,       setOpen]       = useState(false);
  const [activeId,   setActiveId]   = useState(null);    // currently playing track
  const [volume,     setVolume]     = useState(0.6);
  const [muted,      setMuted]      = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
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

  // Stop engine on unmount
  useEffect(() => () => engine.stop(), []);

  const handleTrack = useCallback((id) => {
    if (activeId === id) {
      // Toggle off
      engine.stop();
      setActiveId(null);
      if (showToast) showToast('Ambient sound stopped', '🔇');
    } else {
      engine.play(id);
      setActiveId(id);
      const t = TRACKS.find(t => t.id === id);
      if (showToast) showToast(`Playing ${t?.name} ambient loop`, t?.emoji || '🎶');
    }
  }, [activeId, showToast]);

  const handleVolume = (v) => {
    const val = parseFloat(v);
    setVolume(val);
    engine.setVolume(val);
    if (muted && val > 0) { setMuted(false); engine.setMute(false); }
  };

  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    engine.setMute(next);
  };

  const isPlaying = activeId !== null;

  return (
    <div className="ambient-player-container" ref={panelRef}>
      {/* Trigger element — rendered by Header via render prop / cloneElement */}
      <button
        id="ambient-noise-btn"
        className={`utility-tool-btn${isPlaying ? ' active-tool' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Ambient Soundscapes"
        aria-label="Ambient Sound Player"
      >
        <span>{isPlaying ? '🎵' : '🎧'}</span>
        <span>{isPlaying ? 'Playing' : 'Audio'}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="ambient-drawer" role="dialog" aria-label="Ambient Sound Player">
          <div className="ambient-drawer-header">
            <span className="ambient-drawer-icon">🎧</span>
            <div>
              <div className="ambient-drawer-title">Ambient Soundscapes</div>
              <div className="ambient-drawer-sub">Focus-enhancing background loops</div>
            </div>
            <button
              className="ambient-drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Close audio player"
            >✕</button>
          </div>

          {/* Track list */}
          <div className="ambient-track-list">
            {TRACKS.map(track => {
              const playing = activeId === track.id;
              return (
                <button
                  key={track.id}
                  className={`ambient-track${playing ? ' playing' : ''}`}
                  onClick={() => handleTrack(track.id)}
                  aria-pressed={playing}
                  title={`${playing ? 'Stop' : 'Play'} ${track.name}`}
                >
                  <span className="ambient-track-emoji">{track.emoji}</span>
                  <div className="ambient-track-info">
                    <span className="ambient-track-name">{track.name}</span>
                    <span className="ambient-track-desc">{track.desc}</span>
                  </div>
                  {playing ? (
                    <div className="ambient-eq-bars" aria-hidden="true">
                      <span /><span /><span /><span />
                    </div>
                  ) : (
                    <span className="ambient-play-icon">▶</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Volume Controls */}
          <div className="ambient-controls">
            <button
              className={`ambient-mute-btn${muted ? ' muted' : ''}`}
              onClick={handleMute}
              title={muted ? 'Unmute' : 'Mute'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              className="ambient-volume-slider"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={e => handleVolume(e.target.value)}
              aria-label="Volume"
            />
            <span className="ambient-volume-pct">{muted ? '0' : Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
