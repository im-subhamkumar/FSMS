import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new student (example)
router.post('/', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    const student = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password, // In a real app, hash this!
        role: 'STUDENT',
      },
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
