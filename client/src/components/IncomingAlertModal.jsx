import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { volunteerService } from '../services/api';
import { AlertTriangle, MapPin, Phone, Users, CheckCircle2, X } from 'lucide-react';
import { UrgencyBadge } from './StatusBadge';

export const IncomingAlertModal = () => {
  const { incomingAlert, dismissAlert } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!incomingAlert) return null;

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await volunteerService.acceptEmergency(incomingAlert.emergencyId);
      dismissAlert();
      if (res.data && res.data.emergency) {
        navigate(`/emergency/track/${incomingAlert.emergencyId}`);
      }
    } catch (err) {
      console.error('Accept failed:', err);
      setError(
        err.response?.data?.message ||
          'Failed to accept request. It may have been claimed by another volunteer or cancelled.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await volunteerService.rejectEmergency(incomingAlert.emergencyId);
    } catch (e) {
      // ignore
    }
    dismissAlert();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500 animate-bounce-short">
        {/* Urgent Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-full animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">🚨 Emergency Alert Nearby</h2>
              <p className="text-xs text-red-100 font-medium">Immediate Volunteer Response Requested</p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 hover:bg-white/20 rounded-lg transition"
            title="Dismiss alert"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Emergency Type</span>
              <h3 className="text-xl font-extrabold text-slate-800">{incomingAlert.category}</h3>
            </div>
            <UrgencyBadge level={incomingAlert.urgencyLevel} />
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Incident Location:</span>
                <span>{incomingAlert.location?.address || 'Near your service area'}</span>
                {incomingAlert.location?.landmark && (
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Landmark: {incomingAlert.location.landmark}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <Phone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Requester Contact:</span>
                <span className="font-mono">{incomingAlert.contactPhone || 'Available upon acceptance'}</span>
              </div>
            </div>

            {incomingAlert.peopleAffected > 1 && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <Users className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  <strong className="text-slate-900">{incomingAlert.peopleAffected}</strong> people reported affected
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Situation Description:</span>
            <p className="text-slate-700 italic">"{incomingAlert.description}"</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Accepting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Accept & Respond</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingAlertModal;
