import React from 'react';
import { PhoneCall, ShieldAlert, Heart, LifeBuoy, AlertOctagon } from 'lucide-react';

export const Footer = () => {
  const hotlines = [
    { number: '112', title: 'National Emergency', desc: 'All-in-one emergency service' },
    { number: '108', title: 'Medical & Ambulance', desc: 'Disaster & emergency health' },
    { number: '100', title: 'Police Assistance', desc: 'Law enforcement & safety' },
    { number: '101', title: 'Fire & Rescue', desc: 'Fire hazards & structural rescue' },
    { number: '1091', title: 'Women Helpline', desc: 'Women safety & distress' },
  ];

  return (
    <footer className="bg-slate-900 text-white mt-auto border-t border-slate-800">
      {/* Emergency Hotlines Top Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 px-4 py-6 border-b border-red-500/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 text-center md:text-left">
              <span className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <PhoneCall className="w-6 h-6 text-white" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Direct National Emergency Helplines</h3>
                <p className="text-xs text-red-100 font-medium">In life-threatening situations, dial government emergency services immediately</p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Toll-Free 24/7 Access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {hotlines.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="bg-black/20 hover:bg-black/35 backdrop-blur-sm p-3 rounded-xl border border-white/10 transition transform hover:-translate-y-0.5 text-center group"
              >
                <span className="block text-2xl font-black tracking-wider text-amber-300 group-hover:text-white">
                  {item.number}
                </span>
                <span className="block text-xs font-bold text-white mt-0.5">{item.title}</span>
                <span className="block text-[10px] text-red-200 mt-0.5">{item.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-600 rounded-lg text-white">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-lg font-black tracking-tight">CareConnect</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              CareConnect is a community-driven emergency response platform that pairs citizens in distress with nearby certified helpers, medical first-responders, and roadside assistance volunteers.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Built to protect communities and save critical minutes when it matters most.</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/emergency/create" className="hover:text-red-400 font-semibold transition">Request Emergency Help</a></li>
              <li><a href="/register" className="hover:text-white transition">Volunteer Registration</a></li>
              <li><a href="/login" className="hover:text-white transition">Access Platform</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Emergency Categories</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>🏥 Medical & Trauma Distress</li>
              <li>🚗 Road Accidents & Collisions</li>
              <li>🔧 Vehicle Breakdown & Towing</li>
              <li>🔥 Fire & Structural Emergencies</li>
              <li>🚨 General Community SOS</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} CareConnect Emergency Network. All rights reserved.</p>
          <p className="text-center sm:text-right">Designed for rapid community crisis response and geospatial first-aid dispatch.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
