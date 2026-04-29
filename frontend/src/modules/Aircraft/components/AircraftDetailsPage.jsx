import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deleteAircraft } from "./AircraftData.jsx";
import EditAircraftModal from "./EditAircraftModal";
import StatusBadge from "./StatusBadge";
import { ArrowLeft, Edit2, Trash2, Plane, Save, Calendar, Clock, Fuel, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const AircraftDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchAircraftDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/aircraft/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch aircraft details");
      const data = await res.json();
      setAircraft(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAircraftDetails();
  }, [id, fetchAircraftDetails]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this aircraft?")) {
      try {
        await deleteAircraft(id);
        navigate("/aircraft");
      } catch {
        alert("Failed to delete aircraft");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="p-8 text-center text-rose-500">
        <p className="text-lg font-medium">{error || "Aircraft not found"}</p>
        <button onClick={() => navigate("/aircraft")} className="mt-4 text-indigo-600 hover:underline">
          Go back to list
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/aircraft")}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Aircraft</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-xl font-medium transition-colors"
          >
            <Edit2 size={18} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-xl font-medium transition-colors"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Plane size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {aircraft.manufacturer || "Unknown"} {aircraft.model}
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Tail: {aircraft.tailNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={aircraft.status} />
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {aircraft.availability || "Available"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 py-8">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">ID</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">{aircraft.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Aircraft Type</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">{aircraft.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Manufacturer</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">{aircraft.manufacturer || "N/A"}</dd>
              </div>
            </dl>
          </div>

          {/* Technical Specs */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Technical Specs</h3>
            <dl className="space-y-4">
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Users size={16} /> Capacity</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">{aircraft.capacity} Pax</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Fuel size={16} /> Fuel Capacity</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">{aircraft.fuelCapacity} L</dd>
              </div>
            </dl>
          </div>

          {/* Operational Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Operational Info</h3>
            <dl className="space-y-4">
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock size={16} /> Total Flight Hours</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200 font-mono">{aircraft.totalFlightHours || 0} hrs</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={16} /> Last Maintenance</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-200">
                  {aircraft.lastMaintenance ? new Date(aircraft.lastMaintenance).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notes & Remarks</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[100px]">
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {aircraft.notes || "No notes available for this aircraft."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <EditAircraftModal
          aircraft={aircraft}
          onClose={() => setIsEditing(false)}
          onRefresh={fetchAircraftDetails}
        />
      )}
    </div>
  );
};

export default AircraftDetailsPage;
