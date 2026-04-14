// T3 — FinancialSummaryCards component
// 4 KPI cards for the Reports Dashboard

import React from 'react';
import { IndianRupee, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const CARDS = [
  {
    key: 'totalRevenue',
    label: 'Total Billed',
    icon: IndianRupee,
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-200 dark:shadow-blue-900/30',
    description: 'All time revenue',
  },
  {
    key: 'totalRevenue',
    label: 'Revenue Collected',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-200 dark:shadow-green-900/30',
    description: 'Paid invoices',
  },
  {
    key: 'outstanding',
    label: 'Outstanding',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-200 dark:shadow-amber-900/30',
    description: 'Pending collection',
  },
  {
    key: 'totalOverdue',
    label: 'Overdue Amount',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-200 dark:shadow-red-900/30',
    description: 'Requires attention',
  },
];

export default function FinancialSummaryCards({ summary, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg ${card.shadow} transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
          >
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-white/10" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">{card.label}</span>
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {loading ? (
                <div className="h-9 w-32 rounded-lg bg-white/30 animate-pulse" />
              ) : (
                <p className="text-3xl font-black tracking-tight">
                  ₹{fmt(summary?.[card.key])}
                </p>
              )}

              <p className="mt-1.5 text-xs opacity-70 font-medium">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
