import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStrings } from '../i18n/useAppStrings';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const s = useAppStrings();
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
      else if (user.role === 'radiologist') navigate('/radiologist/requisitions', { replace: true });
      else if (user.role === 'clerical') navigate('/clerical', { replace: true });
      else if (user.role === 'physician') navigate('/physician/new', { replace: true });
      else if (user.role === 'technologist') navigate('/technologist', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : s.login.loginFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="v3-login-bg">
      <div className="v3-login-brand">
        <div className="v3-login-logo" aria-hidden />
        <div className="v3-login-brand-name">{s.layout.brandLine}</div>
      </div>

      <form className="v3-login-card" onSubmit={handleSubmit}>
        <h1 className="v3-login-app-title">{s.login.title}</h1>
        <p className="v3-login-sub">{s.login.subtitle}</p>

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

        <label className="v3-field">
          <span>{s.login.email}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={s.login.emailPlaceholder}
          />
        </label>
        <label className="v3-field">
          <span>{s.login.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={submitting} className="v3-login-submit">
          {submitting ? s.login.signingIn : s.login.signIn}
        </button>

        <a className="v3-login-forgot" href="#" onClick={(e) => e.preventDefault()}>
          {s.login.forgotPassword}
        </a>
      </form>

      <p className="v3-login-footer">
        {s.login.noAccount}{' '}
        <Link to="/signup" className="v3-link">
          {s.login.requestAccess}
        </Link>
        {' · '}
        <Link to="/external-requisition" className="v3-link">
          {s.login.publicRequisition}
        </Link>
      </p>
    </div>
  );
}
