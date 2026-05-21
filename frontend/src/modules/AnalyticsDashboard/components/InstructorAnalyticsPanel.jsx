import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Shield, ShieldAlert, ShieldOff, Award } from 'lucide-react';

const DEPT_COLORS = { FLYING: '#6366f1', GROUND: '#10b981', SIMULATOR: '#f59e0b' };

export default function InstructorAnalyticsPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[250px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const workload = data?.workload || [];
  const deptDist = data?.departmentDistribution || {};
  const deptData = Object.entries(deptDist).map(([name, value]) => ({ name, value }));

  // Compute consistency metric — stddev of flights per instructor
  const flightCounts = workload.map(w => w.flights);
  const avg = flightCounts.length > 0 ? flightCounts.reduce((a, b) => a + b, 0) / flightCounts.length : 0;
  const variance = flightCounts.length > 0 ? flightCounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / flightCounts.length : 0;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const consistencyScore = avg > 0 ? Math.max(0, Math.round(100 - (stdDev / avg) * 100)) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Instructor Workload */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Instructor Performance</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Flights & hours assigned (last 30 days)</p>

        {workload.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workload.slice(0, 10)} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="flights" fill="#6366f1" radius={[6, 6, 0, 0]} name="Flights" barSize={24} />
                <Bar dataKey="hoursLast30Days" fill="#10b981" radius={[6, 6, 0, 0]} name="Hours" barSize={24} />
              </BarChart>
            </ResponsiveContainer>

            {/* Instructor detail rows */}
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {workload.slice(0, 8).map((w, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {w.name?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{w.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{w.department} · {w.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{w.flights} flights</p>
                      <p className="text-[11px] text-gray-500">{w.hoursLast30Days}h</p>
                    </div>
                    {w.licenseStatus === 'VALID' && w.medicalStatus === 'VALID'
                      ? <Shield size={16} className="text-emerald-500" />
                      : w.licenseStatus === 'EXPIRED' || w.medicalStatus === 'EXPIRED'
                        ? <ShieldOff size={16} className="text-red-500" />
                        : <ShieldAlert size={16} className="text-amber-500" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No instructor data</div>
        )}
      </div>

      {/* Grading Consistency + Department */}
      <div className="space-y-6">
        {/* Consistency Score */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Workload Consistency</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">How evenly are flights distributed</p>

          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-700" />
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8"
                  stroke={consistencyScore >= 75 ? '#10b981' : consistencyScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={`${consistencyScore * 3.14} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{consistencyScore}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">score</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
            Avg: {Math.round(avg * 10) / 10} flights · σ: {stdDev}
          </p>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">By Department</h3>
          {deptData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {deptData.map((entry, i) => (
                      <Cell key={i} fill={DEPT_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {deptData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[d.name] }} />
                      <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No department data</p>
          )}
        </div>
      </div>
    </div>
  );
}
