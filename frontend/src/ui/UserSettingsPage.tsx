import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppUi } from '../context/AppUiContext';
import { useAppStrings } from '../i18n/useAppStrings';

export const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { lang, setLang } = useAppUi();
  const s = useAppStrings();

  const parts = (user?.name || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || '';

  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{s.settings}</h1>
      <p className="v3-page-lead">{s.settingsPage.lead}</p>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">{s.settingsPage.preferredLanguage}</div>
        <div className="v3-card__body v3-lang-toggle">
          <button
            type="button"
            className={`v3-lang-btn ${lang === 'en' ? 'v3-lang-btn--active' : ''}`}
            onClick={() => setLang('en')}
          >
            {s.settingsPage.english}
          </button>
          <button
            type="button"
            className={`v3-lang-btn ${lang === 'fr' ? 'v3-lang-btn--active' : ''}`}
            onClick={() => setLang('fr')}
          >
            {s.settingsPage.french}
          </button>
        </div>
      </div>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">{s.settingsPage.displayName}</div>
        <div className="v3-card__body v3-settings-grid">
          <label className="v3-field">
            <span className="v3-field__label">{s.settingsPage.firstName}</span>
            <input readOnly value={first} />
          </label>
          <label className="v3-field">
            <span className="v3-field__label">{s.settingsPage.lastName}</span>
            <input readOnly value={last} />
          </label>
          <p className="v3-field-hint">{s.settingsPage.profileHint}</p>
        </div>
      </div>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">{s.settingsPage.emailHeader}</div>
        <div className="v3-card__body">
          <label className="v3-field">
            <span className="v3-field__label">{s.common.email}</span>
            <input readOnly value={user?.email ?? ''} />
          </label>
        </div>
      </div>
    </div>
  );
};
