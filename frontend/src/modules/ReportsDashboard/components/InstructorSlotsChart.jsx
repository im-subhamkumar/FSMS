// ---------------------------------------------------------------------------
// InstructorSlotsChart.jsx -- Instructor workload (horizontal bar chart)
//
// Displays assigned flying slots per instructor as a horizontal bar chart.
// Full instructor names appear on the Y-axis (e.g., "Capt Arora"). Each
// bar is individually coloured for visual distinction.
//
// Design decision: Horizontal layout was chosen because instructor names
// are variable-length strings that truncate badly on a vertical X-axis.
// A horizontal bar with a wide Y-axis (110px) accommodates full names.
//
// Data shape: [{ name: "Capt Arora", slots: 54, hours: 62 }, ...]
// Source: GET /api/reports/instructors -> slotsPerInstructor
// ---------------------------------------------------------------------------

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase } from 'lucide-react';

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#0ea5e9', '#2563eb', '#7c3aed'];

export default function InstructorSlotsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <Briefcase className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Instructor Workload</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No instructor slot data available.</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.slots - a.slots).slice(0, 8);

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      <div className="mb-4">
        <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Instructor Workload</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Assigned flying slots per instructor</p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" strokeOpacity={0.12} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
              width={110}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.06)' }}
              formatter={(value) => [`${value} slots`, 'Workload']}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
              labelStyle={{ fontWeight: '700', color: '#1e293b', paddingBottom: '2px' }}
            />
            <Bar dataKey="slots" radius={[0, 6, 6, 0]} barSize={20} animationDuration={800}>
              {sortedData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
