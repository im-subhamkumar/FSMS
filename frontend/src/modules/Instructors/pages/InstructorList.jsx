import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, GraduationCap, Phone, Mail,
  Eye, Trash2, RefreshCw, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, User, MoreHorizontal,
  Clock, ShieldCheck, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { instructorsService } from '../services/instructorsService';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const FILTER_DESIGNATIONS = [
  { value: '', label: 'All Designations' },
  { value: 'CHIEF_FLIGHT_INSTRUCTOR', label: 'Chief Flight Instructor' },
  { value: 'SENIOR_FLIGHT_INSTRUCTOR', label: 'Senior Flight Instructor' },
  { value: 'FLIGHT_INSTRUCTOR', label: 'Flight Instructor' },
  { value: 'GROUND_INSTRUCTOR', label: 'Ground Instructor' },
  { value: 'SIMULATOR_INSTRUCTOR', label: 'Simulator Instructor' },
];

function Avatar({ instructor }) {
  const initials = `${instructor.user?.firstName?.[0] || ''}${instructor.user?.lastName?.[0] || ''}`;
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
  const colorIdx = (instructor.id || 0) % colors.length;

  if (instructor.profilePhotoUrl) {
    return (
      <img
        src={`http://localhost:3000${instructor.profilePhotoUrl}`}
        alt={initials}
        className="h-10 w-10 rounded-xl object-cover shadow-sm ring-2 ring-white"
        onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + initials; }}
      />
    );
  }

  return (
    <div className={`h-10 w-10 rounded-xl ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white`}>
      {initials}
    </div>
  );
}

export function InstructorList() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'ACTIVE', designation: '', medicalStatus: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const fetchData = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15, ...filters };
      if (search) params.search = search;
      const res = await instructorsService.list(params);
      setInstructors(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const handleDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ open: false, id: null });
    try {
      await instructorsService.remove(id);
      fetchData(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const stats = useMemo(() => [
    { label: 'Total Instructors', value: pagination.total || 0, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Medical Expiring', value: instructors.filter(i => i.medicalStatus === 'EXPIRING_SOON').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'License Valid', value: instructors.filter(i => i.licenseStatus === 'VALID').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'On Leave', value: instructors.filter(i => i.employmentStatus === 'ON_LEAVE').length, icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-100' },
  ], [instructors, pagination.total]);

  return (
    <div className="space-y-6">

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Deactivate Instructor?"
        message="Are you sure? This instructor will be moved to the inactive list."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.bg} p-4 rounded-2xl border border-white/50 shadow-sm flex items-center justify-between`}
          >
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white shadow-sm ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showFilters ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2" />
            <button
              onClick={() => {
                localStorage.removeItem('instructorFormDraft');
                navigate('/instructors/new');
              }}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Instructor
            </button>
          </div>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 bg-gray-50/50 border-b border-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-hidden"
            >
              <select
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.designation}
                onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
              >
                {FILTER_DESIGNATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <select
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="ACTIVE">Status: Active</option>
                <option value="INACTIVE">Status: Inactive</option>
                <option value="ON_LEAVE">Status: On Leave</option>
              </select>
              <button 
                onClick={() => setFilters({ status: 'ACTIVE', designation: '', medicalStatus: '' })}
                className="text-xs text-blue-600 font-medium hover:underline text-left px-2"
              >
                Reset Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Medical</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-xl" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No instructors found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                instructors.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/instructors/${inst.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar instructor={inst} />
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {inst.user?.firstName} {inst.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">ID: {inst.employeeId || '--'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inst.designation} size="xs" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="h-3 w-3" /> {inst.phone || '--'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail className="h-3 w-3" /> {inst.user?.email || '--'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={inst.medicalStatus} showIcon={true} size="xs" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/instructors/${inst.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmModal({ open: true, id: inst.id })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="p-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
          <p>Showing {instructors.length} of {pagination.total} results</p>
          <div className="flex gap-1">
            <button disabled={pagination.page === 1} className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={pagination.page === pagination.totalPages} className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}