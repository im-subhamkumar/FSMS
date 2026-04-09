import React from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  // Employment Status
  ACTIVE:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  INACTIVE:  { label: 'Inactive',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
  ON_LEAVE:  { label: 'On Leave',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  // Expiry Status
  VALID:         { label: 'Valid',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  EXPIRING_SOON: { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  EXPIRED:       { label: 'Expired',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  // Currency
  CURRENT:       { label: 'Current',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  NOT_CURRENT:   { label: 'Not Current', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  // Designation
  CHIEF_FLIGHT_INSTRUCTOR:  { label: 'Chief Flight Instructor',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  SENIOR_FLIGHT_INSTRUCTOR: { label: 'Senior Flight Instructor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  FLIGHT_INSTRUCTOR:        { label: 'Flight Instructor',        color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  GROUND_INSTRUCTOR:        { label: 'Ground Instructor',        color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  SIMULATOR_INSTRUCTOR:     { label: 'Simulator Instructor',     color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

export function StatusBadge({ status, category, showDot = false, showIcon = false, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  const Icon = config.icon;

  let label = config.label;
  if (category && (status === 'EXPIRED' || status === 'EXPIRING_SOON' || status === 'VALID')) {
    label = `${category} ${label}`;
  }

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold shadow-sm ${sizeClasses} ${config.color}`}>
      {showDot && config.dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`} />
      )}
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
