import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { emergencyService } from '../services/api';
import EmergencyMap from '../components/EmergencyMap';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Phone,
  MapPin,
  Clock,
  User,
  Car,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react';

export const TrackEmergency = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinEmergency, leaveEmergency } = useSocket();
  const navigate = useNavigate();

  const [emergency, setEmergency] = useState(null);
  const [volunteerDistance, setVolunteerDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const steps = [
    { key: 'PENDING', label: 'Reported', desc: 'Awaiting Nearby Helper' },
    { key: 'ACCEPTED', label: 'Assigned', desc: 'Volunteer Accepted' },
    { key: 'ON_THE_WAY', label: 'En Route', desc: 'Helper Traveling to Site' },
    { key: 'IN_PROGRESS', label: 'On Scene', desc: 'Assistance In Progress' },
    { key: 'COMPLETED', label: 'Resolved', desc: 'Emergency Safe & Closed' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'ON_THE_WAY':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  const fetchEmergency = async () => {
    try {
      const res = await emergencyService.getById(id);
      setEmergency(res.data.emergency);
      setVolunteerDistance(res.data.volunteerDistance);
    } catch (err) {
      console.error('Fetch emergency error:', err);
      setError('Emergency record not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergency();
    joinEmergency(id);

    const handleEmergencyUpdated = (e) => {
      const updated = e.detail;
      if (updated && updated._id === id) {
        setEmergency(updated);
      }
    };

    window.addEventListener('careconnect:emergency_updated', handleEmergencyUpdated);
    window.addEventListener('careconnect:emergency_assigned', handleEmergencyUpdated);

    // Live volunteer location listener
    if (socket) {
      socket.on('volunteer_location_update', (data) => {
        setEmergency((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            assignedVolunteer: {
              ...(prev.assignedVolunteer || {}),
              currentLocation: {
                type: 'Point',
                coordinates: data.coordinates,
              },
            },
          };
        });
      });
    }

    return () => {
      leaveEmergency(id);
      window.removeEventListener('careconnect:emergency_updated', handleEmergencyUpdated);
      window.removeEventListener('careconnect:emergency_assigned', handleEmergencyUpdated);
      if (socket) {
        socket.off('volunteer_location_update');
      }
    };
  }, [id, socket]);

  const handleStatusUpdate = async (nextStatus, extraData = {}) => {
    try {
      setUpdatingStatus(true);
      const res = await emergencyService.updateStatus(id, {
        status: nextStatus,
        ...extraData,
      });
      setEmergency(res.data.emergency);
      setShowCompleteModal(false);
      setShowCancelModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update emergency status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Connecting to live tracking stream...</p>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-100 text-red-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Emergency Case Unavailable</h2>
        <p className="text-slate-600">{error || 'This incident record does not exist.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentStep = getStepIndex(emergency.status);
  const isRequester = emergency.userId?._id?.toString() === user?.id?.toString() || emergency.userId?.toString() === user?.id?.toString();
  const isAssignedVolunteer =
    emergency.assignedVolunteerUser?._id?.toString() === user?.id?.toString() ||
    emergency.assignedVolunteerUser?.toString() === user?.id?.toString();
  const isCancelled = emergency.status === 'CANCELLED';
  const isCompleted = emergency.status === 'COMPLETED';

  const helperCoords = emergency.assignedVolunteer?.currentLocation?.coordinates;
  const incidentCoords = emergency.location?.coordinates || [77.5946, 12.9716];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Incident Summary Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {emergency.category} Emergency
            </h1>
            <StatusBadge status={emergency.status} size="lg" />
            <UrgencyBadge level={emergency.urgencyLevel} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Reported: {new Date(emergency.createdAt).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              {emergency.location?.address}
            </span>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {isRequester && !isCompleted && !isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-xs transition"
            >
              Cancel Request
            </button>
          )}

          {/* Volunteer Status Progression Button */}
          {isAssignedVolunteer && !isCompleted && !isCancelled && (
            <>
              {emergency.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleStatusUpdate('ON_THE_WAY')}
                  disabled={updatingStatus}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Travel (On The Way)</span>
                </button>
              )}

              {emergency.status === 'ON_THE_WAY' && (
                <button
                  onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  disabled={updatingStatus}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Arrived at Scene (In Progress)</span>
                </button>
              )}

              {emergency.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  disabled={updatingStatus}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolve & Complete Emergency</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 5-Step Automated Progression Stepper */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-6">
          Automated Emergency Lifecycle
        </span>

        {isCancelled ? (
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-700 font-semibold text-sm flex items-center gap-2">
            <XCircle className="w-5 h-5 text-slate-500" />
            <span>This emergency was cancelled: {emergency.cancellationReason || 'No reason provided'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={st.key}
                  className={`p-4 rounded-2xl border transition relative ${
                    isCurrent
                      ? 'border-red-500 bg-red-50/50 shadow-md ring-2 ring-red-500/20'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        isCurrent
                          ? 'bg-red-600 text-white animate-pulse'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Step {idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{st.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{st.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map & Helper Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Live Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Live Incident & Responder Map</h3>
                <p className="text-xs text-slate-500">Real-time geospatial tracking via OpenStreetMap</p>
              </div>
              {emergency.assignedVolunteer && volunteerDistance && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-200">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ETA: ~{volunteerDistance.etaMinutes} min ({volunteerDistance.formatted})</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <EmergencyMap
                center={[incidentCoords[1], incidentCoords[0]]}
                zoom={14}
                emergencyLocation={{
                  coordinates: incidentCoords,
                  address: emergency.location?.address,
                  category: emergency.category,
                }}
                volunteerLocation={
                  helperCoords
                    ? {
                        coordinates: helperCoords,
                        name: emergency.assignedVolunteerUser?.name || 'Helper',
                        vehicleType: emergency.assignedVolunteer?.vehicleType,
                      }
                    : null
                }
                routeLine={!!helperCoords}
                height="420px"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Incident Situation:</span>
              <p className="italic">"{emergency.description}"</p>
              {emergency.location?.landmark && (
                <p className="text-slate-500">Landmark: {emergency.location.landmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Helper Details or Matching Radar */}
        <div className="space-y-6">
          {emergency.assignedVolunteerUser ? (
            /* Assigned Volunteer Card */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                Assigned First Responder
              </span>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {emergency.assignedVolunteerUser.name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {emergency.assignedVolunteerUser.name}
                  </h4>
                  <span className="text-xs font-semibold text-emerald-600 block">
                    Verified Emergency Volunteer
                  </span>
                  <span className="text-xs text-slate-400">
                    Vehicle: {emergency.assignedVolunteer?.vehicleType || 'Two-Wheeler'}
                  </span>
                </div>
              </div>

              {/* Call Responder Action Button */}
              <a
                href={`tel:${emergency.assignedVolunteer?.phone || emergency.assignedVolunteerUser.phone}`}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Responder: {emergency.assignedVolunteer?.phone || emergency.assignedVolunteerUser.phone}</span>
              </a>

              {/* Requester Info for Volunteer */}
              {isAssignedVolunteer && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Person in Need:
                  </span>
                  <p className="text-sm font-bold text-slate-800">{emergency.userId?.name || 'Citizen'}</p>
                  <a
                    href={`tel:${emergency.contactPhone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Requester: {emergency.contactPhone}</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Awaiting Volunteer Radar */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Searching for Responders</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Emergency broadcast has been dispatched to {emergency.notifiedVolunteers?.length || 'nearby'} volunteers in your area.
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-semibold">
                If in critical danger, also call 112 or 108 immediately.
              </div>
            </div>
          )}

          {/* Audit Timeline History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Incident Audit Timeline
            </h4>
            <div className="space-y-4 relative border-l-2 border-slate-200 pl-4 ml-2">
              {emergency.timeline?.map((item, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                  <span className="text-xs font-bold text-slate-800 block">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-slate-600">{item.note}</p>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Complete Emergency Assistance</h3>
            <p className="text-xs text-slate-500">
              Please enter brief notes about how the situation was resolved before closing this case.
            </p>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. First aid administered, vitals normal, patient handed over to hospital ambulance."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Back
              </button>
              <button
                onClick={() => handleStatusUpdate('COMPLETED', { resolutionNotes })}
                disabled={updatingStatus}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Cancel Emergency Request</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this emergency request?
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (e.g. Issue resolved on scene, false alarm)"
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Keep Active
              </button>
              <button
                onClick={() => handleStatusUpdate('CANCELLED', { cancellationReason: cancelReason })}
                disabled={updatingStatus}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700"
              >
                Cancel Emergency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackEmergency;
