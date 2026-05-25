import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Award, ClipboardCheck, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';

export const StudentDashboard = () => {
    const { user } = useAppStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [flightHours, setFlightHours] = useState(0);
    const [upcomingCount, setUpcomingCount] = useState(0);
    const [upcomingSchedules, setUpcomingSchedules] = useState([]);
    const [medicalStatus, setMedicalStatus] = useState('Valid');
    const [activeCourses, setActiveCourses] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            try {
                // Fetch schedules
                const schedulesRes = await api.get(`/schedules?traineeId=${user.id}`);
                const schedules = schedulesRes.data || [];

                // 1. Calculate Total Flight Hours for completed slots
                const completedSlots = schedules.filter(s => s.status?.toUpperCase() === 'COMPLETED');
                let totalHours = 0;
                completedSlots.forEach(s => {
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    const hours = (end - start) / (1000 * 60 * 60);
                    if (!isNaN(hours)) {
                        totalHours += hours;
                    }
                });
                setFlightHours(totalHours);

                // 2. Calculate Upcoming Sessions
                const now = new Date();
                const upcoming = schedules
                    .filter(s => s.status?.toUpperCase() === 'SCHEDULED' && new Date(s.startTime) > now)
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                
                setUpcomingCount(upcoming.length);
                setUpcomingSchedules(upcoming.slice(0, 3)); // show top 3

                // Fetch student profile details for medical and licenses info
                const studentRes = await api.get(`/students/${user.id}`).catch(() => null);
                if (studentRes && studentRes.data) {
                    const studentData = studentRes.data;
                    
                    // Dynamic Medical Status
                    if (studentData.medicals && studentData.medicals.length > 0) {
                        // find latest medical
                        const sortedMedicals = [...studentData.medicals].sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));
                        const latestMedical = sortedMedicals[0];
                        const expired = new Date(latestMedical.expiryDate) < now;
                        setMedicalStatus(expired ? 'Expired' : 'Valid');
                    } else {
                        setMedicalStatus('None');
                    }

                    // Dynamic Active Courses
                    if (studentData.licenses) {
                        setActiveCourses(studentData.licenses.length || 1);
                    }
                }
            } catch (err) {
                console.error("Error fetching student dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    const stats = [
        { id: 1, name: 'Total Flight Hours', value: loading ? '...' : flightHours.toFixed(1), icon: Calendar, color: 'blue' },
        { id: 2, name: 'Upcoming Sessions', value: loading ? '...' : upcomingCount.toString(), icon: Calendar, color: 'green' },
        { id: 3, name: 'Active Courses', value: loading ? '...' : activeCourses.toString(), icon: BookOpen, color: 'purple' },
        { id: 4, name: 'Medical Status', value: loading ? '...' : medicalStatus, icon: ClipboardCheck, color: 'emerald' },
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                        Here is an overview of your training progress and upcoming schedule.
                    </p>
                </div>
                <button 
                    onClick={() => navigate(`/students/${user?.id}`)}
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
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Schedule</h2>
                    <div className="space-y-4 mt-8">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                        ) : upcomingSchedules.length > 0 ? (
                            upcomingSchedules.map((schedule) => {
                                const formattedDate = new Date(schedule.startTime).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });
                                return (
                                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-shadow">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                {schedule.flightType} Flight - {schedule.aircraftId}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Instructor: {schedule.instructorName || 'Assigned Instructor'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-blue-600 dark:text-blue-400">{formattedDate}</p>
                                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium dark:bg-blue-900 dark:text-blue-300">
                                                {schedule.status === 'SCHEDULED' ? 'Scheduled' : schedule.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No upcoming flights scheduled</p>
                                <p className="text-xs text-gray-500 mt-1">Book a slot to start your practical flight training!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Documents</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 dark:bg-blue-900/50 dark:text-blue-400">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Class II Medical</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded 2 weeks ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 dark:bg-emerald-900/50 dark:text-emerald-400">
                                <Award className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">SPL Certificate</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded 1 month ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
