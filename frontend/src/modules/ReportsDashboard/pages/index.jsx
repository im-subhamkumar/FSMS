// T3 — Reports Dashboard (T10-aligned with all 3 required widgets)
// Required T10 widgets:
//   1. "Revenue over Time" — Line chart ✅
//   2. "Fleet Utilization" — Bar chart (T9 data) ✅
//   3. "Student Progress Funnel" — Pie chart (T1 data) ✅

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BarChart3, Calendar } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import FinancialSummaryCards   from '../components/FinancialSummaryCards';
import RevenueChart             from '../components/RevenueChart';
import FleetUtilizationChart    from '../components/FleetUtilizationChart';
import StudentProgressChart     from '../components/StudentProgressChart';
import TopStudentsTable         from '../components/TopStudentsTable';
import OverdueInvoicesTable     from '../components/OverdueInvoicesTable';

// ── Mock fallback data ────────────────────────────────────────
const MOCK_SUMMARY = {
  totalRevenue: 485000, outstanding: 128000, totalOverdue: 45000, invoiceCount: 34,
};
const MOCK_REVENUE = [
  { label: 'Nov 2025', revenue: 28000 }, { label: 'Dec 2025', revenue: 41000 },
  { label: 'Jan 2026', revenue: 36000 }, { label: 'Feb 2026', revenue: 55000 },
  { label: 'Mar 2026', revenue: 72000 }, { label: 'Apr 2026', revenue: 80000 },
];
const MOCK_FLEET = [
  { aircraft: 'Cessna 172 (RP-C1101)', hours: 186, flights: 42 },
  { aircraft: 'Cessna 172 (RP-C1102)', hours: 154, flights: 37 },
  { aircraft: 'Piper PA-28 (RP-C2201)', hours: 128, flights: 29 },
  { aircraft: 'Diamond DA40 (RP-C3301)', hours: 112, flights: 24 },
  { aircraft: 'Piper PA-28 (RP-C2202)', hours: 96, flights: 21 },
];
const MOCK_STUDENTS_PROGRESS = [
  { label: 'Active',    value: 18, color: '#22c55e' },
  { label: 'Graduated', value: 8,  color: '#3b82f6' },
  { label: 'Inactive',  value: 4,  color: '#94a3b8' },
];
const MOCK_TOP_STUDENTS = [
  { student: { id: 1, firstName: 'Aditya', lastName: 'Sharma', email: 'aditya@example.com' }, totalBilled: 85000, invoiceCount: 6 },
  { student: { id: 2, firstName: 'Priya',  lastName: 'Mehta',  email: 'priya@example.com'  }, totalBilled: 72000, invoiceCount: 5 },
  { student: { id: 3, firstName: 'Rahul',  lastName: 'Verma',  email: 'rahul@example.com'  }, totalBilled: 65000, invoiceCount: 4 },
  { student: { id: 4, firstName: 'Sneha',  lastName: 'Patel',  email: 'sneha@example.com'  }, totalBilled: 48000, invoiceCount: 3 },
  { student: { id: 5, firstName: 'Karan',  lastName: 'Singh',  email: 'karan@example.com'  }, totalBilled: 36000, invoiceCount: 3 },
];
const MOCK_OVERDUE = [
  { id: 1, invoiceNumber: 'INV-2026-0012', student: { firstName: 'Rahul', lastName: 'Verma', email: 'rahul@example.com' }, amount: 18000, dueDate: '2026-02-28T00:00:00Z', daysOverdue: 37 },
  { id: 2, invoiceNumber: 'INV-2026-0019', student: { firstName: 'Priya', lastName: 'Mehta', email: 'priya@example.com' }, amount: 27000, dueDate: '2026-03-10T00:00:00Z', daysOverdue: 27 },
];
// ─────────────────────────────────────────────────────────────

const INIT_LOADING = { summary: true, revenue: true, fleet: true, students: true, top: true, overdue: true };

export default function ReportsDashboardRoot() {
  const {
    getFinancialSummary, getRevenueOverTime, getFleetUtilization,
    getStudentProgress, getTopStudents, getOverdueInvoices,
  } = useReports();

  const [useMock,     setUseMock]     = useState(false);
  const [loading,     setLoading]     = useState(INIT_LOADING);
  const [summary,     setSummary]     = useState(null);
  const [revenue,     setRevenue]     = useState([]);
  const [fleet,       setFleet]       = useState([]);
  const [studentProg, setStudentProg] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [overdue,     setOverdue]     = useState([]);
  const [months,      setMonths]      = useState(6);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const setL = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const tryFetch = async (fn, fallback, key, setter) => {
    try {
      const data = await fn();
      const isEmpty = !data
        || (Array.isArray(data) && data.length === 0)
        || (data.invoiceCount === 0)
        || (data.totalRevenue === 0 && data.invoiceCount === 0);
      setter(isEmpty ? fallback : data);
      if (isEmpty) setUseMock(true);
    } catch {
      setter(fallback);
      setUseMock(true);
    } finally {
      setL(key, false);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(INIT_LOADING);
    await Promise.all([
      tryFetch(getFinancialSummary,          MOCK_SUMMARY,           'summary', setSummary),
      tryFetch(() => getRevenueOverTime(months), MOCK_REVENUE,        'revenue', setRevenue),
      tryFetch(getFleetUtilization,          MOCK_FLEET,             'fleet',   setFleet),
      tryFetch(getStudentProgress,           MOCK_STUDENTS_PROGRESS, 'students',setStudentProg),
      tryFetch(() => getTopStudents(5),      MOCK_TOP_STUDENTS,      'top',     setTopStudents),
      tryFetch(getOverdueInvoices,           MOCK_OVERDUE,           'overdue', setOverdue),
    ]);
    setLastRefresh(new Date());
  }, [months]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Financial insights · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {useMock && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-semibold">
                  Demo Data
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={months}
              onChange={e => setMonths(parseInt(e.target.value))}
              className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>
          <button onClick={fetchAll} disabled={isAnyLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Summary KPIs */}
      <FinancialSummaryCards summary={summary} loading={loading.summary} />

      {/* ── T10 Required Widget 1: Revenue over Time (Line chart) ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Revenue over Time</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monthly collected revenue (PAID invoices) · ₹ INR</p>
        </div>
        <RevenueChart data={revenue} loading={loading.revenue} />
      </div>

      {/* ── T10 Required Widgets 2 & 3 side by side ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fleet Utilization */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Fleet Utilization</h2>
            <p className="text-xs text-gray-400 mt-0.5">Flight hours per aircraft · T9 Aircraft data</p>
          </div>
          <FleetUtilizationChart data={fleet} loading={loading.fleet} />
        </div>

        {/* Student Progress Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Student Progress</h2>
            <p className="text-xs text-gray-400 mt-0.5">Active vs Graduated vs Inactive · T1 Student data</p>
          </div>
          <StudentProgressChart data={studentProg} loading={loading.students} />
        </div>
      </div>

      {/* Bonus widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Top Students by Billing</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by total invoice amount</p>
          </div>
          <TopStudentsTable data={topStudents} loading={loading.top} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Overdue Invoices</h2>
              <p className="text-xs text-gray-400 mt-0.5">Requires immediate attention</p>
            </div>
            {overdue.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                {overdue.length} overdue
              </span>
            )}
          </div>
          <OverdueInvoicesTable data={overdue} loading={loading.overdue} />
        </div>
      </div>
    </div>
  );
}
