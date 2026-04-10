import React, { useState } from "react";
import { deleteAircraft, updateAircraft } from "./AircraftData";

const AircraftDetails = ({ aircraft, onClose, onRefresh }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(aircraft);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDelete = async () => {
    try {
      await deleteAircraft(aircraft.id);
      onRefresh();
      onClose();
    } catch (e) {
      alert("Failed to delete aircraft");
    }
  };

  const handleUpdate = async () => {
    if (form.capacity < 0 || form.fuelCapacity < 0) {
      alert("Values cannot be negative");
      return;
    }

    try {
      await updateAircraft(form);
      setEditMode(false);
      onRefresh();
    } catch (e) {
      alert("Failed to update aircraft");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Under Maintenance":
        return "bg-yellow-500";
      case "Inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-slate-900 p-6 rounded-2xl w-[520px] shadow-xl relative border border-gray-700">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✖
        </button>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">
            {aircraft.name}
          </h2>
          <p className="text-gray-400">{aircraft.model}</p>

          <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full text-white ${getStatusColor(aircraft.status)}`}>
            {aircraft.status}
          </span>
        </div>

        {/* VIEW MODE */}
        {!editMode ? (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">

            <p><span className="text-gray-500">ID:</span> {aircraft.id}</p>
            <p><span className="text-gray-500">Type:</span> {aircraft.type}</p>

            <p><span className="text-gray-500">Capacity:</span> {aircraft.capacity}</p>
            <p><span className="text-gray-500">Fuel:</span> {aircraft.fuelCapacity} L</p>

            <p className="col-span-2">
              <span className="text-gray-500">Last Maintenance:</span> {aircraft.lastMaintenance}
            </p>

            <p className="col-span-2">
              <span className="text-gray-500">Notes:</span> {aircraft.notes || "—"}
            </p>

            {/* Buttons */}
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditMode(true)}
                className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-black font-medium"
              >
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          
          /* EDIT MODE */
          <div className="space-y-3">

            <div className="grid grid-cols-2 gap-3">
              <input name="name" value={form.name} className="input" onChange={handleChange} />
              <input name="model" value={form.model} className="input" onChange={handleChange} />

              <select name="status" value={form.status} className="input" onChange={handleChange}>
                <option>Active</option>
                <option>Under Maintenance</option>
                <option>Inactive</option>
              </select>

              <select name="type" value={form.type} className="input" onChange={handleChange}>
                <option>Passenger</option>
                <option>Cargo</option>
                <option>Training</option>
              </select>
              <input type="number" name="capacity" value={form.capacity} className="input" onChange={handleChange} />
              <input type="number" name="fuelCapacity" value={form.fuelCapacity} className="input" onChange={handleChange} />
              <input type="date" name="lastMaintenance" placeholder="lastMaintenance" value={form.lastMaintenance} className="input col-span-2" onChange={handleChange} />
            </div>

            <textarea name="notes" value={form.notes} className="input" onChange={handleChange} />

            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AircraftDetails;