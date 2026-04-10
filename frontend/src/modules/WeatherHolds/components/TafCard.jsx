import React from 'react';

export default function TafCard({ tafData, error, isLoading }) {
  const formatTafTime = (epoch) => {
    if (!epoch) return '?';
    try {
      const d = new Date(epoch * 1000);
      return `${d.getUTCDate()}/${String(d.getUTCHours()).padStart(2,'0')}Z`;
    } catch { return '?'; }
  };

  const renderContent = () => {
    const placeholderClass = "text-center p-6 text-sm font-medium text-slate-500 bg-white/50 border border-slate-200 rounded-xl";
    if (isLoading) return <div className={placeholderClass}>Loading TAF forecast…</div>;
    if (error) return <div className={`${placeholderClass} text-nogo-red border-red-200 bg-red-50/50`}>{error}</div>;
    if (!tafData?.fcsts) return <div className={placeholderClass}>Enter a valid ICAO code to load forecasts.</div>;

    return tafData.fcsts.map((f, idx) => {
      const timeLabel = f.timeFrom && f.timeTo
        ? `${formatTafTime(f.timeFrom)} – ${formatTafTime(f.timeTo)}`
        : (f.changeIndicator || 'FM');

      const parts = [];
      if (f.wdir != null && f.wspd != null) parts.push(`Wind ${f.wdir === 0 && f.wspd === 0 ? 'Calm' : `${f.wdir}° @ ${f.wspd}KT${f.wgst ? ` G${f.wgst}KT` : ''}`}`);
      if (f.visib != null) parts.push(`Vis ${f.visib === '+9999' ? '10+' : f.visib} SM`);
      if (f.clouds && f.clouds.length > 0) parts.push(f.clouds.map(c => `${c.cover}${c.base}00ft`).join(' '));
      if (f.wxString) parts.push(f.wxString);
      if (f.changeIndicator) parts.push(`[${f.changeIndicator}]`);

      return (
        <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 bg-white/40 border border-slate-200/50 rounded-xl transition-colors hover:bg-white/60">
          <div className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit sm:w-28 shrink-0 border border-blue-500/10 flex items-center justify-center">{timeLabel}</div>
          <div className="text-sm font-semibold text-slate-700 leading-relaxed">{parts.join(' · ') || 'No changes'}</div>
        </div>
      );
    });
  };

  const badgeText = tafData?.fcsts ? `Valid ${formatTafTime(tafData.validTimeFrom)} – ${formatTafTime(tafData.validTimeTo)}` : '—';

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-blue-500/20 p-5 mb-4 rounded-2xl shadow-lg relative z-10">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/50">
        <span className="text-xl">📋</span>
        <span className="font-bold text-slate-800">TAF Forecast</span>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded-md shadow-sm">{badgeText}</span>
      </div>
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
}
