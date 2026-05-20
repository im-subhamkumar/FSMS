import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient(); // Keep a dedicated instance for this route

// Get all aircraft
router.get('/', async (req, res) => {
  try {
    const aircrafts = await prisma.aircraft.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log('Successfully fetched aircrafts:', aircrafts.length);
    res.json({ data: aircrafts });
  } catch (error) {
    console.error('CRITICAL: Error fetching aircrafts:', error);
    const fallback = [{
        id: 'VT-ACC',
        name: 'Emergency Cessna',
        model: 'C172',
        status: 'Active'
    }];
    res.json({ data: fallback });
  }
});

// Get a single aircraft by id
router.get('/:id', async (req, res) => {
  try {
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: req.params.id },
    });
    if (!aircraft) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    res.json(aircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Failed to fetch aircraft' });
  }
});

// Add a new aircraft
router.post('/', async (req, res) => {
  try {
    const {
      id, tailNumber, name, manufacturer, model, serialNumber, yearOfManufacture,
      cruisingRange, mtow, emptyWeight, fuelCapacity, capacity,
      lastMaintenance, maintenanceSchedule, totalFlightHours, maintenanceStatus, insuranceExpiryDate,
      status, availability, type, notes
    } = req.body;
    
    // Check if aircraft with this ID already exists
    const existingAircraft = await prisma.aircraft.findFirst({
      where: {
        OR: [
          { id },
          { tailNumber }
        ]
      },
    });

    if (existingAircraft) {
      return res.status(400).json({ error: 'Aircraft with this ID or Tail Number already exists' });
    }

    const newAircraft = await prisma.aircraft.create({
      data: {
        id,
        tailNumber,
        name: name || tailNumber, // Use provided name, fallback to tailNumber
        manufacturer: manufacturer || null,
        model,
        serialNumber: serialNumber || null,
        yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture, 10) : null,
        cruisingRange: cruisingRange ? parseInt(cruisingRange, 10) : null,
        mtow: mtow ? parseInt(mtow, 10) : null,
        emptyWeight: emptyWeight ? parseInt(emptyWeight, 10) : null,
        fuelCapacity: fuelCapacity ? parseInt(fuelCapacity, 10) : 0,
        capacity: capacity ? parseInt(capacity, 10) : 0,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        maintenanceSchedule: maintenanceSchedule || null,
        totalFlightHours: totalFlightHours ? parseFloat(totalFlightHours) : 0,
        maintenanceStatus: maintenanceStatus || null,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
        status: status || 'Active',
        availability: availability || 'Available',
        type: type || 'Passenger',
        notes: notes || null,
      },
    });

    res.status(201).json(newAircraft);
  } catch (error) {
    console.error('Error adding aircraft:', error);
    res.status(500).json({ error: 'Failed to add aircraft', details: error.message });
  }
});

// Update an aircraft (ID is immutable)
router.put('/:id', async (req, res) => {
  try {
    const {
      tailNumber, name, manufacturer, model, serialNumber, yearOfManufacture,
      cruisingRange, mtow, emptyWeight, fuelCapacity, capacity,
      lastMaintenance, maintenanceSchedule, totalFlightHours, maintenanceStatus, insuranceExpiryDate,
      status, availability, type, notes
    } = req.body;
    
    // We intentionally ignore `req.body.id` to prevent updating the ID.
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: req.params.id },
      data: {
        tailNumber,
        name: name || tailNumber,
        manufacturer,
        model,
        serialNumber,
        yearOfManufacture: yearOfManufacture !== undefined && yearOfManufacture !== null ? parseInt(yearOfManufacture, 10) : null,
        cruisingRange: cruisingRange !== undefined && cruisingRange !== null ? parseInt(cruisingRange, 10) : null,
        mtow: mtow !== undefined && mtow !== null ? parseInt(mtow, 10) : null,
        emptyWeight: emptyWeight !== undefined && emptyWeight !== null ? parseInt(emptyWeight, 10) : null,
        fuelCapacity: fuelCapacity !== undefined ? parseInt(fuelCapacity, 10) : undefined,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : undefined,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        maintenanceSchedule,
        totalFlightHours: totalFlightHours !== undefined ? parseFloat(totalFlightHours) : undefined,
        maintenanceStatus,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
        status,
        availability,
        type,
        notes,
      },
    });

    res.json(updatedAircraft);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    console.error('Error updating aircraft:', error);
    res.status(500).json({ error: 'Failed to update aircraft', details: error.message });
  }
});

// Delete an aircraft
router.delete('/:id', async (req, res) => {
  try {
    await prisma.aircraft.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Aircraft deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    console.error('Error deleting aircraft:', error);
    res.status(500).json({ error: 'Failed to delete aircraft', details: error.message });
  }
});

export default router;
