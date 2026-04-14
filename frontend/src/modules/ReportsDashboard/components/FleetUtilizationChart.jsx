// T3 — FleetUtilizationChart (T10 required: Bar chart — which aircraft fly the most?)
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-semibold">{payload[0].value} flight hours</p>
        {payload[0].payload.flights && (
          <p className="text-gray-400 text-xs">{payload[0].payload.flights} flights</p>
        )}
      </div>
    );
  }
  return null;
};

export default function FleetUtilizationChart({ data, loading }) {
  if (loading) {
    return <div className="h-64 w-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No fleet data available.</div>;
  }

  const maxHours = Math.max(...data.map(d => d.hours));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(156,163,175,0.25)" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          unit="h"
        />
        <YAxis
          type="category"
          dataKey="aircraft"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={145}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 4 }} />
        <Bar dataKey="hours" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.hours === maxHours ? '#1d4ed8' : '#93c5fd'} />
          ))}
          <LabelList dataKey="hours" position="right" style={{ fontSize: 11, fill: '#6b7280', fontWeight: 700 }} formatter={(v) => `${v}h`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
