import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const role = user?.role;
  const canSeeAdmin = role === 'admin';
  const canSeeClerical = role === 'admin' || role === 'clerical';
  const canSeeRequisitions = role === 'admin' || role === 'clerical';
  const canSeeAssigning = role === 'admin';
  const canSeeServiceRules = role === 'admin';
  const canSeeRadiologist = true;

  const navLinks = [
    canSeeRadiologist ? { to: '/radiologist', label: 'Radiologist calendar', key: 'radiologist' } : null,
    canSeeClerical ? { to: '/clerical', label: 'Clerical intake', key: 'clerical' } : null,
    canSeeRequisitions ? { to: '/requisitions', label: 'Requisitions', key: 'requisitions' } : null,
    canSeeAssigning ? { to: '/assigning', label: 'Assigning', key: 'assigning' } : null,
    canSeeServiceRules ? { to: '/service-rules', label: 'Service rules', key: 'service-rules' } : null,
    canSeeAdmin ? { to: '/admin', label: 'Setting', key: 'admin' } : null,
  ].filter((x): x is { to: string; label: string; key: string } => Boolean(x));

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <aside
        style={{
          width: 260,
          background: '#fff',
          borderRight: '1px solid #e2e8f0',
          padding: '1rem',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
        className={`app-sidebar${mobileOpen ? ' open' : ''}`}
      >
        <h1 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Radiology RVU</h1>
        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {user?.name}
        </div>
        <nav style={{ display: 'grid', gap: 6 }}>
          {navLinks.map((item) => {
            const active = location.pathname.includes(item.key);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  textDecoration: 'none',
                  padding: '0.62rem 0.72rem',
                  borderRadius: 10,
                  background: active ? 'rgba(91,99,246,0.12)' : 'transparent',
                  color: active ? '#353fd5' : '#334155',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          style={{ marginTop: '1rem', width: '100%', background: '#111827' }}
        >
          Logout
        </button>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <header
          style={{
            padding: '0.9rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <strong style={{ fontSize: '1rem' }}>Radiology RVU Workload App</strong>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="app-mobile-menu-btn"
            style={{ display: 'none' }}
          >
            Menu
          </button>
        </header>
        <main style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
