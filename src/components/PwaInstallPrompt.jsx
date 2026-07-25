/**
 * PwaInstallPrompt.jsx — Captures browser beforeinstallprompt and renders
 * a 1-tap "📲 Install App" button for Android & desktop Chrome/Edge.
 */

import { useState, useEffect } from 'react';

export default function PwaInstallPrompt({ showToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Detect if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (showToast) showToast('MicroMind installed successfully! 🎉', '📱');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (showToast) {
        showToast('To install on iOS: Tap Share ➔ Add to Home Screen 📲', '📱');
      } else {
        alert('To install on iOS: Tap Share ➔ Add to Home Screen 📲');
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      if (showToast) showToast('Installing MicroMind app…', '📱');
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <button
      id="pwa-install-btn"
      onClick={handleInstallClick}
      title="Install MicroMind App on iOS/Android"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1.5px solid rgba(139, 92, 246, 0.35)',
        color: 'var(--color-violet)',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: '200ms ease',
        fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.12)',
      }}
    >
      <span>📲</span>
      <span>Install App</span>
    </button>
  );
}
