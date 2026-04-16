const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getAircrafts = async () => {
  try {
    const response = await fetch(`${API_URL}/aircraft`);
    if (!response.ok) throw new Error("Failed to fetch aircrafts");
    return await response.json();
  } catch (error) {
    console.error("Error fetching aircrafts:", error);
    return [];
  }
};

export const addAircraft = async (aircraft) => {
  try {
    const response = await fetch(`${API_URL}/aircraft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aircraft),
    });
    if (!response.ok) throw new Error("Failed to add aircraft");
    return await response.json();
  } catch (error) {
    console.error("Error adding aircraft:", error);
    throw error;
  }
};

export const deleteAircraft = async (id) => {
  try {
    const response = await fetch(`${API_URL}/aircraft/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete aircraft");
    return true;
  } catch (error) {
    console.error("Error deleting aircraft:", error);
    throw error;
  }
};

export const updateAircraft = async (updatedAircraft) => {
  try {
    const response = await fetch(`${API_URL}/aircraft/${encodeURIComponent(updatedAircraft.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAircraft),
    });
    if (!response.ok) throw new Error("Failed to update aircraft");
    return await response.json();
  } catch (error) {
    console.error("Error updating aircraft:", error);
    throw error;
  }
};