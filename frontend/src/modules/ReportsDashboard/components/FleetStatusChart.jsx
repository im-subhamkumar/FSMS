// ---------------------------------------------------------------------------
// FleetStatusChart.jsx -- Aircraft status and utilization
//
// Combines two visualisations in a single card:
// 1. Status pills at the top showing counts per category (Airworthy,
//    In Maintenance, AOG) with colour-coded icons.
// 2. Horizontal bar chart below showing flight hours per aircraft,
//    identified by tail number (e.g., VT-BXA).
//
// Design decision: The original pie/donut chart was replaced because
// when all aircraft share the same status (e.g., all Airworthy), the
// donut becomes a single-colour blob with no useful information. The
// new layout provides both status summary and utilization comparison.
//
// Data source: GET /api/reports/fleet
//   -> statusDistribution: [{ name, value }]
//   -> utilization: [{ tailNumber, slots, hours }]
//   -> totalAircraft, openSquawks
// ---------------------------------------------------------------------------

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plane, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

const STATUS_CONFIG = {
  'Airworthy':      { color: '#10b981', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'In Maintenance': { color: '#f59e0b', icon: Wrench,       bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800' },
  'AOG':            { color: '#ef4444', icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-600 dark:text-red-400',       border: 'border-red-200 dark:border-red-800' },
};

const AIRCRAFT_COLORS = ['#14b8a6', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#ec4899'];

export default function FleetStatusChart({ data }) {
  const statusData   = data?.statusDistribution || [];
  const utilization   = data?.utilization || [];
  const totalAircraft = data?.totalAircraft || 0;
  const openSquawks   = data?.openSquawks || 0;

  if (!data || totalAircraft === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <Plane className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Fleet Status</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No aircraft registered.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Fleet Status</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Aircraft availability & flight hours</p>
        </div>
        {openSquawks > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {openSquawks} Squawk{openSquawks > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status Summary Pills */}
      <div className="flex items-center gap-2 mb-4">
        {statusData.map((entry, idx) => {
          const config = STATUS_CONFIG[entry.name] || STATUS_CONFIG['Airworthy'];
          const Icon = config.icon;
          return (
            <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bg} border ${config.border}`}>
              <Icon className={`w-3.5 h-3.5 ${config.text}`} />
              <span className={`text-xs font-bold ${config.text}`}>{entry.value}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{entry.name}</span>
            </div>
          );
        })}
        <div className="ml-auto">
          <span className="text-lg font-black text-gray-800 dark:text-white">{totalAircraft}</span>
          <span className="text-[10px] text-gray-400 font-semibold ml-1 uppercase tracking-wider">Total</span>
        </div>
      </div>

      {/* Utilization — single horizontal bar (flight hours) */}
      {utilization.length > 0 && (
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilization} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" strokeOpacity={0.12} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                label={{ value: 'Flight Hours', position: 'insideBottom', offset: -2, style: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 } }}
              />
              <YAxis
                type="category"
                dataKey="tailNumber"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                formatter={(value) => [`${value} hrs`, 'Flight Hours']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                labelStyle={{ fontWeight: '700', color: '#1e293b', paddingBottom: '2px' }}
              />
              <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={18} animationDuration={800}>
                {utilization.map((_, i) => (
                  <Cell key={i} fill={AIRCRAFT_COLORS[i % AIRCRAFT_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
