import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = { PAID: '#10b981', PENDING: '#f59e0b', OVERDUE: '#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function RevenueCharts({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
          <div className="h-[280px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />
          <div className="h-[200px] bg-gray-100 dark:bg-gray-700/50 rounded-full mx-auto w-[200px] animate-pulse" />
        </div>
      </div>
    );
  }

  const trend = data?.monthlyTrend || [];
  const statusDist = data?.statusDistribution || {};
  const pieData = Object.entries(statusDist).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Trend */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Collected</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Outstanding</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Billed</span>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">₹{Number(data?.totalBilled || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Collected</span>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{Number(data?.totalCollected || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Outstanding</span>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">₹{Number(data?.totalOutstanding || 0).toLocaleString()}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="collected" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2.5} name="Collected" />
            <Area type="monotone" dataKey="outstanding" stroke="#f59e0b" fill="url(#outGrad)" strokeWidth={2} name="Outstanding" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Invoice Status Donut */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Invoice Status</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Collection rate: <span className="font-bold text-emerald-600 dark:text-emerald-400">{data?.collectionRate || 0}%</span>
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#6366f1'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-2 mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[d.name] }} />
                <span className="text-gray-600 dark:text-gray-300 font-medium">{d.name}</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
