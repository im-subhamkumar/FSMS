// T3 — StudentProgressChart (T10 required: Student enrollment funnel — Active vs Graduated)
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="font-bold text-gray-800 dark:text-gray-200">{d.label}</span>
        </div>
        <p className="text-2xl font-black" style={{ color: d.color }}>{d.value}</p>
        <p className="text-xs text-gray-400">students</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, label }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value === 0) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="700">
      {value}
    </text>
  );
};

export default function StudentProgressChart({ data, loading }) {
  if (loading) {
    return <div className="h-56 w-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;
  }

  const chartData = (data || []).filter(d => d.value > 0);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (!chartData.length) {
    return <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No student data available.</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={95}
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend + totals */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {chartData.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-semibold text-gray-500 dark:text-gray-400">{d.label}</span>
            <span className="font-black text-gray-800 dark:text-gray-200">{d.value}</span>
            <span className="text-xs text-gray-400">({total ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">Total: {total} students</p>
    </div>
  );
}
