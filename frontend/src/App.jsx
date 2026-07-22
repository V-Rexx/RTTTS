import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import PassengerMap from './pages/PassengerMap';
import Discover from './pages/Discover';
import Login from './pages/Login';
import DriverPage from './pages/DriverPage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminCities from './pages/admin/Cities';
import AdminRoutes from './pages/admin/Routes';
import AdminStops from './pages/admin/Stops';
import AdminBuses from './pages/admin/Buses';
import AdminDrivers from './pages/admin/Drivers';
import AdminFleetOverview from './pages/admin/FleetOverview';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/city/:slug" element={<PassengerMap />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="fleet" replace />} />
            <Route path="fleet" element={<AdminFleetOverview />} />
            <Route path="cities" element={<AdminCities />} />
            <Route path="routes" element={<AdminRoutes />} />
            <Route path="stops" element={<AdminStops />} />
            <Route path="buses" element={<AdminBuses />} />
            <Route path="drivers" element={<AdminDrivers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
