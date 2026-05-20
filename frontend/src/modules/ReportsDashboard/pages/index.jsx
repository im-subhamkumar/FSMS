// T3 — Reports Dashboard module entry point
// Single-page read-only dashboard (no sub-routes needed)

import React, { useMemo } from 'react';
import { useReportData } from '../hooks/useReportData';
import FilterBar from '../components/FilterBar';

// UI Components
import KPICard from '../components/KPICard';
import RevenueBarChart from '../components/RevenueBarChart';
import InvoiceStatusPieChart from '../components/InvoiceStatusPieChart';
import SlotActivityLineChart from '../components/SlotActivityLineChart';
import StudentGrowthChart from '../components/StudentGrowthChart';
import CoursesByLevelChart from '../components/CoursesByLevelChart';
import InstructorSlotsChart from '../components/InstructorSlotsChart';
import FleetStatusChart from '../components/FleetStatusChart';
import ComplianceAlerts from '../components/ComplianceAlerts';

import {
  IndianRupee, Users, Plane, AlertTriangle,
  TrendingUp, Shield, BarChart3, GraduationCap,
  Gauge, AlertCircle
} from 'lucide-react';

export default function ReportsDashboardRoot() {
  const defaultDateRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  }, []);

  const { dateRange, setDateRange, data, loading, error, refetch } = useReportData(defaultDateRange);

  // Skeleton placeholder for loading charts
  const ChartSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[280px] animate-pulse">
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700/30 rounded-2xl" />
    </div>
  );

  // Section heading component
  const SectionHeading = ({ icon: Icon, title, subtitle, iconColor }) => (
    <div className="flex items-center gap-2.5 pt-2">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-5 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Reports Dashboard
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
            Operational and financial performance metrics
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar dateRange={dateRange} setDateRange={setDateRange} data={data} onRefresh={refetch} />

      {/* Error State */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm">
          <p className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Error Loading Data
          </p>
          <p className="text-xs mt-1 text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-all text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ═══════ KPI Cards ═══════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              label="Total Revenue"
              value={`₹${(data.financial?.totalRevenue || 0).toLocaleString()}`}
              icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
              iconBg="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800"
              loading={loading}
            />
            <KPICard
              label="Collection Rate"
              value={`${data.financial?.collectionRate || 0}%`}
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              iconBg="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800"
              loading={loading}
              subtitle="Paid / Billed"
            />
            <KPICard
              label="Active Students"
              value={data.students?.activeStudents || 0}
              icon={<Users className="w-4 h-4 text-violet-600" />}
              iconBg="bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800"
              loading={loading}
            />
            <KPICard
              label="Flight Hours"
              value={`${data.flights?.totalFlyingHours || 0} hrs`}
              icon={<Plane className="w-4 h-4 text-sky-600" />}
              iconBg="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800"
              loading={loading}
            />
            <KPICard
              label="Fleet Available"
              value={data.fleet?.totalAircraft || 0}
              icon={<Gauge className="w-4 h-4 text-teal-600" />}
              iconBg="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800"
              loading={loading}
              subtitle={`${data.fleet?.openSquawks || 0} open squawks`}
            />
            <KPICard
              label="Overdue Invoices"
              value={data.financial?.overdueCount || 0}
              icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
              iconBg="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800"
              loading={loading}
              subtitle={data.financial?.overdueAmount ? `₹${data.financial.overdueAmount.toLocaleString()}` : null}
            />
          </div>

          {/* ═══════ Financial Overview ═══════ */}
          <SectionHeading
            icon={IndianRupee}
            title="Financial Overview"
            subtitle="Revenue trends and invoice breakdown"
            iconColor="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <ChartSkeleton /> : <RevenueBarChart data={data.financial?.monthlyRevenue} />}
            {loading ? <ChartSkeleton /> : <InvoiceStatusPieChart data={data.financial?.statusBreakdown} />}
          </div>

          {/* ═══════ Flight Operations ═══════ */}
          <SectionHeading
            icon={Plane}
            title="Flight Operations"
            subtitle="Slot activity and student enrollment trends"
            iconColor="bg-sky-50 dark:bg-sky-900/30 text-sky-600"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <ChartSkeleton /> : <SlotActivityLineChart data={data.flights?.slotActivity} />}
            {loading ? <ChartSkeleton /> : <StudentGrowthChart data={data.students?.monthlyJoins} />}
          </div>

          {/* ═══════ Academy & People ═══════ */}
          <SectionHeading
            icon={GraduationCap}
            title="Academy & People"
            subtitle="Course distribution and instructor workload"
            iconColor="bg-violet-50 dark:bg-violet-900/30 text-violet-600"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <ChartSkeleton /> : <CoursesByLevelChart data={data.courses?.studentsPerCourse} />}
            {loading ? <ChartSkeleton /> : <InstructorSlotsChart data={data.instructors?.slotsPerInstructor} />}
          </div>

          {/* ═══════ Fleet & Compliance ═══════ */}
          <SectionHeading
            icon={Shield}
            title="Fleet & Compliance"
            subtitle="Aircraft status and regulatory expiry alerts"
            iconColor="bg-teal-50 dark:bg-teal-900/30 text-teal-600"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <ChartSkeleton /> : <FleetStatusChart data={data.fleet} />}
            {loading ? <ChartSkeleton /> : <ComplianceAlerts data={data.compliance} />}
          </div>
        </div>
      )}
    </div>
  );
}
