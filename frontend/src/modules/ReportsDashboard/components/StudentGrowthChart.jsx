// StudentGrowthChart.jsx -- Area chart showing monthly student enrollments.
// Displays new student joins over time with a gradient fill area chart.
// Data source: GET /api/reports/students -> monthlyJoins
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

export default function StudentGrowthChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Student Growth</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No enrollment data for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      <div className="mb-4">
        <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">New Enrollments</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Monthly student onboarding</p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.15} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value, 'New Students']}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
              labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
