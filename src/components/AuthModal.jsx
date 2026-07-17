/**
 * AuthModal.jsx — Login / Register modal that gates the app.
 * Talks to the Express /api/login and /api/register endpoints.
 */

import { useState } from 'react';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      localStorage.setItem('micromind_token', data.token);
      localStorage.setItem('micromind_user', JSON.stringify({ name: data.name, email: data.email }));
      onAuthSuccess(data.token, data.name);
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>MicroMind</h1>
        <p style={styles.subtitle}>Daily Mental Declutter</p>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin  ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >Sign In</button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >Create Account</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              style={styles.input}
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait…' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={styles.privacy}>
          🔒 Your data is stored on your local server and never shared.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #eef2ff 0%, #f1f5f9 50%, #f0fdf4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: 24,
    padding: '40px 36px',
    width: '100%', maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(79,70,229,0.1)',
    border: '1px solid rgba(79,70,229,0.1)',
    textAlign: 'center',
  },
  logo: {
    fontSize: 48, marginBottom: 8, display: 'block',
  },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.8rem', fontWeight: 800,
    color: '#1e293b', margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '0.85rem', color: '#94a3b8',
    margin: '0 0 28px',
  },
  tabs: {
    display: 'flex', gap: 4,
    background: '#f1f5f9', borderRadius: 12,
    padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, padding: '8px 0',
    border: 'none', borderRadius: 10,
    fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', background: 'transparent',
    color: '#64748b', transition: '120ms ease',
  },
  tabActive: {
    background: 'white',
    color: '#4f46e5',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  input: {
    padding: '12px 16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1e293b',
    transition: '180ms ease',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.82rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '8px 12px',
    margin: 0,
    textAlign: 'left',
  },
  submitBtn: {
    marginTop: 4,
    padding: '13px 0',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: '160ms ease',
    fontFamily: 'inherit',
  },
  privacy: {
    marginTop: 20,
    fontSize: '0.72rem',
    color: '#94a3b8',
  },
};
