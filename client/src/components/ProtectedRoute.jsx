import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying CareConnect credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4">
          <span className="text-4xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-600 mt-2 max-w-md">
          Your current account role (<strong className="capitalize">{role}</strong>) does not have authorization to view this secure portal.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
