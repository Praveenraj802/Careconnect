import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  UserPlus,
  Mail,
  Lock,
  Phone,
  MapPin,
  Car,
  HeartHandshake,
  AlertCircle,
  Navigation,
  Check,
} from 'lucide-react';

export const Register = () => {
  const [role, setRole] = useState('user'); // 'user' or 'volunteer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Volunteer specific state
  const [categories, setCategories] = useState(['Medical', 'General Urgent']);
  const [vehicleType, setVehicleType] = useState('Two-Wheeler');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const allCategories = [
    { id: 'Medical', label: 'Medical & First Aid' },
    { id: 'Road Accident', label: 'Road Accident Rescue' },
    { id: 'Vehicle Breakdown', label: 'Vehicle Breakdown' },
    { id: 'Fire Emergency', label: 'Fire Safety & Evacuation' },
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsDetected(true);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setDetectingGps(false);
        setError('Could not access current GPS location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'volunteer' && categories.length === 0) {
      setError('Please select at least one assistance category.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name,
        email,
        password,
        phone,
        address,
        latitude,
        longitude,
        role,
        ...(role === 'volunteer' && {
          categories,
          vehicleType,
          serviceRadiusKm: Number(serviceRadiusKm),
        }),
      };

      const newUser = await register(payload);
      if (newUser.role === 'volunteer') {
        navigate('/volunteer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. An account with this email may already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create CareConnect Account</h2>
          <p className="text-sm text-slate-600">
            Join the decentralized emergency safety network in your neighborhood.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              role === 'user'
                ? 'bg-white text-slate-900 shadow-md border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Citizen / User</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              role === 'volunteer'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Volunteer / Helper</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password (min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Neighborhood / Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Indiranagar, Bengaluru or street landmark"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* GPS Detection Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Default Location Coordinates</span>
                <span className="text-slate-500 font-mono">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}{' '}
                  {gpsDetected && <span className="text-emerald-600 font-bold ml-1">✓ Detected</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingGps}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>{detectingGps ? 'Detecting...' : 'Detect GPS'}</span>
              </button>
            </div>

            {/* Volunteer Specialized Configuration */}
            {role === 'volunteer' && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-red-600 block">
                  Volunteer Capabilities & Equipment
                </span>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Assistance Categories (Select all that apply) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allCategories.map((cat) => {
                      const isSelected = categories.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleCategoryToggle(cat.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-red-600" />}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
                    >
                      <option value="Two-Wheeler">Two-Wheeler (Bike / Scooter)</option>
                      <option value="Four-Wheeler">Four-Wheeler (Car / SUV)</option>
                      <option value="Ambulance / Emergency Vehicle">Ambulance / Emergency Vehicle</option>
                      <option value="None">None (On Foot / Local Walk)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Service Radius
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Register {role === 'volunteer' ? 'as Volunteer' : 'as Citizen'}</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="text-red-600 font-bold hover:underline">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
