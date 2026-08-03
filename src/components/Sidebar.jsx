/**
 * Sidebar.jsx — Vertical navigation panel.
 * Displays brand logo, main app navigation, XP level progress bar,
 * New Entry button, and Settings/Support actions.
 * Features mobile hamburger slide-over drawer behavior.
 */

import { useState, useEffect } from 'react';
import { useAppState } from '../store.jsx';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    sectionId: 'section-dashboard',
  },
  {
    id: 'brain-dump',
    label: 'Brain Dump',
    icon: 'psychology',
    sectionId: 'section-brain-dump',
  },
  {
    id: 'priority-matrix',
    label: 'Priority Matrix',
    icon: 'grid_view',
    sectionId: 'section-priority-matrix',
  },
  {
    id: 'focus-analytics',
    label: 'Focus Analytics',
    icon: 'analytics',
    sectionId: 'section-focus-analytics',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: 'schedule',
    sectionId: 'section-timeline',
  },
];

export default function Sidebar({ isOpen, onClose, onNewEntry, showToast }) {
  const state = useAppState();
  const xp = state.xp || 0;
  const level = state.level || 1;
  const streak = state.streak || 0;

  const [activeNav, setActiveNav] = useState('dashboard');

  // Sync scroll position to highlight active nav item
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(item.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (item) => {
    setActiveNav(item.id);
    if (onClose) onClose(); // close mobile drawer
    const target = document.getElementById(item.sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else if (item.id === 'brain-dump') {
      const brainDump = document.getElementById('section-brain-dump');
      if (brainDump) {
        brainDump.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          document.getElementById('dump-input')?.focus();
        }, 300);
      }
    }
  };

  const handleSettingsClick = () => {
    if (onClose) onClose();
    const themeBtn =
      document.getElementById('theme-toggle-btn') ||
      document.querySelector('.theme-btn');
    if (themeBtn) {
      themeBtn.click();
    } else if (showToast) {
      showToast('Settings: Use the Theme selector in the top bar!', '⚙️');
    }
  };

  const handleSupportClick = () => {
    if (onClose) onClose();
    if (showToast) {
      showToast(
        'MicroMind Support: Press Ctrl+K or use the Copilot bot anytime!',
        '💡',
      );
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
            display: 'none',
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`sidebar-panel${isOpen ? ' open' : ''}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: '260px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: 'var(--bg-sidebar, #ffffff)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, background-color 0.2s ease',
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <div
          onClick={() =>
            handleNavClick({ id: 'dashboard', sectionId: 'section-dashboard' })
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,14,212,0.3)',
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
            >
              psychology
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: 'Outfit,sans-serif',
                lineHeight: 1.2,
              }}
            >
              MicroMind
            </div>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-secondary)',
                fontWeight: '700',
              }}
            >
              Digital Sanctuary
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  background: isActive ? '#630ed4' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isActive
                    ? '0 4px 14px rgba(99,14,212,0.25)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'rgba(99,14,212,0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '20px' }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* XP Bar & Action Buttons */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            className="badge-container"
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                }}
              >
                Lvl {level}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#8b5cf6',
                }}
              >
                {xp} XP
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(99, 14, 212, 0.15)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, xp % 100)}%`,
                  background: '#630ed4',
                  borderRadius: '6px',
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginTop: '4px',
              }}
            >
              🔥 {streak}-day streak
            </div>
          </div>

          {/* New Entry Button */}
          <button
            type="button"
            onClick={onNewEntry}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              background: '#630ed4',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 16px rgba(99,14,212,0.25)',
              transition: 'all 0.15s',
              marginBottom: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#630ed4';
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px' }}
            >
              add
            </span>
            New Entry
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={handleSettingsClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,14,212,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              settings
            </span>
            Settings
          </button>

          {/* Support Button */}
          <button
            type="button"
            onClick={handleSupportClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,14,212,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px' }}
            >
              help_outline
            </span>
            Support
          </button>
        </div>
      </aside>
    </>
  );
}
