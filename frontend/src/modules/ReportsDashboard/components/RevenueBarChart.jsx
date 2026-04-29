import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Banknote } from 'lucide-react';

export default function RevenueBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <Banknote className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Monthly Revenue</h3>
        <p className="text-gray-500 text-sm mt-1">No financial data recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="mb-6">
        <h3 className="text-gray-800 font-semibold text-lg">Revenue Trend</h3>
        <p className="text-gray-500 text-sm">Monthly paid invoice totals</p>
      </div>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} 
              dy={15} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(1)}k` : `₹${value}`} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }} 
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue (PAID)']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: '600', color: '#1e293b', paddingBottom: '4px' }}
            />
            <Bar 
              dataKey="amount" 
              fill="url(#colorRevenue)" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50} 
              animationDuration={1000}
              activeBar={{ stroke: '#0284c7', strokeWidth: 2, fill: '#38bdf8' }}
            />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
