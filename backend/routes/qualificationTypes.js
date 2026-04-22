import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all qualification types
router.get('/', async (req, res) => {
  try {
    const { search, active } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const types = await prisma.qualificationType.findMany({
      where,
      include: { _count: { select: { records: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single qualification type
router.get('/:id', async (req, res) => {
  try {
    const type = await prisma.qualificationType.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { records: true } } },
    });
    if (!type) return res.status(404).json({ error: 'Qualification type not found' });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }
    const type = await prisma.qualificationType.create({
      data: {
        code,
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(type);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `A qualification type with code "${req.body.code}" already exists.` });
    }
    res.status(400).json({ error: error.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    const type = await prisma.qualificationType.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(type);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Qualification type not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Code already in use' });
    res.status(400).json({ error: error.message });
  }
});

// DELETE (soft — deactivate)
router.delete('/:id', async (req, res) => {
  try {
    const type = await prisma.qualificationType.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ message: 'Qualification type deactivated', type });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Qualification type not found' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
