/**
 * soundEngine.js — Shared Web Audio API synthesis engine for ambient soundscapes.
 * Provides Rain 🌧️, Forest 🌲, Cozy Cafe ☕, and Space Drift/Brown Noise 🌊.
 * No external MP3 files required — 100% synthesized in-browser.
 */

class AmbientEngine {
  constructor() {
    this.ctx       = null;
    this.gainNode  = null;
    this.nodes     = [];
    this.muted     = false;
    this.volume    = 0.5;
    this.currentTrack = null; // 'rain' | 'forest' | 'cafe' | 'space' | null
    this.isPlaying = false;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.1);
    }
  }

  setMute(muted) {
    this.muted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    this.nodes.forEach(n => {
      try { n.stop(); } catch(_) {}
    });
    this.nodes = [];
    this.isPlaying = false;
  }

  playTrack(trackId) {
    this.stop();
    const ctx = this._ensureCtx();
    if (!ctx) return false;

    this.currentTrack = trackId;
    this.isPlaying = true;

    switch (trackId) {
      case 'rain':
        this._playRain(ctx);
        break;
      case 'forest':
        this._playForest(ctx);
        break;
      case 'cafe':
        this._playCafe(ctx);
        break;
      case 'space':
      case 'brown':
        this._playBrownNoise(ctx);
        break;
      default:
        this._playRain(ctx);
        break;
    }
    return true;
  }

  toggleTrack(trackId) {
    if (this.isPlaying && this.currentTrack === trackId) {
      this.stop();
      return false;
    } else {
      return this.playTrack(trackId);
    }
  }

  // ── Track Synthesizers ──────────────────────────────────────────────────
  _playBrownNoise(ctx) {
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5;
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

  _playRain(ctx) {
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    const bp   = ctx.createBiquadFilter();
    bp.type    = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.8;
    src.connect(bp);
    bp.connect(this.gainNode);
    src.start();
    this.nodes.push(src);

    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.35, ctx.currentTime);
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();
    this.nodes.push(lfo);
  }

  _playForest(ctx) {
    // Wind background
    this._playBrownNoise(ctx);

    // High pitch gentle bird/chirp pulses
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start();
    this.nodes.push(osc);

    // Periodic soft chirp pulses
    const interval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'forest') {
        clearInterval(interval);
        return;
      }
      if (Math.random() > 0.4 && this.gainNode && ctx) {
        const now = ctx.currentTime;
        const freq = 2000 + Math.random() * 1000;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      }
    }, 1800);
  }

  _playCafe(ctx) {
    // Mid white noise filtering simulating chatter & ambient rustle
    const bufSize = ctx.sampleRate * 4;
    const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;

    const lp = ctx.createBiquadFilter();
    lp.type  = 'lowpass';
    lp.frequency.value = 800;

    src.connect(lp);
    lp.connect(this.gainNode);
    src.start();
    this.nodes.push(src);
  }
}

export const soundEngine = new AmbientEngine();
