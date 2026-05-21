import React from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function FlightCharts({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[280px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const trend = data?.dailyTrend || [];
  const status = data?.statusCounts || {};

  const statusData = [
    { name: 'Scheduled', value: status.scheduled || 0, fill: '#6366f1' },
    { name: 'Completed', value: status.completed || 0, fill: '#10b981' },
    { name: 'Cancelled', value: status.cancelled || 0, fill: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Flight Hours Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Flight Activity Trend</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Daily flight hours logged</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="flightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="url(#flightGrad)" strokeWidth={2.5} name="Hours" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Slot Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Slot Utilization</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Scheduled vs Completed vs Cancelled</p>

        {/* Summary pills */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {statusData.map(s => (
            <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{s.name}</span>
              <span className="text-xs font-extrabold text-gray-900 dark:text-white">{s.value}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="scheduled" stackId="a" fill="#6366f1" name="Scheduled" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Cancelled" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
