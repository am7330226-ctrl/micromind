/**
 * ThemeSelector.jsx — XP-Gated Theme Picker
 *
 * Shows a panel of theme cards. Locked themes display a "🔒 Unlocks at Lvl X" badge.
 * Active theme is highlighted with a violet ring.
 */

import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../store.jsx';
import { THEMES, getSavedThemeId, applyTheme } from '../utils/themes.js';

export default function ThemeSelector({ showToast }) {
  const state  = useAppState();
  const level  = state.level || 1;

  const [activeId,  setActiveId]  = useState(getSavedThemeId);
  const [panelOpen, setPanelOpen] = useState(false);
  const [lockedHint, setLockedHint] = useState(null); // { id, msg }
  const panelRef = useRef(null);

  // Close on outside click and listen for custom open event
  useEffect(() => {
    function onOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    function onOpenEvent() {
      setPanelOpen(true);
    }
    
    document.addEventListener('open-theme-selector', onOpenEvent);
    if (panelOpen) {
      document.addEventListener('mousedown', onOutside);
      document.addEventListener('touchstart', onOutside);
    }
    return () => {
      document.removeEventListener('open-theme-selector', onOpenEvent);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [panelOpen]);

  // Apply saved theme on mount
  useEffect(() => {
    const theme = THEMES.find(t => t.id === activeId) || THEMES[0];
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(theme) {
    if (theme.unlockLevel > level) {
      setLockedHint({ id: theme.id, msg: `Unlocks at Level ${theme.unlockLevel}!` });
      setTimeout(() => setLockedHint(null), 2200);
      if (showToast) showToast(`🔒 "${theme.name}" unlocks at Level ${theme.unlockLevel}`, '⭐');
      return;
    }
    applyTheme(theme);
    setActiveId(theme.id);
    setPanelOpen(false);
    if (showToast) showToast(`Theme switched to "${theme.name}"`, theme.emoji);
  }

  const activeTheme = THEMES.find(t => t.id === activeId) || THEMES[0];

  return (
    <div className="theme-selector-container" ref={panelRef}>
      {/* Trigger button */}
      <button
        type="button"
        id="theme-toggle-btn"
        className={`utility-tool-btn${panelOpen ? ' active-tool' : ''}`}
        onClick={() => setPanelOpen(o => !o)}
        title="Choose Theme"
        aria-label="Theme Selector"
        aria-expanded={panelOpen}
      >
        <span>{activeTheme.emoji}</span>
        <span>Theme</span>
      </button>

      {/* Theme picker panel */}
      {panelOpen && (
        <div className="theme-panel" role="dialog" aria-label="Theme Selector">
          <div className="theme-panel-header">
            <span>🎨</span>
            <div>
              <div className="theme-panel-title">Choose Theme</div>
              <div className="theme-panel-sub">Level {level} · Earn XP to unlock more</div>
            </div>
          </div>

          <div className="theme-grid">
            {THEMES.map(theme => {
              const isLocked   = theme.unlockLevel > level;
              const isActive   = theme.id === activeId;
              const showBadge  = lockedHint?.id === theme.id;

              return (
                <button
                  type="button"
                  key={theme.id}
                  className={`theme-card${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
                  onClick={() => handleSelect(theme)}
                  aria-pressed={isActive}
                  title={isLocked ? `Unlocks at Level ${theme.unlockLevel}` : theme.description}
                >
                  {/* Colour swatch */}
                  <div
                    className="theme-swatch"
                    style={{ background: theme.vars['--gradient-brand'] || theme.vars['--bg-app'] }}
                  />

                  <div className="theme-info">
                    <span className="theme-card-emoji">{theme.emoji}</span>
                    <div>
                      <div className="theme-card-name">{theme.name}</div>
                      <div className="theme-card-desc">{theme.description}</div>
                    </div>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <span className="theme-active-check" aria-label="Active theme">✓</span>
                  )}

                  {/* Lock badge */}
                  {isLocked && (
                    <span className={`theme-lock-badge${showBadge ? ' shake' : ''}`}>
                      🔒 Lvl {theme.unlockLevel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
