import React, { useState, useEffect } from 'react';

export default function HistoryPanel({ onClose }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'stats'

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async (icaoFilter = '') => {
    setLoading(true);
    try {
      const url = icaoFilter
        ? `/api/weather/history?icao=${icaoFilter}&limit=50`
        : '/api/weather/history?limit=50';
      const res = await fetch(url);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/weather/history/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchHistory(filter.toUpperCase());
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleString([], {
        month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 lg:p-8 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-white dark:border-slate-700/50 w-full max-w-6xl h-full lg:h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-4 items-center bg-white/50 dark:bg-slate-800/40 shrink-0">
          <span className="text-2xl">📋</span>
          <span className="font-bold text-slate-800 dark:text-white text-lg sm:text-xl shrink-0">Weather Check History</span>
          <div className="bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl flex gap-1 ml-0 md:ml-6 overflow-x-auto">
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              onClick={() => setView('list')}
            >
              Records
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${view === 'stats' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              onClick={() => setView('stats')}
            >
              Statistics
            </button>
          </div>
          <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex justify-center items-center font-bold text-slate-500 dark:text-slate-400 transition-colors ml-auto shrink-0" onClick={onClose}>✕</button>
        </div>

        {view === 'list' && (
          <>
            <form className="p-4 md:p-6 pb-0 flex flex-wrap gap-3 items-center shrink-0" onSubmit={handleFilter}>
              <input
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-full sm:w-64 focus:border-blue-500 dark:focus:border-blue-400 dark:text-white outline-none uppercase placeholder:normal-case font-mono"
                type="text"
                placeholder="Filter by ICAO (e.g. VOBG)"
                value={filter}
                onChange={(e) => setFilter(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="px-5 py-2 bg-blue-600 dark:bg-blue-500 font-semibold text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm" type="submit">Filter</button>
              {filter && (
                <button className="px-5 py-2 bg-white dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" type="button" onClick={() => { setFilter(''); fetchHistory(); }}>Clear</button>
              )}
            </form>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              {loading ? (
                <div className="text-center p-8 text-sm italic text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Loading history…</div>
              ) : records.length === 0 ? (
                <div className="text-center p-8 text-sm italic text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  No weather checks recorded yet. Go/No-Go decisions are automatically logged.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Time</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Airport</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Category</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Student</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Verdict</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Wind</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Vis</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">Ceiling</th>
                        <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50 dark:border-slate-700/50">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => {
                        const catColor = r.flight_category === 'VFR' ? 'text-vfr border-vfr/30 bg-vfr/10' :
                          r.flight_category === 'MVFR' ? 'text-mvfr border-mvfr/30 bg-mvfr/10' :
                            r.flight_category === 'IFR' ? 'text-ifr border-ifr/30 bg-ifr/10' :
                              r.flight_category === 'LIFR' ? 'text-lifr border-lifr/30 bg-lifr/10' : 'text-slate-500 bg-slate-100 border-slate-200';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">{formatTime(r.timestamp)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">{r.icao}</td>
                            <td className="px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-800">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catColor}`}>
                                {r.flight_category || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">{(r.student_type || '').replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-800">
                              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${r.verdict === 'GO' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'}`}>
                                {r.verdict || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{r.wind_speed != null ? `${r.wind_speed} KT` : '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{r.visibility_sm != null ? `${r.visibility_sm} SM` : '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{r.ceiling_ft != null ? `${r.ceiling_ft.toLocaleString()} ft` : '—'}</td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">{r.checked_by || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'stats' && stats && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-slate-700 dark:text-white mb-1">{stats.total_checks}</div>
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Checks</div>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400 mb-1">{stats.go_count}</div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">GO Decisions</div>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-red-500 dark:text-red-400 mb-1">{stats.nogo_count}</div>
                <div className="text-[11px] font-bold text-red-600 dark:text-red-500 uppercase tracking-widest">NO-GO Decisions</div>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-blue-500 dark:text-blue-400 mb-1">{stats.go_percentage}%</div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">GO Rate</div>
              </div>
            </div>

            {stats.top_airports?.length > 0 && (
              <div className="mb-8">
                <div className="font-bold text-slate-800 dark:text-white text-lg mb-4">Top Airports</div>
                <div className="flex flex-col">
                  {stats.top_airports.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl mb-2 text-sm shadow-sm">
                      <span className="font-mono text-slate-400 dark:text-slate-500 px-2">#{i + 1}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[50px]">{a.icao}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs hidden sm:block w-32 truncate">{a.station_name || '—'}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{a.check_count} checks</span>
                      <div className="flex-1 h-2 min-w-[100px] bg-slate-100 rounded-full overflow-hidden ml-4">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${(a.go_count / a.check_count) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.daily_trend?.length > 0 && (
              <div>
                <div className="font-bold text-slate-800 dark:text-white text-lg mb-4">Last 7 Days</div>
                <div className="flex flex-col">
                  {stats.daily_trend.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl mb-2 text-sm shadow-sm">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 w-24">{d.date}</span>
                      <span className="text-slate-500 dark:text-slate-400">{d.checks} checks</span>
                      <span className="font-mono text-xs font-bold px-2 py-1 border rounded-md ml-auto text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">{d.go_count} GO</span>
                      <span className="font-mono text-xs font-bold px-2 py-1 border rounded-md text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">{d.nogo_count} NO-GO</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'stats' && !stats && (
          <div className="text-center p-8 text-sm italic text-slate-400 flex-1">Loading statistics…</div>
        )}
      </div>
    </div>
  );
}
