import React from 'react';
import { Users, CheckCircle, Clock, Award, TrendingUp, TrendingDown } from 'lucide-react';

const cards = [
  { key: 'totalStudents', label: 'Total Trainees', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  { key: 'completionRate', label: 'Completion Rate', icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', suffix: '%' },
  { key: 'totalHours', label: 'Total Flight Hours', icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', suffix: ' hrs' },
  { key: 'avgGpa', label: 'Average GPA', icon: Award, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
];

export default function ExecutiveOverview({ summary, performance, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  const getData = (key) => {
    if (key === 'totalStudents') return summary?.totalStudents ?? 0;
    if (key === 'completionRate') return performance?.summary?.completionRate ?? 0;
    if (key === 'totalHours') return performance?.summary?.totalHours ?? 0;
    if (key === 'avgGpa') return summary?.avgGpa ?? 0;
    return 0;
  };

  const getChange = (key) => {
    if (key === 'completionRate') return null;
    if (key === 'totalStudents') return summary?.flightChange;
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map(card => {
        const value = getData(card.key);
        const change = getChange(card.key);
        const Icon = card.icon;
        return (
          <div key={card.key} className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            {/* Background icon */}
            <div className="absolute -top-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <Icon size={100} />
            </div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: card.bg }}>
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{card.label}</span>
            </div>

            <p className="text-3xl font-extrabold text-gray-900 dark:text-white relative z-10 tracking-tight">
              {card.prefix && card.key === 'studentInstructorRatio' ? '' : (card.prefix || '')}
              {typeof value === 'number' ? value.toLocaleString() : value}
              {card.suffix || ''}
            </p>

            {change !== null && change !== undefined && (
              <div className="flex items-center gap-1 mt-3 relative z-10">
                {change >= 0
                  ? <TrendingUp size={14} className="text-emerald-500" />
                  : <TrendingDown size={14} className="text-red-500" />
                }
                <span className={`text-xs font-bold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
