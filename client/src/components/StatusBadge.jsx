import React from 'react';

const statusConfig = {
  PENDING: {
    label: 'Awaiting Helper',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  ACCEPTED: {
    label: 'Volunteer Assigned',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  ON_THE_WAY: {
    label: 'Helper On The Way',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500 animate-ping-slow',
  },
  IN_PROGRESS: {
    label: 'Assistance In Progress',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-600 animate-pulse',
  },
  COMPLETED: {
    label: 'Resolved & Safe',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

const urgencyConfig = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-500 text-white',
  Low: 'bg-slate-500 text-white',
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const UrgencyBadge = ({ level }) => {
  const badgeClass = urgencyConfig[level] || urgencyConfig.High;
  return (
    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${badgeClass}`}>
      {level || 'High'}
    </span>
  );
};

export default StatusBadge;
