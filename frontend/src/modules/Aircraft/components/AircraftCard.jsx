import React from "react";

const AircraftCard = ({ aircraft, onClick }) => {
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
    <div
      onClick={onClick}
      className="bg-slate-700 p-4 rounded-xl w-56 cursor-pointer hover:scale-105 transition"
    >
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-300">{aircraft.id}</span>
        <span
          className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(
            aircraft.status
          )}`}
        >
          {aircraft.status}
        </span>
      </div>

      {/* Name */}
      <h2 className="text-lg font-semibold text-white">
        {aircraft.name}
      </h2>

      {/* Model */}
      <p className="text-sm text-gray-400">
        Model: {aircraft.model}
      </p>
    </div>
  );
};

export default AircraftCard;