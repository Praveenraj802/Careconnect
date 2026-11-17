import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  HeartHandshake,
  MapPin,
  Clock,
  Radio,
  ArrowRight,
  PhoneCall,
  Flame,
  Wrench,
  Car,
  Activity,
  CheckCircle,
  Users,
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, role } = useAuth();

  const categories = [
    {
      title: 'Medical Distress',
      icon: Activity,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      desc: 'Cardiac events, acute asthma, trauma injuries, elderly medical distress, and first-aid response.',
    },
    {
      title: 'Road Accidents',
      icon: Car,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      desc: 'Vehicle collisions, pedestrian impacts, highway crashes, and rapid scene assistance.',
    },
    {
      title: 'Vehicle Breakdowns',
      icon: Wrench,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      desc: 'Stranded vehicles, flat tires, dead batteries, towing needs, and night roadside safety.',
    },
    {
      title: 'Fire Emergencies',
      icon: Flame,
      color: 'bg-rose-600',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      desc: 'Building fires, electrical short circuits, smoke hazards, and immediate community evacuation.',
    },
    {
      title: 'General SOS',
      icon: ShieldAlert,
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      desc: 'Personal safety distress, lost vulnerable individuals, flash floods, and urgent community crises.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Report Crisis in Seconds',
      desc: 'Select the emergency type, verify GPS coordinates, and describe the distress. Zero tedious forms.',
    },
    {
      step: '02',
      title: 'Automated Geospatial Dispatch',
      desc: 'CareConnect matches certified volunteers and first responders within your immediate geographical radius.',
    },
    {
      step: '03',
      title: 'Immediate Claim & Response',
      desc: 'First available volunteer claims the case. You receive instant notifications with their name, phone, and ETA.',
    },
    {
      step: '04',
      title: 'Live Tracking to Resolution',
      desc: 'Track the responder on an interactive map until on-site assistance is delivered and safety is restored.',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/80 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-extrabold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              24/7 Community Emergency Assistance Grid
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Urgent Help in Minutes, Powered by Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-700">
                Community
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium">
              CareConnect instantly pairs people encountering medical emergencies, road accidents, vehicle breakdowns, or fire crises with verified nearby volunteers and professionals.
            </p>

            {/* Main Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/emergency/create"
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-black rounded-2xl shadow-xl shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 animate-pulse-fast"
              >
                <ShieldAlert className="w-6 h-6" />
                <span>REQUEST EMERGENCY HELP</span>
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <HeartHandshake className="w-5 h-5 text-red-400" />
                  <span>Join as Volunteer</span>
                </Link>
              ) : role === 'volunteer' ? (
                <Link
                  to="/volunteer/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Go to Helper Control</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="block text-3xl font-black text-slate-900">&lt; 8 min</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Response Time</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="block text-3xl font-black text-emerald-600">100%</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Free & Community-Run</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="block text-3xl font-black text-blue-600">Geo-Near</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Automated Dispatch</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="block text-3xl font-black text-red-600">24 / 7</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Socket Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Rapid Assistance Categories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Emergency Coverage
          </h2>
          <p className="text-slate-600 font-medium">
            Dedicated volunteers trained and equipped for specialized distress situations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-red-400 hover:shadow-xl transition group duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition mb-2">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/emergency/create"
                    className="text-xs font-bold text-red-600 group-hover:underline flex items-center gap-1"
                  >
                    <span>Request this category</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Become a Volunteer Tile */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center mb-5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">Are you a doctor, mechanic, or volunteer?</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Join our network of community heroes. Select the categories you can assist with, set your availability, and save lives nearby.
              </p>
            </div>
            <Link
              to="/register"
              className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-sm transition shadow-lg shadow-red-600/30"
            >
              Register as Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Workflow Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Automated Response Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How CareConnect Works in a Crisis
            </h2>
            <p className="text-slate-400 font-medium">
              Engineered to minimize delay and dispatch the closest assistance automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((st) => (
              <div key={st.step} className="relative z-10 space-y-3 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
                <span className="text-3xl font-black text-red-500 font-mono block">
                  {st.step}
                </span>
                <h4 className="text-lg font-bold text-white">{st.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Immediate Assistance
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              Facing an emergency right now?
            </h3>
            <p className="text-red-100 text-base">
              Do not wait. Broadcast your location and situation to all certified responders in your area right now.
            </p>
          </div>
          <Link
            to="/emergency/create"
            className="shrink-0 px-8 py-5 bg-white text-red-600 hover:bg-red-50 text-lg font-black rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95"
          >
            🚨 CREATE EMERGENCY REQUEST
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
