import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CloudSun, CloudOff, CloudRain } from 'lucide-react';

const VERDICT_COLORS = { GO: '#10b981', 'NO-GO': '#ef4444', CAUTION: '#f59e0b' };
const CAT_COLORS = { VFR: '#10b981', MVFR: '#3b82f6', IFR: '#f59e0b', LIFR: '#ef4444' };

export default function WeatherPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
          <div className="h-[250px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />
          <div className="h-[200px] bg-gray-100 dark:bg-gray-700/50 rounded-full mx-auto w-[200px] animate-pulse" />
        </div>
      </div>
    );
  }

  const verdictDist = data?.verdictDistribution || {};
  const catDist = data?.categoryDistribution || {};
  const catData = Object.entries(catDist).map(([name, value]) => ({ name, value }));
  const goRate = data?.dailyGoRate || [];
  const goCount = verdictDist['GO'] || 0;
  const noGoCount = verdictDist['NO-GO'] || 0;
  const total = data?.totalChecks || 0;
  const goPct = total > 0 ? Math.round((goCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* GO Rate Trend */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Weather GO Rate</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <CloudSun size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{goPct}% GO</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20">
              <CloudOff size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{noGoCount} NO-GO</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {data?.weatherAffectedFlights || 0} flights affected by weather
        </p>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={goRate} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="goGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" domain={[0, 100]} unit="%" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Area type="monotone" dataKey="goRate" stroke="#10b981" fill="url(#goGrad)" strokeWidth={2.5} name="GO Rate" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Flight Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Flight Categories</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{total} weather checks recorded</p>

        {catData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={CAT_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-2">
              {catData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[d.name] }} />
                    <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <CloudRain size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No weather data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
