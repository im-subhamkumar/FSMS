import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';
import { useDocumentStore } from '../../../store/documentStore';
import { useDocumentCategoryStore } from '../../../store/documentCategoryStore';

export const UploadModal = ({ isOpen, onClose, existingDocument }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    const { uploadDocument, isLoading, error, clearError } = useDocumentStore();
    const { categories, fetchCategories } = useDocumentCategoryStore();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [description, setDescription] = useState('');
    const [aircrafts, setAircrafts] = useState([]);
    const [aircraftId, setAircraftId] = useState('');
    const [dragActive, setDragActive] = useState(false);
    
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            clearError();
            fetchCategories();

            const fetchAircrafts = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/aircraft`);
                    if (response.ok) {
                        const data = await response.json();
                        setAircrafts(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch aircrafts", err);
                }
            };
            fetchAircrafts();

            if (existingDocument) {
                setTitle(existingDocument.title);
                setCategoryId(existingDocument.categoryId);
                if (existingDocument.aircraftId) {
                    setAircraftId(existingDocument.aircraftId);
                }
                if (existingDocument.expiryDate) {
                    setExpiryDate(new Date(existingDocument.expiryDate).toISOString().split('T')[0]);
                }
            }
        }
    }, [isOpen, fetchCategories, existingDocument]);

    if (!isOpen || !mounted) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            if (!title) setTitle(e.dataTransfer.files[0].name.split('.')[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!title) setTitle(e.target.files[0].name.split('.')[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title || !categoryId) return;

        const selectedCategory = categories.find(c => c.id.toString() === categoryId.toString());
        if (selectedCategory?.requiresExpiry && !expiryDate) {
            alert('An expiry date is required for this category');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('categoryId', categoryId);
        if (expiryDate) formData.append('expiryDate', expiryDate);
        if (description) formData.append('description', description);
        if (aircraftId) formData.append('aircraftId', aircraftId);
        if (existingDocument) formData.append('documentId', existingDocument.id);

        try {
            await uploadDocument(formData);
            handleClose();
        } catch (err) {
            console.error('Upload failed', err);
        }
    };

    const handleClose = () => {
        setFile(null);
        setTitle('');
        setCategoryId('');
        setExpiryDate('');
        setDescription('');
        setAircraftId('');
        clearError();
        onClose();
    };

    const selectedCategory = categories.find(c => c.id.toString() === categoryId?.toString());
    const isAircraftCategory = selectedCategory?.name?.toLowerCase().includes('aircraft');

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transition-colors">
                <div className="flex justify-between items-center p-6 bg-slate-900 dark:bg-slate-950 text-white transition-colors">
                    <h2 className="text-xl font-semibold">
                        {existingDocument ? 'Upload New Version' : 'Upload Document'}
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200 dark:border-red-900/50">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                            dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                                <File className="w-10 h-10" />
                                <span className="font-medium">{file.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                <UploadCloud className="w-10 h-10 mb-2 text-slate-400 dark:text-slate-500" />
                                <p className="font-medium text-slate-700 dark:text-slate-300">Click or drag file here</p>
                                <p className="text-sm">PDF, DOC, JPG, PNG up to 50MB</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-white ${existingDocument ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                                placeholder="E.g. Medical Certificate 2025"
                                required
                                disabled={!!existingDocument}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select 
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-white ${existingDocument ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800'}`}
                                    required
                                    disabled={!!existingDocument}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            {categories.find(c => c.id.toString() === categoryId.toString())?.requiresExpiry ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Expiry Date <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full border border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 text-slate-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {isAircraftCategory && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Aircraft (Optional)</label>
                                <select 
                                    value={aircraftId}
                                    onChange={(e) => setAircraftId(e.target.value)}
                                    className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-white ${existingDocument ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800'}`}
                                    disabled={!!existingDocument}
                                >
                                    <option value="">None</option>
                                    {aircrafts.map(ac => (
                                        <option key={ac.id} value={ac.id}>{ac.name} — {ac.model}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Version Description (Optional)</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 transition-all dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                placeholder="What changed in this version? Detailed notes..."
                            />
                        </div>
                    </div>


                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!file || !title || isLoading}
                            className="px-4 py-2 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Uploading...' : (existingDocument ? 'Upload Version' : 'Upload File')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
