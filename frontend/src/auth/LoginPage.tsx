import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'radiologist') navigate('/radiologist', { replace: true });
      else if (user.role === 'clerical') navigate('/clerical', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 360,
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          Radiology RVU Workload App
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Sign in with your email and password.
        </p>
        {error && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: 8,
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '1.5rem' }}>
          <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: submitting ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
