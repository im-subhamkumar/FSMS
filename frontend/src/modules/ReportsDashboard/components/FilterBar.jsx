import React from 'react';
import ExportButtons from './ExportButtons';
import { Calendar } from 'lucide-react';

export default function FilterBar({ dateRange, setDateRange, data }) {

  const handlePreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col items-start gap-4 animate-fade-in lg:flex-row lg:items-center lg:justify-between">
      
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => handlePreset(7)} className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition">
          Last 7 Days
        </button>
        <button onClick={() => handlePreset(30)} className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition">
          Last 30 Days
        </button>
        <button onClick={() => handlePreset(90)} className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition">
          Last 3 Months
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 ml-0 lg:ml-4">
        <label className="text-sm text-gray-500 font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> Date Range:
        </label>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={dateRange.from} 
            onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
            className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <span className="text-gray-400 text-sm font-medium">to</span>
          <input 
            type="date" 
            value={dateRange.to} 
            onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
             className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>
      
      <ExportButtons dateRange={dateRange} data={data} />
    </div>
  );
}
