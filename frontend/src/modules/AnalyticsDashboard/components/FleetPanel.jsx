import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const STATUS_COLORS = { Available: '#10b981', 'In Maintenance': '#f59e0b', Active: '#3b82f6', Inactive: '#9ca3af', AOG: '#ef4444' };
const SEVERITY_COLORS = { Normal: '#f59e0b', Urgent: '#f97316', Critical: '#ef4444' };

export default function FleetPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[250px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const statusDist = data?.statusDistribution || {};
  const pieData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));
  const utilization = (data?.utilization || []).slice(0, 8);
  const squawks = data?.squawksBySeverity || {};
  const squawkData = Object.entries(squawks).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fleet Status + Squawks */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Fleet Status</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Aircraft availability overview</p>

        <div className="flex items-start gap-6">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2 pt-4">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] || '#6366f1' }} />
                  <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Squawk alerts */}
        {data?.openSquawkCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Open Squawks by Severity</p>
            <div className="flex gap-3">
              {squawkData.map(s => (
                <div key={s.name} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: `${SEVERITY_COLORS[s.name]}15` }}>
                  <AlertTriangle size={14} style={{ color: SEVERITY_COLORS[s.name] }} />
                  <span className="text-xs font-bold" style={{ color: SEVERITY_COLORS[s.name] }}>{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aircraft Utilization */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Aircraft Utilization</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Flights per aircraft (last 30 days)</p>

        {utilization.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={utilization} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="tailNumber" tick={{ fontSize: 11 }} stroke="#9ca3af" width={60} />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="flightsLast30Days" fill="#6366f1" radius={[0, 6, 6, 0]} name="Flights" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No flight data available</div>
        )}
      </div>
    </div>
  );
}
