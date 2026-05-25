import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, ClipboardCheck, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';

export const InstructorDashboard = () => {
    const { user } = useAppStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignedStudents, setAssignedStudents] = useState(0);
    const [sessionsToday, setSessionsToday] = useState(0);
    const [totalFlightHours, setTotalFlightHours] = useState(0);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [todaySchedules, setTodaySchedules] = useState([]);

    useEffect(() => {
        const fetchInstructorData = async () => {
            const instructorId = user?.instructorDbId || user?.id;
            if (!instructorId) return;

            try {
                // Fetch schedules for this instructor
                const schedulesRes = await api.get(`/schedules?instructorId=${instructorId}`);
                const schedules = schedulesRes.data || [];

                // 1. Calculate assigned students count (unique traineeIds)
                const uniqueTrainees = new Set(schedules.map(s => s.traineeId));
                setAssignedStudents(uniqueTrainees.size);

                // 2. Filter completed slots and calculate total flight hours
                const completedSlots = schedules.filter(s => s.status?.toUpperCase() === 'COMPLETED');
                setCompletedSessions(completedSlots.length);

                let totalHours = 0;
                completedSlots.forEach(s => {
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    const hours = (end - start) / (1000 * 60 * 60);
                    if (!isNaN(hours)) {
                        totalHours += hours;
                    }
                });
                setTotalFlightHours(totalHours);

                // 3. Filter sessions scheduled for today
                const todayStr = new Date().toISOString().split('T')[0];
                const todaySlots = schedules.filter(s => {
                    const sDateStr = new Date(s.startTime).toISOString().split('T')[0];
                    return sDateStr === todayStr;
                });
                setSessionsToday(todaySlots.length);

                // Sort today's slots by startTime
                const sortedTodaySlots = todaySlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setTodaySchedules(sortedTodaySlots);

            } catch (err) {
                console.error("Failed to fetch instructor dashboard details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructorData();
    }, [user?.instructorDbId, user?.id]);

    const stats = [
        { id: 1, name: 'Assigned Students', value: loading ? '...' : assignedStudents.toString(), icon: Users, color: 'blue' },
        { id: 2, name: 'Sessions Today', value: loading ? '...' : sessionsToday.toString(), icon: Calendar, color: 'green' },
        { id: 3, name: 'Total Flight Hours', value: loading ? '...' : totalFlightHours.toFixed(1), icon: Clock, color: 'purple' },
        { id: 4, name: 'Completed Sessions', value: loading ? '...' : completedSessions.toString(), icon: CheckCircle, color: 'emerald' },
    ];

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            purple: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        };
        return classes[color] || classes.blue;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Portal - {user?.name}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                        Manage your students, sessions, and daily operations.
                    </p>
                </div>
                <button 
                    onClick={() => navigate(`/instructors/${user?.instructorDbId || user?.id}`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98]"
                >
                    <UserIcon className="h-4 w-4" />
                    View My Profile
                </button>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon className="w-24 h-24 rotate-12" />
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate tracking-wide">
                                    {stat.name}
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-2xl ${getColorClass(stat.color)}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[400px]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Schedule</h2>
                    <div className="space-y-4 mt-8">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                        ) : todaySchedules.length > 0 ? (
                            todaySchedules.map((schedule) => {
                                const start = new Date(schedule.startTime);
                                const end = new Date(schedule.endTime);
                                const timeRange = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                                
                                const getStatusStyles = (status) => {
                                    switch (status?.toUpperCase()) {
                                        case 'SCHEDULED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
                                        case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
                                        case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
                                        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
                                    }
                                };

                                return (
                                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{timeRange}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {schedule.flightType} Flight - {schedule.aircraftId}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                                                {schedule.traineeName || 'Trainee'}
                                            </p>
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(schedule.status)}`}>
                                                {schedule.status === 'SCHEDULED' ? 'Scheduled' : schedule.status === 'COMPLETED' ? 'Completed' : schedule.status === 'CANCELLED' ? 'Cancelled' : schedule.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No sessions scheduled for today</p>
                                <p className="text-xs text-gray-500 mt-1">Enjoy your day or check flying slots to review past/future sessions!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Pending Tasks</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 dark:bg-amber-900/50 dark:text-amber-400">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Logbook Sign-offs</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">3 Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
