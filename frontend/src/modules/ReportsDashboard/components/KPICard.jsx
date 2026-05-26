// KPICard.jsx -- Reusable metric card for the dashboard summary row.
// Displays an icon, numeric value, label, and optional subtitle.
// Supports a loading skeleton state for async data. Hover effect
// provides subtle lift animation for interactivity.
import React from 'react';

export default function KPICard({ label, value, icon, iconBg, loading, subtitle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-6 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
      ) : (
        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
      )}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      {subtitle && !loading && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium -mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
