import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

export const AppShell = () => {
    const { sidebarOpen, theme, user } = useAppStore();
    const location = useLocation();

    // Small hack to apply dark mode class to html element
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Dummy Auth check
    if (!user) {
        // Just an example. Since we always have a dummy user, this rarely fires.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return (
        <div className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className={`flex flex-col flex-1 w-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'sm:ml-64' : 'sm:ml-20'}`}
            >
                {/* Header Navbar */}
                <Header />

                {/* Page Content Scrollable Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 custom-scrollbar relative">
                    <div className="mx-auto max-w-7xl">
                        {/* Only show breadcrumbs if not on root / dashboard to avoid redundancy */}
                        {location.pathname !== '/' && <Breadcrumbs />}
                        
                        {/* Page Routes Outlet with transition wrapping block */}
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
