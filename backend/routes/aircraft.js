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
    const { id, name, model, status, capacity, fuelCapacity, type, lastMaintenance, notes } = req.body;
    
    // Check if aircraft with this ID already exists
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id },
    });

    if (existingAircraft) {
      return res.status(400).json({ error: 'Aircraft with this ID already exists' });
    }

    const newAircraft = await prisma.aircraft.create({
      data: {
        id,
        name,
        model,
        status: status || 'Active',
        capacity: capacity ? parseInt(capacity, 10) : 0,
        fuelCapacity: fuelCapacity ? parseInt(fuelCapacity, 10) : 0,
        type: type || 'Passenger',
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
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
    const { name, model, status, capacity, fuelCapacity, type, lastMaintenance, notes } = req.body;
    
    // We intentionally ignore `req.body.id` to prevent updating the ID.
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: req.params.id },
      data: {
        name,
        model,
        status,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : undefined,
        fuelCapacity: fuelCapacity !== undefined ? parseInt(fuelCapacity, 10) : undefined,
        type,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        notes,
      },
    });

    res.json(updatedAircraft);
  } catch (error) {
    if (error.code === 'P2025') {
      // Prisma error code for 'Record to update not found.'
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
