import React, { useState, useEffect } from 'react';
import { Users, Calendar, AlertTriangle, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { StudentDashboard } from './StudentDashboard';
import { InstructorDashboard } from './InstructorDashboard';
import { useAppStore } from '../store/useAppStore';

const stats = [
    { id: 1, name: 'Total Trainees', value: '1,204', icon: Users, change: '+12%', changeType: 'positive', color: 'blue' },
    { id: 2, name: 'Active Sessions', value: '42', icon: Activity, change: '+4.5%', changeType: 'positive', color: 'green' },
    { id: 3, name: 'Alerts & Warnings', value: '8', icon: AlertTriangle, change: '-2', changeType: 'positive', color: 'red' },
    { id: 4, name: 'Scheduled Flights', value: '156', icon: Calendar, change: '+18%', changeType: 'positive', color: 'purple' },
];

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between">
            <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading data
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const getColorClass = (color) => {
        const classes = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            purple: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        };
        return classes[color] || classes.blue;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                        A quick summary of flight school operations and analytics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        Download Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:outline-none">
                        New Session
                    </button>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading
                    ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : stats.map((stat) => (
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
                            <div className="mt-4 flex items-center text-sm relative z-10">
                                <span className={`flex items-center font-bold ${
                                    stat.changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {stat.changeType === 'positive' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                                    {stat.change}
                                </span>
                                <span className="ml-2 text-gray-500 dark:text-gray-400 tracking-tight font-medium">vs last month</span>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Training Operations Activity</h2>
                        <select className="bg-gray-50 dark:bg-gray-900 border-none font-medium text-sm text-gray-600 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 py-1.5 cursor-pointer">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    {isLoading ? (
                         <div className="h-[300px] bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse mt-8"></div>
                    ) : (
                        <div className="h-[300px] w-full flex items-end justify-between gap-3 mt-8 px-2">
                             {/* CSS-only Bar Chart Placeholder */}
                             {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
                                 <div key={i} className="w-full h-full flex flex-col justify-end items-center group pt-6">
                                     <div className="w-full flex-1 max-h-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors relative flex items-end">
                                         <div className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-md transition-all duration-1000 group-hover:opacity-90 min-h-[4px]" style={{ height: `${height}%` }}></div>
                                     </div>
                                     <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-3 uppercase">Day {i + 1}</div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activities</h2>
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
                                    <div className="space-y-3 flex-1">
                                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 dark:before:from-gray-700 before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                            {[
                                { id: 1, text: 'Instructor Sarah certified 4 trainees in IFR operations.', time: '2h ago', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
                                { id: 2, text: 'Maintenance alert reported for Aircraft N7834C.', time: '4h ago', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40' },
                                { id: 3, text: 'New batch of 24 trainees enrolled in Ground School.', time: 'Yesterday', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' },
                                { id: 4, text: 'System backup completed successfully.', time: 'Yesterday', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
                            ].map((activity) => (
                                <div key={activity.id} className="relative flex items-center justify-between gap-4">
                                    <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full shrink-0 ring-4 ring-white dark:ring-gray-800 ${activity.bg}`}>
                                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">{activity.text}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export const Dashboard = () => {
    const { user } = useAppStore();
    
    if (user?.role === 'Student') return <StudentDashboard />;
    if (user?.role === 'Instructor') return <InstructorDashboard />;
    return <AdminDashboard />;
};
