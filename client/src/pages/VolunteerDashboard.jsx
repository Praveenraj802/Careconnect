import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { volunteerService, emergencyService } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Radio,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Car,
  Star,
  Activity,
  ArrowRight,
  RefreshCw,
  Navigation,
  AlertTriangle,
} from 'lucide-react';

export const VolunteerDashboard = () => {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [activeEmergency, setActiveEmergency] = useState(null);
  const [pendingEmergencies, setPendingEmergencies] = useState([]);
  const [historyCases, setHistoryCases] = useState([]);
  const [isAvailable, setIsAvailable] = useState(user?.volunteerProfile?.isAvailable ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchVolunteerData = async () => {
    try {
      setRefreshing(true);

      // 1. Get active assignment if any
      const activeRes = await volunteerService.getActiveEmergency();
      setActiveEmergency(activeRes.data.emergency || null);

      // 2. Get pending emergencies in volunteer's categories
      const pendingRes = await emergencyService.getAll({ status: 'PENDING', limit: 10 });
      setPendingEmergencies(pendingRes.data.emergencies || []);

      // 3. Get volunteer past assignments
      const historyRes = await emergencyService.getAll({ limit: 10 });
      const completed = (historyRes.data.emergencies || []).filter(
        (e) => e.status === 'COMPLETED'
      );
      setHistoryCases(completed);
    } catch (err) {
      console.error('Error loading volunteer dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVolunteerData();

    const handleUpdate = () => {
      fetchVolunteerData();
    };

    window.addEventListener('careconnect:emergency_updated', handleUpdate);
    window.addEventListener('careconnect:emergency_assigned', handleUpdate);

    return () => {
      window.removeEventListener('careconnect:emergency_updated', handleUpdate);
      window.removeEventListener('careconnect:emergency_assigned', handleUpdate);
    };
  }, []);

  const handleToggleAvailability = async () => {
    try {
      setUpdatingAvailability(true);
      const nextStatus = !isAvailable;
      const res = await volunteerService.updateAvailability({ isAvailable: nextStatus });
      setIsAvailable(nextStatus);
      if (user && user.volunteerProfile) {
        updateUser({
          ...user,
          volunteerProfile: {
            ...user.volunteerProfile,
            isAvailable: nextStatus,
          },
        });
      }
    } catch (err) {
      alert('Failed to update availability status.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleAcceptEmergency = async (emergId) => {
    try {
      setAcceptingId(emergId);
      const res = await volunteerService.acceptEmergency(emergId);
      if (res.data && res.data.emergency) {
        navigate(`/emergency/track/${emergId}`);
      }
    } catch (err) {
      alert(
        err.response?.data?.message || 'Emergency could not be claimed. It may have been taken by another volunteer.'
      );
      fetchVolunteerData();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleStatusProgression = async (newStatus) => {
    if (!activeEmergency) return;
    try {
      const res = await emergencyService.updateStatus(activeEmergency._id, { status: newStatus });
      setActiveEmergency(res.data.emergency);
      if (newStatus === 'COMPLETED') {
        fetchVolunteerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Availability Control */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            Emergency Volunteer Station
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            You are registered for: <strong className="text-white">{user?.volunteerProfile?.categories?.join(', ') || 'Emergency Response'}</strong>
          </p>
        </div>

        {/* Availability Toggle Box */}
        <div className="flex items-center gap-4 bg-white/10 p-3.5 rounded-2xl border border-white/15">
          <div className="text-right">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Dispatch Readiness:
            </span>
            <span className={`text-sm font-black ${isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAvailable ? 'AVAILABLE & ONLINE' : 'OFFLINE / BUSY'}
            </span>
          </div>

          <button
            onClick={handleToggleAvailability}
            disabled={updatingAvailability}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 focus:outline-none ${
              isAvailable ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Active Assignment Section (If Any) */}
      {activeEmergency && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-500 shadow-xl space-y-6 animate-pulse-short">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-red-600 text-white rounded-2xl shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase text-red-600 tracking-wider">
                  You Have An Active Case Assigned
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {activeEmergency.category} - {activeEmergency.location?.address}
                </h3>
              </div>
            </div>
            <StatusBadge status={activeEmergency.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Requester:</span>
              <p className="font-bold text-slate-900">{activeEmergency.userId?.name || 'Citizen'}</p>
              <a
                href={`tel:${activeEmergency.contactPhone}`}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{activeEmergency.contactPhone}</span>
              </a>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 md:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Situation Note:</span>
              <p className="text-slate-700 italic">"{activeEmergency.description}"</p>
              {activeEmergency.location?.landmark && (
                <span className="text-xs text-slate-500 block mt-1">
                  Landmark: {activeEmergency.location.landmark}
                </span>
              )}
            </div>
          </div>

          {/* Action Progression Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/emergency/track/${activeEmergency._id}`}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Live Navigation Map</span>
            </Link>

            {activeEmergency.status === 'ACCEPTED' && (
              <button
                onClick={() => handleStatusProgression('ON_THE_WAY')}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
              >
                <Car className="w-4 h-4" />
                <span>Mark as "On The Way"</span>
              </button>
            )}

            {activeEmergency.status === 'ON_THE_WAY' && (
              <button
                onClick={() => handleStatusProgression('IN_PROGRESS')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Mark "Arrived on Scene"</span>
              </button>
            )}

            {activeEmergency.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusProgression('COMPLETED')}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Emergency Completed</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Pending Emergency Queue & Volunteer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Pending Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nearby Unassigned Emergencies</h3>
                <p className="text-xs text-slate-500">Live requests matching your categories awaiting a responder</p>
              </div>
              <button
                onClick={fetchVolunteerData}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {pendingEmergencies.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">All clear! No pending crises nearby</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Keep your availability switch ON. When a crisis occurs, your device will sound an alarm.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingEmergencies.map((emerg) => (
                  <div
                    key={emerg._id}
                    className="p-5 bg-white hover:bg-red-50/20 rounded-2xl border border-slate-200 hover:border-red-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">{emerg.category}</h4>
                          <UrgencyBadge level={emerg.urgencyLevel} />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>{emerg.location?.address}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptEmergency(emerg._id)}
                        disabled={acceptingId === emerg._id || !isAvailable}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
                      >
                        {acceptingId === emerg._id ? 'Claiming...' : 'Accept & Dispatch'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{emerg.description}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Reported {new Date(emerg.createdAt).toLocaleTimeString()}</span>
                      <Link
                        to={`/emergency/track/${emerg._id}`}
                        className="font-bold text-slate-700 hover:underline flex items-center gap-1"
                      >
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Volunteer Statistics Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Responder Profile</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="block text-2xl font-black text-slate-900">
                  {user?.volunteerProfile?.totalAssisted || historyCases.length || 0}
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Cases Resolved</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="block text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-current" />
                  <span>{user?.volunteerProfile?.rating?.toFixed(1) || '5.0'}</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Helper Rating</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vehicle Type:</span>
                <span className="font-bold text-slate-800">{user?.volunteerProfile?.vehicleType || 'Two-Wheeler'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Coverage Radius:</span>
                <span className="font-bold text-slate-800">{user?.volunteerProfile?.serviceRadiusKm || 15} km</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Approved Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {user?.volunteerProfile?.categories?.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/profile"
              className="block w-full py-2.5 text-center border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Update Vehicle & Radius Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
