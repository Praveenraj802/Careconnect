import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emergencyService } from '../services/api';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Clock,
  MapPin,
  Phone,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  RefreshCw,
  X,
} from 'lucide-react';

export const EmergencyHistory = () => {
  const { user, role } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchHistory = async () => {
    try {
      setRefreshing(true);
      const res = await emergencyService.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        limit: 50,
      });
      setEmergencies(res.data.emergencies || []);
    } catch (err) {
      console.error('Failed to fetch emergency history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, categoryFilter]);

  const filteredEmergencies = emergencies.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.category?.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term) ||
      e.location?.address?.toLowerCase().includes(term) ||
      e.contactPhone?.includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Audit Trail & Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Emergency Incidents History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive archive of all reported crises, responder dispatches, and resolution notes.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={refreshing}
          className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition text-slate-700 self-end sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, location, phone..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Awaiting Helper)</option>
              <option value="ACCEPTED">Assigned</option>
              <option value="ON_THE_WAY">Helper On The Way</option>
              <option value="IN_PROGRESS">Assistance In Progress</option>
              <option value="COMPLETED">Completed & Safe</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">All Crisis Categories</option>
              <option value="Medical">Medical Distress</option>
              <option value="Road Accident">Road Accident</option>
              <option value="Vehicle Breakdown">Vehicle Breakdown</option>
              <option value="Fire Emergency">Fire Emergency</option>
              <option value="General Urgent">General SOS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergencies Grid / List */}
      <div className="space-y-4">
        {filteredEmergencies.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No emergency records found</h3>
            <p className="text-xs text-slate-500">
              Try resetting the search terms or filters above.
            </p>
          </div>
        ) : (
          filteredEmergencies.map((emerg) => (
            <div
              key={emerg._id}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition">
                    {emerg.category}
                  </h3>
                  <StatusBadge status={emerg.status} />
                  <UrgencyBadge level={emerg.urgencyLevel} />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {new Date(emerg.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                  <p className="text-slate-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{emerg.location?.address}</span>
                  </p>
                  {emerg.location?.landmark && (
                    <span className="text-slate-400 block">Landmark: {emerg.location.landmark}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Assigned Responder</span>
                  {emerg.assignedVolunteerUser ? (
                    <div className="text-slate-700">
                      <p className="font-bold text-emerald-700">{emerg.assignedVolunteerUser.name}</p>
                      <p className="text-slate-500">{emerg.assignedVolunteerUser.phone}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">None assigned / Broadcast unaccepted</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Requester Contact</span>
                  <p className="text-slate-700 font-bold">{emerg.userId?.name || 'Citizen'}</p>
                  <p className="text-slate-500 font-mono">{emerg.contactPhone}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{emerg.description}"
              </p>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setSelectedCase(emerg)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Case Audit</span>
                </button>

                <Link
                  to={`/emergency/track/${emerg._id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
                >
                  <span>Open Tracking Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Case Details Audit Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-slate-900">
                  Case Audit: {selectedCase.category}
                </h3>
                <StatusBadge status={selectedCase.status} />
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resolution or Cancellation summary */}
            {selectedCase.resolutionNotes && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-xs font-bold uppercase text-emerald-800 block flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Outcome:
                </span>
                <p className="text-xs text-emerald-900 font-medium">{selectedCase.resolutionNotes}</p>
              </div>
            )}

            {selectedCase.cancellationReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1">
                <span className="text-xs font-bold uppercase text-red-800 block flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Cancellation Reason:
                </span>
                <p className="text-xs text-red-900 font-medium">{selectedCase.cancellationReason}</p>
              </div>
            )}

            {/* Timeline Audit Logs */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Official Incident Timeline
              </span>
              <div className="border-l-2 border-slate-200 pl-4 ml-2 space-y-4">
                {selectedCase.timeline?.map((item, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-slate-600">{item.note}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyHistory;
