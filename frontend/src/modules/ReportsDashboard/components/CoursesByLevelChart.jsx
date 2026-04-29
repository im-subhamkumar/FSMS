import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen } from 'lucide-react';

export default function CoursesByLevelChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
        <div className="p-3 bg-gray-50 rounded-full mb-4 shadow-sm border border-gray-100">
           <BookOpen className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-700 font-semibold text-base">Students per Course</h3>
        <p className="text-gray-500 text-xs mt-1">No courses found matching filters.</p>
      </div>
    );
  }

  // To make the static empty data look good during dev while awaiting T5
  // We check if all counts are 0, and if so either show a note or render it anyway with all 0s
  
  return (
    <div className="h-full w-full bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-gray-800 font-semibold text-base">Course Distribution</h3>
          <p className="text-gray-500 text-xs">Number of students enrolled by course</p>
        </div>
        <div className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200/60 shadow-sm">
          Awaiting T5 Sync
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis 
              type="number"
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 12}} 
              allowDecimals={false}
            />
            <YAxis 
              dataKey="courseName" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 11, fontWeight: 500}} 
              width={120}
              tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} // Truncate long names elegantly
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              formatter={(value) => [value, 'Students']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="students" 
              fill="#f43f5e" 
              radius={[0, 4, 4, 0]} 
              barSize={24} 
              animationDuration={1000}
              activeBar={{ stroke: '#e11d48', strokeWidth: 2, fill: '#fb7185' }} // Zoomed effect
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
