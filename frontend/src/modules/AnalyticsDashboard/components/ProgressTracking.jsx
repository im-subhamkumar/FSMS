import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function ProgressTracking({ data, loading, groupBy, onGroupByChange }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            <div className="h-[280px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const trend = data?.completionTrend || [];
  const batches = data?.batchProgress || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Completion Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Completion Trends</h3>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {['daily', 'weekly', 'monthly'].map(g => (
              <button
                key={g}
                onClick={() => onGroupByChange(g)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  groupBy === g
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Completed sessions over time</p>

        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5) || v} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="completions" stroke="#6366f1" fill="url(#completionGrad)" strokeWidth={2.5} name="Completions" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No completion data available</div>
        )}
      </div>

      {/* Batch Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Training Progress by Batch</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Completion rates and hours per batch</p>

        {batches.length > 0 ? (
          <div className="space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {batches.map((b, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{b.batch}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">({b.studentCount} students)</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    b.completionRate >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    b.completionRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {b.completionRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      b.completionRate >= 80 ? 'bg-emerald-500' : b.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(b.completionRate, 100)}%` }}
                  />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Target size={11} />
                    <span>{b.completed}/{b.totalSlots} slots</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock size={11} />
                    <span>{b.totalHours}h total</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <TrendingUp size={11} />
                    <span>{b.avgHoursPerStudent}h/student</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p>No batch data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
