import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emergencyService } from '../services/api';
import EmergencyMap from '../components/EmergencyMap';
import {
  ShieldAlert,
  Activity,
  Car,
  Wrench,
  Flame,
  AlertTriangle,
  MapPin,
  Phone,
  Navigation,
  Users,
  Send,
} from 'lucide-react';

export const CreateEmergency = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Medical');
  const [urgencyLevel, setUrgencyLevel] = useState('High');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [landmark, setLandmark] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(1);

  // Default coordinates from user profile or center
  const initialLng = user?.location?.coordinates?.[0] || 77.5946;
  const initialLat = user?.location?.coordinates?.[1] || 12.9716;
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: 'Medical', title: 'Medical Distress', icon: Activity, color: 'border-red-500 bg-red-50 text-red-700' },
    { id: 'Road Accident', title: 'Road Accident', icon: Car, color: 'border-orange-500 bg-orange-50 text-orange-700' },
    { id: 'Vehicle Breakdown', title: 'Vehicle Breakdown', icon: Wrench, color: 'border-amber-500 bg-amber-50 text-amber-700' },
    { id: 'Fire Emergency', title: 'Fire & Hazards', icon: Flame, color: 'border-rose-600 bg-rose-50 text-rose-700' },
    { id: 'General Urgent', title: 'General SOS', icon: ShieldAlert, color: 'border-purple-500 bg-purple-50 text-purple-700' },
  ];

  const urgencyLevels = ['Critical', 'High', 'Medium', 'Low'];

  useEffect(() => {
    handleDetectGps();
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsSuccess(true);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleMapLocationSelect = (coords) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setGpsSuccess(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !contactPhone.trim()) {
      setError('Please provide a situation description and contact phone number.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        category,
        urgencyLevel,
        description,
        contactPhone,
        address: address || 'Pinned location on map',
        landmark,
        latitude,
        longitude,
        peopleAffected: Number(peopleAffected),
      };

      const res = await emergencyService.create(payload);
      if (res.data && res.data.emergency) {
        navigate(`/emergency/track/${res.data.emergency._id}`);
      }
    } catch (err) {
      console.error('Failed to create emergency:', err);
      setError(
        err.response?.data?.message || 'Failed to dispatch emergency request. Please try again or call 112.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-red-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-200">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Immediate Emergency Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Create Emergency Request</h1>
          <p className="text-sm text-red-100">
            CareConnect automatically identifies and alerts suitable responders in your radius.
          </p>
        </div>
        <div className="hidden sm:block p-3 bg-white/20 rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Emergency Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
            Step 1 of 4: Select Crisis Type
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2.5 ${
                    isSelected
                      ? `${cat.color} shadow-md scale-102`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-bold leading-tight">{cat.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Urgency & Situation Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
            Step 2 of 4: Situation & Severity
          </span>

          {/* Urgency Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Urgency Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {urgencyLevels.map((lvl) => {
                const isSelected = urgencyLevel === lvl;
                return (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setUrgencyLevel(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? lvl === 'Critical'
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : lvl === 'High'
                          ? 'bg-orange-500 text-white border-orange-500 shadow'
                          : lvl === 'Medium'
                          ? 'bg-amber-500 text-white border-amber-500 shadow'
                          : 'bg-slate-600 text-white border-slate-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Situation Description & Immediate Needs *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, any visible injuries, symptoms, hazards, or immediate equipment required..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                People Affected
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPeopleAffected(Math.max(1, peopleAffected - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-lg"
                >
                  -
                </button>
                <span className="font-bold text-base text-slate-900 w-8 text-center">
                  {peopleAffected}
                </span>
                <button
                  type="button"
                  onClick={() => setPeopleAffected(peopleAffected + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-lg"
                >
                  +
                </button>
                <span className="text-xs text-slate-500 ml-2">person(s) in need</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Location & Map Pin */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Step 3 of 4: Incident Location
              </span>
              <p className="text-sm font-bold text-slate-800">Pin precise location on map</p>
            </div>

            <button
              type="button"
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-2 self-start"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>{detectingGps ? 'Acquiring GPS...' : 'Detect Current GPS'}</span>
            </button>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <EmergencyMap
              center={[latitude, longitude]}
              zoom={14}
              emergencyLocation={{
                coordinates: [longitude, latitude],
                address: address || 'Emergency Incident Marker',
                category,
              }}
              onLocationSelect={handleMapLocationSelect}
              height="300px"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Address or Street Name
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100ft Road, Indiranagar"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Prominent Landmark / Floor / Room
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Metro Pillar 78, 2nd Floor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Submission */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Ready to Dispatch
            </span>
            <h3 className="text-xl font-bold">Broadcast Emergency Alert</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Nearby volunteers will be notified instantly via live socket alert and audible alarm.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-xl shadow-red-600/40 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Broadcasting...</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>DISPATCH REQUEST NOW</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEmergency;
