// T3 — useReports hook (T10-aligned + 2 new endpoints)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useReports() {
  const getFinancialSummary = async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/financial-summary${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('Failed to fetch financial summary');
    return res.json();
  };

  const getStatusBreakdown = async () => {
    const res = await fetch(`${API_BASE}/reports/invoice-status-breakdown`);
    if (!res.ok) throw new Error('Failed to fetch status breakdown');
    return res.json();
  };

  // T10 required: Monthly revenue for Line chart
  const getRevenueOverTime = async (months = 12) => {
    const res = await fetch(`${API_BASE}/reports/revenue-over-time?months=${months}`);
    if (!res.ok) throw new Error('Failed to fetch revenue data');
    return res.json();
  };

  const getTopStudents = async (limit = 10) => {
    const res = await fetch(`${API_BASE}/reports/top-students?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top students');
    return res.json();
  };

  const getOverdueInvoices = async () => {
    const res = await fetch(`${API_BASE}/reports/overdue-invoices`);
    if (!res.ok) throw new Error('Failed to fetch overdue invoices');
    return res.json();
  };

  // T10 required: Fleet utilization (hours per aircraft — T9 data)
  const getFleetUtilization = async () => {
    const res = await fetch(`${API_BASE}/reports/fleet-utilization`);
    if (!res.ok) throw new Error('Failed to fetch fleet data');
    return res.json();
  };

  // T10 required: Student enrollment funnel — T1 data
  const getStudentProgress = async () => {
    const res = await fetch(`${API_BASE}/reports/student-progress`);
    if (!res.ok) throw new Error('Failed to fetch student progress');
    return res.json();
  };

  return {
    getFinancialSummary,
    getStatusBreakdown,
    getRevenueOverTime,
    getTopStudents,
    getOverdueInvoices,
    getFleetUtilization,
    getStudentProgress,
  };
}
