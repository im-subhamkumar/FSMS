import React, { useState, useMemo, useRef, useEffect } from 'react';

const AIRPORTS_DB = [
  { icao: 'VOMM', name: 'Chennai International', location: 'Chennai, India' },
  { icao: 'VOBL', name: 'Kempegowda International', location: 'Bengaluru, India' },
  { icao: 'VOBG', name: 'HAL Airport', location: 'Bengaluru, India' },
  { icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj Int', location: 'Mumbai, India' },
  { icao: 'VIDP', name: 'Indira Gandhi International', location: 'New Delhi, India' },
  { icao: 'VOCC', name: 'Cochin International', location: 'Kochi, India' },
  { icao: 'VOHS', name: 'Rajiv Gandhi International', location: 'Hyderabad, India' },
  { icao: 'VECC', name: 'Netaji Subhas Chandra Bose Int', location: 'Kolkata, India' },
  { icao: 'KJFK', name: 'John F. Kennedy Int', location: 'New York, USA' },
  { icao: 'EGLL', name: 'Heathrow Airport', location: 'London, UK' },
  { icao: 'OMDB', name: 'Dubai International', location: 'Dubai, UAE' }
];

export default function Header({ onSearch, isLive, stationId }) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed.length < 3) return;
    setIsFocused(false);
    onSearch(trimmed);
  };

  const handleSelectAirport = (icao) => {
    setInputValue(icao);
    setIsFocused(false);
    onSearch(icao);
  };

  const filteredAirports = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return AIRPORTS_DB;
    return AIRPORTS_DB.filter(a =>
      a.icao.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q)
    );
  }, [inputValue]);

  return (
    <header className="relative z-50 flex flex-col md:flex-row justify-between items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-b border-blue-500/20 dark:border-slate-700/50 px-6 py-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-3xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 w-12 h-12 flex items-center justify-center rounded-xl shadow-sm">✈</div>
        <div>
          <div className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">FSMS Weather</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Flight School Management System</div>
        </div>
      </div>
      <div className="flex-1 w-full md:w-auto my-4 md:my-0 md:mx-8 max-w-lg" ref={containerRef}>
        <form className="relative flex w-full tracking-wide z-50" onSubmit={handleSearch}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
          <input
            className="w-full pl-10 pr-32 py-2.5 bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl font-mono text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all uppercase placeholder:normal-case dark:placeholder:text-slate-400 relative z-50"
            type="text"
            placeholder="Enter ICAO code (e.g. VOBG, VABB)"
            maxLength="6"
            autoComplete="off"
            spellCheck="false"
            value={inputValue}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              setIsFocused(true);
            }}
          />
          <button className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white font-medium text-sm px-4 rounded-lg hover:bg-blue-700 transition-colors z-50" type="submit">Check</button>

          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-[60]">
              {filteredAirports.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">No airports found</div>
              ) : (
                filteredAirports.map(airport => (
                  <div
                    key={airport.icao}
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                    onClick={() => handleSelectAirport(airport.icao)}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{airport.icao}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{airport.location}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[140px] sm:max-w-xs text-right">{airport.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </form>
      </div>
      <div className="flex items-center">
        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full font-mono text-sm tracking-widest uppercase shadow-md">
          <span className={`w-2 h-2 rounded-full ${stationId ? 'bg-go-green shadow-[0_0_8px_#00e87a]' : 'bg-slate-500'}`}></span>
          <span>{stationId || 'No Active Station'}</span>
        </div>
      </div>
    </header>
  );
}
