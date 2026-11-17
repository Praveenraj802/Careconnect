import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import EmergencyMap from '../components/EmergencyMap';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Car,
  HeartHandshake,
  Navigation,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUser, role } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Coordinates
  const initialLng = user?.location?.coordinates?.[0] || 77.5946;
  const initialLat = user?.location?.coordinates?.[1] || 12.9716;
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);

  // Volunteer Fields
  const [categories, setCategories] = useState(user?.volunteerProfile?.categories || ['Medical', 'General Urgent']);
  const [vehicleType, setVehicleType] = useState(user?.volunteerProfile?.vehicleType || 'Two-Wheeler');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(user?.volunteerProfile?.serviceRadiusKm || 15);
  const [isAvailable, setIsAvailable] = useState(user?.volunteerProfile?.isAvailable ?? true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  const allCategories = [
    { id: 'Medical', label: 'Medical & First Aid' },
    { id: 'Road Accident', label: 'Road Accident Rescue' },
    { id: 'Vehicle Breakdown', label: 'Vehicle Breakdown' },
    { id: 'Fire Emergency', label: 'Fire Safety & Hazards' },
    { id: 'General Urgent', label: 'General Crisis SOS' },
  ];

  const handleCategoryToggle = (catId) => {
    if (categories.includes(catId)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== catId));
      }
    } else {
      setCategories([...categories, catId]);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setDetectingGps(false);
      },
      (err) => {
        console.warn(err);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleMapLocationSelect = (coords) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        name,
        phone,
        address,
        latitude,
        longitude,
        ...(role === 'volunteer' && {
          categories,
          vehicleType,
          serviceRadiusKm: Number(serviceRadiusKm),
          isAvailable,
        }),
      };

      const res = await authService.updateProfile(payload);
      if (res.data && res.data.user) {
        updateUser(res.data.user);
        setSuccessMsg('Your profile and dispatch settings have been updated successfully.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white text-2xl font-black flex items-center justify-center uppercase shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
            <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700">
              Role: {role}
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Personal Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
            Personal & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Address / Base Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 100ft Road, Indiranagar, Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>
        </div>

        {/* Location & Map Pin */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Home Base / Dispatch Location
              </h3>
              <p className="text-xs text-slate-500">
                Used to compute nearest emergencies and dispatch distance.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>{detectingGps ? 'Detecting...' : 'Detect Current GPS'}</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <EmergencyMap
              center={[latitude, longitude]}
              zoom={14}
              emergencyLocation={{
                coordinates: [longitude, latitude],
                address: address || 'Your Base Location',
                category: 'Base Location',
              }}
              onLocationSelect={handleMapLocationSelect}
              height="280px"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono block">
            Pinned Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>

        {/* Volunteer Specific Section */}
        {role === 'volunteer' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              Volunteer Response Settings
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Assistance Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allCategories.map((cat) => {
                  const isChecked = categories.includes(cat.id);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isChecked && <span className="text-red-600 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dispatch Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value="Two-Wheeler">Two-Wheeler (Bike / Scooter)</option>
                  <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
                  <option value="Ambulance / Emergency Vehicle">Ambulance / Emergency Vehicle</option>
                  <option value="None">None (On Foot)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Max Service Radius
                  </label>
                  <span className="text-xs font-black text-red-600">{serviceRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={40}
                  step={1}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600 mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
