import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, volunteerService } from '../services/api';
import {
  ShieldAlert,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Radio,
  PlusCircle,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, role, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(user?.volunteerProfile?.isAvailable ?? true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const notifRef = useRef(null);

  // Sync isAvailable with user profile
  useEffect(() => {
    if (user?.volunteerProfile?.isAvailable !== undefined) {
      setIsAvailable(user.volunteerProfile.isAvailable);
    }
  }, [user]);

  // Fetch notifications if logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Polling fallback
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const newStatus = !isAvailable;
      const res = await volunteerService.updateAvailability({ isAvailable: newStatus });
      setIsAvailable(newStatus);
      if (user && user.volunteerProfile) {
        updateUser({
          ...user,
          volunteerProfile: {
            ...user.volunteerProfile,
            isAvailable: newStatus,
          },
        });
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="p-2 bg-red-600 group-hover:bg-red-700 text-white rounded-xl shadow-md transition transform group-hover:scale-105">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-red-600 transition">
                  Care<span className="text-red-600">Connect</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  Emergency Network
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && role === 'user' && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/dashboard') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/history') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My History
                </Link>
              </>
            )}

            {isAuthenticated && role === 'volunteer' && (
              <>
                <Link
                  to="/volunteer/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/volunteer/dashboard') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Helper Dashboard
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/history') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Cases History
                </Link>
              </>
            )}

            {isAuthenticated && role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/admin/dashboard') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin Center
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive('/history') ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All Logs
                </Link>
              </>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Volunteer Availability Toggle Pill */}
            {isAuthenticated && role === 'volunteer' && (
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle your availability to receive nearby emergencies"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{isAvailable ? 'Ready for Calls' : 'Offline'}</span>
              </button>
            )}

            {/* Quick Emergency Request Button */}
            {role !== 'volunteer' && (
              <Link
                to="/emergency/create"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/25 transition transform active:scale-95 animate-pulse-fast"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request Help</span>
              </Link>
            )}

            {/* Notification Bell Dropdown */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3.5 text-xs transition hover:bg-slate-50 cursor-pointer ${
                              !notif.isRead ? 'bg-red-50/40' : ''
                            }`}
                            onClick={() => {
                              if (notif.emergencyId) {
                                navigate(`/emergency/track/${notif.emergencyId}`);
                                setNotificationsOpen(false);
                              }
                            }}
                          >
                            <p className="font-bold text-slate-800 mb-0.5">{notif.title}</p>
                            <p className="text-slate-600">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <span className="font-bold text-slate-800 block truncate max-w-[100px]">{user?.name}</span>
                    <span className="text-slate-400 capitalize">{role}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition"
                >
                  Join as Volunteer
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {role !== 'volunteer' && (
              <Link
                to="/emergency/create"
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow"
              >
                SOS
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800"
          >
            Home
          </Link>

          {isAuthenticated ? (
            <>
              {role === 'user' && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-semibold text-slate-800"
                  >
                    User Dashboard
                  </Link>
                  <Link
                    to="/emergency/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-semibold text-red-600 font-bold"
                  >
                    Request Emergency Help
                  </Link>
                </>
              )}

              {role === 'volunteer' && (
                <Link
                  to="/volunteer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-semibold text-slate-800"
                >
                  Volunteer Control Center
                </Link>
              )}

              {role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-semibold text-slate-800"
                >
                  Admin Analytics
                </Link>
              )}

              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-slate-800"
              >
                Emergency History
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-slate-800"
              >
                Profile Settings
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-base font-bold text-red-600"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center font-bold text-slate-800 border border-slate-300 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center font-bold text-white bg-red-600 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
