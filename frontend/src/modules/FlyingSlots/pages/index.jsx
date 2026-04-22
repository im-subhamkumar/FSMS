import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export default function FlyingSlotsPage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        traineeId: '1',
        traineeName: 'John Trainee',
        instructorId: '1',
        instructorName: 'Alice Instructor',
        aircraftId: 'VT-ACC',
        startTime: '',
        endTime: ''
    });

    const [aircrafts, setAircrafts] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchData();
        loadDropdownData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/schedules`);
            if (!res.ok) throw new Error('Could not fetch schedules');
            const data = await res.json();
            setSchedules(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to connect to backend server.');
        } finally {
            setLoading(false);
        }
    };

    const loadDropdownData = async () => {
        try {
            const [airRes, insRes, stuRes] = await Promise.all([
                fetch(`${API_BASE}/planes`),
                fetch(`${API_BASE}/instructors`),
                fetch(`${API_BASE}/students`)
            ]);
            const airData = await airRes.json();
            const insResponse = await insRes.json();
            const stuData = await stuRes.json();
            
            console.log('API Response Debug:', { airData, insResponse, stuData });

            setAircrafts(Array.isArray(airData.data) ? airData.data : (Array.isArray(airData) ? airData : []));
            setInstructors(Array.isArray(insResponse.data) ? insResponse.data : (Array.isArray(insResponse) ? insResponse : []));
            setStudents(Array.isArray(stuData) ? stuData : (stuData.data || []));
        } catch (err) {
            console.error('Failed to load dropdowns', err);
            setAircrafts([]);
            setInstructors([]);
            setStudents([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form Submit Triggered:', form);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                fetchData();
                setForm({ ...form, startTime: '', endTime: '' });
                setError(null);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create schedule');
            }
        } catch (err) {
            console.error(err);
            setError('Network error: Action could not be saved.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            await fetch(`${API_BASE}/schedules/sync-weather`, { method: 'POST' });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`${API_BASE}/schedules/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 font-[Inter,sans-serif] bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Flight Schedule Manager</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage trainee slots and monitor weather safety.</p>
                </div>
                <button 
                    onClick={handleSync}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    🔄 Sync Weather Status
                </button>
            </header>
            
            {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <span>×</span>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scheduling Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-blue-500">📅</span> New Flight Slot
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 opacity-80">Trainee</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/40"
                                    value={form.traineeId}
                                    onChange={e => {
                                        const s = students.find(x => x.id == e.target.value);
                                        setForm({...form, traineeId: e.target.value, traineeName: s ? `${s.firstName} ${s.lastName}` : ''})
                                    }}
                                    required
                                >
                                    <option value="">Select Trainee</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 opacity-80">Instructor</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/40"
                                    value={form.instructorId}
                                    onChange={e => {
                                        const i = instructors.find(x => x.id == e.target.value);
                                        setForm({...form, instructorId: e.target.value, instructorName: i ? i.user.firstName + ' ' + i.user.lastName : ''})
                                    }}
                                    required
                                >
                                    <option value="">Select Instructor</option>
                                    {instructors.map(i => <option key={i.id} value={i.id}>{i.user.firstName} {i.user.lastName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 opacity-80">Aircraft</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/40"
                                    value={form.aircraftId}
                                    onChange={e => setForm({...form, aircraftId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Aircraft</option>
                                    <option value="VT-ACC">VT-ACC - Cessna 172 (Test Aircraft)</option>
                                    {aircrafts.map(a => a.id !== 'VT-ACC' && <option key={a.id} value={a.id}>{a.id} - {a.model}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Starts</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                                        value={form.startTime}
                                        onChange={e => setForm({...form, startTime: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Ends</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                                        value={form.endTime}
                                        onChange={e => setForm({...form, endTime: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-3.5 rounded-xl mt-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Slots List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 px-1">
                        <span className="text-blue-500">📋</span> Active Slots
                    </h2>
                    
                    {schedules.length === 0 && !loading && (
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                            <p className="text-slate-500">No flight slots scheduled yet.</p>
                        </div>
                    )}

                    {schedules.map(slot => (
                        <div 
                            key={slot.id} 
                            className={`relative bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm transition-all ${slot.status === 'CANCELLED' ? 'border-red-200 bg-red-50/10' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${slot.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <span>{new Date(slot.startTime).toLocaleDateString(undefined, { month: 'short' })}</span>
                                        <span className="text-lg leading-none">{new Date(slot.startTime).toLocaleDateString(undefined, { day: '2-digit' })}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{slot.traineeName || 'Trainee #' + slot.traineeId}</h3>
                                        <p className="text-sm text-slate-500 font-medium">with {slot.instructorName || 'Instructor #' + slot.instructorId} • {slot.aircraftId}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-bold">
                                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${slot.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                                {slot.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(slot.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                >
                                    🗑️
                                </button>
                            </div>

                            {slot.weatherVerdict && (
                                <div className={`mt-4 p-4 rounded-xl text-sm ${slot.weatherVerdict === 'GO' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'}`}>
                                    <div className="font-bold flex items-center gap-1.5 mb-1">
                                        {slot.weatherVerdict === 'GO' ? '✅ Weather: GO' : '❌ Weather: NO-GO'}
                                    </div>
                                    {slot.cancellationReason && <p className="opacity-90">{slot.cancellationReason}</p>}
                                </div>
                            )}

                            {slot.extremeWeatherWarning && (
                                <div className="mt-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium animate-pulse">
                                    {slot.extremeWeatherWarning}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold">Updating schedules...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
