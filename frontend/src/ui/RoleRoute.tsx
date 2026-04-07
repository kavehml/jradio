import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RoleRoute({
  roles,
  children,
}: {
  roles: readonly string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function RoleHomeRedirect() {
  const { user } = useAuth();
  const r = user?.role;
  if (r === 'admin') return <Navigate to="/admin" replace />;
  if (r === 'clerical') return <Navigate to="/clerical" replace />;
  if (r === 'radiologist') return <Navigate to="/radiologist/requisitions" replace />;
  if (r === 'physician') return <Navigate to="/physician/new" replace />;
  if (r === 'technologist') return <Navigate to="/technologist" replace />;
  return <Navigate to="/login" replace />;
}
