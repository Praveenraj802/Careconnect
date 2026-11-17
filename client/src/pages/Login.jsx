import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Lock, Mail, AlertCircle, ArrowRight, UserCheck, Stethoscope, Shield, Wrench } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password);

      // Route based on role
      const destination =
        location.state?.from?.pathname ||
        (loggedUser.role === 'admin'
          ? '/admin/dashboard'
          : loggedUser.role === 'volunteer'
          ? '/volunteer/dashboard'
          : '/dashboard');

      navigate(destination);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(demoEmail, demoPassword);
      const destination =
        loggedUser.role === 'admin'
          ? '/admin/dashboard'
          : loggedUser.role === 'volunteer'
          ? '/volunteer/dashboard'
          : '/dashboard';
      navigate(destination);
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access CareConnect</h2>
          <p className="text-sm text-slate-600">
            Sign in to manage emergency alerts, respond as a volunteer, or oversee network operations.
          </p>
        </div>

        {/* Demo Fast-Login Strip */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            ⚡ Instant 1-Click Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('user@careconnect.org', 'user123')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Normal Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('sarah.medical@careconnect.org', 'volunteer123')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <Stethoscope className="w-3.5 h-3.5 text-red-600" />
              <span>Volunteer (Doctor)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('rohit.rescue@careconnect.org', 'volunteer123')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>Volunteer (Rescue)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@careconnect.org', 'admin123')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>System Admin</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-red-600 font-bold hover:underline">
                Register as a User or Volunteer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
