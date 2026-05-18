import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase } from 'lucide-react';

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
        <p className="text-gray-400 dark:text-gray-500 text-xs">Top instructors by assigned slots</p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.15} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              dy={8}
              interval={0}
              tickFormatter={(val) => val.split(' ')[0]}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.05)' }}
              formatter={(value, name) => [value, name === 'slots' ? 'Slots' : 'Hours']}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
            />
            <Bar dataKey="slots" fill="url(#colorInstructor)" radius={[6, 6, 0, 0]} barSize={28} animationDuration={800} />
            <defs>
              <linearGradient id="colorInstructor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
