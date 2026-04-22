import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all records — supports ?studentId=, ?instructorId=, ?qualificationTypeId=
router.get('/', async (req, res) => {
  try {
    const { studentId, instructorId, qualificationTypeId } = req.query;
    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (instructorId) where.instructorId = parseInt(instructorId);
    if (qualificationTypeId) where.qualificationTypeId = parseInt(qualificationTypeId);

    const records = await prisma.qualificationRecord.findMany({
      where,
      include: {
        qualificationType: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single record
router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.qualificationRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        qualificationType: true,
      },
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const {
      qualificationTypeId, studentId, instructorId,
      issueDate, expiryDate, certificateNumber,
      issuingAuthority, notes,
    } = req.body;

    if (!qualificationTypeId || !issueDate) {
      return res.status(400).json({ error: 'qualificationTypeId and issueDate are required' });
    }

    const record = await prisma.qualificationRecord.create({
      data: {
        qualificationTypeId: parseInt(qualificationTypeId),
        studentId: studentId ? parseInt(studentId) : null,
        instructorId: instructorId ? parseInt(instructorId) : null,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateNumber: certificateNumber || null,
        issuingAuthority: issuingAuthority || null,
        notes: notes || null,
      },
      include: {
        qualificationType: { select: { id: true, code: true, name: true } },
      },
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const {
      issueDate, expiryDate, certificateNumber,
      issuingAuthority, notes,
    } = req.body;

    const record = await prisma.qualificationRecord.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(issueDate !== undefined && { issueDate: new Date(issueDate) }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(certificateNumber !== undefined && { certificateNumber }),
        ...(issuingAuthority !== undefined && { issuingAuthority }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        qualificationType: { select: { id: true, code: true, name: true } },
      },
    });

    res.json(record);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
    res.status(400).json({ error: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.qualificationRecord.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Qualification record deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
