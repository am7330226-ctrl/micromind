/**
 * AuthModal.jsx — Login / Register modal that gates the app.
 * Uses Supabase Auth (email/password + Google OAuth).
 */

import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin]     = useState(true);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  // ── Email / Password submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
        onAuthSuccess(data.session, data.user.user_metadata?.name || email.split('@')[0]);
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (err) { setError(err.message); return; }
        setCheckEmail(true); // Supabase sends a confirmation email
      }
    } catch (ex) {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setLoading(false); }
    // On success, the page redirects — onAuthStateChange in store.jsx picks it up
  };

  // ── "Check your email" screen ──────────────────────────────────────────────
  if (checkEmail) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.logo}>📬</div>
          <h1 style={styles.title}>Check your email</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 8 }}>
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            style={{ ...styles.submitBtn, marginTop: 24 }}
            onClick={() => { setCheckEmail(false); setIsLogin(true); }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>MicroMind</h1>
        <p style={styles.subtitle}>Daily Mental Declutter</p>

        {/* Google button */}
        <button style={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.7c4.5-4.2 7.4-10.3 7.4-17.3z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z"/>
            <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8-6.2z"/>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.2 30.5 0 24 0 14.7 0 6.5 5.3 2.5 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}><span>or</span></div>

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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait…' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={styles.privacy}>
          🔒 Powered by Supabase — your data is secure and encrypted.
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
  logo:     { fontSize: 48, marginBottom: 8, display: 'block' },
  title:    { fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' },
  subtitle: { fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px' },
  googleBtn: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '11px 0',
    background: 'white',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1e293b',
    cursor: 'pointer',
    transition: '160ms ease',
    fontFamily: 'inherit',
    marginBottom: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '16px 0',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  tabs: {
    display: 'flex', gap: 4,
    background: '#f1f5f9', borderRadius: 12,
    padding: 4, marginBottom: 16,
  },
  tab: {
    flex: 1, padding: '8px 0',
    border: 'none', borderRadius: 10,
    fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', background: 'transparent',
    color: '#64748b', transition: '120ms ease',
  },
  tabActive: { background: 'white', color: '#4f46e5', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  form:      { display: 'flex', flexDirection: 'column', gap: 12 },
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
    color: '#dc2626', fontSize: '0.82rem',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '8px 12px', margin: 0, textAlign: 'left',
  },
  submitBtn: {
    marginTop: 4, padding: '13px 0',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', transition: '160ms ease', fontFamily: 'inherit',
  },
  privacy: { marginTop: 20, fontSize: '0.72rem', color: '#94a3b8' },
};
