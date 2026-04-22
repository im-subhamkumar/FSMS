import React from "react";
import { Routes, Route } from "react-router-dom";
import AircraftManager from "../components/AircraftManager";
import AddAircraft from "../components/AddAircraft";
import AircraftDetailsPage from "../components/AircraftDetailsPage";

const Aircraft = () => {
  return (
    <Routes>
      {/* Main Page */}
      <Route path="/" element={<AircraftManager />} />

      {/* Add Aircraft Page */}
      <Route path="add" element={<AddAircraft />} />

      {/* Aircraft Details Page */}
      <Route path=":id" element={<AircraftDetailsPage />} />
    </Routes>
  );
};

export default Aircraft;
