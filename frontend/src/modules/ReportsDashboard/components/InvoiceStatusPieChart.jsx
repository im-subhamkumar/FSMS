// T3 — InvoiceStatusPieChart component
// Donut chart showing invoice count breakdown by status - using Recharts

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  DRAFT:     '#94a3b8',
  SENT:      '#3b82f6',
  PAID:      '#22c55e',
  OVERDUE:   '#ef4444',
  CANCELLED: '#64748b',
};

const LABELS = {
  DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
        <p className="font-bold text-gray-800 dark:text-gray-200">{LABELS[d.status]}</p>
        <p className="text-gray-500">{d.count} invoice{d.count !== 1 ? 's' : ''}</p>
        <p className="text-gray-500">₹{Number(d.totalAmount || 0).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ data }) => (
  <div className="flex flex-wrap justify-center gap-3 mt-3">
    {data.map(d => (
      <div key={d.status} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] }} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{LABELS[d.status]} ({d.count})</span>
      </div>
    ))}
  </div>
);

export default function InvoiceStatusPieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const chartData = (data || []).filter(d => d.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No invoice data available yet.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend data={chartData} />
    </div>
  );
}
