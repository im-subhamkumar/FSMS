import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = {
  PENDING: '#f59e0b',  // Amber
  PAID: '#0ea5e9',     // Blue
  OVERDUE: '#ef4444'   // Red
};

// Custom shape to create a zoom/pop-out effect
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Zoomed effect
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
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
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <PieChartIcon className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Invoice Status</h3>
        <p className="text-gray-500 text-xs mt-1">No invoices generated in this period.</p>
      </div>
    );
  }

  const totalInvoices = pieData.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col relative">
      <div className="mb-2">
        <h3 className="text-gray-800 font-semibold text-base">Invoice Status</h3>
        <p className="text-gray-500 text-xs">Distribution by payment state</p>
      </div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
        <span className="text-3xl font-bold text-gray-800">{totalInvoices}</span>
        <span className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">Total</span>
      </div>

      <div className="flex-1 min-h-[220px] relative z-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              stroke="none"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Count']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: '600', color: '#1e293b' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-gray-600 font-medium ml-1 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
