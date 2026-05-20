import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane } from 'lucide-react';

export default function SlotActivityLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <Plane className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Slot Activity</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No flight slots in this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      <div className="mb-4">
        <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Flight Slot Activity</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Scheduled vs Completed vs Cancelled</p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.15} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
              labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ top: -5, fontSize: '11px', fontWeight: 500 }} />
            <Line type="monotone" dataKey="booked" name="Scheduled" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} dot={false} animationDuration={800} />
            <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} dot={false} animationDuration={800} />
            <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
