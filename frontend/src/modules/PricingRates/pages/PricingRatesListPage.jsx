import React, { useState, useEffect, useCallback } from 'react';
import {
    Tags, Plus, Search, Filter, RefreshCw,
    IndianRupee, CheckCircle, XCircle,
    Edit2, Trash2, ChevronDown, AlertCircle,
    Clock, Repeat, CreditCard, Layers
} from 'lucide-react';
import PricingRateModal from '../components/PricingRateModal';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : `http://${window.location.hostname}:3000`;

const CATEGORY_META = {
    AIRCRAFT_RENTAL: { label: 'Aircraft Rental',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',    icon: '✈️' },
    INSTRUCTOR_FEE:  { label: 'Instructor Fee',    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: '👨‍✈️' },
    COURSE_FEE:      { label: 'Course Fee',        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', icon: '📚' },
    EXAM_FEE:        { label: 'Exam Fee',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  icon: '📝' },
    GROUND_SCHOOL:   { label: 'Ground School',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '🏫' },
    OTHER:           { label: 'Other',             color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',        icon: '📌' },
};

const RATE_TYPE_META = {
    HOURLY:      { label: 'Per Hour',    icon: Clock,      color: 'text-sky-600 dark:text-sky-400' },
    FLAT:        { label: 'Flat Rate',   icon: CreditCard, color: 'text-violet-600 dark:text-violet-400' },
    PER_SESSION: { label: 'Per Session', icon: Repeat,     color: 'text-amber-600 dark:text-amber-400' },
};

const formatAmount = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{value}</p>
        </div>
    </div>
);

const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[...Array(7)].map((_, i) => (
            <td key={i} className="px-4 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </td>
        ))}
    </tr>
);

export default function PricingRatesListPage() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState(null);

    const fetchRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (categoryFilter) params.set('category', categoryFilter);
            if (typeFilter) params.set('rateType', typeFilter);
            if (statusFilter) params.set('active', statusFilter);

            const res = await fetch(`${API_BASE}/api/pricing-rates?${params}`);
            if (!res.ok) throw new Error('Failed to fetch pricing rates');
            const data = await res.json();
            setRates(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, typeFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchRates, 300);
        return () => clearTimeout(timer);
    }, [fetchRates]);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/pricing-rates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to deactivate rate');
            setDeleteConfirm(null);
            fetchRates();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/pricing-rates/${id}/hard`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to permanently delete rate');
            setHardDeleteConfirm(null);
            fetchRates();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleModalClose = (refreshNeeded) => {
        setModalOpen(false);
        setEditingRate(null);
        if (refreshNeeded) fetchRates();
    };

    const openEdit = (rate) => {
        setEditingRate(rate);
        setModalOpen(true);
    };

    const activeRates = rates.filter(r => r.isActive);
    const hourlyRatesCount = rates.filter(r => r.rateType === 'HOURLY').length;
    
    const categoryCount = new Set(rates.map(r => r.category)).size;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tags className="w-7 h-7 text-violet-600" />
                        Pricing Rates
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage billing rates for aircraft, instructors, courses, and exams.
                    </p>
                </div>
                <button
                    id="btn-add-rate"
                    onClick={() => { setEditingRate(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    <Plus className="w-4 h-4" />
                    Add Rate
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Tags}        label="Total Rates"   value={rates.length}          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
                <StatCard icon={CheckCircle} label="Active"        value={activeRates.length}    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
                <StatCard icon={Clock}       label="Hourly Rates"  value={hourlyRatesCount}    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                <StatCard icon={Layers}      label="Categories"    value={categoryCount}         color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            id="rates-search"
                            type="text"
                            placeholder="Search rates..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            id="rates-filter-category"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {Object.entries(CATEGORY_META).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Rate type filter */}
                    <div className="relative">
                        <select
                            id="rates-filter-type"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
                        >
                            <option value="">All Types</option>
                            {Object.entries(RATE_TYPE_META).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <select
                            id="rates-filter-status"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Refresh */}
                    <button
                        id="btn-refresh-rates"
                        onClick={fetchRates}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate Name</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linked Course</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                            ) : rates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                            <Tags className="w-12 h-12 opacity-30" />
                                            <p className="font-medium">No pricing rates found</p>
                                            <p className="text-xs">Try adjusting filters or add a new rate.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rates.map(rate => {
                                    const RateIcon = RATE_TYPE_META[rate.rateType]?.icon || IndianRupee;
                                    return (
                                        <tr
                                            key={rate.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
                                        >
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-gray-900 dark:text-white">{rate.name}</p>
                                                {rate.notes && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{rate.notes}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_META[rate.category]?.color}`}>
                                                    <span>{CATEGORY_META[rate.category]?.icon}</span>
                                                    {CATEGORY_META[rate.category]?.label || rate.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`flex items-center gap-1.5 text-sm font-medium ${RATE_TYPE_META[rate.rateType]?.color}`}>
                                                    <RateIcon className="w-3.5 h-3.5" />
                                                    {RATE_TYPE_META[rate.rateType]?.label || rate.rateType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                                                {formatAmount(rate.amount)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {rate.course ? (
                                                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                                        {rate.course.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {rate.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                        <XCircle className="w-3 h-3" /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        id={`btn-edit-rate-${rate.id}`}
                                                        onClick={() => openEdit(rate)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                                                        title="Edit rate"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        id={`btn-delete-rate-${rate.id}`}
                                                        onClick={() => setDeleteConfirm(rate)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                                        title="Deactivate rate"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        id={`btn-hard-delete-rate-${rate.id}`}
                                                        onClick={() => setHardDeleteConfirm(rate)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                        title="Delete permanently"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && rates.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Showing {rates.length} rate{rates.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <PricingRateModal
                    rate={editingRate}
                    onClose={handleModalClose}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Deactivate Rate</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">This will mark the rate as inactive</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to deactivate <strong>{deleteConfirm.name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hard Delete Confirmation */}
            {hardDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Permanent Delete</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to <strong>permanently delete</strong> {hardDeleteConfirm.name}? It will be removed entirely from the database.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setHardDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleHardDelete(hardDeleteConfirm.id)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
