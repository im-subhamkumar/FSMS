import React from "react";
import { Routes, Route } from "react-router-dom";
import AircraftManager from "../components/AircraftManager";
import AddAircraft from "../components/AddAircraft";
import AircraftDetailsPage from "../components/AircraftDetailsPage";

const Aircraft = () => {
  return (
    <Routes>
      <Route index element={<AircraftManager />} />
      <Route path="add" element={<AddAircraft />} />
      <Route path=":id" element={<AircraftDetailsPage />} />
    </Routes>
  );
};

export default Aircraft;