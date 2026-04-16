import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-8xl font-black text-blue-600 mb-4 tracking-tight">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 dark:text-gray-100">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md dark:text-gray-400">
            The module or page you are looking for doesn't exist, has been moved, or you don't have the necessary access permissions.
        </p>
        <Link 
            to="/" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/30"
        >
            Return to Dashboard
        </Link>
    </div>
);
