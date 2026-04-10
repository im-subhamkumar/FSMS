import React, { useState } from "react";
import { addAircraft } from "./AircraftData";

const AircraftForm = ({ onAdded }) => {
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    model: "",
    status: "Active",
    capacity: "",
    fuelCapacity: "",
    type: "Passenger",
    lastMaintenance: "",
    notes: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.id || !form.name || !form.model) {
      alert("Please fill required fields");
      return;
    }

    if (form.capacity < 0 || form.fuelCapacity < 0) {
      alert("Values cannot be negative");
      return;
    }

    try {
      await addAircraft(form);
      onAdded();
      setShowForm(false);
    } catch (e) {
      alert("Failed to add aircraft");
      return;
    }

    // reset form
    setForm({
      id: "",
      name: "",
      model: "",
      status: "Active",
      capacity: "",
      fuelCapacity: "",
      type: "Passenger",
      lastMaintenance: "",
      notes: "",
    });
  };

  return (
    <div className="mb-6">
      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 px-4 py-2 rounded-lg text-white mb-4"
      >
        + Add New Aircraft
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-800 p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="id" placeholder="Aircraft ID" className="input" onChange={handleChange} />
            <input name="name" placeholder="Name" className="input" onChange={handleChange} />
            <input name="model" placeholder="Model" className="input" onChange={handleChange} />

            <select name="status" className="input" onChange={handleChange}>
              <option>Active</option>
              <option>Under Maintenance</option>
              <option>Inactive</option>
            </select>

            <input
              type="number"
              name="capacity"
              placeholder="Capacity"
              className="input"
              onChange={handleChange}
            />

            <input
              type="number"
              name="fuelCapacity"
              placeholder="Fuel Capacity (L)"
              className="input"
              onChange={handleChange}
            />

            <select name="type" className="input" onChange={handleChange}>
              <option>Passenger</option>
              <option>Cargo</option>
              <option>Training</option>
            </select>

            <input
              type="date"
              name="lastMaintenance"
              className="input"
              onChange={handleChange}
            />
          </div>

          <textarea
            name="notes"
            placeholder="Notes"
            className="input"
            onChange={handleChange}
          />

          <button
            onClick={handleSubmit}
            className="bg-green-600 px-4 py-2 rounded-lg text-white"
          >
            Add Aircraft
          </button>
        </div>
      )}
    </div>
  );
};

export default AircraftForm;