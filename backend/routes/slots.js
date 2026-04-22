import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to reliably parse frontend string to a User ID
async function getOrCreateUserId(name, role) {
    if (!name) return 1; // fallback
    
    const parts = name.split(' ').map(p => p.trim()).filter(p => p);
    const firstName = parts[0] || 'Unknown';
    const lastName = parts.slice(1).join(' ') || '';

    let user = await prisma.user.findFirst({
        where: {
            firstName: { contains: firstName },
            role: role
        }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: `${firstName.toLowerCase()}${Date.now()}@test.com`,
                password: 'placeholder_password',
                role: role
            }
        });
    }
    return user.id;
}

// GET /api/slots
router.get('/', async (req, res) => {
    try {
        const slots = await prisma.flyingSlot.findMany({
            include: { student: true, instructor: true }
        });
        
        // Map to frontend format
        const formatted = slots.map(slot => ({
            id: slot.id.toString(),
            date: slot.date.toISOString().split('T')[0],
            startTime: slot.startTime,
            endTime: slot.endTime,
            instructor: `${slot.instructor.firstName} ${slot.instructor.lastName}`.trim(),
            student: `${slot.student.firstName} ${slot.student.lastName}`.trim(),
            aircraft: slot.aircraft,
            status: slot.status === 'SCHEDULED' ? 'Scheduled' : 
                    slot.status === 'COMPLETED' ? 'Completed' : 'Cancelled'
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/slots
router.post('/', async (req, res) => {
    try {
        const { date, startTime, endTime, instructor, student, aircraft, status } = req.body;

        const studentId = await getOrCreateUserId(student, 'STUDENT');
        const instructorId = await getOrCreateUserId(instructor, 'INSTRUCTOR');

        let prismaStatus = 'SCHEDULED';
        if (status === 'Completed') prismaStatus = 'COMPLETED';
        if (status === 'Cancelled') prismaStatus = 'CANCELLED';

        const newSlot = await prisma.flyingSlot.create({
            data: {
                date: new Date(date),
                startTime,
                endTime,
                aircraft,
                status: prismaStatus,
                studentId,
                instructorId
            },
            include: { student: true, instructor: true }
        });

        res.status(201).json({
            id: newSlot.id.toString(),
            date: newSlot.date.toISOString().split('T')[0],
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            instructor: `${newSlot.instructor.firstName} ${newSlot.instructor.lastName}`.trim(),
            student: `${newSlot.student.firstName} ${newSlot.student.lastName}`.trim(),
            aircraft: newSlot.aircraft,
            status: status
        });
    } catch (error) {
        console.error('Error creating slot:', error);
        res.status(500).json({ error: 'Failed to save slot' });
    }
});

// PUT /api/slots/:id
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { date, startTime, endTime, instructor, student, aircraft, status } = req.body;

        const studentId = await getOrCreateUserId(student, 'STUDENT');
        const instructorId = await getOrCreateUserId(instructor, 'INSTRUCTOR');

        let prismaStatus = 'SCHEDULED';
        if (status === 'Completed') prismaStatus = 'COMPLETED';
        if (status === 'Cancelled') prismaStatus = 'CANCELLED';

        const updatedSlot = await prisma.flyingSlot.update({
            where: { id },
            data: {
                date: new Date(date),
                startTime,
                endTime,
                aircraft,
                status: prismaStatus,
                studentId,
                instructorId
            },
            include: { student: true, instructor: true }
        });

        res.json({
            id: updatedSlot.id.toString(),
            date: updatedSlot.date.toISOString().split('T')[0],
            startTime: updatedSlot.startTime,
            endTime: updatedSlot.endTime,
            instructor: `${updatedSlot.instructor.firstName} ${updatedSlot.instructor.lastName}`.trim(),
            student: `${updatedSlot.student.firstName} ${updatedSlot.student.lastName}`.trim(),
            aircraft: updatedSlot.aircraft,
            status: status
        });
    } catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({ error: 'Failed to update slot' });
    }
});

export default router;
