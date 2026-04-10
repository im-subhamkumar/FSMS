import React, { useEffect, useState } from "react";
import { getAircrafts } from "./AircraftData";
import AircraftForm from "./AircraftForm";
import AircraftGrid from "./AircraftGrid";
import AircraftDetails from "./AircraftDetails";

const AircraftManager = () => {
  const [aircrafts, setAircrafts] = useState([]);
  const [filteredAircrafts, setFilteredAircrafts] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Load data
  const loadData = async () => {
    const data = await getAircrafts();
    setAircrafts(data);
    setFilteredAircrafts(data);
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
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.model.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Aircrafts</h1>

      {/* Form */}
      <AircraftForm onAdded={loadData} />

      {/* Search + Filter */}
      <div className="bg-slate-800 p-4 rounded-xl mb-4 flex items-center gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID, Name, Model..."
          className="input flex"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Status Filter */}
        <select
          className="input w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option>Active</option>
          <option>Under Maintenance</option>
          <option>Inactive</option>
        </select>

        {/* Type Filter */}
        <select
          className="input w-48"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Type</option>
          <option>Passenger</option>
          <option>Cargo</option>
          <option>Training</option>
        </select>

        {/* Clear Button */}
        <button
          onClick={() => {
            setSearch("");
            setStatusFilter("");
            setTypeFilter("");
          }}
          className="bg-gray-600 px-4 py-2 rounded-lg whitespace-nowrap"
        >
          Clear
        </button>
      </div>

      {/* Grid */}
      <AircraftGrid
        aircrafts={filteredAircrafts}
        onSelect={(aircraft) => setSelectedAircraft(aircraft)}
      />

      {/* Popup */}
      {selectedAircraft && (
        <AircraftDetails
          aircraft={selectedAircraft}
          onClose={() => setSelectedAircraft(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default AircraftManager;