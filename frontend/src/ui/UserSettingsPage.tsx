import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppUi } from '../context/AppUiContext';
import { navT } from '../i18n/nav';

export const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { lang, setLang } = useAppUi();
  const t = navT(lang);

  const parts = (user?.name || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || '';

  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{t.settings}</h1>
      <p className="v3-page-lead">
        {lang === 'fr'
          ? 'Préférences d’affichage et informations de profil (aperçu).'
          : 'Display preferences and profile summary (preview).'}
      </p>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">{lang === 'fr' ? 'Langue préférée' : 'Preferred language'}</div>
        <div className="v3-card__body v3-lang-toggle">
          <button
            type="button"
            className={`v3-lang-btn ${lang === 'en' ? 'v3-lang-btn--active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
          <button
            type="button"
            className={`v3-lang-btn ${lang === 'fr' ? 'v3-lang-btn--active' : ''}`}
            onClick={() => setLang('fr')}
          >
            Français
          </button>
        </div>
      </div>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">{lang === 'fr' ? 'Nom affiché' : 'Display name'}</div>
        <div className="v3-card__body v3-settings-grid">
          <label className="v3-field">
            <span className="v3-field__label">{lang === 'fr' ? 'Prénom' : 'First name'}</span>
            <input readOnly value={first} />
          </label>
          <label className="v3-field">
            <span className="v3-field__label">{lang === 'fr' ? 'Nom' : 'Last name'}</span>
            <input readOnly value={last} />
          </label>
          <p className="v3-field-hint">
            {lang === 'fr'
              ? 'La modification du profil complet sera disponible dans une prochaine version.'
              : 'Full profile editing will be available in a future update.'}
          </p>
        </div>
      </div>

      <div className="v3-card v3-card--settings">
        <div className="v3-card__header">Email</div>
        <div className="v3-card__body">
          <label className="v3-field">
            <span className="v3-field__label">Email</span>
            <input readOnly value={user?.email ?? ''} />
          </label>
        </div>
      </div>
    </div>
  );
};
