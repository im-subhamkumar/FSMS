import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, Search, ArrowRight, User, 
    Plane, CheckCircle2, XCircle, Clock, 
    History, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

export function DispatchHistory() {
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchHistoricSlots();
    }, [selectedDate]);

    const fetchHistoricSlots = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/slots');
            const data = await response.json();
            if (Array.isArray(data)) {
                let historicData = data;
                if (selectedDate) {
                    historicData = data.filter(s => s.date === selectedDate);
                }
                // Sort by date descending, then time
                const sorted = historicData.sort((a, b) => {
                    if (a.date !== b.date) {
                        return (b.date || "").localeCompare(a.date || "");
                    }
                    return (b.startTime || "").localeCompare(a.startTime || "");
                });
                setSlots(sorted);
            }
        } catch (error) {
            console.error('Error fetching historic slots:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const todayDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Helper to determine the effective status of a slot based on time
    const getSlotEffectiveStatus = (slot) => {
        const rawStatus = (slot.status || "SCHEDULED").toUpperCase();
        if (rawStatus === 'CANCELLED' || rawStatus === 'COMPLETED') return rawStatus;

        const isPastDate = slot.date < todayDate;
        const isPastTimeToday = slot.date === todayDate && currentTime > slot.endTime;

        if (isPastDate || isPastTimeToday) return 'COMPLETED';
        return 'SCHEDULED';
    };

    const filteredSlots = slots.filter(slot => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            (slot.student || "").toLowerCase().includes(query) ||
            (slot.instructor || "").toLowerCase().includes(query) ||
            (slot.aircraft || "").toLowerCase().includes(query)
        );
        const effectiveStatus = getSlotEffectiveStatus(slot);
        const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* DATA CONTAINER */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row items-center gap-3">
                    <div className="relative w-full lg:flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            placeholder="Find crew or aircraft in archives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-48 flex items-center">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                            {selectedDate && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedDate('');
                                    }}
                                    className="absolute right-2.5 text-slate-400 hover:text-rose-500 transition-colors z-20 p-1 bg-slate-50 dark:bg-slate-900"
                                    title="Clear date filter"
                                >
                                    <XCircle size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter size={16} className="text-slate-400 hidden sm:block" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                            >
                                <option value="ALL">All Outcomes</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="SCHEDULED">Scheduled (Historic)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left order-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Instructor</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Aircraft</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Searching Archives...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSlots.length > 0 ? (
                                filteredSlots.map((slot) => (
                                    <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                                {slot.date ? new Date(slot.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 font-mono font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                                                <Clock size={12} className="text-slate-400" />
                                                <span>{slot.startTime}</span>
                                                <ArrowRight size={10} className="text-slate-300" />
                                                <span>{slot.endTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white text-sm">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-indigo-400" />
                                                {slot.instructor}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white text-sm">
                                            {slot.student}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Plane size={14} className="text-slate-400" />
                                                {slot.aircraft}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <HistoryStatusBadge status={getSlotEffectiveStatus(slot)} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400">
                                            <History size={48} className="opacity-20" />
                                            <p className="font-bold">No records found for this date</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function HistoryStatusBadge({ status }) {
    const config = {
        COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
        SCHEDULED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };

    const style = config[status] || config.SCHEDULED;
    const label = status === 'COMPLETED' ? 'Landed Safe' : status === 'CANCELLED' ? 'No-Go' : 'Pending/Skip';

    return (
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${style}`}>
            {label}
        </span>
    );
}
