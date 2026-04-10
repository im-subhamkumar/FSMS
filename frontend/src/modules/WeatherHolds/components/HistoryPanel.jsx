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
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 lg:p-8 overflow-y-auto" onClick={(e) => {if(e.target === e.currentTarget) onClose();}}>
      <div className="bg-white/90 backdrop-blur-2xl border border-white w-full max-w-6xl h-full lg:h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200/50 flex flex-wrap gap-4 items-center bg-white/50 shrink-0">
          <span className="text-2xl">📋</span>
          <span className="font-bold text-slate-800 text-lg sm:text-xl shrink-0">Weather Check History</span>
          <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1 ml-0 md:ml-6 overflow-x-auto">
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setView('list')}
            >
              Records
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${view === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setView('stats')}
            >
              Statistics
            </button>
          </div>
          <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex justify-center items-center font-bold text-slate-500 transition-colors ml-auto shrink-0" onClick={onClose}>✕</button>
        </div>

        {view === 'list' && (
          <>
            <form className="p-4 md:p-6 pb-0 flex flex-wrap gap-3 items-center shrink-0" onSubmit={handleFilter}>
              <input
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:border-blue-500 outline-none uppercase placeholder:normal-case font-mono"
                type="text"
                placeholder="Filter by ICAO (e.g. VOBG)"
                value={filter}
                onChange={(e) => setFilter(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="px-5 py-2 bg-blue-600 font-semibold text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm" type="submit">Filter</button>
              {filter && (
                <button className="px-5 py-2 bg-white font-semibold text-slate-600 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" type="button" onClick={() => { setFilter(''); fetchHistory(); }}>Clear</button>
              )}
            </form>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              {loading ? (
                <div className="text-center p-8 text-sm italic text-slate-400 bg-white/40 rounded-xl border border-dashed border-slate-200">Loading history…</div>
              ) : records.length === 0 ? (
                <div className="text-center p-8 text-sm italic text-slate-400 bg-white/40 rounded-xl border border-dashed border-slate-200">
                  No weather checks recorded yet. Go/No-Go decisions are automatically logged.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Time</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Airport</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Category</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Student</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Verdict</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Wind</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Vis</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">Ceiling</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-slate-200/50">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => {
                        const catColor = r.flight_category === 'VFR' ? 'text-vfr border-vfr/30 bg-vfr/10' :
                                         r.flight_category === 'MVFR' ? 'text-mvfr border-mvfr/30 bg-mvfr/10' :
                                         r.flight_category === 'IFR' ? 'text-ifr border-ifr/30 bg-ifr/10' :
                                         r.flight_category === 'LIFR' ? 'text-lifr border-lifr/30 bg-lifr/10' : 'text-slate-500 bg-slate-100 border-slate-200';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100 whitespace-nowrap">{formatTime(r.timestamp)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700 border-b border-slate-100">{r.icao}</td>
                            <td className="px-4 py-3 text-sm border-b border-slate-100">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catColor}`}>
                                {r.flight_category || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">{(r.student_type || '').replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-sm border-b border-slate-100">
                              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${r.verdict === 'GO' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                                {r.verdict || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 border-b border-slate-100">{r.wind_speed != null ? `${r.wind_speed} KT` : '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 border-b border-slate-100">{r.visibility_sm != null ? `${r.visibility_sm} SM` : '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-600 border-b border-slate-100">{r.ceiling_ft != null ? `${r.ceiling_ft.toLocaleString()} ft` : '—'}</td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-400 border-b border-slate-100">{r.checked_by || '—'}</td>
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
              <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-slate-700 mb-1">{stats.total_checks}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Checks</div>
              </div>
              <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-emerald-500 mb-1">{stats.go_count}</div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">GO Decisions</div>
              </div>
              <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-red-500 mb-1">{stats.nogo_count}</div>
                <div className="text-[11px] font-bold text-red-600 uppercase tracking-widest">NO-GO Decisions</div>
              </div>
              <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-blue-500 mb-1">{stats.go_percentage}%</div>
                <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">GO Rate</div>
              </div>
            </div>

            {stats.top_airports?.length > 0 && (
              <div className="mb-8">
                <div className="font-bold text-slate-800 text-lg mb-4">Top Airports</div>
                <div className="flex flex-col">
                  {stats.top_airports.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-white/50 border border-slate-200/50 rounded-xl mb-2 text-sm shadow-sm">
                      <span className="font-mono text-slate-400 px-2">#{i + 1}</span>
                      <span className="font-bold text-slate-700 min-w-[50px]">{a.icao}</span>
                      <span className="text-slate-500 text-xs hidden sm:block w-32 truncate">{a.station_name || '—'}</span>
                      <span className="font-semibold text-slate-600">{a.check_count} checks</span>
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
                <div className="font-bold text-slate-800 text-lg mb-4">Last 7 Days</div>
                <div className="flex flex-col">
                  {stats.daily_trend.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/50 border border-slate-200/50 rounded-xl mb-2 text-sm shadow-sm">
                      <span className="font-semibold text-slate-600 w-24">{d.date}</span>
                      <span className="text-slate-500">{d.checks} checks</span>
                      <span className="font-mono text-xs font-bold px-2 py-1 border rounded-md ml-auto text-emerald-600 border-emerald-200 bg-emerald-50">{d.go_count} GO</span>
                      <span className="font-mono text-xs font-bold px-2 py-1 border rounded-md text-red-600 border-red-200 bg-red-50">{d.nogo_count} NO-GO</span>
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
