import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, History, Download, UploadCloud, FileText, Calendar, ShieldCheck, AlertCircle, Clock, Eye } from 'lucide-react';
import { useDocumentStore } from '../../../store/documentStore';

export const DocumentDetailsModal = ({ isOpen, onClose, document, onUploadNewVersion }) => {
    const [mounted, setMounted] = useState(false);
    const { fetchDocumentVersions, documentVersions, isLoading } = useDocumentStore();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && document?.id) {
            fetchDocumentVersions(document.id);
        }
    }, [isOpen, document?.id, fetchDocumentVersions]);

    if (!isOpen || !mounted || !document) return null;

    const getStatusStyle = (doc) => {
        if (doc.status === 'EXPIRED') return 'bg-red-100 text-red-700 border-red-200';
        const warningDays = doc.category?.warningThresholdDays || 30;
        if (doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000)) {
            return 'bg-amber-100 text-amber-700 border-amber-200';
        }
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    const getStatusText = (doc) => {
        if (doc.status === 'EXPIRED') return 'Expired';
        const warningDays = doc.category?.warningThresholdDays || 30;
        if (doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000)) {
            return 'Expiring Soon';
        }
        return 'Valid';
    };

    const StatusIcon = ({ doc, className }) => {
        if (doc.status === 'EXPIRED') return <AlertCircle className={className} />;
        const warningDays = doc.category?.warningThresholdDays || 30;
        if (doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000)) {
            return <Clock className={className} />;
        }
        return <ShieldCheck className={className} />;
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{document.title}</h2>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-700">
                                    {document.category?.name || 'Uncategorized'}
                                </span>
                                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusStyle(document)}`}>
                                    <StatusIcon doc={document} className="w-3.5 h-3.5" />
                                    {getStatusText(document)}
                                </div>
                                {document.expiryDate && (
                                    <span className="flex items-center text-xs text-slate-500 gap-1 font-medium bg-slate-100 px-2 py-1 rounded-md">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Expires: {new Date(document.expiryDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Version History */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-600" />
                            Version History
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documentVersions.length === 0 ? (
                                <p className="text-slate-500 text-center py-4">No version history available.</p>
                            ) : (
                                documentVersions.map((version, index) => {
                                    const isLatest = index === 0;
                                    const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/uploads/${version.fileUrl}`;
                                    
                                    return (
                                        <div 
                                            key={version.id} 
                                            className={`p-4 rounded-xl border transition-all ${
                                                isLatest 
                                                ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                                        isLatest ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        V{version.version}
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${isLatest ? 'text-blue-900' : 'text-slate-700'}`}>
                                                            {version.originalName}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 mb-1">
                                                            <span>Uploaded on {new Date(version.uploadedAt).toLocaleString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span>{(version.size / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                        {version.description && (
                                                            <p className="mt-2 text-sm text-slate-600 bg-slate-100/50 p-2.5 rounded-lg border border-slate-100 italic">
                                                                "{version.description}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <a 
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`p-2 rounded-lg transition-colors flex flex-col items-center gap-1 ${
                                                            isLatest 
                                                            ? 'text-blue-600 hover:bg-blue-100' 
                                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                                        }`}
                                                        title="View this version"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                    <a 
                                                        href={fileUrl}
                                                        download={version.originalName}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`p-2 rounded-lg transition-colors flex flex-col items-center gap-1 ${
                                                            isLatest 
                                                            ? 'text-blue-600 hover:bg-blue-100' 
                                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                                        }`}
                                                        title="Download this version"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => onUploadNewVersion(document)}
                        className="flex items-center gap-2 px-6 py-2.5 font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 active:scale-95"
                    >
                        <UploadCloud className="w-5 h-5" />
                        Upload New Version
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, window.document.body);
};
