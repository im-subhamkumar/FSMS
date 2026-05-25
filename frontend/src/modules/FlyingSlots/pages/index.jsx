import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Search } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useAppStore } from '../../../store/useAppStore';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export default function FlyingSlotsRoot() {
    const { user } = useAppStore();
    const isStudent = user?.role === 'Student';
    const isInstructor = user?.role === 'Instructor';
    
    const [slots, setSlots] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ 
        date: '', startTime: '', endTime: '', 
        instructor: '', instructorId: '',
        student: '', traineeId: '',
        aircraft: '', aircraftId: '',
        flightType: 'Dual',
        status: 'Scheduled' 
    });
    const [editId, setEditId] = useState(null);
    
    // View state
    const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', or 'timeline'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Weather schedule state
    const [schedules, setSchedules] = useState([]);
    const [syncing, setSyncing] = useState(false);

    // Dropdown data
    const [students, setStudents] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [aircraftList, setAircraftList] = useState([]);

    useEffect(() => {
        fetchSlots();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const [sRes, iRes, aRes] = await Promise.all([
                fetch(`${API_BASE}/students`),
                fetch(`${API_BASE}/instructors`),
                fetch(`${API_BASE}/aircraft`)
            ]);
            
            if (sRes.ok) setStudents(await sRes.json());
            if (iRes.ok) {
                const iData = await iRes.json();
                setInstructors(iData.data || iData); 
            }
            if (aRes.ok) {
                const aData = await aRes.json();
                setAircraftList(aData.data || aData);
            }
        } catch (err) { console.error('Failed to fetch dropdown data:', err); }
    };

    const fetchSlots = async () => {
        try {
            let url = `${API_BASE}/schedules`;
            if (isStudent && user?.id) {
                url += `?traineeId=${user.id}`;
            } else if (isInstructor && (user?.instructorDbId || user?.id)) {
                // instructorDbId is the Instructor table ID; schedules reference this, NOT the User table ID
                url += `?instructorId=${user.instructorDbId || user.id}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setSchedules(data);
                
                const mappedSlots = data.map(s => {
                    const startDate = new Date(s.startTime);
                    const endDate = new Date(s.endTime);
                    
                    const localDate = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2,'0')}-${startDate.getDate().toString().padStart(2,'0')}`;
                    const localStartTime = `${startDate.getHours().toString().padStart(2,'0')}:${startDate.getMinutes().toString().padStart(2,'0')}`;
                    const localEndTime = `${endDate.getHours().toString().padStart(2,'0')}:${endDate.getMinutes().toString().padStart(2,'0')}`;

                    return {
                        id: s.id,
                        date: localDate,
                        startTime: localStartTime,
                        endTime: localEndTime,
                        student: s.traineeName || `Trainee #${s.traineeId}`,
                        traineeId: s.traineeId,
                        instructor: s.instructorName || `Instructor #${s.instructorId}`,
                        instructorId: s.instructorId,
                        flightType: s.flightType || 'Dual',
                        status: s.status === 'SCHEDULED' ? 'Scheduled' : s.status === 'CANCELLED' ? 'Cancelled' : s.status === 'AWAITING' ? 'Awaiting' : s.status,
                        weatherVerdict: s.weatherVerdict,

                        extremeWeatherWarning: s.extremeWeatherWarning,
                        cancellationReason: s.cancellationReason
                    };
                });
                
                setSlots(mappedSlots);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const handleSyncWeather = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE}/schedules/sync-weather`, { method: 'POST' });
            fetchSlots();
        } catch (err) { console.error(err); }
        finally { setSyncing(false); }
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('Delete this weather schedule?')) return;
        try {
            await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
            fetchSlots();
        } catch (err) { console.error(err); }
    };

    const handleOpenModal = (slot = null) => {
        if (slot && slot.id) {
            setFormData(slot);
            setEditId(slot.id);
        } else {
            setFormData({ 
                date: selectedDate, 
                startTime: '', 
                endTime: '', 
                instructor: '', 
                instructorId: '',
                student: '', 
                traineeId: '',
                aircraft: '', 
                flightType: 'Dual', 
                status: 'Scheduled' 
            });
            setEditId(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.date || !formData.startTime || !formData.instructorId || !formData.traineeId || !formData.aircraft) {
            alert('Please fill out all required fields.');
            return;
        }

        try {
            const startISO = new Date(`${formData.date}T${formData.startTime}`).toISOString();
            const endISO = formData.endTime 
                ? new Date(`${formData.date}T${formData.endTime}`).toISOString()
                : new Date(new Date(`${formData.date}T${formData.startTime}`).getTime() + 2*60*60*1000).toISOString();

            const payload = {
                traineeId: parseInt(formData.traineeId),
                traineeName: formData.student,
                instructorId: parseInt(formData.instructorId),
                instructorName: formData.instructor,
                aircraftId: formData.aircraft,
                flightType: formData.flightType,
                startTime: startISO,
                endTime: endISO,
                status: formData.status.toUpperCase()
            };

            const url = editId ? `${API_BASE}/schedules/${editId}` : `${API_BASE}/schedules`;
            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchSlots();
                setTimeout(fetchSlots, 3000);
                handleCloseModal();
            } else {
                const errData = await response.json();
                alert(errData.error || 'Failed to save slot');
            }

        } catch (error) {
            console.error('Error saving slot:', error);
            alert('An unexpected error occurred.');
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toUpperCase()) {
            case 'SCHEDULED': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'AWAITING': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        }
    };

    const filteredSlots = useMemo(() => {
        return slots.filter(slot => 
            slot.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
            slot.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            slot.aircraft.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [slots, searchTerm]);

    const handleEventUpdate = async ({ event, start, end }) => {
        try {
            const startISO = new Date(start).toISOString();
            const endISO = new Date(end).toISOString();
            
            const payload = {
                traineeId: event.traineeId,
                traineeName: event.student,
                instructorId: event.instructorId,
                instructorName: event.instructor,
                aircraftId: event.aircraft,
                flightType: event.flightType,
                startTime: startISO,
                endTime: endISO,
                status: event.status.toUpperCase()
            };

            const response = await fetch(`${API_BASE}/schedules/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchSlots();
            } else {
                const errData = await response.json();
                alert(errData.error || 'Failed to update slot timings.');
            }
        } catch (err) {
            console.error('Drag/Drop Error:', err);
        }
    };

    const renderList = () => (
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructor</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aircraft</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSlots.length > 0 ? (
                            filteredSlots.map((slot) => (
                                <tr key={slot.id} onClick={() => { if (!isStudent) handleOpenModal(slot); }} className={`transition-colors ${isStudent ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer'}`} title={isStudent ? '' : isInstructor ? 'Click to reschedule or cancel' : 'Click to edit'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{slot.date}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{slot.startTime} - {slot.endTime}</div>
                                        {slot.weatherVerdict && slot.status !== 'Cancelled' && (
                                            <div className={`mt-1 text-[10px] font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded-md ${slot.weatherVerdict === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {slot.weatherVerdict}
                                            </div>
                                        )}
                                        {slot.status === 'Cancelled' && slot.cancellationReason && (
                                            <div className="mt-1 text-[10px] font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                                                NO-GO
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs mr-3">
                                                {slot.student.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white font-medium">{slot.student}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {slot.instructor}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        <div>{slot.aircraft}</div>
                                        <div className="mt-1 text-xs text-gray-500 font-semibold">{slot.flightType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(slot.status)}`}>
                                            {slot.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No flying slots found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCalendar = () => {
        const events = slots.map(slot => {
            const startStr = `${slot.date}T${slot.startTime}:00`;
            const endStr = slot.endTime ? `${slot.date}T${slot.endTime}:00` : `${slot.date}T${slot.startTime}:00`;
            
            return {
                ...slot,
                start: new Date(startStr),
                end: new Date(endStr),
                title: `${slot.student} w/ ${slot.instructor}`
            };
        });

        const CustomEvent = ({ event }) => (
            <div className="flex flex-col h-full text-xs p-1" title={event.title}>
                <div className="font-bold flex items-center justify-between">
                    <span className="truncate">{event.student.split(' ')[0]} / {event.instructor.split(' ')[0]}</span>
                    <span className="text-[9px] uppercase bg-black/10 px-1 rounded flex-shrink-0 ml-1">{event.flightType}</span>
                </div>
                {event.weatherVerdict && (
                    <div className={`mt-1 text-[9px] font-bold uppercase inline-block px-1 rounded w-fit ${
                        event.weatherVerdict === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        Wx: {event.weatherVerdict}
                    </div>
                )}
            </div>
        );

        return (
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6 h-full min-h-[600px] flex flex-col">
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={['month', 'week', 'day']}
                    defaultView="week"
                    step={30}
                    timeslots={2}
                    date={new Date(selectedDate)}
                    onEventDrop={(isStudent || isInstructor) ? undefined : handleEventUpdate}
                    onEventResize={(isStudent || isInstructor) ? undefined : handleEventUpdate}
                    resizable={!isStudent && !isInstructor}
                    onNavigate={(newDate) => setSelectedDate(newDate.toISOString().split('T')[0])}
                    selectable={!isStudent && !isInstructor}
                    onSelectSlot={(isStudent || isInstructor) ? undefined : (slotInfo) => {
                        const dateStr = slotInfo.start.toISOString().split('T')[0];
                        const timeStr = slotInfo.start.toTimeString().substring(0, 5);
                        const endTimeStr = slotInfo.end.toTimeString().substring(0, 5);
                        
                        setFormData({ 
                            ...formData, 
                            date: dateStr, 
                            startTime: timeStr, 
                            endTime: endTimeStr 
                        });
                        setEditId(null);
                        setIsModalOpen(true);
                    }}
                    onSelectEvent={(event) => { if (!isStudent) handleOpenModal(event); else return; }}
                    components={{
                        event: CustomEvent
                    }}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: event.status === 'Completed' ? '#22c55e' : event.status === 'Cancelled' ? '#ef4444' : '#3b82f6',
                            borderRadius: '6px',
                            color: 'white',
                            border: 'none'
                        }
                    })}
                />
            </div>
        );
    };

    const renderTimeline = () => {
        const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
        const dailySlots = slots.filter(s => s.date === selectedDate);

        return (
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Timeline</h2>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white py-2 px-3 border" 
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-16 pl-6 space-y-0 pb-12">
                        {hours.map(hour => {
                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                            const startingHere = dailySlots.filter(s => parseInt(s.startTime.split(':')[0]) === hour);
                            const isActiveOccupied = dailySlots.some(s => {
                                const startH = parseInt(s.startTime.split(':')[0]);
                                const endH = s.endTime ? parseInt(s.endTime.split(':')[0]) : startH + 1;
                                return hour >= startH && hour < endH;
                            });

                            return (
                                <div key={hour} className="relative py-4 border-t border-dashed border-gray-100 dark:border-gray-700/50">
                                    <div className="absolute -left-[5.5rem] top-3 w-16 text-right text-sm font-bold text-gray-500 dark:text-gray-400">
                                        {timeStr}
                                    </div>
                                    <div className={`absolute -left-[1.65rem] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${isActiveOccupied ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className="min-h-[2.5rem] flex flex-col gap-3">
                                        {!isActiveOccupied && !isStudent && !isInstructor && (
                                            <div className="text-sm text-green-600 dark:text-green-400/80 font-medium italic opacity-70 py-1 hover:opacity-100 transition-opacity flex items-center gap-2 cursor-pointer" onClick={() => {
                                                setFormData({ ...formData, date: selectedDate, startTime: timeStr, endTime: `${(hour+2).toString().padStart(2, '0')}:00` });
                                                setEditId(null);
                                                setIsModalOpen(true);
                                            }}>
                                                + Available
                                            </div>
                                        )}
                                        {startingHere.map(slot => (
                                            <div key={slot.id} onClick={() => { if (!isStudent) handleOpenModal(slot); }} className={`p-4 rounded-xl border shadow-sm ${isStudent ? '' : 'cursor-pointer hover:scale-[1.01] hover:shadow-md'} ${slot.status === 'Completed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : slot.status === 'Cancelled' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'} transition-all relative overflow-hidden`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-base mb-1">{slot.startTime} &rarr; {slot.endTime}</div>
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs">{slot.student.charAt(0)}</div>
                                                            {slot.student} <span className="text-gray-400 mx-1">with</span> {slot.instructor}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono bg-white/50 dark:bg-black/20 inline-block px-2 py-1 rounded">{slot.aircraft}</div>
                                                        
                                                        {slot.weatherVerdict && slot.status !== 'Cancelled' && (
                                                            <div className={`ml-2 text-[10px] font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded-md ${slot.weatherVerdict === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                Weather: {slot.weatherVerdict}
                                                            </div>
                                                        )}
                                                        {slot.status === 'Cancelled' && slot.cancellationReason && (
                                                            <div className="ml-2 text-[10px] font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                                                                Weather: NO-GO
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusStyles(slot.status)}`}>
                                                        {slot.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Flying Slots</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage flight schedules and bookings.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                        {['list', 'calendar', 'timeline'].map(mode => (
                            <button 
                                key={mode}
                                onClick={() => setViewMode(mode)} 
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === mode ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search slots..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    {!isStudent && !isInstructor && (
                        <>
                            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">+ Add Slot</button>
                            <button onClick={handleSyncWeather} disabled={syncing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors">
                                {syncing ? 'Syncing...' : 'Sync Weather'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode === 'list' && renderList()}
            {viewMode === 'calendar' && renderCalendar()}
            {viewMode === 'timeline' && renderTimeline()}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-6 border-b pb-4 dark:border-gray-700">
                            {isInstructor ? 'Reschedule / Cancel Slot' : (editId ? 'Edit Flying Slot' : 'Schedule Flying Slot')}
                        </h2>
                        <div className="space-y-5">
                            {/* Instructor sees a read-only summary of the slot details */}
                            {isInstructor && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-1">
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Student: <span className="font-normal">{formData.student}</span></p>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Aircraft: <span className="font-normal">{formData.aircraft}</span></p>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Flight Type: <span className="font-normal">{formData.flightType}</span></p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Start *</label>
                                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">End</label>
                                        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" />
                                    </div>
                                </div>
                            </div>
                            {/* Only Admin sees instructor/student/aircraft dropdowns */}
                            {!isInstructor && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Instructor *</label>
                                        <select name="instructor" value={`${formData.instructor}|${formData.instructorId}`} onChange={(e) => { const [name, id] = e.target.value.split('|'); setFormData(prev => ({ ...prev, instructor: name, instructorId: id })); }} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required>
                                            <option value="">Select Instructor</option>
                                            {instructors.map(i => { const fullName = i.user ? `${i.user.firstName} ${i.user.lastName}` : (i.name || 'Unknown'); return (<option key={i.id} value={`${fullName}|${i.id}`}>{fullName}</option>); })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Student *</label>
                                        <select name="student" value={`${formData.student}|${formData.traineeId}`} onChange={(e) => { const [name, id] = e.target.value.split('|'); setFormData(prev => ({ ...prev, student: name, traineeId: id })); }} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required>
                                            <option value="">Select Student</option>
                                            {students.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}|${s.id}`}>{s.firstName} {s.lastName} ({s.studentId})</option>))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aircraft *</label>
                                            <select name="aircraft" value={formData.aircraft} onChange={(e) => setFormData(prev => ({ ...prev, aircraft: e.target.value }))} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required>
                                                <option value="">Select Aircraft</option>
                                                {aircraftList.map(a => (<option key={a.id} value={a.id}>{a.tailNumber || a.id} - {a.model}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Flight Type</label>
                                            <select name="flightType" value={formData.flightType} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border">
                                                <option value="Dual">Dual</option>
                                                <option value="Solo">Solo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border">
                                                <option value="Scheduled">Scheduled</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* Instructor-only: simple status action buttons */}
                            {isInstructor && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Action</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, status: 'Cancelled'}))} className={`py-2.5 px-4 rounded-lg border-2 font-bold text-sm transition-all ${ formData.status === 'Cancelled' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300'}`}>
                                            ✕ Cancel Slot
                                        </button>
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, status: 'Scheduled'}))} className={`py-2.5 px-4 rounded-lg border-2 font-bold text-sm transition-all ${ formData.status === 'Scheduled' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                                            ↻ Reschedule
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(formData.weatherVerdict || formData.status === 'CANCELLED') && (() => {
                                // If the slot is CANCELLED, the effective verdict is always NO-GO
                                const effectiveVerdict = formData.status === 'CANCELLED' ? 'NO-GO' : (formData.weatherVerdict || 'GO');
                                const isGo = effectiveVerdict === 'GO';
                                // Clean cancellation reason: strip out "all safe" messages from stale data
                                let cleanReason = formData.cancellationReason || '';
                                if (formData.status === 'CANCELLED' && cleanReason) {
                                    cleanReason = cleanReason
                                        .split(' | ')
                                        .filter(part => !part.includes('All weather parameters within safe limits'))
                                        .join(' | ');
                                }
                                return (
                                    <div className={`mt-4 p-4 rounded-xl text-sm ${isGo ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                        <div className="font-bold flex items-center gap-1.5 mb-1">{isGo ? '✅ Weather: GO' : '❌ Weather: NO-GO'}</div>
                                        {cleanReason && <p className="opacity-90">{cleanReason}</p>}
                                    </div>
                                );
                            })()}
                            {formData.extremeWeatherWarning && (
                                <div className="mt-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-medium animate-pulse">
                                    {formData.extremeWeatherWarning}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 border-t pt-5 dark:border-gray-700">
                                <button onClick={handleCloseModal} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Close</button>
                                <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Weather Detail Section */}
            {schedules.length > 0 && viewMode === 'list' && (
                <div className="mt-8 pt-8 border-t dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Recent Weather Verdicts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedules.filter(s => s.weatherVerdict).slice(0, 6).map(slot => (
                            <div key={slot.id} className={`p-4 rounded-xl border ${slot.weatherVerdict === 'GO' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{slot.traineeName}</div>
                                        <div className="text-xs opacity-75">{new Date(slot.startTime).toLocaleString()}</div>
                                    </div>
                                    <div className={`font-black uppercase text-sm ${slot.weatherVerdict === 'GO' ? 'text-green-600' : 'text-red-600'}`}>
                                        {slot.weatherVerdict}
                                    </div>
                                </div>
                                {slot.extremeWeatherWarning && <div className="text-xs mt-2 text-red-500 font-medium italic">⚠️ {slot.extremeWeatherWarning}</div>}
                                {!isStudent && <button onClick={() => handleDeleteSchedule(slot.id)} className="mt-3 text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-widest font-bold transition-colors">Delete Record</button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
