import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane } from 'lucide-react';

export default function SlotActivityLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <Plane className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Slot Activity</h3>
        <p className="text-gray-500 text-xs mt-1">No flight slots scheduled in this period.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-gray-800 font-semibold text-base">Flight Slots Activity</h3>
          <p className="text-gray-500 text-xs">Scheduled vs Completed vs Cancelled</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="circle"
              wrapperStyle={{ top: -25, fontSize: '12px', fontWeight: 500 }}
            />
            <Line 
              type="monotone" 
              dataKey="booked" 
              name="Scheduled"
              stroke="#0ea5e9" 
              strokeWidth={2.5}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
              dot={false}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              name="Completed"
              stroke="#10b981" 
              strokeWidth={2.5}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
              dot={false}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="cancelled" 
              name="Cancelled"
              stroke="#ef4444" 
              strokeWidth={2.5}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
              dot={false}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
