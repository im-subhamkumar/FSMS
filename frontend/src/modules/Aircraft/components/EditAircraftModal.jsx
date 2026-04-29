import React, { useState } from "react";
import { updateAircraft } from "./AircraftData.jsx";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
// API_URL is available for future direct fetch calls in this component

const EditAircraftModal = ({ aircraft, onClose, onRefresh }) => {
  const [form, setForm] = useState(aircraft);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      await updateAircraft(form);
      onRefresh();
      onClose();
    } catch {
      alert("Failed to update aircraft");
      setIsSaving(false);
    }
  };

  // Safe split for Date fields
  const safeDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Aircraft Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Editing: {form.manufacturer || "Unknown"} {form.model} ({form.tailNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Basic Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aircraft ID</label>
                <input name="id" value={form.id || ""} disabled className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tail Number</label>
                <input name="tailNumber" value={form.tailNumber || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                <input name="serialNumber" value={form.serialNumber || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Manufacturer</label>
                <input name="manufacturer" value={form.manufacturer || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model</label>
                <input name="model" value={form.model || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year of Manufacture</label>
                <input type="number" name="yearOfManufacture" value={form.yearOfManufacture || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 2: Performance */}
          <div>
            <h3 className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Performance & Capacity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cruising Range (NM)</label>
                <input type="number" name="cruisingRange" value={form.cruisingRange ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">MTOW (lbs)</label>
                <input type="number" name="mtow" value={form.mtow ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empty Weight (lbs)</label>
                <input type="number" name="emptyWeight" value={form.emptyWeight ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fuel Capacity (L/Gal)</label>
                <input type="number" name="fuelCapacity" value={form.fuelCapacity ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (Pax)</label>
                <input type="number" name="capacity" value={form.capacity ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select name="type" value={form.type || "Passenger"} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
                  <option>Passenger</option>
                  <option>Cargo</option>
                  <option>Training</option>
                  <option>Helicopter</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Section 3: Maintenance */}
          <div>
            <h3 className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Maintenance & Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Flight Hours</label>
                <input type="number" step="0.1" name="totalFlightHours" value={form.totalFlightHours ?? ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Maintenance Date</label>
                <input type="date" name="lastMaintenance" value={safeDate(form.lastMaintenance)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maintenance Schedule</label>
                <select name="maintenanceSchedule" value={form.maintenanceSchedule || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
                  <option value="">Select Schedule</option>
                  <option value="50 hours">50 hours</option>
                  <option value="100 hours">100 hours</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maintenance Status</label>
                <select name="maintenanceStatus" value={form.maintenanceStatus || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
                  <option value="">Select Status</option>
                  <option>OK</option>
                  <option>Due</option>
                  <option>Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Insurance Expiry Date</label>
                <input type="date" name="insuranceExpiryDate" value={safeDate(form.insuranceExpiryDate)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm" onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 4: Operational */}
          <div>
            <h3 className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Operational Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select name="status" value={form.status || "Active"} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Availability</label>
                <select name="availability" value={form.availability || "Available"} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
                  <option>Available</option>
                  <option>Assigned</option>
                  <option>Reserved</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <textarea name="notes" rows="3" value={form.notes || ""} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 mt-auto bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAircraftModal;
