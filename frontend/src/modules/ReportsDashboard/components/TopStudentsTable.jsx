// T3 — TopStudentsTable component
// Leaderboard of students ranked by total billing amount

import React from 'react';
import { Trophy, IndianRupee } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(parseFloat(val) || 0);

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const RANK_BG = ['bg-yellow-50 dark:bg-yellow-900/10', 'bg-gray-50 dark:bg-gray-700/30', 'bg-amber-50 dark:bg-amber-900/10'];

export default function TopStudentsTable({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No student billing data available.
      </div>
    );
  }

  // Find max for relative bar width
  const maxBilled = Math.max(...data.map(d => d.totalBilled));

  return (
    <div className="space-y-2">
      {data.map((entry, index) => {
        const rankColor = RANK_COLORS[index] || 'text-gray-400 dark:text-gray-500';
        const rankBg = index < 3 ? RANK_BG[index] : '';
        const pct = maxBilled > 0 ? (entry.totalBilled / maxBilled) * 100 : 0;

        return (
          <div
            key={entry.student?.id || index}
            className={`flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${rankBg}`}
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {index < 3 ? (
                <Trophy className={`w-5 h-5 mx-auto ${rankColor}`} />
              ) : (
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
              )}
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {entry.student?.firstName?.[0]}{entry.student?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {entry.student?.firstName} {entry.student?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{entry.student?.email}</p>
              </div>
            </div>

            {/* Progress bar + Amount */}
            <div className="flex flex-col items-end gap-1 shrink-0 min-w-[100px]">
              <span className="text-sm font-bold text-gray-900 dark:text-white">₹{fmt(entry.totalBilled)}</span>
              <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{entry.invoiceCount} invoice{entry.invoiceCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
