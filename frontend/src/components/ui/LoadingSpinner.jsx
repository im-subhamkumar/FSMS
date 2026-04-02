import React from 'react';

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 flex items-center justify-center">
            <span className="sr-only">Loading...</span>
        </div>
    </div>
);
