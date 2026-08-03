/**
 * Header.jsx — Streamlined top bar component.
 * Includes breadcrumb, quick search, status badges, voice briefing, audio player, theme selector,
 * daily reset, and user profile menu in a single sleek sticky header.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch } from '../store.jsx';
import PwaInstallPrompt from './PwaInstallPrompt.jsx';
import VoiceBriefing from './VoiceBriefing.jsx';
import AmbientSoundPlayer from './AmbientSoundPlayer.jsx';
import ThemeSelector from './ThemeSelector.jsx';

export default function Header({
  userName,
  onLogout,
  showToast,
  onOpenAnalytics,
  onOpenPomodoro,
  onToggleSidebar,
}) {
  const dispatch = useDispatch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const handleReset = () => {
    dispatch({ type: 'DAILY_RESET' });
    if (showToast)
      showToast(
        'Daily reset performed! Habits reset & completed tasks archived.',
        '🌙',
      );
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--bg-header, rgba(255, 255, 255, 0.85))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            color: '#630ed4',
            display: 'flex',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '24px' }}
          >
            menu
          </span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: '#4a4455', fontWeight: '500' }}>Dashboard</span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '14px', color: '#4a4455' }}
          >
            chevron_right
          </span>
          <span style={{ color: '#630ed4', fontWeight: '700' }}>Overview</span>
        </div>
      </div>

      {/* Right: Tools + Badges + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0f3ff',
            borderRadius: '999px',
            border: searchOpen
              ? '1.5px solid #630ed4'
              : '1px solid rgba(204,195,216,0.3)',
            padding: '0 10px',
            height: '34px',
            width: searchOpen ? '180px' : '34px',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              searchRef.current?.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
            aria-label="Open search"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#4a4455' }}
            >
              search
            </span>
          </button>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => {
              if (!search) setSearchOpen(false);
            }}
            placeholder="Search tasks..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#111c2d',
              width: searchOpen ? '100%' : '0',
              opacity: searchOpen ? 1 : 0,
              padding: searchOpen ? '0 0 0 6px' : 0,
            }}
            aria-label="Search"
          />
        </div>

        {/* Quick Toolbar items */}
        <VoiceBriefing showToast={showToast} />

        <button
          type="button"
          onClick={onOpenPomodoro}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#f0f3ff',
            border: '1px solid rgba(204,195,216,0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#111c2d',
          }}
          title="Pomodoro Focus Timer"
        >
          <span>🍓</span>
          <span style={{ fontWeight: '500' }}>Pomodoro</span>
        </button>

        <button
          type="button"
          onClick={onOpenAnalytics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#f0f3ff',
            border: '1px solid rgba(204,195,216,0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#111c2d',
          }}
          title="Analytics"
        >
          <span>📊</span>
          <span style={{ fontWeight: '500' }}>Stats</span>
        </button>

        <AmbientSoundPlayer showToast={showToast} />
        <ThemeSelector showToast={showToast} />

        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
          title="Daily Reset"
        >
          <span>⚡</span>
          <span>Reset</span>
        </button>

        {/* Profile Avatar Dropdown */}
        <div
          ref={menuRef}
          style={{
            position: 'relative',
            marginLeft: '6px',
            paddingLeft: '12px',
            borderLeft: '1px solid rgba(204,195,216,0.3)',
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#630ed4',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              border: '2px solid rgba(99,14,212,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={`Signed in as ${userName}`}
            aria-label="User Menu"
          >
            {(userName || 'U').charAt(0).toUpperCase()}
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '200px',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(204,195,216,0.4)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                zIndex: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f0f3ff',
                  borderBottom: '1px solid rgba(204,195,216,0.3)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111c2d',
                  }}
                >
                  {userName}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '11px',
                    color: '#4a4455',
                  }}
                >
                  Active Session
                </p>
              </div>
              <div style={{ padding: '8px' }}>
                <PwaInstallPrompt showToast={showToast} />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
