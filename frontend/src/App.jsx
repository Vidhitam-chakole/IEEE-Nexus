import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import GuideDashboard from './pages/GuideDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import PanelDashboard from './pages/PanelDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div className="clay-card" style={{ padding: 32 }}>Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'coordinator') return <Navigate to="/portal/coordinator" replace />;
    if (user.role === 'guide') return <Navigate to="/portal/guide" replace />;
    if (user.role === 'panel') return <Navigate to="/portal/panel" replace />;
    return <Navigate to="/portal/student" replace />;
  }

  return children;
}

function PortalRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'coordinator') return <Navigate to="/portal/coordinator" replace />;
  if (user.role === 'guide') return <Navigate to="/portal/guide" replace />;
  if (user.role === 'panel') return <Navigate to="/portal/panel" replace />;
  return <Navigate to="/portal/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Portal Gateway */}
          <Route path="/portal" element={<PortalRedirect />} />

          {/* Role-Specific Protected Portals */}
          <Route
            path="/portal/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/guide/*"
            element={
              <ProtectedRoute allowedRoles={['guide']}>
                <GuideDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/coordinator/*"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/panel/*"
            element={
              <ProtectedRoute allowedRoles={['panel']}>
                <PanelDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
