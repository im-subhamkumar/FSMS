import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { Plane } from 'lucide-react';

const COLORS = {
  'Airworthy': '#10b981',
  'In Maintenance': '#f59e0b',
  'AOG': '#ef4444',
  'Other': '#94a3b8'
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 5} startAngle={startAngle} endAngle={endAngle} fill={fill} />
  );
};

export default function FleetStatusChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const statusData = data?.statusDistribution || [];
  const totalAircraft = data?.totalAircraft || 0;
  const openSquawks = data?.openSquawks || 0;

  if (!statusData || statusData.length === 0) {
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
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px] relative">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Fleet Status</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Aircraft availability overview</p>
        </div>
        {openSquawks > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-700">
            {openSquawks} Open Squawk{openSquawks > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '50px' }}>
        <span className="text-2xl font-black text-gray-800 dark:text-white">{totalAircraft}</span>
        <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Aircraft</span>
      </div>

      <div className="flex-1 min-h-[180px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={statusData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              animationDuration={800}
              stroke="none"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {statusData.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name] || '#94a3b8' }} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{entry.name} ({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
