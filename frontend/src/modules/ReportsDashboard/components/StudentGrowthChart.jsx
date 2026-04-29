import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

export default function StudentGrowthChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <Users className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Student Growth</h3>
        <p className="text-gray-500 text-xs mt-1">No enrollment data for this period.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="mb-4">
        <h3 className="text-gray-800 font-semibold text-base">New Enrollments</h3>
        <p className="text-gray-500 text-xs">Monthly student onboarding growth</p>
      </div>
      
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              formatter={(value) => [value, 'New Students']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStudents)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
