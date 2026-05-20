import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export default function SlotRequestsRoot() {
    const { user } = useAppStore();
    const isStudent = user?.role === 'Student';

    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('All'); // All, Pending, Approved, Rejected

    // Modal state for Students
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [aircraftList, setAircraftList] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        timePreference: 'Morning',
        instructorPreference: '',
        aircraftPreference: '',
        notes: ''
    });

    const fetchRequests = useCallback(async () => {
        try {
            let url = `${API_BASE}/slot-requests`;
            if (isStudent && user?.id) {
                url += `?studentId=${user.id}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching slot requests:', error);
        }
    }, [isStudent, user?.id]);

    const fetchDropdowns = useCallback(async () => {
        try {
            const [iRes, aRes] = await Promise.all([
                fetch(`${API_BASE}/instructors`),
                fetch(`${API_BASE}/aircraft`)
            ]);
            if (iRes.ok) {
                const iData = await iRes.json();
                setInstructors(iData.data || iData); 
            }
            if (aRes.ok) {
                const aData = await aRes.json();
                setAircraftList(aData.data || aData);
            }
        } catch (err) { console.error('Failed to fetch dropdown data:', err); }
    }, []);

    useEffect(() => {
        fetchRequests();
        if (isStudent) {
            fetchDropdowns();
        }
    }, [fetchRequests, isStudent, fetchDropdowns]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/slot-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
            }
        } catch (error) {
            console.error("Error updating slot request status", error);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/slot-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    studentId: user.id
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    date: '',
                    timePreference: 'Morning',
                    instructorPreference: '',
                    aircraftPreference: '',
                    notes: ''
                });
                fetchRequests();
            } else {
                alert('Failed to submit request');
            }
        } catch (error) {
            console.error("Error submitting request", error);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'Pending': default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
        }
    };

    const filteredRequests = requests.filter(req => filter === 'All' ? true : req.status === filter);

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {isStudent ? 'My Slot Requests' : 'Manage Slot Requests'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        {isStudent ? 'Request and track your upcoming flight sessions' : 'Review and approve flight session requests submitted by students'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setFilter(status)} 
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === status ? 'bg-white dark:bg-gray-700 shadow flex items-center justify-center text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    {isStudent && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Request Slot
                        </button>
                    )}
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">No requests found</p>
                        <p className="text-sm mt-1 text-gray-500">There are no {filter.toLowerCase()} requests at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredRequests.map(req => (
                            <div key={req.id} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {req.date}
                                        </h3>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                            {req.timePreference}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getStatusStyle(req.status)}`}>
                                        {req.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 animate-pulse"></span>}
                                        {req.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-4 flex-1">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                {req.student.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 border-b border-transparent dark:text-gray-400 uppercase tracking-widest font-semibold">Student</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{req.student}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 px-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Requested Inst.</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.instructor}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            {req.aircraft}
                                        </span>
                                    </div>

                                    {req.notes && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                            <p className="text-xs text-yellow-800 dark:text-yellow-500 italic">
                                                <span className="font-bold mr-1">Note:</span>"{req.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions - Only for Admins/Instructors on Pending requests */}
                                {!isStudent && req.status === 'Pending' && (
                                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                                            className="w-full flex justify-center items-center py-2 px-3 border border-red-200 dark:border-red-800/50 rounded-lg shadow-sm text-sm font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'Approved')}
                                            className="w-full flex justify-center items-center py-2 px-3 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Modal for Students */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Flight Slot</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Time Preference *</label>
                                <select 
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.timePreference}
                                    onChange={(e) => setFormData({...formData, timePreference: e.target.value})}
                                >
                                    <option value="Morning">Morning (06:00 - 12:00)</option>
                                    <option value="Afternoon">Afternoon (12:00 - 18:00)</option>
                                    <option value="Evening">Evening (18:00 - 22:00)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aircraft Preference *</label>
                                <select 
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.aircraftPreference}
                                    onChange={(e) => setFormData({...formData, aircraftPreference: e.target.value})}
                                >
                                    <option value="">Select Aircraft</option>
                                    {aircraftList.map(a => (
                                        <option key={a.id} value={a.id}>{a.id} ({a.model})</option>
                                    ))}
                                    <option value="Any">Any Available</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Instructor Preference *</label>
                                <select 
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.instructorPreference}
                                    onChange={(e) => setFormData({...formData, instructorPreference: e.target.value})}
                                >
                                    <option value="">Select Instructor</option>
                                    {instructors.map(i => (
                                        <option key={i.id} value={`${i.user?.firstName || ''} ${i.user?.lastName || ''}`.trim()}>
                                            {i.user?.firstName} {i.user?.lastName}
                                        </option>
                                    ))}
                                    <option value="Any">Any Available</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes / Flight Type</label>
                                <textarea 
                                    rows="2"
                                    placeholder="e.g. Dual flight, Solo cross-country, etc."
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
