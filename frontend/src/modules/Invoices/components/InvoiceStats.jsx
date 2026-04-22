// T3 — InvoiceStats (T10 required: Total Revenue, Outstanding, Overdue)
// Enhanced with interactive cards (pattern from Student module StatCard/BatchCard)
import React from 'react';
import { IndianRupee, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue',  icon: IndianRupee,   color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  hoverBorder: 'hover:border-green-300 dark:hover:border-green-600', hoverShadow: 'hover:shadow-green-500/10' },
  { key: 'outstanding',  label: 'Outstanding',    icon: Clock,         color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-600', hoverShadow: 'hover:shadow-amber-500/10' },
  { key: 'overdue',      label: 'Overdue',         icon: AlertTriangle, color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      hoverBorder: 'hover:border-red-300 dark:hover:border-red-600',     hoverShadow: 'hover:shadow-red-500/10', isAlert: true },
  { key: 'paidCount',    label: 'Invoices Paid',   icon: CheckCircle2,  color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',   hoverShadow: 'hover:shadow-blue-500/10', isCount: true, filterStatus: 'PAID' },
  { key: 'pendingCount', label: 'Pending',         icon: Clock,         color: 'text-orange-600 dark:text-orange-400',bg: 'bg-orange-50 dark:bg-orange-900/20',hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600',hoverShadow: 'hover:shadow-orange-500/10', isCount: true, filterStatus: 'PENDING' },
  { key: 'overdueCount', label: 'Overdue',         icon: AlertTriangle, color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      hoverBorder: 'hover:border-red-300 dark:hover:border-red-600',     hoverShadow: 'hover:shadow-red-500/10', isCount: true, filterStatus: 'OVERDUE', isAlert: true },
];

export default function InvoiceStats({ stats, loading, activeFilter, onFilterByStatus }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
      {CARDS.map(card => {
        const Icon = card.icon;
        const value = stats?.[card.key];
        const isClickable = Boolean(card.filterStatus && onFilterByStatus);
        const isActive = activeFilter === card.filterStatus;
        const showPulse = card.isAlert && !card.isCount && parseFloat(value) > 0;
        const showCountPulse = card.isAlert && card.isCount && parseInt(value) > 0;

        return (
          <div
            key={card.key}
            onClick={() => isClickable && onFilterByStatus(isActive ? '' : card.filterStatus)}
            className={`
              bg-white dark:bg-gray-800 rounded-2xl border shadow-sm p-4 flex flex-col gap-2
              transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
              ${card.hoverBorder} ${card.hoverShadow}
              ${isClickable ? 'cursor-pointer' : ''}
              ${isActive
                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-blue-500/10'
                : 'border-gray-100 dark:border-gray-700'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center
                ${(showPulse || showCountPulse) ? 'animate-pulse' : ''}
                group-hover:scale-110 transition-transform duration-300
              `}>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              {isClickable && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {isActive ? 'Active' : 'Filter'}
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-7 w-24 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ) : (
              <p className={`text-xl font-black ${card.color}`}>
                {card.isCount ? (value ?? '—') : `₹${fmt(value)}`}
              </p>
            )}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
