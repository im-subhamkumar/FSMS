import React, { useState, useEffect, useMemo } from 'react';
import {
    PlaneTakeoff, Search, Clock, Plane,
    CheckCircle2, XCircle, User, Calendar,
    AlertCircle, LayoutDashboard, ArrowRight, Filter,
    History, Cloudy, Wind, Thermometer, Eye
} from 'lucide-react';

import { DispatchHistory } from '../components/DispatchHistory';

export default function DispatchBoardRoot() {
    const [view, setView] = useState('LIVE'); // 'LIVE' or 'HISTORY'
    const [slots, setSlots] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [flightTypeFilter, setFlightTypeFilter] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const [interventionMode, setInterventionMode] = useState(null);
    const [weather, setWeather] = useState(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);

    const todayDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchSlots();
        fetchWeather();

        // Update time every second for absolute real-time status shifts
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);

        // Update weather every 5 minutes
        const weatherTimer = setInterval(fetchWeather, 300000);

        return () => {
            clearInterval(timer);
            clearInterval(weatherTimer);
        };
    }, []);

    const fetchWeather = async () => {
        try {
            setIsWeatherLoading(true);
            // Defaulting to VIDP (Delhi) for this board, can be made dynamic
            const response = await fetch('http://localhost:3000/api/weather/metar/VIDP');
            const data = await response.json();
            if (data && !data.error) {
                setWeather(data);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const fetchSlots = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:3000/api/schedules');
            const data = await response.json();

            if (Array.isArray(data)) {
                // Map the Schedule model data to the format used by the UI
                const mappedData = data.map(s => {
                    const startDate = new Date(s.startTime);
                    const endDate = new Date(s.endTime);

                    const localDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
                    const localStartTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
                    const localEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

                    return {
                        id: s.id,
                        date: localDate,
                        startTime: localStartTime,
                        endTime: localEndTime,
                        student: s.traineeName || `Trainee #${s.traineeId}`,
                        instructor: s.instructorName || `Instructor #${s.instructorId}`,
                        aircraft: s.aircraftId,
                        flightType: s.flightType || 'Dual',
                        status: s.status,
                        notes: s.cancellationReason || '',
                        weatherVerdict: s.weatherVerdict,
                        extremeWeatherWarning: s.extremeWeatherWarning
                    };
                });

                // Sort by time
                const sorted = mappedData.sort((a, b) => a.startTime.localeCompare(b.startTime));
                setSlots(sorted);
            } else {
                setSlots([]);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            setSlots([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAbortMission = async (slotId, reason) => {
        try {
            // Get the current slot to preserve other fields for PUT request
            const slot = slots.find(s => s.id === slotId);
            if (!slot) return;

            const response = await fetch(`http://localhost:3000/api/schedules/${slotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...slot,
                    status: 'CANCELLED',
                    cancellationReason: `MISSION ABORTED: ${reason}. (Logged: ${currentTime})`
                })
            });
            if (response.ok) {
                await fetchSlots();
                setInterventionMode(null);
            }
        } catch (error) {
            console.error('Error aborting mission:', error);
        }
    };

    // Helper to determine the effective status of a slot based on time
    const getSlotEffectiveStatus = (slot) => {
        const rawStatus = (slot.status || "SCHEDULED").toUpperCase();
        if (rawStatus === 'CANCELLED' || rawStatus === 'COMPLETED') return rawStatus;

        // Check for Emergency in notes (High Priority)
        if (slot.notes?.toUpperCase().includes('EMERGENCY')) return 'EMERGENCY';

        const isToday = slot.date === todayDate;
        const isPastDate = slot.date < todayDate;
        
        // Use only HH:mm for comparison with slot times
        const timeForComparison = currentTime.substring(0, 5);
        const isPastTimeToday = isToday && timeForComparison > slot.endTime;
        const isFlightInAir = isToday && timeForComparison >= slot.startTime && timeForComparison <= slot.endTime;

        if (isPastDate || isPastTimeToday) return 'COMPLETED';
        if (isFlightInAir) return 'AIRBORNE';

        return 'SCHEDULED';
    };

    // Calculate Today's Stats
    const stats = useMemo(() => {
        const todaySlots = slots.filter(s => s.date === todayDate);
        const processedSlots = todaySlots.map(s => ({ ...s, effectiveStatus: getSlotEffectiveStatus(s) }));

        return {
            total: todaySlots.length,
            scheduled: processedSlots.filter(s => s.effectiveStatus === 'SCHEDULED' || s.effectiveStatus === 'AWAITING').length,
            airborne: processedSlots.filter(s => s.effectiveStatus === 'AIRBORNE').length,
            completed: processedSlots.filter(s => s.effectiveStatus === 'COMPLETED').length,
            overdue: processedSlots.filter(s => s.effectiveStatus === 'OVERDUE').length,
            cancelled: processedSlots.filter(s => s.effectiveStatus === 'CANCELLED').length
        };
    }, [slots, todayDate, currentTime]);

    // Filtering for TODAY + Search + Status
    const filteredSlots = slots.filter(slot => {
        if (slot.date !== todayDate) return false;

        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            (slot.student || "").toLowerCase().includes(query) ||
            (slot.instructor || "").toLowerCase().includes(query) ||
            (slot.aircraft || "").toLowerCase().includes(query) ||
            (slot.status || "").toLowerCase().includes(query) ||
            (slot.flightType || "").toLowerCase().includes(query)
        );

        const effectiveStatus = getSlotEffectiveStatus(slot);

        const matchesStatus = statusFilter === 'ALL' || statusFilter === effectiveStatus;
        const matchesFlightType = flightTypeFilter === 'ALL' || (slot.flightType || 'Dual').toUpperCase() === flightTypeFilter;

        return matchesSearch && matchesStatus && matchesFlightType;
    });

    return (
        <div className="p-6 md:p-8 space-y-8 bg-gray-50/50 dark:bg-slate-900 min-h-full">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <PlaneTakeoff className="text-indigo-500" size={32} />
                        {view === 'LIVE' ? 'Dispatch Operations' : 'Flight Archives'}
                    </h1>

                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Switcher Button in Top Right */}
                    <button
                        onClick={() => setView(view === 'LIVE' ? 'HISTORY' : 'LIVE')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border ${view === 'LIVE'
                            ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 shadow-indigo-500/20'
                            }`}
                    >
                        {view === 'LIVE' ? <History size={18} /> : <LayoutDashboard size={18} />}
                        {view === 'LIVE' ? 'View History' : 'Live Board'}
                    </button>

                    {view === 'LIVE' && (
                        <div className="hidden sm:flex items-center gap-4">
                            <div className="px-5 py-2.5 bg-slate-900 dark:bg-indigo-500/10 rounded-xl border border-slate-700 dark:border-indigo-500/20 flex items-center gap-3">
                                <Clock size={18} className="text-indigo-400 animate-pulse" />
                                <span className="text-sm font-mono font-black text-white dark:text-indigo-400 tracking-wider">
                                    {currentTime}
                                </span>
                            </div>
                            <div className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500" />
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {view === 'LIVE' && (
                <WeatherStrip weather={weather} isLoading={isWeatherLoading} />
            )}

            {view === 'HISTORY' ? (
                <DispatchHistory currentTime={currentTime} todayDate={todayDate} />
            ) : (
                <>
                    {/* SUMMARY STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <StatCard
                            icon={<Plane size={20} className="text-blue-600 dark:text-blue-400" />}
                            label="Today's Total"
                            value={stats.total}
                            color="blue"
                        />
                        <StatCard
                            icon={<PlaneTakeoff size={20} className="text-indigo-600 dark:text-indigo-400" />}
                            label="Airborne"
                            value={stats.airborne}
                            color="indigo"
                            alert={stats.airborne > 0}
                        />
                        <StatCard
                            icon={<Clock size={20} className="text-amber-600 dark:text-amber-400" />}
                            label="On Ground"
                            value={stats.scheduled}
                            color="amber"
                        />
                        <StatCard
                            icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
                            label="Completed"
                            value={stats.completed}
                            color="emerald"
                        />
                        <StatCard
                            icon={<AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />}
                            label="Overdue / Risk"
                            value={stats.overdue}
                            color="rose"
                            alert={stats.overdue > 0}
                        />
                        <StatCard
                            icon={<XCircle size={20} className="text-slate-600 dark:text-slate-400" />}
                            label="Cancelled"
                            value={stats.cancelled}
                            color="slate"
                        />
                    </div>

                    {/* MAIN DATA TABLE */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                        {/* SEARCH & FILTER BAR PANEL */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col xl:flex-row items-center gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="relative w-full max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    placeholder="Search by student, instructor, aircraft or status..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm shadow-sm"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm hover:border-indigo-500/50 transition-all group w-full sm:w-auto">
                                    <Filter size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-transparent border-none text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 outline-none cursor-pointer w-full sm:w-40"
                                    >
                                        <option value="ALL">All Statuses ({stats.total})</option>
                                        <option value="AIRBORNE">Airborne ({stats.airborne})</option>
                                        <option value="SCHEDULED">Scheduled ({stats.scheduled})</option>
                                        <option value="COMPLETED">Completed ({stats.completed})</option>
                                        <option value="CANCELLED">Cancelled ({stats.cancelled})</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm hover:border-blue-500/50 transition-all group w-full sm:w-auto">
                                    <Plane size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <select
                                        value={flightTypeFilter}
                                        onChange={(e) => setFlightTypeFilter(e.target.value)}
                                        className="bg-transparent border-none text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 outline-none cursor-pointer w-full sm:w-40"
                                    >
                                        <option value="ALL">All Flight Modes</option>
                                        <option value="DUAL">Dual Instruction</option>
                                        <option value="SOLO">Solo Operations</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4">Time Slot</th>
                                        <th className="px-6 py-4">Instructor</th>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Aircraft</th>
                                        <th className="px-6 py-4">Mode</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                                    <span className="text-slate-500 font-medium">Syncing flight data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredSlots.length > 0 ? (
                                        filteredSlots.map((slot) => (
                                            <tr key={slot.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono font-bold">
                                                        <span>{slot.startTime}</span>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                        <span>{slot.endTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={16} className="text-indigo-400" />
                                                        <span className="font-semibold text-slate-900 dark:text-white">{slot.instructor}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                                                            {slot.student?.[0]}
                                                        </div>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{slot.student}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                                        <Plane size={14} className="text-indigo-500" />
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{slot.aircraft}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${slot.flightType?.toUpperCase() === 'SOLO'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                        }`}>
                                                        {slot.flightType || 'Dual'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <StatusBadge status={getSlotEffectiveStatus(slot)} />
                                                        {(getSlotEffectiveStatus(slot) === 'AIRBORNE' || getSlotEffectiveStatus(slot) === 'OVERDUE' || getSlotEffectiveStatus(slot) === 'SCHEDULED') && (
                                                            <button
                                                                onClick={() => setInterventionMode(slot)}
                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                title="Emergency / Abort Mission"
                                                            >
                                                                <AlertCircle size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                        <LayoutDashboard size={40} className="text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold">No Operations Found</p>
                                                        <p className="text-sm text-slate-500">Either no flights are active, or they don't match your filters.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* PROBLEM DETAIL / CANCELLATION MODAL */}
            {interventionMode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInterventionMode(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4 text-rose-600 dark:text-rose-400">
                                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl ring-2 ring-rose-500/20">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Safety Alert</h2>
                                    <p className="text-sm font-bold text-slate-500 opacity-70 italic">Operational Issues Detected</p>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Detected Problem</label>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {interventionMode.notes || interventionMode.extremeWeatherWarning || (interventionMode.weatherVerdict === 'NO-GO' ? 'Adverse weather conditions detected for this slot.' : 'No specific discrepancy logged, but safety threshold reached.')}
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">

                                <button
                                    onClick={() => setInterventionMode(null)}
                                    className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-2xl font-bold text-xs transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WeatherStrip({ weather, isLoading }) {
    if (!weather && !isLoading) return null;

    const getCategoryColor = (cat) => {
        switch (cat?.toUpperCase()) {
            case 'VFR': return 'bg-emerald-500';
            case 'MVFR': return 'bg-blue-500';
            case 'IFR': return 'bg-orange-500';
            case 'LIFR': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    const isBadWeather = ['IFR', 'LIFR'].includes(weather?.flight_category?.toUpperCase());

    return (
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${isBadWeather
                ? 'bg-rose-600 border-rose-500 shadow-lg shadow-rose-600/20'
                : 'bg-white dark:bg-slate-800 border-blue-500/30 dark:border-blue-400/20 shadow-lg shadow-blue-500/5 hover:border-blue-500/50 transition-all duration-300'
            }`}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            )}

            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-6">
                {/* Station & Status */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white font-black text-xs shadow-inner ${getCategoryColor(weather?.flight_category)}`}>
                        <span className="text-[10px] opacity-70 uppercase">Cat</span>
                        <span>{weather?.flight_category || '--'}</span>
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${isBadWeather ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {weather?.station_id || 'Station'} METAR
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-tight ${isBadWeather ? 'text-rose-100' : 'text-slate-500'}`}>
                            Observed: {weather?.obs_time ? new Date(weather.obs_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                </div>

                {/* Wind */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isBadWeather ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <Wind size={18} className={isBadWeather ? 'text-white' : 'text-indigo-500'} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isBadWeather ? 'text-rose-100' : 'text-slate-500'}`}>Surface Wind</p>
                        <p className={`text-sm font-black ${isBadWeather ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {weather?.wind_dir || '000'}° @ {weather?.wind_speed || '0'} {weather?.wind_unit || 'KT'}
                            {weather?.wind_gust && <span className="text-rose-400 ml-1">G{weather.wind_gust}</span>}
                        </p>
                    </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isBadWeather ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <Eye size={18} className={isBadWeather ? 'text-white' : 'text-indigo-500'} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isBadWeather ? 'text-rose-100' : 'text-slate-500'}`}>Visibility</p>
                        <p className={`text-sm font-black ${isBadWeather ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {weather?.visibility_sm || '--'} SM
                        </p>
                    </div>
                </div>

                {/* Ceiling */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isBadWeather ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <Cloudy size={18} className={isBadWeather ? 'text-white' : 'text-indigo-500'} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isBadWeather ? 'text-rose-100' : 'text-slate-500'}`}>Ceiling</p>
                        <p className={`text-sm font-black ${isBadWeather ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {weather?.ceiling_ft ? `${weather.ceiling_ft} FT` : 'SKC / CLR'}
                        </p>
                    </div>
                </div>

                {/* Temperature */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isBadWeather ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <Thermometer size={18} className={isBadWeather ? 'text-white' : 'text-indigo-500'} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isBadWeather ? 'text-rose-100' : 'text-slate-500'}`}>Temp / Dew</p>
                        <p className={`text-sm font-black ${isBadWeather ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {weather?.temperature_c || '0'}° / {weather?.dewpoint_c || '0'}° C
                        </p>
                    </div>
                </div>

                {isBadWeather && (
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3 animate-pulse">
                        <AlertCircle size={20} className="text-white" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Weather Warning: No-Go Restricted</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, alert }) {
    const colorMap = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-500/10",
            hover: "hover:border-blue-500/50 hover:shadow-blue-500/10"
        },
        indigo: {
            bg: "bg-indigo-50 dark:bg-indigo-500/10",
            hover: "hover:border-indigo-500/50 hover:shadow-indigo-500/10"
        },
        amber: {
            bg: "bg-amber-50 dark:bg-amber-500/10",
            hover: "hover:border-amber-500/50 hover:shadow-amber-500/10"
        },
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            hover: "hover:border-emerald-500/50 hover:shadow-emerald-500/10"
        },
        rose: {
            bg: "bg-rose-50 dark:bg-rose-500/10",
            hover: "hover:border-rose-500/50 hover:shadow-rose-500/10"
        },
        slate: {
            bg: "bg-slate-50 dark:bg-slate-500/10",
            hover: "hover:border-slate-500/50 hover:shadow-slate-500/10"
        }
    };

    const style = colorMap[color] || colorMap.blue;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-default group ${style.hover}`}>
            <div className={`p-3 rounded-xl transition-all duration-300 ${alert && label === 'Airborne' ? 'bg-indigo-100 dark:bg-indigo-500/20 animate-pulse ring-2 ring-indigo-500/50' : style.bg} group-hover:scale-110`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const config = {
        AIRBORNE: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30 animate-pulse",
        COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        CANCELLED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
        OVERDUE: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 animate-pulse",
        EMERGENCY: "bg-rose-600 text-white border-rose-600 animate-[pulse_1s_ease-in-out_infinite] shadow-lg shadow-rose-600/50",
    };

    const style = config[status] || config.SCHEDULED;
    const label = status === 'AIRBORNE' ? 'Airborne' : status === 'SCHEDULED' ? 'Scheduled' : status === 'COMPLETED' ? 'Completed' : status === 'CANCELLED' ? 'Cancelled' : status === 'OVERDUE' ? 'Overdue' : status === 'EMERGENCY' ? 'EMERGENCY' : status;

    return (
        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border flex items-center gap-2 w-fit ${style}`}>
            {(status === 'AIRBORNE' || status === 'OVERDUE') && <div className={`w-1.5 h-1.5 rounded-full animate-ping ${status === 'OVERDUE' ? 'bg-orange-500' : 'bg-indigo-500'}`} />}
            {status === 'EMERGENCY' && <AlertCircle size={12} className="animate-bounce" />}
            {label}
        </span>
    );
}

