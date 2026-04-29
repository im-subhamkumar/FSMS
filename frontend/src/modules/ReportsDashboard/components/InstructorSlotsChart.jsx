import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase } from 'lucide-react';

export default function InstructorSlotsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <Briefcase className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Instructor Workload</h3>
        <p className="text-gray-500 text-xs mt-1">No active slots aligned to instructors.</p>
      </div>
    );
  }

  // Sort by slots descending so the busiest instructors are on top/left
  const sortedData = [...data].sort((a, b) => b.slots - a.slots).slice(0, 10); // Show top 10

  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-gray-800 font-semibold text-base">Instructor Workload</h3>
          <p className="text-gray-500 text-xs">Top instructors by assigned slots</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 10, right: 0, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 11, fontWeight: 500}} 
              dy={10} 
              interval={0}
              tickFormatter={(val) => val.split(' ')[0]} // Show just first name for space
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              formatter={(value) => [value, 'Slots Assigned']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="slots" 
              fill="url(#colorInstructor)" 
              radius={[4, 4, 0, 0]} 
              barSize={32} 
              animationDuration={1000}
              activeBar={{ stroke: '#0284c7', strokeWidth: 2, fill: '#38bdf8' }}
            />
            <defs>
              <linearGradient id="colorInstructor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
