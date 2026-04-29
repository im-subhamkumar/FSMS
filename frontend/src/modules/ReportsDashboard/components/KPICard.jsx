import React from 'react';

export default function KPICard({ label, value, icon, iconBg, loading }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-shadow duration-200 flex flex-col justify-center relative overflow-hidden group">
      {/* Subtle top border accent on hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500 group-hover:to-blue-500/10 transition-all duration-500"></div>
      
      <div className="flex items-center space-x-3 relative z-10">
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-sm ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-xs font-semibold tracking-wide uppercase">{label}</p>
          {loading ? (
            <div className="h-6 w-20 bg-gray-200 rounded mt-1 animate-pulse" />
          ) : (
            <h3 className="text-xl font-bold text-gray-800 tracking-tight mt-0.5 truncate max-w-[150px] sm:max-w-[200px]" title={String(value)}>{value}</h3>
          )}
        </div>
      </div>
    </div>
  );
}
