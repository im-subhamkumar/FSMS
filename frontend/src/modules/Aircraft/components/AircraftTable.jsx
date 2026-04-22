import React from "react";
import StatusBadge from "./StatusBadge";
import ActionButtons from "./ActionButtons";

const formatFlightHours = (hours) => {
  if (!hours && hours !== 0) return "00:00";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  // DD-MM-YYYY
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const AircraftTable = ({ aircrafts, isLoading, onView, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl min-h-[200px] flex items-center justify-center">
        <p className="text-slate-500 dark:text-gray-400 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading aircraft data...
        </p>
      </div>
    );
  }

  if (!aircrafts || aircrafts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-xl min-h-[200px] flex items-center justify-center flex-col gap-3">
        <p className="text-slate-500 dark:text-gray-400 text-lg">No aircraft available</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">Try adjusting your filters or add a new aircraft.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4">Name & Tail Number</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Flight Hours</th>
              <th className="px-6 py-4">Last Maintenance</th>
              <th className="px-6 py-4">Availability</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 transition-colors">
            {aircrafts.map((aircraft) => {
              const displayName = `${aircraft.manufacturer || 'Unknown'} - ${aircraft.tailNumber}`;
              return (
                <tr key={aircraft.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {displayName}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={aircraft.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {formatFlightHours(aircraft.totalFlightHours)}
                  </td>
                  <td className="px-6 py-4">
                    {formatDate(aircraft.lastMaintenance)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {aircraft.availability || 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons
                      onView={() => onView(aircraft)}
                      onEdit={() => onEdit(aircraft)}
                      onDelete={() => onDelete(aircraft)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AircraftTable;
