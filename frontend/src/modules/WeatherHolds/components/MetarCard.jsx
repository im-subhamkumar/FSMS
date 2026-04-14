import React from 'react';

export default function MetarCard({ metarData }) {
  const glassCardClasses = "bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-5 mb-4 rounded-2xl shadow-lg relative z-10";
  const headerClasses = "flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-700/50";

  if (!metarData) {
    return (
      <div className={glassCardClasses}>
        <div className={headerClasses}>
          <span className="text-xl">📡</span>
          <span className="font-bold text-slate-800 dark:text-white">Live METAR</span>
          <span className="ml-auto text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">—</span>
        </div>
        <div className="font-mono text-sm leading-relaxed p-4 bg-slate-100/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200/50 dark:border-slate-600">No data — search an airport above.</div>
      </div>
    );
  }

  const windDir = metarData.wind_dir === 'VRB' ? 'VRB' : (metarData.wind_dir ? metarData.wind_dir + '°' : '—');
  const windSpeed = metarData.wind_speed != null ? metarData.wind_speed : '—';
  const windUnit = metarData.wind_unit || 'KT';
  const vis = metarData.visibility_sm;
  const ceil = metarData.ceiling_ft;
  const temp = metarData.temperature_c != null ? `${metarData.temperature_c}°C` : '—';
  const dew = metarData.dewpoint_c != null ? `/ ${metarData.dewpoint_c}°C` : '';
  const alt = metarData.altimeter_inhg ? `${metarData.altimeter_inhg.toFixed(2)} inHg` : '—';

  const safeObsTime = metarData.obs_time ? (metarData.obs_time.endsWith('Z') ? metarData.obs_time : metarData.obs_time.replace(' ', 'T') + 'Z') : null;
  const d = safeObsTime ? new Date(safeObsTime) : null;
  const formattedAge = d ? `${d.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })} Local` : 'Live';

  return (
    <div className={glassCardClasses}>
      <div className={headerClasses}>
        <span className="text-xl">📡</span>
        <span className="font-bold text-slate-800 dark:text-white">Live METAR</span>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-md shadow-sm">{formattedAge}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Wind</div>
          <div className="text-[15px] font-bold text-blue-500">{`${windDir} @ ${windSpeed} ${windUnit}`}</div>
        </div>
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Gust</div>
          <div className="text-[15px] font-bold text-blue-500">{metarData.wind_gust ? `${metarData.wind_gust} ${windUnit}` : 'None'}</div>
        </div>
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Visibility</div>
          <div className={`text-[15px] font-bold ${vis != null && vis < 3 ? 'text-nogo-red' : vis < 5 ? 'text-caution-yellow' : 'text-blue-500'}`}>
            {vis != null ? `${vis} SM` : '—'}
          </div>
        </div>
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Ceiling</div>
          <div className={`text-[15px] font-bold ${ceil != null && ceil < 1000 ? 'text-nogo-red' : ceil < 3000 ? 'text-caution-yellow' : 'text-blue-500'}`}>
            {ceil != null ? `${ceil.toLocaleString()} ft` : 'Unreported'}
          </div>
        </div>
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Temperature</div>
          <div className="text-[15px] font-bold text-blue-500">{`${temp} ${dew}`}</div>
        </div>
        <div className="bg-white/40 dark:bg-slate-700/40 border border-blue-500/20 dark:border-slate-600 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Altimeter</div>
          <div className="text-[15px] font-bold text-blue-500">{alt}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {metarData.hazards && metarData.hazards.map((h, i) => (
          <span key={i} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-md text-xs font-bold shadow-sm">{`${h.code} – ${h.label}`}</span>
        ))}
      </div>
      <div className="font-mono text-[13px] leading-relaxed p-4 bg-slate-900/5 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 rounded-xl break-words border border-slate-900/10 dark:border-slate-700 shadow-inner">{metarData.raw || 'No raw data available'}</div>
    </div>
  );
}
