import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function PerformanceAnalytics({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[260px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const trainees = data?.traineePerformance || [];
  const courses = data?.courseBreakdown || [];
  const pf = data?.passFailRatio || {};

  // Prepare pass/fail donut
  const pfData = [
    { name: 'Completed', value: pf.completed || 0 },
    { name: 'Cancelled', value: pf.cancelled || 0 },
  ].filter(d => d.value > 0);
  const PF_COLORS = { Completed: '#10b981', Cancelled: '#ef4444' };

  // Group courses by level for bar chart
  const levelMap = {};
  courses.forEach(c => {
    if (!levelMap[c.level]) levelMap[c.level] = { level: c.level, count: 0, totalTargetHrs: 0 };
    levelMap[c.level].count++;
    levelMap[c.level].totalTargetHrs += c.targetHours;
  });
  const levelData = Object.values(levelMap);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trainee Performance Table */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Trainee Performance</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Flight slot completion rates per trainee</p>

        {trainees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trainee</th>
                  <th className="text-center py-2.5 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">GPA</th>
                  <th className="text-center py-2.5 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slots</th>
                  <th className="text-center py-2.5 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="text-center py-2.5 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</th>
                  <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody>
                {trainees.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="text-gray-900 dark:text-white font-bold">{t.gpa || '0.0'}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.totalSlots}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.hours}h</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.completionRate >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        t.completionRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t.completionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            t.completionRate >= 80 ? 'bg-emerald-500' : t.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(t.completionRate, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No trainee data available</div>
        )}
      </div>

      {/* Pass vs Fail (Completed vs Cancelled) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Pass vs Fail Ratio</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completed vs Cancelled flights</p>

        {/* Big ratio number */}
        <div className="text-center my-3">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{pf.ratio || '0'}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">: 1</span>
          <p className="text-xs text-gray-400 mt-1">completion ratio</p>
        </div>

        {pfData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pfData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {pfData.map((entry, i) => (
                  <Cell key={i} fill={PF_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">No data</div>
        )}

        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-gray-600 dark:text-gray-300 font-medium">Completed</span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{pf.completed || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-red-500" />
              <span className="text-gray-600 dark:text-gray-300 font-medium">Cancelled</span>
            </div>
            <span className="font-bold text-red-600 dark:text-red-400">{pf.cancelled || 0}</span>
          </div>
        </div>

        {/* Course Levels mini bar */}
        {levelData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Courses by Level</p>
            <div className="space-y-2">
              {levelData.map((l, i) => (
                <div key={l.level} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{l.level}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{l.count} courses · {l.totalTargetHrs}h</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
