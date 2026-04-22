import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import migrated components
import Header from '../components/Header';
import FlightCategoryCard from '../components/FlightCategoryCard';
import GoNoGoCard from '../components/GoNoGoCard';
import HistoryPanel from '../components/HistoryPanel';

const REFRESH_INTERVAL = 300; // 5 minutes in seconds
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function WeatherHoldsPage() {
  const [icao, setIcao] = useState('VOBG');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'info' });
  const [studentType, setStudentType] = useState('pre_solo');
  const [showHistory, setShowHistory] = useState(false);

  const [metarData, setMetarData] = useState(null);
  const [tafData, setTafData] = useState(null);
  const [goNoGoData, setGoNoGoData] = useState(null);
  const [atmosData, setAtmosData] = useState(null);

  const [tafError, setTafError] = useState('');
  const [atmosError, setAtmosError] = useState('');
  const [schedules, setSchedules] = useState([]);

  // Auto-refresh state
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const countdownRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ visible: true, msg, type });
    if (type !== 'error') {
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 6000);
    }
  };

  const handleSearch = useCallback(async (queryIcao) => {
    const targetIcao = queryIcao.toUpperCase().trim();
    setIcao(targetIcao);
    setLoading(true);
    setToast({ visible: false, msg: '', type: 'info' });

    setMetarData(null);
    setTafData(null);
    setAtmosData(null);
    setGoNoGoData(null);
    setTafError('');
    setAtmosError('');

    try {
      // Fetch METAR
      const metarRes = await fetch(`${API_BASE}/weather/metar/${targetIcao}`);
      const metarJson = await metarRes.json();

      if (metarJson.error) {
        showToast(`⚠️ ${metarJson.error}`, 'warn');
        setLoading(false);
        return;
      }
      setMetarData(metarJson);

      // Fetch TAF
      fetch(`${API_BASE}/weather/taf/${targetIcao}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) setTafError(data.error);
          else { setTafData(data); setTafError(''); }
        })
        .catch(err => setTafError(err.message));

      // Fetch Atmos if lat/lon available
      if (metarJson.lat && metarJson.lon) {
        fetch(`${API_BASE}/weather/openmeteo?lat=${metarJson.lat}&lon=${metarJson.lon}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) setAtmosError(data.error);
            else { setAtmosData(data); setAtmosError(''); }
          })
          .catch(err => setAtmosError(err.message));
      }

      // Fetch GoNoGo
      fetchGoNoGo(targetIcao, studentType);
      setCountdown(REFRESH_INTERVAL);

    } catch (err) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [studentType]);

  const fetchGoNoGo = async (queryIcao, sType) => {
    try {
      const res = await fetch(`${API_BASE}/weather/gonogo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icao: queryIcao,
          student_type: sType,
          source: 'dashboard'
        })
      });
      const data = await res.json();
      setGoNoGoData(data);
    } catch (err) {
      setGoNoGoData({ error: err.message });
    }
  };

  useEffect(() => {
    if (icao) {
      fetchGoNoGo(icao, studentType);
      fetchSchedules();
    }
  }, [studentType]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_BASE}/schedules`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    handleSearch(icao);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh || !icao) return;
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleSearch(icao);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [autoRefresh, icao, handleSearch]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="font-[Inter,system-ui,sans-serif] text-slate-900 dark:text-slate-100 min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 pb-10">
      <Header onSearch={handleSearch} stationId={metarData?.station_id} />

      <div className="flex justify-between items-center bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg border border-blue-500/20 dark:border-slate-700/50 px-4 py-3 mx-4 lg:mx-5 mb-4 rounded-xl shadow-sm text-sm text-slate-700 dark:text-slate-300">
        <div className="flex gap-3 items-center">
          <button
            className={`p-1.5 rounded-lg transition-colors ${autoRefresh ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄' : '⏸️'}
          </button>
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {autoRefresh ? `Auto-refresh in ${formatCountdown(countdown)}` : 'Auto-refresh paused'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <button className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm" onClick={() => setShowHistory(!showHistory)}>
            📋 {showHistory ? 'Hide History' : 'History'}
          </button>
          <button className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm" onClick={() => handleSearch(icao)}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-4 min-w-[300px]">
            <span className="text-xl">{toast.type === 'error' ? '🚫' : 'ℹ️'}</span>
            <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{toast.msg}</div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={() => setToast({ visible: false })}>✕</button>
          </div>
        </div>
      )}

      {showHistory ? (
        <HistoryPanel onClose={() => setShowHistory(false)} />
      ) : (
        <main className="max-w-4xl mx-auto p-4 lg:px-5">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FlightCategoryCard
                category={metarData?.flight_category}
                stationId={metarData?.station_id}
                obsTime={metarData?.obs_time}
                stationName={metarData?.name}
              />
              <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
                <span className="text-4xl mb-2">📍</span>
                <h2 className="text-xl font-bold">{metarData?.name || icao}</h2>
                <p className="text-slate-500 dark:text-slate-400">Current Station Observation</p>
                <div className="mt-4 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {metarData?.temperature_c}°C
                </div>
              </div>
            </div>

            <GoNoGoCard studentType={studentType} setStudentType={setStudentType} goNoGoData={goNoGoData} />
            
            {/* Minimal Slots Preview */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>📅</span> Upcoming Flight Slots
              </h3>
              {schedules.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">No active slots found.</p>
              ) : (
                <div className="space-y-3">
                  {schedules.slice(0, 3).map(slot => (
                    <div key={slot.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-sm">
                      <div>
                        <div className="font-bold">{slot.traineeName}</div>
                        <div className="text-xs text-slate-500">{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {slot.aircraftId}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${slot.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        {slot.status}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <a href="/flying-slots" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All Slots →</a>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4 px-10">
              <p>This dashboard provides a simplified safety overview based on real-time aviation reports. Always consult official briefing sources before flight.</p>
            </div>
          </div>
        </main>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <div className="font-semibold tracking-wide">Fetching weather data…</div>
        </div>
      )}
    </div>
  );
}
