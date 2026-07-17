/**
 * Header.jsx — App top bar with brand identity, live date, user info and logout.
 */

export default function Header({ userName, onLogout }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">🧠</div>
        <div>
          <span className="brand-name">MicroMind</span>
          <span className="brand-tagline"> · Daily Mental Declutter</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {today}
        </span>

        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              color: 'white', fontWeight: 700, fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {userName.split(' ')[0]}
            </span>
            <button
              onClick={onLogout}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
