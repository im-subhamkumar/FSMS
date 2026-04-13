import React, { useEffect, useState } from "react";
import { getAircrafts } from "./AircraftData";
import AircraftCard from "./AircraftCard";

const AircraftGrid = ({ aircrafts, onSelect }) => {

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-xl min-h-[200px]">
      {aircrafts.length === 0 ? (
        <p className="text-slate-500 dark:text-gray-400">No aircraft available</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {aircrafts.map((aircraft) => (
            <AircraftCard
              key={aircraft.id}
              aircraft={aircraft}
              onClick={() => onSelect(aircraft)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AircraftGrid;