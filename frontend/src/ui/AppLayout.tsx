import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAppUi } from '../context/AppUiContext';
import { navT, type UiRole } from '../i18n/nav';

type NavItem = { to: string; labelKey: string };

function navForRole(
  role: string | undefined,
  t: ReturnType<typeof navT>
): { subtitleRole: string; items: NavItem[] } {
  if (role === 'admin') {
    return {
      subtitleRole: t.roles.admin,
      items: [
        { to: '/clerical', labelKey: 'clericalIntake' },
        { to: '/requisitions', labelKey: 'requisitions' },
        { to: '/assigning', labelKey: 'workloadSeparation' },
        { to: '/radiologist/requisitions', labelKey: 'radRequisitions' },
        { to: '/radiologist/weekly', labelKey: 'radWeekly' },
        { to: '/radiologist/calendar', labelKey: 'radCalendar' },
        { to: '/service-rules', labelKey: 'serviceRules' },
        { to: '/admin/radiologist-schedule', labelKey: 'radSchedule' },
        { to: '/admin/rvu-credits', labelKey: 'rvuCredits' },
        { to: '/admin', labelKey: 'userAccess' },
      ],
    };
  }
  if (role === 'clerical') {
    return {
      subtitleRole: t.roles.clerical,
      items: [
        { to: '/clerical', labelKey: 'clericalIntake' },
        { to: '/requisitions', labelKey: 'requisitions' },
        { to: '/assigning', labelKey: 'workloadSeparation' },
      ],
    };
  }
  if (role === 'radiologist') {
    return {
      subtitleRole: t.roles.radiologist,
      items: [
        { to: '/radiologist/requisitions', labelKey: 'radRequisitions' },
        { to: '/radiologist/weekly', labelKey: 'radWeekly' },
        { to: '/radiologist/calendar', labelKey: 'radCalendar' },
      ],
    };
  }
  if (role === 'physician') {
    return {
      subtitleRole: t.roles.physician,
      items: [
        { to: '/physician/new', labelKey: 'physNew' },
        { to: '/physician/history', labelKey: 'physHistory' },
        { to: '/physician/flagged', labelKey: 'physFlagged' },
      ],
    };
  }
  if (role === 'technologist') {
    return {
      subtitleRole: t.roles.technologist,
      items: [{ to: '/technologist', labelKey: 'techList' }],
    };
  }
  return { subtitleRole: '', items: [] };
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang, setLang } = useAppUi();
  const t = navT(lang);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const role = user?.role as UiRole | undefined;
  const { subtitleRole, items } = navForRole(user?.role, t);

  const path = location.pathname;
  const isActive = (item: NavItem) => {
    if (item.to === '/admin') return path === '/admin';
    if (path === item.to) return true;
    return path.startsWith(`${item.to}/`);
  };

  const settingsActive = path.startsWith('/settings');

  return (
    <div className="v3-shell">
      <aside className={`v3-sidebar${mobileOpen ? ' v3-sidebar--open' : ''}`}>
        <div className="v3-sidebar__head">
          <h1 className="v3-sidebar__menu-title">{t.menu}</h1>
          <p className="v3-sidebar__role">{subtitleRole}</p>
        </div>
        <nav className="v3-sidebar__nav">
          {items.map((item) => {
            const active = isActive(item);
            const label = t.nav[item.labelKey as keyof typeof t.nav] ?? item.labelKey;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`v3-sidebar__link${active ? ' v3-sidebar__link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <Link
            to="/settings"
            className={`v3-sidebar__link${settingsActive ? ' v3-sidebar__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
            style={{ marginTop: 8 }}
          >
            ⚙ {t.settings}
          </Link>
        </nav>
        <div className="v3-sidebar__foot">
          <button type="button" className="v3-sidebar__logout" onClick={handleLogout}>
            {t.logout}
          </button>
        </div>
      </aside>

      <div className="v3-main">
        <header className="v3-topbar">
          <div className="v3-topbar__left">
            <button
              type="button"
              className="v3-icon-btn v3-burger app-mobile-menu-btn"
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
          <div className="v3-topbar__right">
            {user?.role === 'radiologist' && (
              <span className="v3-rvu-pill" title="RVU (placeholder)">
                RVU · —
              </span>
            )}
            <div className="v3-profile">
              <div className="v3-profile__avatar">{initials(user?.name ?? '')}</div>
              <div className="v3-profile__text">
                <strong>{user?.name}</strong>
                <span>{subtitleRole}</span>
              </div>
            </div>
            <button
              type="button"
              className="v3-icon-btn"
              title={lang === 'fr' ? 'English' : 'Français'}
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            >
              <span className="v3-lang-icon">{lang === 'fr' ? '🇺🇸' : '🇫🇷'}</span>
            </button>
            <button type="button" className="v3-icon-btn" title={t.logout} onClick={handleLogout}>
              ⎋
            </button>
          </div>
        </header>
        <div className="v3-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
