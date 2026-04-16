import React, { useState, useEffect } from 'react';

export default function FlyingSlotsRoot() {
    const [slots, setSlots] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ date: '', startTime: '', endTime: '', instructor: '', student: '', aircraft: '', status: 'Scheduled' });
    const [editId, setEditId] = useState(null);
    
    // View state
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/slots');
            if (response.ok) {
                const data = await response.json();
                setSlots(data);
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
            setFormData({ date: viewMode === 'calendar' ? selectedDate : '', startTime: '', endTime: '', instructor: '', student: '', aircraft: '', status: 'Scheduled' });
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
            if (editId) {
                const response = await fetch(`http://localhost:3000/api/slots/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    const updatedSlot = await response.json();
                    setSlots(slots.map(s => s.id === editId ? updatedSlot : s));
                }
            } else {
                const response = await fetch('http://localhost:3000/api/slots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    const newSlot = await response.json();
                    setSlots([...slots, newSlot]);
                }
            }
        } catch (error) {
            console.error('Error saving slot:', error);
        }
        handleCloseModal();
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'Scheduled': default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        }
    };

    const filteredSlots = slots.filter(slot => 
        slot.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
        slot.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.aircraft.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                        {slot.aircraft}
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
        // Daily timeline from 06:00 to 20:00
        const hours = Array.from({length: 15}, (_, i) => i + 6);
        const dailySlots = slots.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime));

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
                            
                            // Get slots that START in this hour
                            const startingHere = dailySlots.filter(s => parseInt(s.startTime.split(':')[0]) === hour);
                            
                            // Check if this hour is free by making sure NO slot spans across this hour
                            const isActiveOccupied = dailySlots.some(s => {
                                const startH = parseInt(s.startTime.split(':')[0]);
                                const endH = s.endTime ? parseInt(s.endTime.split(':')[0]) : startH + 1;
                                return hour >= startH && hour < endH;
                            });

                            return (
                                <div key={hour} className="relative py-4 border-t border-dashed border-gray-100 dark:border-gray-700/50">
                                    {/* Time Marker */}
                                    <div className="absolute -left-[5.5rem] top-3 w-16 text-right text-sm font-bold text-gray-500 dark:text-gray-400">
                                        {timeStr}
                                    </div>
                                    
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[1.65rem] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${isActiveOccupied ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

                                    {/* Content Area */}
                                    <div className="min-h-[2.5rem] flex flex-col gap-3">
                                        {!isActiveOccupied && (
                                            <div className="text-sm text-green-600 dark:text-green-400/80 font-medium italic opacity-70 py-1 hover:opacity-100 transition-opacity flex items-center gap-2 cursor-pointer" onClick={() => {
                                                setFormData({ ...formData, date: selectedDate, startTime: timeStr, endTime: `${(hour+2).toString().padStart(2, '0')}:00` });
                                                setEditId(null);
                                                setIsModalOpen(true);
                                            }}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                Timeslot available
                                            </div>
                                        )}

                                        {startingHere.map(slot => (
                                            <div key={slot.id} onClick={() => handleOpenModal(slot)} className={`p-4 rounded-xl cursor-pointer border shadow-sm ${slot.status === 'Completed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : slot.status === 'Cancelled' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'} transition-all hover:scale-[1.01] hover:shadow-md relative overflow-hidden`}>
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${slot.status === 'Completed' ? 'bg-green-500' : slot.status === 'Cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                <div className="flex justify-between items-start pl-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-base mb-1">{slot.startTime} &rarr; {slot.endTime}</div>
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs">{slot.student.charAt(0)}</div>
                                                            {slot.student} <span className="text-gray-400 mx-1">with</span> {slot.instructor}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono bg-white/50 dark:bg-black/20 inline-block px-2 py-1 rounded">{slot.aircraft}</div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border ${getStatusStyles(slot.status)}`}>
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
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'list' ? renderList() : renderCalendar()}

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
                                                <input type="text" name="instructor" value={formData.instructor} onChange={handleInputChange} placeholder="e.g. Capt. Smith" className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Student *</label>
                                                <input type="text" name="student" value={formData.student} onChange={handleInputChange} placeholder="e.g. John Doe" className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aircraft *</label>
                                                    <input type="text" name="aircraft" value={formData.aircraft} onChange={handleInputChange} placeholder="e.g. C-172 (N1234)" className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3 border" required />
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
