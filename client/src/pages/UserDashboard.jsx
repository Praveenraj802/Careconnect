import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emergencyService, volunteerService } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  PlusCircle,
  Clock,
  MapPin,
  Phone,
  UserCheck,
  Star,
  ArrowRight,
  Activity,
  AlertTriangle,
  RefreshCw,
  Compass,
} from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeEmergency, setActiveEmergency] = useState(null);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Listen for socket update events
    const handleUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('careconnect:emergency_updated', handleUpdate);
    window.addEventListener('careconnect:emergency_assigned', handleUpdate);

    return () => {
      window.removeEventListener('careconnect:emergency_updated', handleUpdate);
      window.removeEventListener('careconnect:emergency_assigned', handleUpdate);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      // Fetch user emergencies
      const res = await emergencyService.getAll({ myRequests: true, limit: 10 });
      const list = res.data.emergencies || [];

      // Find active request (PENDING, ACCEPTED, ON_THE_WAY, IN_PROGRESS)
      const active = list.find((e) =>
        ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(e.status)
      );
      setActiveEmergency(active || null);
      setRecentEmergencies(list);

      // Fetch nearby helpers based on user location
      const coords = user?.location?.coordinates || [77.5946, 12.9716];
      const volRes = await volunteerService.getNearby({
        longitude: coords[0],
        latitude: coords[1],
        radius: 20,
      });
      setNearbyVolunteers(volRes.data.volunteers || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Quick SOS Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
            Citizen Emergency Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name || 'Citizen'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Connected to CareConnect real-time safety network. Need urgent assistance or first aid?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/emergency/create"
            className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 animate-pulse-fast"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>REQUEST EMERGENCY HELP</span>
          </Link>
        </div>
      </div>

      {/* Active Incident Alert Banner (If Any) */}
      {activeEmergency && (
        <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-3xl p-6 shadow-lg animate-pulse-short">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
                <AlertTriangle className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Active Emergency: {activeEmergency.category}
                  </h3>
                  <StatusBadge status={activeEmergency.status} />
                </div>
                <p className="text-sm text-slate-700 mt-1">
                  Location: {activeEmergency.location?.address || 'Your reported location'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reported at: {new Date(activeEmergency.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <Link
              to={`/emergency/track/${activeEmergency._id}`}
              className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <span>Track Live Status & Helper</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Nearby Responders & Emergency History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Nearby Responders Radar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nearby Available Responders</h3>
                  <p className="text-xs text-slate-500">Live community helpers within your area ready to dispatch</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {nearbyVolunteers.length} Active Now
              </span>
            </div>

            {nearbyVolunteers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No volunteers immediately within radius</p>
                <p className="text-xs text-slate-400 mt-1">
                  When you report an emergency, we automatically broadcast to all regional safety volunteers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {nearbyVolunteers.map((vol) => (
                  <div
                    key={vol._id}
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
                          {vol.userId?.name?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{vol.userId?.name || 'Volunteer'}</h4>
                          <span className="text-[11px] text-slate-500 block">
                            Vehicle: {vol.vehicleType}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-lg">
                        {vol.distanceFormatted}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {vol.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{vol.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                      <span>{vol.totalAssisted || 0} Cases Assisted</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Helpline Strip */}
          <div className="bg-red-50 rounded-3xl p-6 border border-red-200 space-y-3">
            <h4 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              <span>Instant Emergency Helplines</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href="tel:112"
                className="p-3 bg-white hover:bg-red-100 rounded-xl border border-red-200 text-center transition"
              >
                <span className="block text-xl font-black text-red-600">112</span>
                <span className="block text-[11px] font-bold text-slate-700">All Emergency</span>
              </a>
              <a
                href="tel:108"
                className="p-3 bg-white hover:bg-red-100 rounded-xl border border-red-200 text-center transition"
              >
                <span className="block text-xl font-black text-red-600">108</span>
                <span className="block text-[11px] font-bold text-slate-700">Ambulance</span>
              </a>
              <a
                href="tel:100"
                className="p-3 bg-white hover:bg-red-100 rounded-xl border border-red-200 text-center transition"
              >
                <span className="block text-xl font-black text-red-600">100</span>
                <span className="block text-[11px] font-bold text-slate-700">Police</span>
              </a>
              <a
                href="tel:101"
                className="p-3 bg-white hover:bg-red-100 rounded-xl border border-red-200 text-center transition"
              >
                <span className="block text-xl font-black text-red-600">101</span>
                <span className="block text-[11px] font-bold text-slate-700">Fire Hazard</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Requests History */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent Requests</h3>
              <Link to="/history" className="text-xs font-bold text-red-600 hover:underline">
                View All
              </Link>
            </div>

            {recentEmergencies.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No previous emergency requests found
              </div>
            ) : (
              <div className="space-y-3">
                {recentEmergencies.slice(0, 5).map((emerg) => (
                  <Link
                    key={emerg._id}
                    to={`/emergency/track/${emerg._id}`}
                    className="block p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition">
                        {emerg.category}
                      </span>
                      <StatusBadge status={emerg.status} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {emerg.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{new Date(emerg.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        Track Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
