import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Users,
  HeartHandshake,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Power,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('emergencies'); // 'emergencies' or 'users'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchUser, setSearchUser] = useState('');

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, emergRes, usersRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getEmergencies({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          limit: 30,
        }),
        adminService.getUsers({
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          search: searchUser || undefined,
          limit: 50,
        }),
      ]);

      setStats(dashRes.data.stats);
      setEmergencies(emergRes.data.emergencies || []);
      setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter, categoryFilter, roleFilter, searchUser]);

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      await adminService.updateUserStatus(userId, { isActive: !currentActive });
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !currentActive } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Shield className="w-4 h-4" />
            <span>Master Administration Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">CareConnect Analytics & Control</h1>
          <p className="text-sm text-slate-300">
            Real-time emergency monitoring, volunteer fleet oversight, and user directory.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={refreshing}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Live Feeds</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-slate-900">{stats.totalUsers}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Citizens</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-purple-600">{stats.totalVolunteers}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Volunteers</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-emerald-600">{stats.availableVolunteersCount}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Available Fleet</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-amber-500">{stats.pendingEmergencies}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Awaiting Dispatches</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-blue-600">{stats.activeEmergencies}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">In-Progress Cases</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-emerald-700">{stats.completedEmergencies}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Resolved Cases</span>
          </div>
        </div>
      )}

      {/* Tab Switcher & Filters */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('emergencies')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'emergencies'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Emergency Logs ({emergencies.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Registered Users & Responders ({usersList.length})
            </button>
          </div>

          {/* Contextual Filters */}
          {activeTab === 'emergencies' ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Assigned</option>
                <option value="ON_THE_WAY">On The Way</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="Medical">Medical</option>
                <option value="Road Accident">Road Accident</option>
                <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                <option value="Fire Emergency">Fire Emergency</option>
                <option value="General Urgent">General SOS</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search user..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="user">Citizens</option>
                <option value="volunteer">Volunteers</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Emergency Operations Table */}
        {activeTab === 'emergencies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold">Category & Urgency</th>
                  <th className="p-3.5 font-bold">Requester</th>
                  <th className="p-3.5 font-bold">Assigned Responder</th>
                  <th className="p-3.5 font-bold">Location</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Reported Time</th>
                  <th className="p-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {emergencies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No emergencies matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  emergencies.map((emerg) => (
                    <tr key={emerg._id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{emerg.category}</span>
                          <UrgencyBadge level={emerg.urgencyLevel} />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold block text-slate-900">{emerg.userId?.name || 'Citizen'}</span>
                        <span className="text-slate-400">{emerg.contactPhone}</span>
                      </td>
                      <td className="p-3.5">
                        {emerg.assignedVolunteerUser ? (
                          <div>
                            <span className="font-bold text-emerald-700 block">
                              {emerg.assignedVolunteerUser.name}
                            </span>
                            <span className="text-slate-400">{emerg.assignedVolunteerUser.phone}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600">
                        {emerg.location?.address}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={emerg.status} />
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(emerg.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/emergency/track/${emerg._id}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Track</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Users & Responders Management Table */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-bold">User Identity</th>
                  <th className="p-3.5 font-bold">Role</th>
                  <th className="p-3.5 font-bold">Phone Number</th>
                  <th className="p-3.5 font-bold">Volunteer Details</th>
                  <th className="p-3.5 font-bold">Registered</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center uppercase">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'volunteer'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{u.phone}</td>
                      <td className="p-3.5">
                        {u.volunteerProfile ? (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {u.volunteerProfile.categories?.join(', ')}
                            </span>
                            <span className="text-slate-400">
                              Vehicle: {u.volunteerProfile.vehicleType} | {u.volunteerProfile.totalAssisted || 0} Assisted
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            u.isActive ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            u.isActive
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
