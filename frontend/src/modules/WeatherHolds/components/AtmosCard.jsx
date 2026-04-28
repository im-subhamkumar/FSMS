import React from 'react';

export default function AtmosCard({ atmosData, error, isLoading }) {
  const renderContent = () => {
    const placeholderClass = "text-center p-6 text-sm italic text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-700/20 rounded-xl border border-dashed border-slate-400/40 dark:border-slate-600/40";
    if (isLoading) return <div className={placeholderClass}>Loading atmospheric data…</div>;
    if (error) return (
      <div className={`${placeholderClass} !border-amber-500/40`}>
        <div className="text-2xl mb-2">⚠️</div>
        <div className="text-amber-500 dark:text-amber-400 font-semibold">Weather Service Error</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {error.includes('unavailable') ? 'Both primary and fallback services are down. Retrying...' : error}
        </div>
      </div>
    );
    if (!atmosData) return <div className={placeholderClass}>Atmospheric data loads after airport search.</div>;

    const cw = atmosData.current_weather || {};
    const hourly = atmosData.hourly || {};
    const idx = 0;

    const safeHourly = (key) => {
      const arr = hourly[key];
      const val = Array.isArray(arr) && arr.length > idx ? arr[idx] : null;
      if (val === null) return 'N/A';
      return val;
    };

    const formatVal = (val, unit) => {
      if (val === null || val === undefined || val === 'N/A') return 'N/A';
      return `${val} ${unit}`;
    };

    const items = [
      { lbl: 'Temperature', val: formatVal(cw.temperature, '°C'), sub: 'Current' },
      { lbl: 'Wind Speed', val: formatVal(cw.windspeed, 'km/h'), sub: 'Current' },
      { lbl: 'Wind Direction', val: formatVal(cw.winddirection, '°'), sub: 'Current' },
      { lbl: 'Cloud Cover', val: formatVal(safeHourly('cloudcover') !== 'N/A' ? safeHourly('cloudcover') : null, '%'), sub: 'Hourly' },
      { lbl: 'Visibility', val: safeHourly('visibility') !== 'N/A' ? `${(safeHourly('visibility') / 1000).toFixed(1)} km` : 'N/A', sub: 'Hourly' },
      { lbl: 'Precipitation', val: formatVal(safeHourly('precipitation') !== 'N/A' ? safeHourly('precipitation') : null, 'mm'), sub: 'Hourly' },
      { lbl: 'Wind (80m)', val: formatVal(safeHourly('windspeed_80m') !== 'N/A' ? safeHourly('windspeed_80m') : null, 'km/h'), sub: 'Upper level' },
    ];

    return items.map((i, idx) => (
      <div key={idx} className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/10 dark:border-slate-600/30 rounded-xl p-3 text-center shadow-sm">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{i.lbl}</div>
        <div className="text-lg font-extrabold text-blue-500 dark:text-blue-400 mb-0.5">{i.val}</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{i.sub}</div>
      </div>
    ));
  };

  const provider = atmosData?.provider || 'Atmospheric';

  return (
    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-5 mb-4 rounded-2xl shadow-lg relative z-10">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <span className="text-xl">🌡️</span>
        <span className="font-bold text-slate-800 dark:text-white">Atmos Data</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${provider === 'MET Norway' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
          {provider}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {renderContent()}
      </div>
    </div>
  );
}
