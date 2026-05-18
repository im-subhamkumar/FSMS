import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helper: Parse Date Filters ───────────────────────────────
const getDateFilters = (query, dateField = 'createdAt') => {
  const filters = {};
  if (query.from || query.to) {
    filters[dateField] = {};
    if (query.from) filters[dateField].gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      filters[dateField].lte = toDate;
    }
  }
  return filters;
};

const getYearMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (key) => {
  const [year, month] = key.split('-');
  const d = new Date(year, parseInt(month) - 1, 1);
  const monthStr = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  return `${monthStr} ${year.slice(2)}`;
};

// ─── 1. Financial Summary ─────────────────────────────────────
router.get('/financial', async (req, res) => {
  try {
    const dateFilters = getDateFilters(req.query, 'issuedDate');

    const invoices = await prisma.invoice.findMany({
      where: dateFilters,
    });

    let totalRevenue = 0;
    let totalBilled = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    const monthlyMap = {};
    const statusBreakdown = { PENDING: 0, PAID: 0, OVERDUE: 0 };

    invoices.forEach(inv => {
      const amt = parseFloat(inv.amount || 0);
      const paid = parseFloat(inv.paidAmount || 0);
      const status = inv.status;

      totalBilled += amt;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      if (status === 'PAID') {
        totalRevenue += paid;
      } else if (status === 'PENDING') {
        pendingAmount += (amt - paid);
      } else if (status === 'OVERDUE') {
        overdueCount += 1;
        overdueAmount += (amt - paid);
      }

      // Monthly aggregation by issuedDate (chronological order)
      const key = getYearMonthKey(new Date(inv.issuedDate));
      if (!monthlyMap[key]) monthlyMap[key] = 0;
      if (status === 'PAID') monthlyMap[key] += paid;
    });

    const monthlyRevenue = Object.keys(monthlyMap).sort().map(key => ({
      month: formatMonthLabel(key),
      amount: Math.round(monthlyMap[key])
    }));

    // Collection efficiency percentage
    const collectionRate = totalBilled > 0
      ? Math.round((totalRevenue / totalBilled) * 100)
      : 0;

    res.json({
      totalRevenue: Math.round(totalRevenue),
      totalBilled: Math.round(totalBilled),
      pendingAmount: Math.round(pendingAmount),
      overdueCount,
      overdueAmount: Math.round(overdueAmount),
      collectionRate,
      monthlyRevenue,
      statusBreakdown
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 2. Student Summary ───────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    // Total students (unfiltered — always show full count)
    const totalStudents = await prisma.student.count();
    const activeStudents = totalStudents; // No isActive field in Student model

    // Monthly joins — use date filter for trend data
    const dateFilters = getDateFilters(req.query);
    const students = await prisma.student.findMany({
      where: dateFilters,
      select: { createdAt: true }
    });

    const monthlyMap = {};
    students.forEach(st => {
      const key = getYearMonthKey(new Date(st.createdAt));
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    });

    const monthlyJoins = Object.keys(monthlyMap).sort().map(key => ({
      month: formatMonthLabel(key),
      count: monthlyMap[key]
    }));

    // Batch distribution
    const allStudents = await prisma.student.findMany({
      select: { batch: true }
    });
    const batchMap = {};
    allStudents.forEach(st => {
      const batch = st.batch || 'Unassigned';
      batchMap[batch] = (batchMap[batch] || 0) + 1;
    });

    res.json({
      totalStudents,
      activeStudents,
      monthlyJoins,
      batchDistribution: Object.entries(batchMap).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    console.error('Students report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 3. Flight Activity Summary ───────────────────────────────
router.get('/flights', async (req, res) => {
  try {
    const filters = getDateFilters(req.query, 'date');

    const slots = await prisma.flyingSlot.findMany({
      where: filters,
    });

    let totalSlots = slots.length;
    let bookedSlots = 0;
    let completedSlots = 0;
    let cancelledSlots = 0;
    let totalFlyingHours = 0;

    const monthlyMap = {};

    slots.forEach(slot => {
      const status = slot.status;
      if (status === 'SCHEDULED') bookedSlots++;
      else if (status === 'COMPLETED') completedSlots++;
      else if (status === 'CANCELLED') cancelledSlots++;

      // Calculate hours from time strings
      try {
        const [sH, sM] = slot.startTime.split(':').map(Number);
        const [eH, eM] = slot.endTime.split(':').map(Number);
        const hours = (eH + eM / 60) - (sH + sM / 60);
        if (hours > 0 && status === 'COMPLETED') totalFlyingHours += hours;
      } catch (e) { /* skip bad time data */ }

      const key = getYearMonthKey(new Date(slot.date));
      if (!monthlyMap[key]) {
        monthlyMap[key] = { booked: 0, completed: 0, cancelled: 0 };
      }

      if (status === 'SCHEDULED') monthlyMap[key].booked++;
      else if (status === 'COMPLETED') monthlyMap[key].completed++;
      else if (status === 'CANCELLED') monthlyMap[key].cancelled++;
    });

    const slotActivity = Object.keys(monthlyMap).sort().map(key => ({
      month: formatMonthLabel(key),
      booked: monthlyMap[key].booked,
      completed: monthlyMap[key].completed,
      cancelled: monthlyMap[key].cancelled
    }));

    // Slot utilization rate
    const utilizationRate = totalSlots > 0
      ? Math.round((completedSlots / totalSlots) * 100)
      : 0;

    res.json({
      totalSlots,
      bookedSlots,
      completedSlots,
      cancelledSlots,
      totalFlyingHours: Math.round(totalFlyingHours * 10) / 10,
      utilizationRate,
      slotActivity
    });
  } catch (error) {
    console.error('Flights report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 4. Instructor Summary ────────────────────────────────────
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    const totalInstructors = instructors.length;
    const activeInstructors = instructors.filter(i => i.employmentStatus === 'ACTIVE').length;

    // Get flying slots for the date range
    const filters = getDateFilters(req.query, 'date');
    const slots = await prisma.flyingSlot.findMany({
      where: filters
    });

    // FlyingSlot.instructorId references User.id (not Instructor.id)
    // So we must map using inst.userId
    const instructorSlotCounts = {};
    const instructorHours = {};

    slots.forEach(slot => {
      const iid = slot.instructorId;
      instructorSlotCounts[iid] = (instructorSlotCounts[iid] || 0) + 1;

      // Calculate hours for completed slots
      if (slot.status === 'COMPLETED') {
        try {
          const [sH, sM] = slot.startTime.split(':').map(Number);
          const [eH, eM] = slot.endTime.split(':').map(Number);
          const hours = (eH + eM / 60) - (sH + sM / 60);
          if (hours > 0) {
            instructorHours[iid] = (instructorHours[iid] || 0) + hours;
          }
        } catch (e) { /* skip */ }
      }
    });

    const slotsPerInstructor = instructors.map(inst => {
      const userId = inst.userId;
      const name = `${inst.user?.firstName || ''} ${inst.user?.lastName || ''}`.trim() || `Instructor #${inst.id}`;
      return {
        name,
        slots: instructorSlotCounts[userId] || 0,
        hours: Math.round((instructorHours[userId] || 0) * 10) / 10
      };
    }).sort((a, b) => b.slots - a.slots);

    res.json({
      totalInstructors,
      activeInstructors,
      slotsPerInstructor
    });
  } catch (error) {
    console.error('Instructors report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 5. Course Summary (REAL DATA — no mocks) ────────────────
router.get('/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true }
    });

    const totalCourses = courses.length;

    // Count invoices that reference each course name in their line items
    // This acts as a proxy for "popularity / enrollment" since there's no
    // enrollment junction table in the schema
    const invoiceItems = await prisma.invoiceItem.findMany({
      select: { description: true }
    });

    const coursePopularity = courses.map(course => {
      // Count invoice items whose description contains the course name
      const matchCount = invoiceItems.filter(item =>
        item.description.toLowerCase().includes(course.name.toLowerCase()) ||
        item.description.toLowerCase().includes(course.code.toLowerCase())
      ).length;

      return {
        courseName: course.name,
        level: course.level,
        students: matchCount
      };
    });

    // Sort by count descending
    coursePopularity.sort((a, b) => b.students - a.students);

    // Level distribution
    const levelMap = {};
    courses.forEach(c => {
      levelMap[c.level] = (levelMap[c.level] || 0) + 1;
    });

    res.json({
      totalCourses,
      studentsPerCourse: coursePopularity,
      levelDistribution: Object.entries(levelMap).map(([level, count]) => ({ level, count }))
    });
  } catch (error) {
    console.error('Courses report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 6. Fleet & Aircraft Status (NEW) ─────────────────────────
router.get('/fleet', async (req, res) => {
  try {
    const aircraft = await prisma.aircraft.findMany();
    const totalAircraft = aircraft.length;

    // Status distribution
    const statusMap = { Airworthy: 0, 'In Maintenance': 0, AOG: 0, Other: 0 };
    aircraft.forEach(ac => {
      const s = (ac.status || '').toLowerCase();
      if (s.includes('active') || s.includes('airworthy') || s.includes('available')) {
        statusMap['Airworthy']++;
      } else if (s.includes('maintenance') || s === 'in_maintenance') {
        statusMap['In Maintenance']++;
      } else if (s.includes('aog') || s.includes('grounded')) {
        statusMap['AOG']++;
      } else {
        statusMap['Other']++;
      }
    });

    // Aircraft utilization — count flying slots per aircraft
    const filters = getDateFilters(req.query, 'date');
    let slots = [];
    try {
      slots = await prisma.flyingSlot.findMany({ where: filters });
    } catch (e) { /* FlyingSlot may not have data */ }

    const aircraftUsage = {};
    slots.forEach(slot => {
      const tail = slot.aircraft || 'Unknown';
      if (!aircraftUsage[tail]) aircraftUsage[tail] = { slots: 0, hours: 0 };
      aircraftUsage[tail].slots++;
      if (slot.status === 'COMPLETED') {
        try {
          const [sH, sM] = slot.startTime.split(':').map(Number);
          const [eH, eM] = slot.endTime.split(':').map(Number);
          const hours = (eH + eM / 60) - (sH + sM / 60);
          if (hours > 0) aircraftUsage[tail].hours += hours;
        } catch (e) { /* skip */ }
      }
    });

    const utilization = Object.entries(aircraftUsage)
      .map(([tailNumber, data]) => ({
        tailNumber,
        slots: data.slots,
        hours: Math.round(data.hours * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    // Squawk summary
    let openSquawks = 0;
    try {
      openSquawks = await prisma.squawk.count({
        where: { status: 'Open' }
      });
    } catch (e) { /* Squawk table may be empty */ }

    res.json({
      totalAircraft,
      statusDistribution: Object.entries(statusMap)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value })),
      utilization,
      openSquawks
    });
  } catch (error) {
    console.error('Fleet report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── 7. Compliance & Expiry Alerts (NEW) ──────────────────────
router.get('/compliance', async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const alerts = [];

    // Student licenses expiring within 30 days or already expired
    try {
      const expiringLicenses = await prisma.studentLicense.findMany({
        where: { expiryDate: { lte: in30Days } },
        include: { student: { select: { firstName: true, lastName: true, studentId: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 20
      });

      expiringLicenses.forEach(lic => {
        const isExpired = new Date(lic.expiryDate) < now;
        alerts.push({
          type: 'License',
          entity: `${lic.student.firstName} ${lic.student.lastName}`,
          entityId: lic.student.studentId,
          detail: `${lic.licenseType} — ${lic.licenseNumber}`,
          expiryDate: lic.expiryDate,
          status: isExpired ? 'EXPIRED' : 'EXPIRING_SOON'
        });
      });
    } catch (e) { /* table may be empty */ }

    // Student medicals expiring
    try {
      const expiringMedicals = await prisma.studentMedical.findMany({
        where: { expiryDate: { lte: in30Days } },
        include: { student: { select: { firstName: true, lastName: true, studentId: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 20
      });

      expiringMedicals.forEach(med => {
        const isExpired = new Date(med.expiryDate) < now;
        alerts.push({
          type: 'Medical',
          entity: `${med.student.firstName} ${med.student.lastName}`,
          entityId: med.student.studentId,
          detail: `Certificate #${med.medicalCertificateNumber}`,
          expiryDate: med.expiryDate,
          status: isExpired ? 'EXPIRED' : 'EXPIRING_SOON'
        });
      });
    } catch (e) { /* table may be empty */ }

    // Documents expiring
    try {
      const expiringDocs = await prisma.document.findMany({
        where: {
          expiryDate: { lte: in30Days },
          status: 'ACTIVE'
        },
        include: { category: { select: { name: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 20
      });

      expiringDocs.forEach(doc => {
        const isExpired = new Date(doc.expiryDate) < now;
        alerts.push({
          type: 'Document',
          entity: doc.title,
          entityId: doc.id.toString(),
          detail: doc.category?.name || 'Uncategorized',
          expiryDate: doc.expiryDate,
          status: isExpired ? 'EXPIRED' : 'EXPIRING_SOON'
        });
      });
    } catch (e) { /* table may be empty */ }

    // Sort all alerts: expired first, then by expiry date ascending
    alerts.sort((a, b) => {
      if (a.status === 'EXPIRED' && b.status !== 'EXPIRED') return -1;
      if (a.status !== 'EXPIRED' && b.status === 'EXPIRED') return 1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    const expiredCount = alerts.filter(a => a.status === 'EXPIRED').length;
    const expiringSoonCount = alerts.filter(a => a.status === 'EXPIRING_SOON').length;

    res.json({
      totalAlerts: alerts.length,
      expiredCount,
      expiringSoonCount,
      alerts: alerts.slice(0, 15)
    });
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
