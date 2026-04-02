import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, User, Sun, Moon, LogOut, Settings as SettingsIcon, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Header = () => {
    const { toggleSidebar, user, logout, notifications, removeNotification, markAllRead, theme, toggleTheme } = useAppStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 backdrop-blur-md px-4 shadow-sm sm:px-6 dark:bg-gray-900/80 dark:border-gray-800 transition-colors duration-200">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Global Search Interface */}
                <div className="hidden sm:flex max-w-md items-center relative group">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        className="w-[280px] lg:w-[400px] rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:bg-gray-900"
                        placeholder="Search instructors, records, modules..."
                    />
                    <div className="absolute right-3 hidden lg:flex items-center gap-1 opacity-100 transition-opacity">
                        <kbd className="inline-flex items-center border border-gray-200 bg-white rounded px-2 py-0.5 font-sans text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800">Ctrl K</kbd>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                    aria-label="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                        ${isNotifOpen ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-gray-900"></span>
                            </span>
                        )}
                    </button>

                    {/* Notification Panel */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications ({unreadCount})</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium transition-colors">
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center flex flex-col items-center justify-center">
                                        <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {notifications.map((n) => (
                                            <li key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${n.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                                <div className="flex gap-3 relative">
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.unread ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-transparent'}`} />
                                                    <div className="flex-1 min-w-0 pr-6">
                                                        <p className={`text-sm tracking-tight ${n.unread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>{n.title}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{n.time}</p>
                                                    </div>
                                                    <button onClick={() => removeNotification(n.id)} className="absolute right-0 top-0 text-gray-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Dismiss">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="p-2 border-t dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-center">
                                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 md:gap-3 p-1 rounded-full md:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                    >
                        <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white dark:border-gray-800 shadow-sm shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-full w-full p-1.5 text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300" />
                            )}
                        </div>
                        <div className="hidden md:flex flex-col text-left mr-1">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">{user?.name || 'Guest'}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-bold">{user?.role || 'User'}</span>
                        </div>
                    </button>

                    {/* Profile Panel */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Guest'}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{user?.role || 'User'}</p>
                            </div>
                            <div className="p-1.5 border-b dark:border-gray-700">
                                <button className="flex w-full items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors group">
                                    <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    Your Profile
                                </button>
                                <button className="flex w-full items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors group mt-0.5">
                                    <SettingsIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    Account Settings
                                </button>
                            </div>
                            <div className="p-1.5">
                                <button onClick={logout} className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors group">
                                    <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
