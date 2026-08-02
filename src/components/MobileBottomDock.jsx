/**
 * MobileBottomDock.jsx — Floating bottom navigation bar for mobile viewports (< 640px).
 * Provides one-thumb touch access with guaranteed 44px x 44px touch targets.
 */

export default function MobileBottomDock({
  onOpenPomodoro,
  onOpenAnalytics,
  onReset,
  showToast
}) {
  const focusInput = () => {
    const input = document.getElementById('dump-input');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="mobile-bottom-dock" role="navigation" aria-label="Mobile Bottom Navigation">
      <button
        className="dock-btn"
        onClick={focusInput}
        title="Focus Brain Dump"
        aria-label="Brain Dump"
      >
        <span>🧠</span>
        <span className="dock-label">Dump</span>
      </button>

      <button
        className="dock-btn"
        onClick={onOpenPomodoro}
        title="Pomodoro Timer"
        aria-label="Pomodoro Timer"
      >
        <span>🍅</span>
        <span className="dock-label">Focus</span>
      </button>

      <button
        className="dock-btn"
        onClick={onOpenAnalytics}
        title="Analytics Dashboard"
        aria-label="Analytics"
      >
        <span>📊</span>
        <span className="dock-label">Stats</span>
      </button>

      <button
        className="dock-btn"
        onClick={(e) => {
          e.currentTarget.blur();
          const btn = document.getElementById('theme-toggle-btn');
          if (btn) {
            btn.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        title="Choose Theme"
        aria-label="Theme Selector"
      >
        <span>🎨</span>
        <span className="dock-label">Theme</span>
      </button>

      <button
        className="dock-btn"
        onClick={onReset}
        title="Daily Reset"
        aria-label="Daily Reset"
      >
        <span>🌙</span>
        <span className="dock-label">Reset</span>
      </button>
    </div>
  );
}
