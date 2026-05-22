import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  ClipboardCheck,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const STATUS_META = {
  VALID: {
    label: 'Valid',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  EXPIRING_SOON: {
    label: 'Expiring Soon',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const HOLDER_TYPE_META = {
  STUDENT: { label: 'Student', icon: Users },
  INSTRUCTOR: { label: 'Instructor', icon: UserRound },
};

const emptyForm = {
  qualificationTypeId: '',
  holderType: 'STUDENT',
  holderId: '',
  issueDate: '',
  expiryDate: '',
  certificateNumber: '',
  issuingAuthority: '',
  notes: '',
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(7)].map((_, index) => (
      <td key={index} className="px-4 py-4">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </td>
    ))}
  </tr>
);

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function getDaysRemaining(expiryDate) {
  if (!expiryDate) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiry = new Date(expiryDate);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.ceil((expiryDay - start) / (1000 * 60 * 60 * 24));
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export default function QualificationRecordsRoot() {
  const [records, setRecords] = useState([]);
  const [types, setTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [lookupWarnings, setLookupWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState('');
  const [holderTypeFilter, setHolderTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [lastAutoExpiryDate, setLastAutoExpiryDate] = useState('');

  const fetchLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      const payload = await readJson(
        await fetch(`${API_BASE}/qualification-records/lookups`),
        'Failed to fetch qualification lookups'
      );

      setTypes(payload.types || []);
      setStudents(payload.students || []);
      setInstructors(payload.instructors || []);
      setLookupWarnings(payload.warnings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (holderTypeFilter) params.set('holderType', holderTypeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('qualificationTypeId', typeFilter);

      const res = await fetch(`${API_BASE}/qualification-records?${params.toString()}`);
      setRecords(await readJson(res, 'Failed to fetch qualification records'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [holderTypeFilter, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    const timer = setTimeout(fetchRecords, 250);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const holderOptions = useMemo(() => {
    if (formData.holderType === 'INSTRUCTOR') {
      return instructors.map((instructor) => ({
        id: instructor.id,
        label: `${instructor.user?.firstName || ''} ${instructor.user?.lastName || ''}`.trim(),
        sublabel: [instructor.employeeId, instructor.designation].filter(Boolean).join(' • '),
      }));
    }

    return students.map((student) => ({
      id: student.id,
      label: `${student.firstName} ${student.lastName}`.trim(),
      sublabel: student.studentId,
    }));
  }, [formData.holderType, instructors, students]);

  const selectedHolderCount = formData.holderType === 'INSTRUCTOR' ? instructors.length : students.length;
  const saveDisabled = saving || types.length === 0 || selectedHolderCount === 0;
  const selectedType = types.find((type) => String(type.id) === String(formData.qualificationTypeId));

  useEffect(() => {
    if (!formData.issueDate || !selectedType?.validityDays) return;

    const recalculatedExpiry = addDays(formData.issueDate, Number(selectedType.validityDays));

    setFormData((current) => {
      if (!current.issueDate || String(current.qualificationTypeId) !== String(selectedType.id)) {
        return current;
      }

      const canAutoPopulateExpiry =
        !current.expiryDate || current.expiryDate === lastAutoExpiryDate;

      if (!canAutoPopulateExpiry) return current;
      if (current.expiryDate === recalculatedExpiry) return current;

      return {
        ...current,
        expiryDate: recalculatedExpiry,
      };
    });

    setLastAutoExpiryDate(recalculatedExpiry);
  }, [formData.issueDate, formData.qualificationTypeId, lastAutoExpiryDate, selectedType?.id, selectedType?.validityDays]);

  const handleSeedDefaults = async () => {
    setSeedingDefaults(true);
    setError(null);
    setInfo(null);
    try {
      const data = await readJson(
        await fetch(`${API_BASE}/qualification-types/seed-defaults`, { method: 'POST' }),
        'Failed to load standard qualification types'
      );
      setInfo(data.message || 'Standard qualification types loaded');
      await fetchLookups();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeedingDefaults(false);
    }
  };

  const stats = useMemo(() => {
    const validCount = records.filter((record) => record.status === 'VALID').length;
    const expiringSoonCount = records.filter((record) => record.status === 'EXPIRING_SOON').length;
    const expiredCount = records.filter((record) => record.status === 'EXPIRED').length;

    return {
      total: records.length,
      validCount,
      expiringSoonCount,
      expiredCount,
    };
  }, [records]);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setLastAutoExpiryDate('');
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormData({
      qualificationTypeId: String(record.qualificationTypeId),
      holderType: record.studentId ? 'STUDENT' : 'INSTRUCTOR',
      holderId: String(record.studentId || record.instructorId || ''),
      issueDate: toDateInput(record.issueDate),
      expiryDate: toDateInput(record.expiryDate),
      certificateNumber: record.certificateNumber || '',
      issuingAuthority: record.issuingAuthority || '',
      notes: record.notes || '',
    });
    setLastAutoExpiryDate('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormData(emptyForm);
    setLastAutoExpiryDate('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        qualificationTypeId: Number(formData.qualificationTypeId),
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate || null,
        certificateNumber: formData.certificateNumber || null,
        issuingAuthority: formData.issuingAuthority || null,
        notes: formData.notes || null,
        studentId: formData.holderType === 'STUDENT' ? Number(formData.holderId) : null,
        instructorId: formData.holderType === 'INSTRUCTOR' ? Number(formData.holderId) : null,
        autoRecalculateExpiry: !formData.expiryDate,
      };

      const url = editing
        ? `${API_BASE}/qualification-records/${editing.id}`
        : `${API_BASE}/qualification-records`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await readJson(res, 'Failed to save qualification record');

      closeModal();
      await fetchRecords();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/qualification-records/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete qualification record');
      }

      setDeleteConfirm(null);
      await fetchRecords();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <ClipboardCheck className="h-7 w-7 text-sky-600" />
            Qualification Records
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track issued licenses, ratings, medicals, and other qualifications for students and instructors.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={lookupLoading}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ClipboardCheck}
          label="Total Records"
          value={stats.total}
          color="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Valid"
          value={stats.validCount}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={CalendarClock}
          label="Expiring Soon"
          value={stats.expiringSoonCount}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          icon={XCircle}
          label="Expired"
          value={stats.expiredCount}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search holder, certificate, type..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={holderTypeFilter}
              onChange={(event) => setHolderTypeFilter(event.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">All Holders</option>
              <option value="STUDENT">Students</option>
              <option value="INSTRUCTOR">Instructors</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Types</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.code} - {type.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {info && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {info}
        </div>
      )}

      {lookupWarnings.map((warning) => (
        <div
          key={warning}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {warning}
        </div>
      ))}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Holder</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Certificate</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Issue Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Expiry</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, index) => <SkeletonRow key={index} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                      <ClipboardCheck className="h-12 w-12 opacity-30" />
                      <p className="font-medium">No qualification records found</p>
                      <p className="text-xs">Create the first record to start tracking compliance.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const holderMeta = HOLDER_TYPE_META[record.holder?.type] || HOLDER_TYPE_META.STUDENT;
                  const HolderIcon = holderMeta.icon;
                  const daysRemaining = getDaysRemaining(record.expiryDate);
                  const statusMeta = STATUS_META[record.status] || STATUS_META.VALID;

                  return (
                    <tr key={record.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-sky-50 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                            <HolderIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{record.holder?.label || 'Unknown holder'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {holderMeta.label}
                              {record.holder?.meta?.studentId ? ` • ${record.holder.meta.studentId}` : ''}
                              {record.holder?.meta?.employeeId ? ` • ${record.holder.meta.employeeId}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <span className="rounded-md bg-sky-50 px-2 py-1 font-mono text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            {record.qualificationType?.code}
                          </span>
                          <p className="mt-1 font-medium text-gray-900 dark:text-white">{record.qualificationType?.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{record.certificateNumber || '-'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{record.issuingAuthority || 'Authority not set'}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{formatDate(record.issueDate)}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(record.expiryDate)}</p>
                        {daysRemaining !== null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`
                              : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(record)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(record)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {!loading && records.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Showing {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Qualification Record' : 'New Qualification Record'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Qualification Type *</label>
                  <select
                    value={formData.qualificationTypeId}
                    onChange={(event) => setFormData({ ...formData, qualificationTypeId: event.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a qualification type</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.code} - {type.name}{type.isActive === false ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {types.length === 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                      <span>No qualification types exist yet.</span>
                      <button
                        type="button"
                        onClick={handleSeedDefaults}
                        disabled={seedingDefaults}
                        className="font-semibold underline underline-offset-2 disabled:opacity-50"
                      >
                        {seedingDefaults ? 'Loading...' : 'Load standard types'}
                      </button>
                    </div>
                  )}
                  {selectedType?.validityDays ? (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Default validity: {selectedType.validityDays} day{selectedType.validityDays === 1 ? '' : 's'}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Holder Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(HOLDER_TYPE_META).map(([key, meta]) => {
                      const HolderTypeIcon = meta.icon;
                      const selected = formData.holderType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              holderType: key,
                              holderId: '',
                            })
                          }
                          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                            selected
                              ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-900/30 dark:text-sky-300'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <HolderTypeIcon className="h-4 w-4" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Choose <strong>{formData.holderType === 'INSTRUCTOR' ? 'Instructor' : 'Student'}</strong> to add that kind of qualification record.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formData.holderType === 'INSTRUCTOR' ? 'Instructor *' : 'Student *'}
                </label>
                <select
                  value={formData.holderId}
                  onChange={(event) => setFormData({ ...formData, holderId: event.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">
                    {lookupLoading ? 'Loading options...' : `Select ${formData.holderType === 'INSTRUCTOR' ? 'an instructor' : 'a student'}`}
                  </option>
                  {holderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} {option.sublabel ? `(${option.sublabel})` : ''}
                    </option>
                  ))}
                </select>
                {!lookupLoading && selectedHolderCount === 0 && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    No {formData.holderType === 'INSTRUCTOR' ? 'instructors' : 'students'} are currently available in the system, so this record type cannot be created until one exists.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(event) => setFormData({ ...formData, issueDate: event.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(event) =>
                      setFormData({ ...formData, expiryDate: event.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {selectedType?.validityDays ? (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Auto-filled from type validity until you change it manually.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Number</label>
                  <input
                    type="text"
                    value={formData.certificateNumber}
                    onChange={(event) => setFormData({ ...formData, certificateNumber: event.target.value })}
                    placeholder="e.g. CPL-2026-014"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Issuing Authority</label>
                  <input
                    type="text"
                    value={formData.issuingAuthority}
                    onChange={(event) => setFormData({ ...formData, issuingAuthority: event.target.value })}
                    placeholder="DGCA / School / AME"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  rows={4}
                  placeholder="Add scope, renewal notes, examiner details, or restrictions..."
                  className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveDisabled}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Delete Record</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This removes the record permanently</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
              Delete the {deleteConfirm.qualificationType?.name} record for <strong>{deleteConfirm.holder?.label}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
