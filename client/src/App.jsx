import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/shared/Spinner';

// Pages
import LandingPage from './pages/LandingPage';
import CityMapPage from './pages/CityMapPage';
import LoginPage from './pages/LoginPage';
import DriverPage from './pages/DriverPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CitiesPage from './pages/admin/CitiesPage';
import RoutesPage from './pages/admin/RoutesPage';
import StopsPage from './pages/admin/StopsPage';
import BusesPage from './pages/admin/BusesPage';
import DriversPage from './pages/admin/DriversPage';

// Premium Role-Guard Protected Route Wrapper
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Validating Security Token...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If driver attempts admin, or admin attempts driver, redirect safely
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Passenger Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/city/:slug" element={<CityMapPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Driver Console */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cities"
            element={
              <ProtectedRoute requiredRole="admin">
                <CitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <ProtectedRoute requiredRole="admin">
                <RoutesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stops"
            element={
              <ProtectedRoute requiredRole="admin">
                <StopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buses"
            element={
              <ProtectedRoute requiredRole="admin">
                <BusesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/drivers"
            element={
              <ProtectedRoute requiredRole="admin">
                <DriversPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all safety redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
