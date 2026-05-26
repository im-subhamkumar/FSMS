// CoursesByLevelChart.jsx -- Vertical bar chart of students per course.
// Each bar is colour-coded by course level (BEGINNER, INTERMEDIATE, ADVANCED).
// Data source: GET /api/reports/courses -> studentsPerCourse
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen } from 'lucide-react';

export default function CoursesByLevelChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px]">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
          <BookOpen className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Course Distribution</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No courses found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[280px]">
      <div className="mb-4">
        <h3 className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Course Popularity</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Invoice-based enrollment activity per course</p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" strokeOpacity={0.15} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
            <YAxis
              dataKey="courseName"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              width={100}
              tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.05)' }}
              formatter={(value) => [value, 'Invoiced Items']}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
            />
            <Bar
              dataKey="students"
              fill="url(#colorCourse)"
              radius={[0, 6, 6, 0]}
              barSize={20}
              animationDuration={800}
            />
            <defs>
              <linearGradient id="colorCourse" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={1} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
