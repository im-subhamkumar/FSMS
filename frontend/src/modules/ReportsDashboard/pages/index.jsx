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

import { IndianRupee, Users, Plane, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ReportsDashboardRoot() {
  // Default date filter: Last 30 Days
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

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Report Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Read-only operational and financial metrics.</p>
        </div>
      </div>
      
      <FilterBar dateRange={dateRange} setDateRange={setDateRange} data={data} />

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-5 border border-red-200 shadow-sm animate-fade-in">
          <p className="font-semibold text-base flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" /> Error Loading Data
          </p>
          <p className="text-xs mt-1 text-red-500">{error}</p>
          <button 
            onClick={refetch} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 hover:shadow-md transition-all text-xs font-medium"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard 
              label="Total Revenue" 
              value={`₹${data.financial?.totalRevenue?.toLocaleString() || 0}`} 
              icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50 border border-emerald-100"
              loading={loading} 
            />
            <KPICard 
              label="Active Students" 
              value={data.students?.activeStudents || 0} 
              icon={<Users className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50 border border-blue-100"
              loading={loading} 
            />
            <KPICard 
              label="Total Flight Hours" 
              value={`${data.flights?.totalFlyingHours || 0} hrs`} 
              icon={<Plane className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50 border border-indigo-100"
              loading={loading} 
            />
            <KPICard 
              label="Overdue Invoices" 
              value={data.financial?.overdueCount || 0} 
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              iconBg="bg-rose-50 border border-rose-100"
              loading={loading} 
            />
          </div>

          {/* Row 2: Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[320px]">
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <RevenueBarChart data={data.financial?.monthlyRevenue} />
             )}
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <InvoiceStatusPieChart data={data.financial?.statusBreakdown} />
             )}
          </div>

          {/* Row 3: Operations Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[320px]">
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <SlotActivityLineChart data={data.flights?.slotActivity} />
             )}
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <StudentGrowthChart data={data.students?.monthlyJoins} />
             )}
          </div>

          {/* Row 4: Course & Instructor Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[320px]">
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <CoursesByLevelChart data={data.courses?.studentsPerCourse} />
             )}
             {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center animate-pulse"><div className="h-full w-full bg-slate-50 opacity-50 rounded-xl"></div></div>
             ) : (
                <InstructorSlotsChart data={data.instructors?.slotsPerInstructor} />
             )}
          </div>
        </div>
      )}
    </div>
  );
}
