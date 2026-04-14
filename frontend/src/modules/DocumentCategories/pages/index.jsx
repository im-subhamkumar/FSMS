import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Clock, Save, X, FileBadge } from 'lucide-react';
import { useDocumentCategoryStore } from '../../../store/documentCategoryStore';

export default function DocumentCategoriesRoot() {
    const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, isLoading, error } = useDocumentCategoryStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        requiresExpiry: false,
        warningThresholdDays: 30
    });

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenForm = (category = null) => {
        if (category) {
            setEditingId(category.id);
            setFormData({
                name: category.name,
                description: category.description || '',
                requiresExpiry: category.requiresExpiry,
                warningThresholdDays: category.warningThresholdDays || 30
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                requiresExpiry: false,
                warningThresholdDays: 30
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCategory(editingId, formData);
            } else {
                await createCategory(formData);
            }
            handleCloseForm();
        } catch (err) {
            console.error('Error saving category', err);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you confirm you want to delete this category? Any associated documents will trap this action unless deleted.')) {
            try {
                await deleteCategory(id);
            } catch (err) {
                alert(err.message || 'Failed to delete category');
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <FileBadge className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Document Categories
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 pl-11">Manage classification settings and expiry policies for all system documents.</p>
                </div>
                <button 
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Category
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 relative transition-colors">
                {isLoading && categories.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                                    <th className="px-6 py-4 font-medium">Category Name</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium">Expiry Policy</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No categories found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{cat.name}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">ID: {cat.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-300 text-sm max-w-xs block truncate" title={cat.description}>
                                                {cat.description || <span className="text-slate-400 dark:text-slate-500 italic">No description</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cat.requiresExpiry ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 w-fit">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Expiry Tracking Active
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                        Warn {cat.warningThresholdDays} days before
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    No Expiry
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenForm(cat)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transition-colors">
                        <div className="flex justify-between items-center p-6 bg-slate-900 dark:bg-slate-950 text-white transition-colors">
                            <h2 className="text-xl font-semibold">
                                {editingId ? 'Edit Category' : 'New Document Category'}
                            </h2>
                            <button onClick={handleCloseForm} className="p-2 hover:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="e.g. Medical Certificate"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="What kind of documents belong here?"
                                />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4 transition-colors">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-start pt-0.5">
                                        <input 
                                            type="checkbox"
                                            checked={formData.requiresExpiry}
                                            onChange={(e) => setFormData({...formData, requiresExpiry: e.target.checked})}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Tracks Expiry Dates</span>
                                        <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">Require an expiry date when uploading these documents.</span>
                                    </div>
                                </label>

                                {formData.requiresExpiry && (
                                    <div className="pl-7 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warning Threshold (Days)</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={formData.warningThresholdDays}
                                                onChange={(e) => setFormData({...formData, warningThresholdDays: parseInt(e.target.value) || 0})}
                                                className="w-24 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Days before expiry to show warnings</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={handleCloseForm}
                                    className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isLoading || !formData.name}
                                    className="flex items-center gap-2 px-5 py-2 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <Save className="w-4 h-4" />
                                    {isLoading ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
