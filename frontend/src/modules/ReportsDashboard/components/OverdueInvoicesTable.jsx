// T3 — OverdueInvoicesTable component
// Alert panel for overdue invoices

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Clock } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(parseFloat(val) || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function OverdueInvoicesTable({ data, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-red-50 dark:bg-red-900/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No overdue invoices</p>
        <p className="text-xs text-gray-400">All invoices are up to date</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map((inv) => (
        <div
          key={inv.id}
          onClick={() => navigate(`/invoices/${inv.id}`)}
          className="flex items-center gap-4 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors group"
        >
          {/* Warning icon */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold text-red-700 dark:text-red-400">{inv.invoiceNumber}</span>
              {inv.daysOverdue !== null && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" />
                  {inv.daysOverdue}d overdue
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {inv.student?.firstName} {inv.student?.lastName}
            </p>
            <p className="text-xs text-gray-400">Due: {fmtDate(inv.dueDate)}</p>
          </div>

          {/* Amount */}
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-sm font-black text-red-700 dark:text-red-400">₹{fmt(inv.amount)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}
