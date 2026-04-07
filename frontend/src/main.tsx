import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { AppUiProvider } from './context/AppUiContext';
import { AppLayout } from './ui/AppLayout';
import { RadiologistDashboard } from './ui/RadiologistDashboard';
import { ClericalIntake } from './ui/ClericalIntake';
import { AdminDashboard } from './ui/AdminDashboard';
import { PublicRequisitionForm } from './ui/PublicRequisitionForm';
import { RequisitionsAdmin } from './ui/RequisitionsAdmin';
import { SpecialtyRulesAdmin } from './ui/SpecialtyRulesAdmin';
import { AssigningTab } from './ui/AssigningTab';
import { UserSettingsPage } from './ui/UserSettingsPage';
import {
  PhysicianNewRequisition,
  PhysicianHistory,
  PhysicianFlagged,
  SignUpPage,
} from './ui/PhysicianPages';
import { RoleHomeRedirect, RoleRoute } from './ui/RoleRoute';
import './styles.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const Root = () => (
  <BrowserRouter>
    <AppUiProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/external-requisition" element={<PublicRequisitionForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleHomeRedirect />} />
            <Route path="settings" element={<UserSettingsPage />} />

            <Route
              path="clerical"
              element={
                <RoleRoute roles={['admin', 'clerical']}>
                  <ClericalIntake />
                </RoleRoute>
              }
            />
            <Route
              path="requisitions"
              element={
                <RoleRoute roles={['admin', 'clerical']}>
                  <RequisitionsAdmin variant="full" />
                </RoleRoute>
              }
            />
            <Route
              path="assigning"
              element={
                <RoleRoute roles={['admin', 'clerical']}>
                  <AssigningTab />
                </RoleRoute>
              }
            />
            <Route
              path="service-rules"
              element={
                <RoleRoute roles={['admin']}>
                  <SpecialtyRulesAdmin />
                </RoleRoute>
              }
            />
            <Route
              path="admin"
              element={
                <RoleRoute roles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="admin/radiologist-schedule"
              element={
                <RoleRoute roles={['admin']}>
                  <RadiologistDashboard initialViewMode="week" />
                </RoleRoute>
              }
            />

            <Route path="radiologist" element={<Navigate to="/radiologist/requisitions" replace />} />
            <Route
              path="radiologist/requisitions"
              element={
                <RoleRoute roles={['admin', 'radiologist']}>
                  <RequisitionsAdmin variant="radiologist" />
                </RoleRoute>
              }
            />
            <Route
              path="radiologist/weekly"
              element={
                <RoleRoute roles={['admin', 'radiologist']}>
                  <RadiologistDashboard initialViewMode="week" />
                </RoleRoute>
              }
            />
            <Route
              path="radiologist/calendar"
              element={
                <RoleRoute roles={['admin', 'radiologist']}>
                  <RadiologistDashboard initialViewMode="month" />
                </RoleRoute>
              }
            />

            <Route
              path="physician/new"
              element={
                <RoleRoute roles={['physician']}>
                  <PhysicianNewRequisition />
                </RoleRoute>
              }
            />
            <Route
              path="physician/history"
              element={
                <RoleRoute roles={['physician']}>
                  <PhysicianHistory />
                </RoleRoute>
              }
            />
            <Route
              path="physician/flagged"
              element={
                <RoleRoute roles={['physician']}>
                  <PhysicianFlagged />
                </RoleRoute>
              }
            />

            <Route
              path="technologist"
              element={
                <RoleRoute roles={['technologist']}>
                  <RequisitionsAdmin variant="technologist" />
                </RoleRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </AppUiProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
