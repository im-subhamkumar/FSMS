import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET all courses ───────────────────────────────────────────
// Supports ?search=, ?level=, ?active=true|false
router.get('/', async (req, res) => {
  try {
    const { search, level, active } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { pricingRates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET single course ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        pricingRates: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST create course ────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { code, name, description, level, durationHours, price, isActive, createdBy } = req.body;

    if (!code || !name || !level || !durationHours || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: code, name, level, durationHours, price' });
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description: description || null,
        level,
        durationHours: parseFloat(durationHours),
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : true,
        createdBy: createdBy ? parseInt(createdBy) : null,
      },
    });

    res.status(201).json(course);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `A course with code "${req.body.code}" already exists.` });
    }
    res.status(400).json({ error: error.message });
  }
});

// ─── PUT update course ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, level, durationHours, price, isActive } = req.body;

    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(durationHours !== undefined && { durationHours: parseFloat(durationHours) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(course);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `A course with that code already exists.` });
    }
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE (soft) course ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });

    res.json({ message: 'Course deactivated successfully', course });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE (hard) course ──────────────────────────────────────
router.delete('/:id/hard', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);

    // Use transaction to ensure child pricing rates are deleted first (to satisfy constraints)
    const [deletedRates, deletedCourse] = await prisma.$transaction([
      prisma.pricingRate.deleteMany({ where: { courseId } }),
      prisma.course.delete({ where: { id: courseId } }),
    ]);

    res.json({ message: 'Course deleted permanently', course: deletedCourse });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
