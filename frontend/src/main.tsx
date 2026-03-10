import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';
import { RadiologistDashboard } from './ui/RadiologistDashboard';
import { ClericalIntake } from './ui/ClericalIntake';
import { AdminDashboard } from './ui/AdminDashboard';

const Root = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/radiologist" replace />} />
        <Route path="radiologist" element={<RadiologistDashboard />} />
        <Route path="clerical" element={<ClericalIntake />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
