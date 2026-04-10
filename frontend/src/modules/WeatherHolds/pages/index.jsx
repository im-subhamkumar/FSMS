import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import migrated components
import Header from '../components/Header';
import FlightCategoryCard from '../components/FlightCategoryCard';
import MetarCard from '../components/MetarCard';
import TafCard from '../components/TafCard';
import RadarMap from '../components/RadarMap';
import GoNoGoCard from '../components/GoNoGoCard';
import AtmosCard from '../components/AtmosCard';
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
    if (icao) fetchGoNoGo(icao, studentType);
  }, [studentType]);

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
    <div className="font-[Inter,system-ui,sans-serif] text-slate-900 min-h-screen bg-gradient-to-br from-slate-50 to-white pb-10">
      <Header onSearch={handleSearch} stationId={metarData?.station_id} />

      <div className="flex justify-between items-center bg-white/70 backdrop-blur-lg border border-blue-500/20 px-4 py-3 mx-4 lg:mx-5 mb-4 rounded-xl shadow-sm text-sm text-slate-700">
        <div className="flex gap-3 items-center">
          <button
            className={`p-1.5 rounded-lg transition-colors ${autoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 hover:bg-slate-200'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄' : '⏸️'}
          </button>
          <span className="font-medium text-slate-600">
            {autoRefresh ? `Auto-refresh in ${formatCountdown(countdown)}` : 'Auto-refresh paused'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm" onClick={() => setShowHistory(!showHistory)}>
            📋 {showHistory ? 'Hide History' : 'History'}
          </button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm" onClick={() => handleSearch(icao)}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-xl rounded-xl p-4 min-w-[300px]">
            <span className="text-xl">{toast.type === 'error' ? '🚫' : 'ℹ️'}</span>
            <div className="flex-1 text-sm font-medium text-slate-700">{toast.msg}</div>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setToast({ visible: false })}>✕</button>
          </div>
        </div>
      )}

      {showHistory ? (
        <HistoryPanel onClose={() => setShowHistory(false)} />
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-[360px_1fr_360px] gap-4 p-4 lg:px-5">
          <section className="flex flex-col gap-4">
            <FlightCategoryCard
              category={metarData?.flight_category}
              stationId={metarData?.station_id}
              obsTime={metarData?.obs_time}
              stationName={metarData?.name}
            />
            <MetarCard metarData={metarData} />
            <TafCard tafData={tafData} error={tafError} isLoading={loading && !tafData} />
          </section>

          <section className="flex flex-col gap-4 h-[500px] lg:h-auto">
            <RadarMap lat={metarData?.lat} lon={metarData?.lon} stationId={metarData?.station_id} />
          </section>

          <section className="flex flex-col gap-4">
            <GoNoGoCard studentType={studentType} setStudentType={setStudentType} goNoGoData={goNoGoData} />
            <AtmosCard atmosData={atmosData} error={atmosError} isLoading={loading && !atmosData} />
          </section>
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
