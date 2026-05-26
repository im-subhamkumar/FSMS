// InvoiceStatusPieChart.jsx -- Donut chart showing invoice count by status.
// Displays PAID, PENDING, and OVERDUE segments with hover-expand interaction.
// Uses Recharts PieChart with an inner radius to create a donut effect.
// Data source: GET /api/reports/financial -> statusBreakdown
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = {
  PENDING: '#f59e0b',
  PAID: '#10b981',
  OVERDUE: '#ef4444'
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function InvoiceStatusPieChart({ data = {} }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const pieData = Object.keys(data).map(key => ({
    name: key,
    value: data[key]
  })).filter(item => item.value > 0);

  if (!pieData || pieData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <PieChartIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Invoice Status</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No invoices in this period.</p>
      </div>
    );
  }

  const totalInvoices = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px] relative">
      <div className="mb-2">
        <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Invoice Status</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Distribution by payment state</p>
      </div>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '60px' }}>
        <span className="text-2xl font-black text-gray-800 dark:text-white">{totalInvoices}</span>
        <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Total</span>
      </div>

      <div className="flex-1 min-h-[200px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
              stroke="none"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
              itemStyle={{ fontWeight: '600', color: '#1e293b' }}
            />
            <Legend
              verticalAlign="bottom"
              height={30}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-gray-600 dark:text-gray-300 font-medium ml-1 text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
