import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import IncomingAlertModal from './components/IncomingAlertModal';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import CreateEmergency from './pages/CreateEmergency';
import TrackEmergency from './pages/TrackEmergency';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import EmergencyHistory from './pages/EmergencyHistory';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          {/* Main Navigation */}
          <Navbar />

          {/* Volunteer Real-time Emergency Pop-up Modal */}
          <IncomingAlertModal />

          {/* Page Routing */}
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Citizen Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Emergency Creation */}
              <Route
                path="/emergency/create"
                element={
                  <ProtectedRoute allowedRoles={['user', 'volunteer', 'admin']}>
                    <CreateEmergency />
                  </ProtectedRoute>
                }
              />

              {/* Live Tracking Room */}
              <Route
                path="/emergency/track/:id"
                element={
                  <ProtectedRoute allowedRoles={['user', 'volunteer', 'admin']}>
                    <TrackEmergency />
                  </ProtectedRoute>
                }
              />

              {/* Volunteer Station */}
              <Route
                path="/volunteer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Administrator Control Center */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Profile & Dispatch Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['user', 'volunteer', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Audit History Logs */}
              <Route
                path="/history"
                element={
                  <ProtectedRoute allowedRoles={['user', 'volunteer', 'admin']}>
                    <EmergencyHistory />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Emergency Hotlines & Footer */}
          <Footer />
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
