import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/slot-requests
router.get('/', async (req, res) => {
    try {
        const { studentId } = req.query;
        let where = {};
        if (studentId) {
            where.studentId = parseInt(studentId);
        }

        const requests = await prisma.slotRequest.findMany({
            where,
            include: { student: true }
        });
        
        const formatted = requests.map(req => ({
            id: req.id.toString(),
            date: req.date.toISOString().split('T')[0],
            timePreference: req.timePreference,
            instructor: req.instructorPreference,
            student: `${req.student.firstName} ${req.student.lastName}`.trim(),
            aircraft: req.aircraftPreference,
            notes: req.notes,
            status: req.status === 'APPROVED' ? 'Approved' : 
                    req.status === 'REJECTED' ? 'Rejected' : 'Pending'
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching slot requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/slot-requests/:id
router.patch('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        
        let prismaStatus = 'PENDING';
        if (status === 'Approved') prismaStatus = 'APPROVED';
        if (status === 'Rejected') prismaStatus = 'REJECTED';

        const updated = await prisma.slotRequest.update({
            where: { id },
            data: { status: prismaStatus },
            include: { student: true }
        });

        res.json({
            id: updated.id.toString(),
            date: updated.date.toISOString().split('T')[0],
            timePreference: updated.timePreference,
            instructor: updated.instructorPreference,
            student: `${updated.student.firstName} ${updated.student.lastName}`.trim(),
            aircraft: updated.aircraftPreference,
            notes: updated.notes,
            status: status
        });
    } catch (error) {
        console.error('Error updating slot request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// POST /api/slot-requests
router.post('/', async (req, res) => {
    try {
        const { date, timePreference, instructorPreference, aircraftPreference, notes, studentId } = req.body;
        
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const newRequest = await prisma.slotRequest.create({
            data: {
                date: new Date(date),
                timePreference,
                instructorPreference,
                aircraftPreference,
                notes,
                studentId: parseInt(studentId),
                status: 'PENDING'
            },
            include: { student: true }
        });

        res.status(201).json({
            id: newRequest.id.toString(),
            date: newRequest.date.toISOString().split('T')[0],
            timePreference: newRequest.timePreference,
            instructor: newRequest.instructorPreference,
            student: `${newRequest.student.firstName} ${newRequest.student.lastName}`.trim(),
            aircraft: newRequest.aircraftPreference,
            notes: newRequest.notes,
            status: 'Pending'
        });
    } catch (error) {
        console.error('Error creating slot request:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

export default router;
