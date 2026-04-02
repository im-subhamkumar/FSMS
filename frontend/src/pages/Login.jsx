import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login = () => {
    const { setUser } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogin = () => {
        setUser({
            id: 'I-26',
            name: 'Tech Lead',
            role: 'Admin',
            avatar: 'https://ui-avatars.com/api/?name=Tech+Lead&background=0284c7&color=fff',
        });
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to FSMS</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click below to continue</p>
                </div>
                <button
                    onClick={handleLogin}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
};
