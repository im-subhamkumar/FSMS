import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/maintenance/aircraft
router.get('/aircraft', async (req, res) => {
  try {
    const aircraft = await prisma.aircraft.findMany({
      include: {
        assignedAme: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    const formattedAircraft = aircraft.map(ac => ({
      ...ac,
      ameAssignedStr: ac.assignedAme ? `${ac.assignedAme.firstName} ${ac.assignedAme.lastName}` : null
    }));

    res.json(formattedAircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Failed to fetch aircraft' });
  }
});

// GET /api/maintenance/squawks
router.get('/squawks', async (req, res) => {
  try {
    const squawks = await prisma.squawk.findMany({
      where: { status: 'Open' },
      include: {
        aircraft: true
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(squawks);
  } catch (error) {
    console.error('Error fetching squawks:', error);
    res.status(500).json({ error: 'Failed to fetch squawks' });
  }
});

// GET /api/maintenance/activities
router.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.maintenanceActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/maintenance/ames
router.get('/ames', async (req, res) => {
  try {
    const ames = await prisma.user.findMany({
      where: { role: 'STAFF' }, // Assuming STAFF role is used for AMEs
      select: {
        id: true,
        firstName: true,
        lastName: true,
      }
    });
    res.json(ames);
  } catch (error) {
    console.error('Error fetching AMEs:', error);
    res.status(500).json({ error: 'Failed to fetch AMEs' });
  }
});

// GET /api/maintenance/stats
router.get('/stats', async (req, res) => {
  try {
    const airworthy = await prisma.aircraft.count({ where: { status: 'AIRWORTHY' } });
    const grounded = await prisma.aircraft.count({ where: { status: 'AOG' } });
    const openSquawks = await prisma.squawk.count({ where: { status: 'Open' } });
    const criticalSquawks = await prisma.squawk.count({ where: { status: 'Open', severity: 'Critical' } });
    
    // Maintenance due count (example: Next Check <= 10 hours)
    const maintenanceDueCount = await prisma.aircraft.count({
      where: { nextCheck: { lte: 10 } }
    });

    res.json({
      airworthy,
      grounded,
      openSquawks,
      criticalSquawks,
      maintenanceDueCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/maintenance/assigned-repairs
router.get('/assigned-repairs', async (req, res) => {
  try {
    const aircraftWithIssues = await prisma.aircraft.findMany({
      where: {
        assignedAmeId: { not: null },
        OR: [
          { status: 'AOG' },
          { status: 'IN_MAINTENANCE' }
        ]
      },
      include: {
        assignedAme: true,
        squawks: {
          where: { status: 'Open' },
          take: 1
        }
      }
    });

    const formatted = aircraftWithIssues.map(ac => {
      const squawk = ac.squawks[0];
      return {
        id: ac.tailNumber,
        issue: squawk ? squawk.issue : 'Maintenance Check',
        badge: ac.status.replace('_', ' '),
        badgeColor: ac.status === 'AOG' ? 'red' : 'orange',
        ame: `Capt. ${ac.assignedAme?.lastName || 'Unknown'}`,
        due: 'Next Check: ' + ac.nextCheck + 'h',
        status: ac.status === 'AOG' ? 'Pending' : 'In Progress',
        statusColor: ac.status === 'AOG' ? 'orange' : 'blue'
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching assigned repairs:', error);
    res.status(500).json({ error: 'Failed to fetch assigned repairs' });
  }
});

// POST /api/maintenance/assign-ame
router.post('/assign-ame', async (req, res) => {
  const { aircraftId, ameId } = req.body;
  if (!aircraftId || !ameId) {
    return res.status(400).json({ error: 'Missing aircraftId or ameId' });
  }

  try {
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: parseInt(aircraftId) },
      data: {
        assignedAmeId: parseInt(ameId),
        status: 'IN_MAINTENANCE'
      }
    });

    const ame = await prisma.user.findUnique({ where: { id: parseInt(ameId) } });
    await prisma.maintenanceActivity.create({
      data: {
        description: `AME ${ame?.lastName || ''} assigned to ${updatedAircraft.tailNumber}`,
        type: 'Info',
        userId: parseInt(ameId)
      }
    });

    res.json({ message: 'Assignment successful', aircraft: updatedAircraft });
  } catch (error) {
    console.error('Error assigning AME:', error);
    res.status(500).json({ error: 'Failed to assign AME' });
  }
});

export default router;
