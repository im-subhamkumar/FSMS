import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart3, RefreshCw, ChevronDown, Filter, X } from 'lucide-react';
import ExecutiveOverview from '../components/ExecutiveOverview';
import PerformanceAnalytics from '../components/PerformanceAnalytics';
import ProgressTracking from '../components/ProgressTracking';
import InstructorAnalyticsPanel from '../components/InstructorAnalyticsPanel';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SECTIONS = [
  { id: 'overview', label: '📊 Executive Overview' },
  { id: 'performance', label: '🎯 Performance' },
  { id: 'progress', label: '📈 Progress' },
  { id: 'instructors', label: '👨‍✈️ Instructors' },
];

export default function AnalyticsDashboardRoot() {
  // Data state
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [progress, setProgress] = useState(null);
  const [instructors, setInstructors] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  // Filter state
  const [range, setRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('daily');
  const [showFilters, setShowFilters] = useState(false);
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  // Filter options (populated from data)
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filterInstructor) params.set('instructorId', filterInstructor);

      const [sumRes, perfRes, progRes, instrRes] = await Promise.allSettled([
        axios.get(`${API}/analytics/summary`),
        axios.get(`${API}/analytics/performance?range=${range}&${params.toString()}`),
        axios.get(`${API}/analytics/progress?range=${range}&groupBy=${groupBy}`),
        axios.get(`${API}/analytics/instructors`),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data);
      if (progRes.status === 'fulfilled') {
        setProgress(progRes.value.data);
        // Extract batch options
        const batches = progRes.value.data?.batchProgress?.map(b => b.batch) || [];
        setBatchOptions(batches);
      }
      if (instrRes.status === 'fulfilled') {
        setInstructors(instrRes.value.data);
        // Extract instructor options
        const instrs = instrRes.value.data?.workload?.map(w => ({ id: w.id, name: w.name })) || [];
        setInstructorOptions(instrs);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, groupBy, filterInstructor]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => fetchAll(true), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setFilterInstructor('');
    setFilterBatch('');
    setRange('30d');
  };

  const hasActiveFilters = filterInstructor || filterBatch || range !== '30d';

  // Filter batch progress if batch filter active
  const filteredProgress = filterBatch
    ? { ...progress, batchProgress: progress?.batchProgress?.filter(b => b.batch === filterBatch) }
    : progress;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Training operations & performance insights
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-400">· Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
              showFilters || hasActiveFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>

          {/* Range selector */}
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── T4 Section 5: Filters & Controls ── */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filters & Controls</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Date Range</label>
              <select value={range} onChange={e => setRange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Instructor</label>
              <select value={filterInstructor} onChange={e => setFilterInstructor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">All Instructors</option>
                {instructorOptions.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Batch</label>
              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">All Batches</option>
                {batchOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Trend Grouping */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Group By</label>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Section Nav Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {SECTIONS.map(sec => (
          <button
            key={sec.id}
            onClick={() => scrollTo(sec.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── Section 1: Executive Overview ── */}
      <section id="section-overview">
        <SectionHeader number="1" title="Executive Overview" subtitle="Key performance indicators at a glance" />
        <ExecutiveOverview summary={summary} performance={performance} loading={loading} />
      </section>

      {/* ── Section 2: Performance Analytics ── */}
      <section id="section-performance">
        <SectionHeader number="2" title="Performance Analytics" subtitle="Trainee performance, completion rates, and pass/fail ratio" />
        <PerformanceAnalytics data={performance} loading={loading} />
      </section>

      {/* ── Section 3: Progress Tracking ── */}
      <section id="section-progress">
        <SectionHeader number="3" title="Progress Tracking" subtitle="Completion trends and training progress per batch" />
        <ProgressTracking data={filteredProgress} loading={loading} groupBy={groupBy} onGroupByChange={setGroupBy} />
      </section>

      {/* ── Section 4: Instructor Analytics ── */}
      <section id="section-instructors">
        <SectionHeader number="4" title="Instructor Analytics" subtitle="Performance scores, workload consistency, and department distribution" />
        <InstructorAnalyticsPanel data={instructors} loading={loading} />
      </section>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="mb-4 mt-2 flex items-center gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
