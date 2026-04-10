import React from 'react';

const THRESHOLDS = {
  pre_solo: { wind: 10, gust: 5, crosswind: 5, label: 'Pre-Solo' },
  post_solo: { wind: 15, gust: 10, crosswind: 8, label: 'Post-Solo' },
  cross_country: { wind: 20, gust: 10, crosswind: 12, label: 'Cross-Country' },
  dual_cfi: { wind: 25, gust: 15, crosswind: null, label: 'Dual (with CFI)' },
};

export default function GoNoGoCard({ studentType, setStudentType, goNoGoData }) {
  const t = THRESHOLDS[studentType];

  const formatTimeSlot = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + 'Z';
  };

  return (
    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-5 mb-4 rounded-2xl shadow-lg relative z-10 flex flex-col h-full">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <span className="text-xl">🚦</span>
        <span className="font-bold text-slate-800 dark:text-white">Go / No-Go Decision</span>
      </div>

      {goNoGoData?.assigned_slots?.length > 0 && (
        <div className="assigned-slots-section">
          <div className="forecast-title" style={{ color: 'var(--accent-light)', marginBottom: '10px' }}>
            📍 Admin Assigned Slots
          </div>
          <div className="assigned-slots-grid">
            {goNoGoData.assigned_slots.map((slot, idx) => (
              <div key={idx} className={`assigned-slot-card ${slot.verdict}`}>
                <div className="assigned-slot-header">
                  <span className="assigned-slot-time">
                    {formatTimeSlot(slot.start)} – {formatTimeSlot(slot.end)}
                  </span>
                  <span className={`assigned-slot-badge ${slot.verdict}`}>
                    {slot.verdict}
                  </span>
                </div>
                <div className="assigned-slot-body">
                  <div className="assigned-slot-prob-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`circle ${slot.verdict}`} strokeDasharray={`${slot.probability}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.35" className="percentage">{slot.probability}%</text>
                    </svg>
                  </div>
                  <div className="assigned-slot-details">
                    <div className="assigned-slot-prob-lbl">Go Probability</div>
                    <div className="assigned-slot-reason">
                      {slot.reasons[0]}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/5 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 mb-6 mt-2">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">Student Type</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(THRESHOLDS).map(key => (
            <button
              key={key}
              className={`px-4 py-2 font-semibold text-sm rounded-lg border transition-all ${studentType === key ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'}`}
              onClick={() => setStudentType(key)}
            >
              {THRESHOLDS[key].label}
            </button>
          ))}
        </div>
      </div>

      {goNoGoData && !goNoGoData.error && (() => {
        const isCaution = goNoGoData.verdict === 'GO' && goNoGoData.warnings?.length > 0;
        const displayVerdict = isCaution ? 'CAUTION' : goNoGoData.verdict;
        const verdictStyle = displayVerdict === 'GO'
          ? 'text-go-green border-go-green bg-go-green/10 shadow-[0_0_20px_rgba(0,232,122,0.3)]'
          : displayVerdict === 'CAUTION'
            ? 'text-caution-yellow border-caution-yellow bg-caution-yellow/10 shadow-[0_0_20px_rgba(255,196,26,0.3)]'
            : 'text-nogo-red border-nogo-red bg-nogo-red/10 shadow-[0_0_20px_rgba(255,59,59,0.3)]';

        return (
          <div className="text-center mb-6 animate-pulse-once">
            <div className={`inline-block text-3xl font-black tracking-widest px-10 py-3 rounded-full border-4 shadow-lg ${verdictStyle}`}>
              {displayVerdict}
            </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-4">
              {displayVerdict === 'GO' ? `✅ Cleared for ${goNoGoData.student_label} operations` : (isCaution ? `⚠️ Marginal conditions for ${goNoGoData.student_label}` : `❌ Flight not recommended for ${goNoGoData.student_label}`)}
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between bg-white/40 dark:bg-slate-700/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 mb-4 shadow-sm divide-x divide-slate-200/60 dark:divide-slate-700">
        <div className="text-center flex-1 px-2"><div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Max Wind</div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.wind} KT</div></div>
        <div className="text-center flex-1 px-2"><div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Max Gust</div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.gust} KT</div></div>
        <div className="text-center flex-1 px-2"><div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Crosswind</div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.crosswind ? t.crosswind + ' KT' : 'A/C Limit'}</div></div>
      </div>

      <div className="flex flex-col gap-2 mb-2">
        {!goNoGoData && <div className="text-slate-400 dark:text-slate-500 text-center text-sm p-4 italic">Select a student type and search an airport to get a decision.</div>}
        {goNoGoData?.error && <div className="text-sm font-medium p-3 rounded-lg flex items-start border shadow-sm bg-nogo-red/10 text-red-700 dark:text-red-400 border-nogo-red/20 dark:border-nogo-red/40">Error: {goNoGoData.error}</div>}
        {goNoGoData?.reasons?.map((r, i) => (
          <div key={i} className={`text-sm font-medium p-3 rounded-lg flex items-start border shadow-sm ${r.startsWith('✅') ? 'bg-go-green/10 text-emerald-700 dark:text-emerald-400 border-go-green/20 dark:border-go-green/40' : 'bg-nogo-red/10 text-red-700 dark:text-red-400 border-nogo-red/20 dark:border-nogo-red/40'}`}>{r}</div>
        ))}
        {goNoGoData?.warnings?.map((w, i) => (
          <div key={'w' + i} className="text-sm font-medium p-3 rounded-lg flex items-start border shadow-sm bg-caution-yellow/10 text-amber-700 dark:text-amber-400 border-caution-yellow/20 dark:border-caution-yellow/40">{w}</div>
        ))}
      </div>

      {goNoGoData?.forecast_slots?.length > 0 && (
        <div className="mt-2">
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">📅 24-Hour Forecast Outlook</div>
          <div className="flex flex-col">
            {goNoGoData.forecast_slots.map((slot, idx) => (
              <div key={idx} className={`flex border bg-white/50 dark:bg-slate-700/20 rounded-xl overflow-hidden mb-2 shadow-sm transition-transform hover:-translate-y-0.5 ${slot.verdict === 'GO' ? 'border-go-green/30' : slot.verdict === 'CAUTION' ? 'border-caution-yellow/30' : 'border-nogo-red/30'}`}>
                <div className="bg-slate-800 dark:bg-slate-900 text-white font-mono text-xs font-bold p-3 flex items-center justify-center min-w-[70px] shrink-0">{formatTimeSlot(slot.time_from)}</div>
                <div className="p-3 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${slot.verdict === 'GO' ? 'bg-go-green/20 text-emerald-700 dark:text-emerald-400' : slot.verdict === 'CAUTION' ? 'bg-caution-yellow/20 text-amber-700 dark:text-amber-400' : 'bg-nogo-red/20 text-red-700 dark:text-red-400'}`}>
                      {slot.verdict === 'GO' && slot.probability < 100 ? 'PROB GO' : slot.verdict}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{slot.type}</span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mb-2 font-medium">{slot.summary}</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${slot.probability}%`, background: slot.verdict === 'GO' ? '#00d97e' : slot.verdict === 'CAUTION' ? '#ffc41a' : '#ff5f5f' }}></div></div>
                    {slot.probability}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
