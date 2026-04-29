import React, { useEffect, useState } from "react";
import { getAircrafts, deleteAircraft } from "./AircraftData.jsx";
import AircraftTable from "./AircraftTable";
import EditAircraftModal from "./EditAircraftModal";
import { useNavigate } from "react-router-dom";
import { Plane, Plus, Search, CheckCircle, Wrench, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export default function AircraftManager() {
  const [aircrafts, setAircrafts] = useState([]);
  const [filteredAircrafts, setFilteredAircrafts] = useState([]);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const navigate = useNavigate();

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/aircraft`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAircrafts(data);
        setFilteredAircrafts(data);
      } else if (data && Array.isArray(data.data)) {
        setAircrafts(data.data);
        setFilteredAircrafts(data.data);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const oldData = await getAircrafts();
      setAircrafts(oldData || []);
      setFilteredAircrafts(oldData || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  useEffect(() => {
    let data = [...aircrafts];

    // Search
    if (search) {
      data = data.filter((a) =>
        (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.tailNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.model || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.id || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      data = data.filter((a) => a.status === statusFilter);
    }

    // Type filter
    if (typeFilter) {
      data = data.filter((a) => a.type === typeFilter);
    }

    setFilteredAircrafts(data);
  }, [search, statusFilter, typeFilter, aircrafts]);

  // Actions
  const handleView = (aircraft) => {
    navigate(`/aircraft/${aircraft.id}`);
  };

  const handleEdit = (aircraft) => {
    setEditingAircraft(aircraft);
  };

  const handleDelete = async (aircraft) => {
    if (window.confirm(`Are you sure you want to delete this aircraft: ${aircraft.manufacturer || ''} - ${aircraft.tailNumber}?`)) {
      try {
        await deleteAircraft(aircraft.id);
        // Remove row instantly from UI (without refresh)
        setAircrafts((prev) => prev.filter((a) => a.id !== aircraft.id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete aircraft");
      }
    }
  };

  // Statistics
  const activeCount = aircrafts.filter(a => a.status === "Active").length;
  const maintenanceCount = aircrafts.filter(a => a.status === "In Maintenance").length;
  const overdueCount = aircrafts.filter(a => a.maintenanceStatus === "Overdue" || a.maintenanceStatus === "Due").length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50/50 dark:bg-slate-900 min-h-[calc(100vh-theme(spacing.16))]">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Plane className="text-indigo-500" size={32} />
            Aircraft
          </h1>
          {/* <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">
            Manage your aircraft inventory, performance metrics, and maintenance schedules.
          </p> */}
        </div>

        <button
          onClick={() => navigate("/aircraft/add")}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 font-semibold"
        >
          <Plus size={18} />
          Add Aircraft
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Plane size={24} className="text-blue-600 dark:text-blue-400" />}
          label="Total Fleet"
          value={aircrafts.length}
          bg="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          icon={<CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />}
          label="Active"
          value={activeCount}
          bg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={<Wrench size={24} className="text-amber-600 dark:text-amber-400" />}
          label="In Maintenance"
          value={maintenanceCount}
          bg="bg-amber-50 dark:bg-amber-500/10"
          alert={maintenanceCount > 0}
        />
        <StatCard
          icon={<AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />}
          label="Maintenance Due"
          value={overdueCount}
          bg="bg-rose-50 dark:bg-rose-500/10"
          alert={overdueCount > 0}
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row flex-wrap items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">

          <div className="relative w-full md:w-auto md:flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              placeholder="Search by tail number, name or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow transition-colors"
            />
          </div>

          <div className="flex w-full md:w-auto gap-4">
            <select
              className="w-full md:w-48 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="In Maintenance">In Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              className="w-full md:w-48 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option>Passenger</option>
              <option>Training</option>
              <option>Cargo</option>
              <option>Helicopter</option>
            </select>
          </div>
        </div>

        {/* TABLE DISPLAY */}
        <div className="p-6 bg-slate-50/10 dark:bg-slate-800/20 text-sm">
          <AircraftTable
            aircrafts={filteredAircrafts}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* POPUP DETAILS */}
      {editingAircraft && (
        <EditAircraftModal
          aircraft={editingAircraft}
          onClose={() => setEditingAircraft(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg, alert }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className={`p-4 rounded-2xl ${alert ? 'bg-rose-100 dark:bg-rose-900/40 animate-pulse' : bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value || 0}</p>
      </div>
    </div>
  );
}
