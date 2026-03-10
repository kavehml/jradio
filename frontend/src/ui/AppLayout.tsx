import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Radiology RVU Workload App</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/radiologist" style={{ textDecoration: location.pathname.includes('radiologist') ? 'underline' : 'none' }}>Radiologist portal</Link>
          <Link to="/clerical" style={{ textDecoration: location.pathname.includes('clerical') ? 'underline' : 'none' }}>Clerical intake</Link>
          <Link to="/admin" style={{ textDecoration: location.pathname.includes('admin') ? 'underline' : 'none' }}>Admin portal</Link>
        </nav>
      </header>
      <main style={{ padding: '1.5rem 2rem', flex: 1, background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
};
