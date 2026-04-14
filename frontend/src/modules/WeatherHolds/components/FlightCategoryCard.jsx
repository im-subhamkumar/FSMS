import React from 'react';

export default function FlightCategoryCard({ category, stationId, obsTime, stationName }) {
  const safeObsTime = obsTime ? (obsTime.endsWith('Z') ? obsTime : obsTime.replace(' ', 'T') + 'Z') : null;
  const formattedTime = safeObsTime ? `${new Date(safeObsTime).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })} Local` : 'No data loaded';

  const catColors = {
    VFR: 'text-vfr border-vfr bg-vfr/10 shadow-[0_0_15px_rgba(0,217,126,0.2)]',
    MVFR: 'text-mvfr border-mvfr bg-mvfr/10 shadow-[0_0_15px_rgba(77,166,255,0.2)]',
    IFR: 'text-ifr border-ifr bg-ifr/10 shadow-[0_0_15px_rgba(255,77,77,0.2)]',
    LIFR: 'text-lifr border-lifr bg-lifr/10 shadow-[0_0_15px_rgba(180,77,255,0.2)]',
    UNKNOWN: 'text-slate-400 border-slate-300 bg-slate-100/50'
  };

  const badgeStyle = catColors[category] || catColors['UNKNOWN'];

  const baseCardClass = "flex flex-col items-center justify-center p-8 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 rounded-2xl shadow-lg relative overflow-hidden text-center";

  if (!stationId) {
    return (
      <div className={baseCardClass}>
        <div className="font-mono text-3xl font-black text-slate-400 dark:text-slate-500 tracking-wider mb-4">—</div>
        <div className={`text-2xl font-black px-8 py-2 rounded-full border-2 mb-4 tracking-widest ${catColors['UNKNOWN']}`}>Enter ICAO</div>
        <div className="text-sm font-medium text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-700/50 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 mt-2">Awaiting search...</div>
      </div>
    );
  }

  return (
    <div className={baseCardClass}>
      <div className="font-mono text-4xl font-black text-slate-800 dark:text-white tracking-widest mb-5">{stationId}</div>
      <div className={`text-2xl font-black px-10 py-2.5 rounded-full border-2 mb-5 tracking-widest ${badgeStyle}`}>{category || '—'}</div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-700/40 px-5 py-2 rounded-lg border border-slate-200/60 dark:border-slate-600 shadow-sm mt-2">{obsTime ? `Observed: ${formattedTime}` : formattedTime}</div>
      {stationName && <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">{stationName}</div>}
    </div>
  );
}
