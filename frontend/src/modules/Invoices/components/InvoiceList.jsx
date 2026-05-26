// ---------------------------------------------------------------------------
// InvoiceList.jsx -- Main invoice listing page
//
// Displays a paginated table of invoices with KPI summary cards, search bar,
// status filter dropdown, and hover-reveal edit/delete actions. Pagination
// is client-side with 10 items per page.
//
// Role-based view differences:
//   - Admin/Staff: See all invoices. "Student" column visible. Create button
//     and edit/delete hover actions available. Search matches invoice #,
//     student name, and email.
//   - Student: See only own invoices (filtered by backend). "Description"
//     column replaces "Student" column. Create button and edit/delete actions
//     hidden. Search matches invoice # and line item descriptions.
//
// The isStudent flag is derived from useAppStore().user.role and controls
// all conditional rendering throughout this component.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight, ChevronLeft, Filter, RefreshCw, FileText, Edit2, Trash2 } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useAppStore } from '../../../store/useAppStore';
import StatusBadge from './StatusBadge';
import InvoiceStats from './InvoiceStats';

// 3-status filter
const STATUS_OPTIONS = ['', 'PENDING', 'PAID', 'OVERDUE'];
const PER_PAGE = 10;

const fmt     = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(parseFloat(val) || 0);
const fmtDate = (d)   => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { getInvoices, getStats, deleteInvoice } = useInvoices();
  const { user } = useAppStore();
  const isStudent = user?.role === 'Student';

  const [invoices,     setInvoices]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error,        setError]        = useState(null);

  // Filters
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');

  // Pagination (from Student module pattern)
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setStatsLoading(true);
    setError(null);
    try {
      const filters = {};
      if (statusFilter) filters.status   = statusFilter;
      if (fromDate)     filters.from     = fromDate;
      if (toDate)       filters.to       = toDate;

      const [data, statsData] = await Promise.all([getInvoices(filters), getStats()]);
      setInvoices(data);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [statusFilter, fromDate, toDate]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, fromDate, toDate]);

  // Stat card click → filter by status
  const handleFilterByStatus = (status) => {
    setStatusFilter(status);
  };

  // Client-side search — students search by invoice # and description;
  // admins search by invoice #, student name, and email
  const filtered = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchInvoice = (inv.invoiceNumber || '').toLowerCase().includes(q);
    if (isStudent) {
      const desc = (inv.items || []).map(it => (it.description || '').toLowerCase()).join(' ');
      return matchInvoice || desc.includes(q);
    }
    const studentName = `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`.toLowerCase();
    return (
      matchInvoice ||
      studentName.includes(q) ||
      (inv.student?.email || '').toLowerCase().includes(q)
    );
  });

  // Pagination calculations (from Student module)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const first = (page - 1) * PER_PAGE;
  const last  = first + PER_PAGE;
  const paginated = filtered.slice(first, last);

  // Delete handler with confirmation
  const handleDelete = async (e, inv) => {
    e.stopPropagation();
    if (!confirm(`Delete invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await deleteInvoice(inv.id);
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isStudent ? 'My Invoices' : 'Invoices'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isStudent ? 'View your billing and payment records' : 'Manage student billing and payment records'}
          </p>
        </div>
        {/* Create Invoice — Admin/Staff only */}
        {!isStudent && (
          <button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 font-semibold text-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        )}
      </div>

      {/* T10 required: Financial Summary row — now with click-to-filter */}
      <InvoiceStats
        stats={stats}
        loading={statsLoading}
        activeFilter={statusFilter}
        onFilterByStatus={handleFilterByStatus}
        isStudent={isStudent}
      />

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isStudent ? 'Search by invoice # or description…' : 'Search invoice #, student name, email…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </div>

        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all"
        />

        <button onClick={fetchData}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Searchable invoice table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-1">
        {error ? (
          <div className="flex flex-col items-center justify-center h-48 text-red-500 gap-2">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="text-sm underline">Retry</button>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Enhanced empty state — pattern from Student module */
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold">No invoices found</p>
            <p className="text-sm">Adjust your filters or create a new invoice.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['Invoice #', ...(isStudent ? ['Description'] : ['Student']), 'Issued Date', 'Due Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {paginated.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      {isStudent ? (
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                            {inv.items?.[0]?.description || '—'}
                          </span>
                          {inv.items?.length > 1 && (
                            <span className="text-xs text-gray-400"> +{inv.items.length - 1} more</span>
                          )}
                        </td>
                      ) : (
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {inv.student?.firstName} {inv.student?.lastName}
                            </span>
                            <span className="text-xs text-gray-400">{inv.student?.email}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtDate(inv.issuedDate)}</td>
                      <td className={`px-5 py-3 text-sm ${inv.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{fmt(inv.amount)}</span>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      {/* Hover-reveal quick actions — Admin/Staff only */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isStudent && inv.status === 'PENDING' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}/edit`); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, inv)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer — pattern from Student module StudentsRoot */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length > 0 ? first + 1 : 0}</span> to{' '}
                <span className="font-medium text-gray-900 dark:text-white">{Math.min(last, filtered.length)}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> invoices
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
