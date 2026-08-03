/**
 * VoiceBriefing.jsx — Daily AI Voice Briefing Component
 *
 * Uses the Web Speech API to read a personalized daily summary.
 * Controls: ▶ Play, ⏸ Pause, ⏹ Stop with a pulsing audio waveform indicator.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../store.jsx';
import { useAuth } from '../store.jsx';
import {
  generateBriefingScript,
  isVoiceSupported,
} from '../utils/voiceBriefing.js';

export default function VoiceBriefing({ showToast }) {
  const state = useAppState();
  const { auth } = useAuth();

  const [status, setStatus] = useState('idle'); // 'idle' | 'speaking' | 'paused' | 'unsupported'
  const [script, setScript] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const utteranceRef = useRef(null);
  const panelRef = useRef(null);

  // ── Check browser support ────────────────────────────────────────────────
  useEffect(() => {
    if (!isVoiceSupported()) setStatus('unsupported');
    // Cleanup on unmount: stop any ongoing speech
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    function onOutsideClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener('mousedown', onOutsideClick);
      document.addEventListener('touchstart', onOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('touchstart', onOutsideClick);
    };
  }, [panelOpen]);

  // ── Generate script when panel opens ─────────────────────────────────────
  useEffect(() => {
    if (panelOpen) {
      const generated = generateBriefingScript(state, auth.name || 'Friend');

      setScript(generated);
    }
  }, [panelOpen, state, auth.name]);

  // ── Play ─────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (!isVoiceSupported()) {
      if (showToast) showToast('Voice not supported in this browser', '⚠️');
      return;
    }

    // If paused, resume
    if (status === 'paused' && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus('speaking');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.92; // slightly slower than default for clarity
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Pick a pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google US')),
      ) || voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => {
      setStatus('idle');
      if (showToast) showToast('Speech error occurred', '⚠️');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatus('speaking');
  }, [script, status, showToast]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, []);

  // ── Stop ──────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setStatus('idle');
  }, []);

  if (status === 'unsupported') return null;

  return (
    <div className="voice-briefing-container" ref={panelRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`utility-tool-btn voice-briefing-trigger${status === 'speaking' ? ' voice-active' : ''}`}
        onClick={() => setPanelOpen((o) => !o)}
        title="Daily AI Voice Briefing"
        aria-label="Voice Briefing"
        aria-expanded={panelOpen}
      >
        {status === 'speaking' ? (
          <span className="voice-wave-icon" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
        ) : (
          <span>🔊</span>
        )}
        <span>Briefing</span>
      </button>

      {/* Briefing Panel */}
      {panelOpen && (
        <div
          className="voice-briefing-panel"
          role="dialog"
          aria-label="Daily Briefing"
        >
          <div className="voice-panel-header">
            <span className="voice-panel-icon">🔊</span>
            <div>
              <div className="voice-panel-title">Daily Briefing</div>
              <div className="voice-panel-subtitle">
                Your AI-powered morning summary
              </div>
            </div>
            <button
              type="button"
              className="voice-panel-close"
              onClick={() => {
                handleStop();
                setPanelOpen(false);
              }}
              aria-label="Close briefing panel"
            >
              ✕
            </button>
          </div>

          {/* Script Preview */}
          <div
            className={`voice-script-preview${status === 'speaking' ? ' speaking' : ''}`}
          >
            {script}
          </div>

          {/* Status Indicator */}
          {status === 'speaking' && (
            <div className="voice-status-bar">
              <div className="audio-pulse-indicator">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="voice-status-text">Reading your briefing…</span>
            </div>
          )}
          {status === 'paused' && (
            <div className="voice-status-bar paused">
              <span>⏸</span>
              <span className="voice-status-text">Paused</span>
            </div>
          )}

          {/* Controls */}
          <div className="voice-controls">
            <button
              type="button"
              className={`voice-ctrl-btn play${status === 'speaking' ? ' disabled' : ''}`}
              onClick={handlePlay}
              disabled={status === 'speaking'}
              aria-label="Play briefing"
              title="Play"
            >
              ▶ {status === 'paused' ? 'Resume' : 'Play'}
            </button>

            <button
              type="button"
              className="voice-ctrl-btn pause"
              onClick={handlePause}
              disabled={status !== 'speaking'}
              aria-label="Pause briefing"
              title="Pause"
            >
              ⏸ Pause
            </button>

            <button
              type="button"
              className="voice-ctrl-btn stop"
              onClick={handleStop}
              disabled={status === 'idle'}
              aria-label="Stop briefing"
              title="Stop"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
