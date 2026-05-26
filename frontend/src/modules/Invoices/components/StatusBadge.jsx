// StatusBadge.jsx -- Reusable pill-shaped status indicator.
// Renders a colour-coded badge for PENDING (amber), PAID (green), or
// OVERDUE (red) statuses. Includes a dot indicator and supports two
// sizes: 'sm' (table rows) and 'lg' (detail view headers).
// Falls back to a neutral gray badge for unknown status values.
import React from 'react';

const CONFIG = {
  PENDING: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  PAID: {
    label: 'Paid',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-green-400/20',
    dot: 'bg-green-500',
  },
  OVERDUE: {
    label: 'Overdue',
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-red-400/20',
    dot: 'bg-red-500',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = CONFIG[status] || {
    label: status,
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  };

  const textSize = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ring-1 ring-inset ${cfg.classes} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
