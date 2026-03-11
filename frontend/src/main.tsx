import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { AppLayout } from './ui/AppLayout';
import { RadiologistDashboard } from './ui/RadiologistDashboard';
import { ClericalIntake } from './ui/ClericalIntake';
import { AdminDashboard } from './ui/AdminDashboard';
import { PublicRequisitionForm } from './ui/PublicRequisitionForm';
import { RequisitionsAdmin } from './ui/RequisitionsAdmin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/external-requisition" element={<PublicRequisitionForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/radiologist" replace />} />
          <Route path="radiologist" element={<RadiologistDashboard />} />
          <Route path="clerical" element={<ClericalIntake />} />
          <Route path="requisitions" element={<RequisitionsAdmin />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
