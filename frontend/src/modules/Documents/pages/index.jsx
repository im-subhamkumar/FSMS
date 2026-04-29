import React from 'react';
import { FileText } from 'lucide-react';

export default function DocumentsRoot() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage uploaded documents and files.</p>
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-full mb-4">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    Documents module is under development.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Check back soon for file management capabilities.
                </p>
            </div>
        </div>
    );
}
