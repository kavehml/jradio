import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const role = user?.role;
  const canSeeAdmin = role === 'admin';
  const canSeeClerical = role === 'admin' || role === 'clerical';
  const canSeeRequisitions = role === 'admin' || role === 'clerical';
  const canSeeServiceRules = role === 'admin';
  const canSeeRadiologist = true;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Radiology RVU Workload App</h1>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {canSeeRadiologist && (
            <Link to="/radiologist" style={{ textDecoration: location.pathname.includes('radiologist') ? 'underline' : 'none' }}>Radiologist portal</Link>
          )}
          {canSeeClerical && (
            <Link to="/clerical" style={{ textDecoration: location.pathname.includes('clerical') ? 'underline' : 'none' }}>Clerical intake</Link>
          )}
          {canSeeRequisitions && (
            <Link to="/requisitions" style={{ textDecoration: location.pathname.includes('requisitions') ? 'underline' : 'none' }}>Requisitions</Link>
          )}
          {canSeeServiceRules && (
            <Link to="/service-rules" style={{ textDecoration: location.pathname.includes('service-rules') ? 'underline' : 'none' }}>Service rules</Link>
          )}
          {canSeeAdmin && (
            <Link to="/admin" style={{ textDecoration: location.pathname.includes('admin') ? 'underline' : 'none' }}>Admin portal</Link>
          )}
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{user?.name}</span>
          <button type="button" onClick={handleLogout} style={{ padding: '0.35rem 0.75rem', cursor: 'pointer' }}>Logout</button>
        </nav>
      </header>
      <main style={{ padding: '1.5rem 2rem', flex: 1, background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
};
