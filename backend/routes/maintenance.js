import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/maintenance/aircraft
router.get('/aircraft', async (req, res) => {
  try {
    const aircraft = await prisma.aircraft.findMany({
      include: {
        squawks: {
          where: { status: 'Open' },
          take: 1
        },
        assignedAme: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const formatted = aircraft.map(ac => ({
      ...ac,
      ameAssignedStr: ac.assignedAme ? `${ac.assignedAme.firstName} ${ac.assignedAme.lastName}` : null
    }));

    res.json(formatted);
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
      include: { aircraft: true },
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
      where: { role: 'STAFF' },
      select: { id: true, firstName: true, lastName: true }
    });
    res.json(ames);
  } catch (error) {
    console.error('Error fetching AMEs:', error);
    res.status(500).json({ error: 'Failed to fetch AMEs' });
  }
});

// GET /api/maintenance/stats
// Aircraft team uses status = "Active" / "Inactive" / "Under Maintenance"
router.get('/stats', async (req, res) => {
  try {
    const [airworthy, grounded, inMaintenance, openSquawks, criticalSquawks, maintenanceDueCount] = await Promise.all([
      prisma.aircraft.count({ where: { status: 'Active' } }),
      prisma.aircraft.count({ where: { status: 'Inactive' } }),
      prisma.aircraft.count({ where: { status: 'Under Maintenance' } }),
      prisma.squawk.count({ where: { status: 'Open' } }),
      prisma.squawk.count({ where: { status: 'Open', severity: 'Critical' } }),
      // Maintenance due = aircraft whose last maintenance was over 90 days ago or never
      prisma.aircraft.count({
        where: {
          OR: [
            { lastMaintenance: null },
            { lastMaintenance: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
          ]
        }
      })
    ]);

    res.json({
      airworthy,
      grounded,
      inMaintenance,
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
          { status: 'Inactive' },
          { status: 'Under Maintenance' }
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
      const isGrounded = ac.status === 'Inactive';
      return {
        id: ac.name,
        issue: squawk ? squawk.issue : 'Scheduled Maintenance',
        badge: ac.status,
        badgeColor: isGrounded ? 'red' : 'orange',
        ame: ac.assignedAme ? `${ac.assignedAme.firstName} ${ac.assignedAme.lastName}` : 'Unassigned',
        due: ac.lastMaintenance ? `Last: ${new Date(ac.lastMaintenance).toLocaleDateString()}` : 'Never maintained',
        status: isGrounded ? 'Pending' : 'In Progress',
        statusColor: isGrounded ? 'orange' : 'blue'
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching assigned repairs:', error);
    res.status(500).json({ error: 'Failed to fetch assigned repairs' });
  }
});

// POST /api/maintenance/assign-ame
// Aircraft id is now a String (e.g., "AC-001")
router.post('/assign-ame', async (req, res) => {
  const { aircraftId, ameId } = req.body;
  if (!aircraftId || !ameId) {
    return res.status(400).json({ error: 'Missing aircraftId or ameId' });
  }

  try {
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: String(aircraftId) },   // ID is now a String
      data: {
        assignedAmeId: parseInt(ameId),
        status: 'Under Maintenance'
      }
    });

    const ame = await prisma.user.findUnique({ where: { id: parseInt(ameId) } });
    await prisma.maintenanceActivity.create({
      data: {
        description: `AME ${ame?.firstName || ''} ${ame?.lastName || ''} assigned to ${updatedAircraft.name}`,
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
