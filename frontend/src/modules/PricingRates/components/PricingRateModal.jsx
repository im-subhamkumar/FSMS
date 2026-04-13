import React, { useState, useEffect } from 'react';
import { X, Tags, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const CATEGORIES = [
    { value: 'AIRCRAFT_RENTAL', label: '✈️  Aircraft Rental' },
    { value: 'INSTRUCTOR_FEE',  label: '👨‍✈️  Instructor Fee' },
    { value: 'COURSE_FEE',      label: '📚  Course Fee' },
    { value: 'EXAM_FEE',        label: '📝  Exam Fee' },
    { value: 'GROUND_SCHOOL',   label: '🏫  Ground School' },
    { value: 'OTHER',           label: '📌  Other' },
];

const RATE_TYPES = [
    { value: 'HOURLY',      label: 'Per Hour' },
    { value: 'FLAT',        label: 'Flat Rate' },
    { value: 'PER_SESSION', label: 'Per Session' },
];

const Field = ({ label, required, children, hint }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
);

const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition';

export default function PricingRateModal({ rate, onClose }) {
    const isEdit = Boolean(rate);

    const [form, setForm] = useState({
        name: rate?.name || '',
        category: rate?.category || '',
        rateType: rate?.rateType || '',
        amount: rate?.amount || '',
        currency: rate?.currency || 'INR',
        courseId: rate?.courseId || '',
        effectiveFrom: rate?.effectiveFrom
            ? new Date(rate.effectiveFrom).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        notes: rate?.notes || '',
        isActive: rate?.isActive !== undefined ? rate.isActive : true,
    });

    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Load courses for the dropdown
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/courses?active=true`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch {
                // Silently fail — course link is optional
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.name.trim() || !form.category || !form.rateType || form.amount === '') {
            setError('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit
                ? `${API_BASE}/api/pricing-rates/${rate.id}`
                : `${API_BASE}/api/pricing-rates`;
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                ...form,
                amount: parseFloat(form.amount),
                courseId: form.courseId ? parseInt(form.courseId) : null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            onClose(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdrop}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40">
                            <Tags className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-base">
                                {isEdit ? 'Edit Pricing Rate' : 'Add New Rate'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isEdit ? `Editing: ${rate.name}` : 'Define a new billable rate'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        id="btn-close-rate-modal"
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <Field label="Rate Name" required>
                        <input
                            id="rate-name"
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Cessna 172 Wet Rate"
                            className={inputClass}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Category" required>
                            <select
                                id="rate-category"
                                value={form.category}
                                onChange={e => set('category', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select category...</option>
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Rate Type" required>
                            <select
                                id="rate-type"
                                value={form.rateType}
                                onChange={e => set('rateType', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select type...</option>
                                {RATE_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="pb-4">
                        <Field label="Amount (INR)" required>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                                <input
                                    id="rate-amount"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.amount}
                                    onChange={e => set('amount', e.target.value)}
                                    placeholder="5000"
                                    className={inputClass + ' pl-7'}
                                />
                            </div>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Linked Course" hint="Optional — link this rate to a specific course">
                            <select
                                id="rate-course"
                                value={form.courseId}
                                onChange={e => set('courseId', e.target.value)}
                                disabled={loadingCourses}
                                className={inputClass + ' disabled:opacity-60'}
                            >
                                <option value="">No linked course</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Effective From">
                            <input
                                id="rate-effective-from"
                                type="date"
                                value={form.effectiveFrom}
                                onChange={e => set('effectiveFrom', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label="Notes" hint="Optional — internal notes about this rate">
                        <textarea
                            id="rate-notes"
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder="e.g. Applies during peak hours only..."
                            rows={2}
                            className={inputClass + ' resize-none'}
                        />
                    </Field>

                    {isEdit && (
                        <Field label="Status">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    id="rate-toggle-status"
                                    onClick={() => set('isActive', !form.isActive)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                        form.isActive ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            form.isActive ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {form.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </Field>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        id="btn-save-rate"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/30"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Rate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
