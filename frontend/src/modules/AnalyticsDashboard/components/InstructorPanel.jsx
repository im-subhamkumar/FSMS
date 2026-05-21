import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, ShieldAlert, ShieldOff, Clock } from 'lucide-react';

const DEPT_COLORS = { FLYING: '#6366f1', GROUND: '#10b981', SIMULATOR: '#f59e0b' };

const statusIcon = (licStatus, medStatus) => {
  if (licStatus === 'EXPIRED' || medStatus === 'EXPIRED') return <ShieldOff size={14} className="text-red-500" />;
  if (licStatus === 'EXPIRING_SOON' || medStatus === 'EXPIRING_SOON') return <ShieldAlert size={14} className="text-amber-500" />;
  return <Shield size={14} className="text-emerald-500" />;
};

const statusBadge = (status) => {
  const map = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    ON_LEAVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return map[status] || map.ACTIVE;
};

export default function InstructorPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[200px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const deptDist = data?.departmentDistribution || {};
  const deptData = Object.entries(deptDist).map(([name, value]) => ({ name, value }));
  const workload = (data?.workload || []).slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workload Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Instructor Workload</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Flights assigned (last 30 days)</p>

        {workload.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workload} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="flights" fill="#6366f1" radius={[6, 6, 0, 0]} name="Flights" barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No workload data available</div>
        )}
      </div>

      {/* Department + Availability */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Department Split</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Instructors by department</p>

        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={deptData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4} strokeWidth={0}>
              {deptData.map((entry, i) => (
                <Cell key={i} fill={DEPT_COLORS[entry.name] || '#6366f1'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-1.5 mt-1">
          {deptData.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[d.name] }} />
                <span className="text-gray-600 dark:text-gray-300 text-xs">{d.name}</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-xs">{d.value}</span>
            </div>
          ))}
        </div>

        {/* Quick status list */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Compliance Status</p>
          <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
            {workload.filter(w => w.licenseStatus !== 'VALID' || w.medicalStatus !== 'VALID').slice(0, 5).map((w, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {statusIcon(w.licenseStatus, w.medicalStatus)}
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{w.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(w.status)}`}>{w.status}</span>
              </div>
            ))}
            {workload.filter(w => w.licenseStatus !== 'VALID' || w.medicalStatus !== 'VALID').length === 0 && (
              <p className="text-xs text-emerald-500 flex items-center gap-1"><Shield size={12} /> All compliant</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
