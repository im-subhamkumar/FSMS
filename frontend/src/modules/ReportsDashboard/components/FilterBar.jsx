import React, { useState } from 'react';
import ExportButtons from './ExportButtons';
import { Calendar, RefreshCw } from 'lucide-react';

const PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
];

export default function FilterBar({ dateRange, setDateRange, data, onRefresh }) {
  const [activePreset, setActivePreset] = useState(30);

  const handlePreset = (days) => {
    setActivePreset(days);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    });
  };

  const handleCustomDate = (field, value) => {
    setActivePreset(null);
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex items-center gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.days}
            onClick={() => handlePreset(p.days)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              activePreset === p.days
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

      {/* Custom date range */}
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => handleCustomDate('from', e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
        <span className="text-gray-400 text-xs font-medium">to</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => handleCustomDate('to', e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Export — pushed to the right */}
      <div className="ml-auto">
        <ExportButtons dateRange={dateRange} data={data} />
      </div>
    </div>
  );
}
