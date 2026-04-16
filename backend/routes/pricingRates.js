import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET all pricing rates ─────────────────────────────────────
// Supports ?search=, ?category=, ?rateType=, ?active=true|false
router.get('/', async (req, res) => {
  try {
    const { search, category, rateType, active } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (rateType) {
      where.rateType = rateType;
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const rates = await prisma.pricingRate.findMany({
      where,
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET single pricing rate ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const rate = await prisma.pricingRate.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        course: {
          select: { id: true, code: true, name: true, level: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!rate) {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }

    res.json(rate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST create pricing rate ──────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      name, category, rateType, amount, currency,
      courseId, effectiveFrom, isActive, notes, createdBy,
    } = req.body;

    if (!name || !category || !rateType || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, category, rateType, amount' });
    }

    const rate = await prisma.pricingRate.create({
      data: {
        name,
        category,
        rateType,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        courseId: courseId ? parseInt(courseId) : null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || null,
        createdBy: createdBy ? parseInt(createdBy) : null,
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
      },
    });

    res.status(201).json(rate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PUT update pricing rate ───────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const {
      name, category, rateType, amount, currency,
      courseId, effectiveFrom, isActive, notes,
    } = req.body;

    const rate = await prisma.pricingRate.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(rateType !== undefined && { rateType }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency !== undefined && { currency }),
        ...(courseId !== undefined && { courseId: courseId ? parseInt(courseId) : null }),
        ...(effectiveFrom !== undefined && { effectiveFrom: new Date(effectiveFrom) }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
      },
    });

    res.json(rate);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE (soft) pricing rate ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const rate = await prisma.pricingRate.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    res.json({ message: 'Pricing rate deactivated successfully', rate });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE (hard) pricing rate ────────────────────────────────
router.delete('/:id/hard', async (req, res) => {
  try {
    const rate = await prisma.pricingRate.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Pricing rate deleted permanently', rate });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
