import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

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
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
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
        fetchSchedules();
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
                setAircraftList(aData.data || aData); // Handle {data:[]} wrapper
            }
        } catch (err) { console.error('Failed to fetch dropdown data:', err); }
    };

    const fetchSchedules = async () => {
        try {
            const res = await fetch(`${API_BASE}/schedules`);
            if (res.ok) {
                const data = await res.json();
                setSchedules(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error('Failed to fetch schedules:', err); }
    };

    const handleSyncWeather = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE}/schedules/sync-weather`, { method: 'POST' });
            await fetchSchedules();
        } catch (err) { console.error(err); }
        finally { setSyncing(false); }
    };

    const handleDeleteSchedule = async (id) => {
        if (!confirm('Delete this weather schedule?')) return;
        try {
            await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
            fetchSchedules();
        } catch (err) { console.error(err); }
    };

    const fetchSlots = async () => {
        try {
            // Using API_BASE/schedules instead of /slots to get weather data
            const response = await fetch(`${API_BASE}/schedules`);
            if (response.ok) {
                const data = await response.json();
                
                // Map the Schedule model format to the UI's expected slot format
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
                        aircraft: s.aircraftId,
                        flightType: s.flightType || 'Dual',
                        status: s.status === 'SCHEDULED' ? 'Scheduled' : s.status === 'CANCELLED' ? 'Cancelled' : s.status,
                        // Attach weather data for display in lists
                        weatherVerdict: s.weatherVerdict,
                        extremeWeatherWarning: s.extremeWeatherWarning,
                        cancellationReason: s.cancellationReason
                    };
                });
                
                setSlots(mappedSlots);
                setSchedules(data); // Keep raw schedules for the detail section
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const handleOpenModal = (slot = null) => {
        if (slot && slot.id) {
            setFormData(slot);
            setEditId(slot.id);
        } else {
            // Default new slot to selected date if in calendar mode
            setFormData({ date: viewMode === 'calendar' ? selectedDate : '', startTime: '', endTime: '', instructor: '', student: '', aircraft: '', flightType: 'Dual', status: 'Scheduled' });
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
        if (!formData.date || !formData.startTime || !formData.instructor || !formData.student || !formData.aircraft) {
            alert('Please fill out all required fields.');
            return;
        }

        try {
            // Prepare data for the /api/schedules endpoint (expects ISO strings for times)
            const startISO = new Date(`${formData.date}T${formData.startTime}`).toISOString();
            const endISO = formData.endTime 
                ? new Date(`${formData.date}T${formData.endTime}`).toISOString()
                : new Date(new Date(`${formData.date}T${formData.startTime}`).getTime() + 2*60*60*1000).toISOString(); // Default 2h

            const payload = {
                traineeId: formData.traineeId,
                traineeName: formData.student,
                instructorId: formData.instructorId,
                instructorName: formData.instructor,
                aircraftId: formData.aircraft,
                flightType: formData.flightType,
                startTime: startISO,
                endTime: endISO
            };

            if (editId) {
                const response = await fetch(`${API_BASE}/schedules/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    fetchSlots();
                    setTimeout(fetchSlots, 3000);
                    setTimeout(fetchSlots, 8000);
                    handleCloseModal();
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Failed to update slot');
                }
            } else {
                const response = await fetch(`${API_BASE}/schedules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    fetchSlots();
                    // Poll again after 3 seconds to catch the background weather check update
                    setTimeout(fetchSlots, 3000);
                    setTimeout(fetchSlots, 8000);
                    handleCloseModal();
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Failed to save slot');
                }
            }
        } catch (error) {
            console.error('Error saving slot:', error);
            alert('An unexpected error occurred while saving the slot.');
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

    const filteredSlots = slots.filter(slot => 
        slot.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
        slot.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.aircraft.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                endTime: endISO
            };

            const response = await fetch(`${API_BASE}/schedules/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchSlots();
                setTimeout(fetchSlots, 3000);
            } else {
                const errData = await response.json();
                alert(errData.error || 'Failed to update slot timings.');
            }
        } catch (err) {
            console.error('Drag/Drop Error:', err);
            alert('An unexpected error occurred while updating the slot.');
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
                                <tr key={slot.id} onClick={() => handleOpenModal(slot)} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer" title="Click to edit">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{slot.date}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{slot.startTime} - {slot.endTime}</div>
                                        {slot.weatherVerdict && (
                                            <div className={`mt-1 text-[10px] font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded-md ${slot.weatherVerdict === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {slot.weatherVerdict}
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
                                    <div className="flex flex-col items-center">
                                        <svg className="h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-base font-medium">No flying slots found</p>
                                        <p className="mt-1">Try adjusting your search or add a new slot.</p>
                                    </div>
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
                <div className="flex justify-between mt-1 items-center">
                    <span className="font-mono text-[10px]">{event.aircraft}</span>
                    <span className={`px-1 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                        event.status === 'Completed' ? 'bg-green-500 text-white' : 
                        event.status === 'Cancelled' ? 'bg-red-500 text-white' : 
                        'bg-white/20 text-white'
                    }`}>{event.status}</span>
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

        const CustomTimeSlot = ({ children }) => {
            return React.cloneElement(children, {
                className: `${children.props.className || ''} group relative cursor-pointer`,
                children: (
                    <>
                        {children.props.children}
                        <div className="custom-add-slot-btn absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity z-10">
                            <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-800/50">
                                + Add Slot
                            </span>
                        </div>
                    </>
                )
            });
        };

        return (
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6 h-full min-h-[600px] flex flex-col">
                <style>{`
                  .rbc-calendar {
                    min-height: 500px;
                    flex: 1;
                    font-family: inherit;
                  }
                  .rbc-toolbar button {
                    color: inherit;
                  }
                  .rbc-toolbar button.rbc-active {
                    background-color: #e5e7eb;
                    color: #111827;
                  }
                  .dark .rbc-toolbar button.rbc-active {
                    background-color: #374151;
                    color: #f9fafb;
                  }
                  .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-header, .dark .rbc-day-bg, .dark .rbc-timeslot-group, .dark .rbc-time-content {
                    border-color: #374151;
                  }
                  .dark .rbc-off-range-bg {
                    background-color: #1f2937;
                  }
                  .dark .rbc-today {
                    background-color: #111827;
                  }
                  .rbc-time-gutter .custom-add-slot-btn {
                    display: none !important;
                  }
                `}</style>
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
                    onEventDrop={handleEventUpdate}
                    onEventResize={handleEventUpdate}
                    resizable
                    onNavigate={(newDate) => {
                        const tzOffset = newDate.getTimezoneOffset() * 60000;
                        const localISOTime = (new Date(newDate - tzOffset)).toISOString().slice(0, -1);
                        setSelectedDate(localISOTime.split('T')[0]);
                    }}
                    selectable
                    onSelectSlot={(slotInfo) => {
                        const startDate = slotInfo.start;
                        const endDate = slotInfo.end;
                        
                        const tzOffset = startDate.getTimezoneOffset() * 60000;
                        const localISOStart = (new Date(startDate - tzOffset)).toISOString().slice(0, -1);
                        const localISOEnd = (new Date(endDate - tzOffset)).toISOString().slice(0, -1);
                        
                        const dateStr = localISOStart.split('T')[0];
                        const timeStr = localISOStart.split('T')[1].substring(0, 5);
                        const endTimeStr = localISOEnd.split('T')[1].substring(0, 5);
                        
                        setFormData({ 
                            ...formData, 
                            date: dateStr, 
                            startTime: timeStr, 
                            endTime: endTimeStr 
                        });
                        setEditId(null);
                        setIsModalOpen(true);
                    }}
                    onSelectEvent={(event) => handleOpenModal(event)}
                    components={{
                        event: CustomEvent,
                        timeSlotWrapper: CustomTimeSlot
                    }}
                    eventPropGetter={(event) => {
                        let bgColor = '#3b82f6';
                        if (event.status === 'Completed') bgColor = '#22c55e';
                        if (event.status === 'Cancelled') bgColor = '#ef4444';
                        return {
                            style: {
                                backgroundColor: bgColor,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                padding: '0',
                                overflow: 'hidden'
                            }
                        };
                    }}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Flying Slots</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage flight schedules, instructors, and student bookings.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                    {/* View Toggle */}
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            List View
                        </button>
                        <button 
                            onClick={() => setViewMode('calendar')} 
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            Calendar
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <div className="relative w-full sm:w-56">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search slots..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    )}
                    
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add Slot
                    </button>

                    <button
                        onClick={handleSyncWeather}
                        disabled={syncing}
                        className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {syncing ? '⏳ Syncing...' : '🔄 Sync Weather'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'list' ? renderList() : renderCalendar()}

            {/* Weather Schedules Section */}
            {schedules.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>🌤️</span> Weather-Checked Schedules
                    </h2>
                    <div className="space-y-3">
                        {schedules.map(slot => (
                            <div key={slot.id} className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm ${slot.status === 'CANCELLED' ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="flex gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${slot.status === 'CANCELLED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                            <span>{new Date(slot.startTime).toLocaleDateString(undefined, { month: 'short' })}</span>
                                            <span className="text-lg leading-none">{new Date(slot.startTime).toLocaleDateString(undefined, { day: '2-digit' })}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{slot.traineeName || 'Trainee #' + slot.traineeId}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">with {slot.instructorName || 'Instructor'} • {slot.aircraftId}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full font-bold text-gray-700 dark:text-gray-300">
                                                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${slot.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                                    {slot.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteSchedule(slot.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">🗑️</button>
                                </div>
                                {slot.weatherVerdict && (
                                    <div className={`mt-4 p-4 rounded-xl text-sm ${slot.weatherVerdict === 'GO' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                        <div className="font-bold flex items-center gap-1.5 mb-1">{slot.weatherVerdict === 'GO' ? '✅ Weather: GO' : '❌ Weather: NO-GO'}</div>
                                        {slot.cancellationReason && <p className="opacity-90">{slot.cancellationReason}</p>}
                                    </div>
                                )}
                                {slot.extremeWeatherWarning && (
                                    <div className="mt-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-medium animate-pulse">
                                        {slot.extremeWeatherWarning}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 dark:bg-black dark:bg-opacity-80 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={handleCloseModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal Panel */}
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-200 dark:border-gray-700">
                            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-2xl leading-6 font-extrabold text-gray-900 dark:text-white mb-6 border-b pb-4 dark:border-gray-700" id="modal-title">
                                            {editId ? 'Edit Flying Slot' : 'Schedule Flying Slot'}
                                        </h3>
                                        <div className="space-y-5">
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
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Instructor *</label>
                                                <select 
                                                    name="instructor" 
                                                    value={`${formData.instructor}|${formData.instructorId}`} 
                                                    onChange={(e) => {
                                                        const [name, id] = e.target.value.split('|');
                                                        setFormData(prev => ({ ...prev, instructor: name, instructorId: id }));
                                                    }} 
                                                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" 
                                                    required
                                                >
                                                    <option value="">Select Instructor</option>
                                                    {instructors.map(i => {
                                                        const fullName = i.user ? `${i.user.firstName} ${i.user.lastName}` : (i.name || 'Unknown');
                                                        return (
                                                            <option key={i.id} value={`${fullName}|${i.id}`}>
                                                                {fullName}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Student *</label>
                                                <select 
                                                    name="student" 
                                                    value={`${formData.student}|${formData.traineeId}`} 
                                                    onChange={(e) => {
                                                        const [name, id] = e.target.value.split('|');
                                                        setFormData(prev => ({ ...prev, student: name, traineeId: id }));
                                                    }} 
                                                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" 
                                                    required
                                                >
                                                    <option value="">Select Student</option>
                                                    {students.map(s => (
                                                        <option key={s.id} value={`${s.firstName} ${s.lastName}|${s.id}`}>
                                                            {s.firstName} {s.lastName} ({s.studentId})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aircraft *</label>
                                                    <select 
                                                        name="aircraft" 
                                                        value={formData.aircraft} 
                                                        onChange={(e) => setFormData(prev => ({ ...prev, aircraft: e.target.value }))} 
                                                        className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" 
                                                        required
                                                    >
                                                        <option value="">Select Aircraft</option>
                                                        {aircraftList.map(a => (
                                                            <option key={a.id} value={a.id}>{a.tailNumber || a.id} - {a.model}</option>
                                                        ))}
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-4 sm:px-6 flex flex-row-reverse gap-3 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Save Slot
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2.5 bg-white dark:bg-gray-700 text-base font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
