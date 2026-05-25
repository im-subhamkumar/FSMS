import React, { useState } from 'react';
import { X, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : `http://${window.location.hostname}:3000`;

const LEVELS = [
    { value: 'SPL', label: 'Student Pilot License (SPL)' },
    { value: 'PPL', label: 'Private Pilot License (PPL)' },
    { value: 'CPL', label: 'Commercial Pilot License (CPL)' },
    { value: 'ATPL', label: 'Airline Transport Pilot License (ATPL)' },
    { value: 'IR', label: 'Instrument Rating (IR)' },
    { value: 'ME', label: 'Multi-Engine Rating (ME)' },
    { value: 'CFI_FIR', label: 'Flight Instructor Rating (CFI/FIR)' },
    { value: 'TYPE_RATING', label: 'Type Rating' },
    { value: 'AIR_REG', label: 'Air Regulations' },
    { value: 'AIR_NAV', label: 'Air Navigation' },
    { value: 'AV_MET', label: 'Aviation Meteorology' },
    { value: 'TECH_GEN', label: 'Technical General' },
    { value: 'TECH_SPEC', label: 'Technical Specific' },
    { value: 'RTR_A', label: 'Radio Telephony (RTR-A)' },
    { value: 'BSC_BBA_AV', label: 'B.Sc. / BBA in Aviation Management' },
    { value: 'AME', label: 'Aircraft Maintenance Engineering (AME)' },
    { value: 'GH_CC', label: 'Ground Handling & Cabin Crew Training' },
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
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function CourseModal({ course, onClose }) {
    const isEdit = Boolean(course);

    const [form, setForm] = useState({
        code: course?.code || '',
        name: course?.name || '',
        description: course?.description || '',
        level: course?.level || '',
        durationHours: course?.durationHours || '',
        price: course?.price || '',
        isActive: course?.isActive !== undefined ? course.isActive : true,
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.code.trim() || !form.name.trim() || !form.level || !form.durationHours || form.price === '') {
            setError('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit
                ? `${API_BASE}/api/courses/${course.id}`
                : `${API_BASE}/api/courses`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    durationHours: parseFloat(form.durationHours),
                    price: parseFloat(form.price),
                }),
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

    // Close on backdrop click
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
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-base">
                                {isEdit ? 'Edit Course' : 'Add New Course'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isEdit ? `Editing: ${course.code}` : 'Fill in the course details below'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        id="btn-close-course-modal"
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

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Course Code" required hint="e.g. PPL-001">
                            <input
                                id="course-code"
                                type="text"
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                placeholder="PPL-001"
                                maxLength={20}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Level" required>
                            <select
                                id="course-level"
                                value={form.level}
                                onChange={e => set('level', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select level...</option>
                                {LEVELS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field label="Course Name" required>
                        <input
                            id="course-name"
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Private Pilot Licence – Basic"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Description" hint="Optional — brief overview of the course">
                        <textarea
                            id="course-description"
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Provides foundational skills for student pilots..."
                            rows={3}
                            className={inputClass + ' resize-none'}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Duration (hours)" required>
                            <input
                                id="course-duration"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={form.durationHours}
                                onChange={e => set('durationHours', e.target.value)}
                                placeholder="40"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Price (INR)" required>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                                <input
                                    id="course-price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.price}
                                    onChange={e => set('price', e.target.value)}
                                    placeholder="85000"
                                    className={inputClass + ' pl-7'}
                                />
                            </div>
                        </Field>
                    </div>

                    {isEdit && (
                        <Field label="Status">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    id="course-toggle-status"
                                    onClick={() => set('isActive', !form.isActive)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${form.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'
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
                        id="btn-save-course"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
                    </button>
                </div>
            </div>
        </div>
    );
}
