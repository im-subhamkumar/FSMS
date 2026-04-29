import React from 'react';

export default function DocumentsRoot() {
    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-4">D oc um en ts</h1>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    This is the D oc um en ts module placeholder.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 transition-colors">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search documents by title or category..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="md:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={categoryIdFilter}
                    onChange={(e) => setCategoryIdFilter(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Document Grid */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed text-slate-500 dark:text-slate-400 min-h-[400px] transition-colors">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
                        <FileSearch className="w-12 h-12 text-blue-500/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No documents found</h3>
                    <p className="text-center max-w-sm mb-6">We couldn't find anything matching your criteria. Try adjusting your filters or upload a new document.</p>
                    <button 
                        onClick={() => {
                            setDocumentToUpdate(null);
                            setIsUploadModalOpen(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Upload your first document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocuments.map(doc => {
                        const currentVersion = doc.versions?.[0] || {};
                        const fileUrl = currentVersion.fileUrl 
                            ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || `http://${window.location.hostname}:3000`}/uploads/${currentVersion.fileUrl}`
                            : '#';
                        
                        return (
                            <div 
                                key={doc.id} 
                                onClick={() => setSelectedDocument(doc)}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer"
                            >
                                
                                {/* Status badge */}
                                <div className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 backdrop-blur-md ${getStatusStyle(doc)}`}>
                                    <StatusIcon doc={doc} className="w-3.5 h-3.5" />
                                    {getStatusText(doc)}
                                </div>

                                <div className="p-6 pb-5 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 truncate" title={doc.title}>{doc.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{doc.category?.name || 'Uncategorized'}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 gap-2">
                                            <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            <span>Version {currentVersion.version || 1}</span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-xs">{currentVersion.size ? (currentVersion.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
                                        </div>
                                        {doc.expiryDate && (
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 gap-2">
                                                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex gap-2" onClick={e => e.stopPropagation()}>
                                    <a 
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <Download className="w-4 h-4" /> View
                                    </a>
                                    <button 
                                        onClick={() => {
                                            if(confirm('Are you sure you want to delete this document?')) {
                                                deleteDocument(doc.id);
                                            }
                                        }}
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <UploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setDocumentToUpdate(null);
                }} 
                existingDocument={documentToUpdate}
            />

            <DocumentDetailsModal
                isOpen={!!selectedDocument}
                onClose={() => setSelectedDocument(null)}
                document={selectedDocument}
                onUploadNewVersion={(doc) => {
                    setSelectedDocument(null);
                    setDocumentToUpdate(doc);
                    setIsUploadModalOpen(true);
                }}
            />
        </div>
    );
}
