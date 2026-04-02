import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, Plane, MonitorPlay,
    CalendarDays, CalendarPlus, Wrench, CloudLightning, BookOpen,
    BadgeCheck, ClipboardCheck, FolderTree, Files, Tags, Receipt,
    BarChart3, PieChart, Bell, History
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const navGroups = [
    {
        label: "Overview",
        items: [
            { id: 'T0', name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        ]
    },
    {
        label: "People",
        items: [
            { id: 'T1', name: 'Students', icon: Users, path: '/students' },
            { id: 'T2', name: 'Instructors', icon: GraduationCap, path: '/instructors' },
        ]
    },
    {
        label: "Operations",
        items: [
            { id: 'T3', name: 'Aircraft', icon: Plane, path: '/aircraft' },
            { id: 'T4', name: 'Flying Slots', icon: CalendarDays, path: '/flying-slots' },
            { id: 'T5', name: 'Slot Requests', icon: CalendarPlus, path: '/slot-requests' },
            { id: 'T6', name: 'Dispatch Board', icon: MonitorPlay, path: '/dispatch-board' },
            { id: 'T7', name: 'Maintenance Blocks', icon: Wrench, path: '/maintenance-blocks' },
            { id: 'T8', name: 'Weather Holds', icon: CloudLightning, path: '/weather-holds' },
        ]
    },
    {
        label: "Academics",
        items: [
            { id: 'T9', name: 'Courses', icon: BookOpen, path: '/courses' },
            { id: 'T10', name: 'Qualification Types', icon: BadgeCheck, path: '/qualification-types' },
            { id: 'T11', name: 'Qualification Records', icon: ClipboardCheck, path: '/qualification-records' },
        ]
    },
    {
        label: "Documents",
        items: [
            { id: 'T12', name: 'Document Categories', icon: FolderTree, path: '/document-categories' },
            { id: 'T13', name: 'Documents', icon: Files, path: '/documents' },
        ]
    },
    {
        label: "Finance",
        items: [
            { id: 'T14', name: 'Pricing Rates', icon: Tags, path: '/pricing-rates' },
            { id: 'T15', name: 'Invoices', icon: Receipt, path: '/invoices' },
        ]
    },
    {
        label: "Insights",
        items: [
            { id: 'T16', name: 'Reports Dashboard', icon: BarChart3, path: '/reports-dashboard' },
            { id: 'T17', name: 'Analytics Dashboard', icon: PieChart, path: '/analytics-dashboard' },
        ]
    },
    {
        label: "System",
        items: [
            { id: 'T18', name: 'Notifications', icon: Bell, path: '/notifications' },
            { id: 'T19', name: 'Audit Logs', icon: History, path: '/audit-logs' },
        ]
    }
];

export const Sidebar = () => {
    const { sidebarOpen } = useAppStore();

    return (
        <aside
            className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r 
            bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm
            ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full sm:translate-x-0'}`}
        >
            <div className="flex h-full flex-col overflow-y-auto custom-scrollbar">
                {/* Logo Area */}
                <div className="flex items-center justify-center border-b dark:border-gray-800 h-16 shrink-0 bg-blue-600 dark:bg-blue-700 text-white shadow-sm">
                    {sidebarOpen ? (
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-xl tracking-wider">FSMS</span>
                            <span className="text-[10px] text-blue-100 tracking-widest uppercase font-semibold">Flight School</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center bg-blue-500 rounded-lg p-2 shadow-inner">
                            <span className="font-black text-xl tracking-tighter">FS</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-5 p-3 overflow-x-hidden pt-5">
                    {navGroups.map((group, idx) => (
                        <div key={idx}>
                            {sidebarOpen ? (
                                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                                    {group.label}
                                </h3>
                            ) : (
                                <div className="w-full border-t border-gray-100 dark:border-gray-800 mb-2 mt-4 hidden sm:block first:mt-0 first:border-0"></div>
                            )}
                            
                            <ul className="space-y-1">
                                {group.items.map((item) => (
                                    <li key={item.id} className="relative group/nav-item">
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-medium before:absolute before:inset-y-0 before:-left-3 before:w-1 before:bg-blue-600 before:rounded-r-md'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`
                                            }
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center min-w-0">
                                                    <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 
                                                        ${!sidebarOpen ? 'mx-auto' : 'mr-3'} 
                                                    `} />
                                                    <span className={`text-sm truncate transition-opacity duration-300
                                                        ${!sidebarOpen ? 'w-0 opacity-0 hidden sm:block' : 'w-auto opacity-100'}
                                                    `}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                
                                                {/* Badge */}
                                                {item.badge && sidebarOpen && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        </NavLink>

                                        {/* Tooltip for collapsed mode */}
                                        {!sidebarOpen && (
                                            <div className="absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-200 group-hover/nav-item:opacity-100 z-50 pointer-events-none whitespace-nowrap hidden sm:block">
                                                {item.name}
                                                <span className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900"></span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer Area */}
                <div className={`border-t dark:border-gray-800 p-4 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/20 ${sidebarOpen ? 'flex justify-between items-center' : 'flex justify-center'}`}>
                    {sidebarOpen ? (
                        <>
                            <div className="text-xs text-gray-400 hidden sm:block font-medium">System Active</div>
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                        </>
                    ) : (
                         <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    )}
                </div>
            </div>
        </aside>
    );
};
