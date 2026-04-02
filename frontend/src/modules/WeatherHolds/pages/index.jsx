import React from 'react';

export default function WeatherHoldsRoot() {
    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-4">W ea th er Ho ld s</h1>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    This is the W ea th er Ho ld s module placeholder.
                </p>
            </div>
        </div>
    );
}
