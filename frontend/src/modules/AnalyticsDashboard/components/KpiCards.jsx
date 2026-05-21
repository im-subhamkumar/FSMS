import React from 'react';
import { Users, UserCheck, Plane, Calendar, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const cards = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  { key: 'activeInstructors', label: 'Active Instructors', icon: UserCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'fleetAvailabilityPct', label: 'Fleet Available', icon: Plane, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', suffix: '%' },
  { key: 'todayFlights', label: "Today's Flights", icon: Calendar, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { key: 'revenueThisMonth', label: 'Revenue (Month)', icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', prefix: '₹' },
  { key: 'openSquawks', label: 'Open Alerts', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
];

export default function KpiCards({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  const getChange = (key) => {
    if (key === 'revenueThisMonth') return data?.revenueChange;
    if (key === 'todayFlights' || key === 'fleetAvailabilityPct') return data?.flightChange;
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(card => {
        const value = data?.[card.key] ?? '—';
        const change = getChange(card.key);
        const Icon = card.icon;
        return (
          <div key={card.key} className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <Icon size={80} />
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-2 rounded-xl" style={{ backgroundColor: card.bg }}>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white relative z-10">
              {card.prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}{card.suffix || ''}
            </p>
            {change !== null && change !== undefined && (
              <div className="flex items-center gap-1 mt-2 relative z-10">
                {change >= 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
                <span className={`text-xs font-bold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
