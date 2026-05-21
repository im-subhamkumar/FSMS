// ============================================================
// Analytics Dashboard API
// Prefix: /api/analytics
// Endpoints:
//   GET /api/analytics/summary     — KPI card data
//   GET /api/analytics/flights     — flight trends & slot stats
//   GET /api/analytics/revenue     — financial analytics
//   GET /api/analytics/fleet       — aircraft status & utilization
//   GET /api/analytics/instructors — workload & availability
//   GET /api/analytics/weather     — weather verdict history
//   GET /api/analytics/compliance  — expiring docs/licenses
// ============================================================

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helper: date ranges ─────────────────────────────────────
function getDateRange(range) {
  const now = new Date();
  const start = new Date();
  switch (range) {
    case '7d':  start.setDate(now.getDate() - 7); break;
    case '30d': start.setDate(now.getDate() - 30); break;
    case '90d': start.setDate(now.getDate() - 90); break;
    case '6m':  start.setMonth(now.getMonth() - 6); break;
    case '1y':  start.setFullYear(now.getFullYear() - 1); break;
    default:    start.setDate(now.getDate() - 30);
  }
  return { start, end: now };
}

// ─── GET /api/analytics/summary ──────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

    const [
      totalStudents, totalInstructors, activeInstructors,
      totalAircraft, availableAircraft,
      todayFlights, thisMonthFlights, lastMonthFlights,
      paidInvoicesThisMonth, paidInvoicesLastMonth,
      openSquawks, expiringDocs,
      avgGpaData
    ] = await Promise.all([
      prisma.student.count(),
      prisma.instructor.count({ where: { isDeleted: false } }),
      prisma.instructor.count({ where: { employmentStatus: 'ACTIVE', isDeleted: false } }),
      prisma.aircraft.count(),
      prisma.aircraft.count({ where: { availability: 'Available' } }),
      prisma.flyingSlot.count({ where: { date: { gte: todayStart, lt: todayEnd } } }),
      prisma.flyingSlot.count({ where: { date: { gte: thisMonthStart } } }),
      prisma.flyingSlot.count({ where: { date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.invoice.findMany({ where: { status: 'PAID', updatedAt: { gte: thisMonthStart } }, select: { paidAmount: true } }),
      prisma.invoice.findMany({ where: { status: 'PAID', updatedAt: { gte: lastMonthStart, lte: lastMonthEnd } }, select: { paidAmount: true } }),
      prisma.squawk.count({ where: { status: 'Open' } }),
      prisma.document.count({ where: { expiryDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), gte: now } } }),
      prisma.student.aggregate({ _avg: { gpa: true } })
    ]);

    const revenueThisMonth = paidInvoicesThisMonth.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
    const revenueLastMonth = paidInvoicesLastMonth.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
    const revenueChange = revenueLastMonth > 0 ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1) : 0;
    const flightChange = lastMonthFlights > 0 ? (((thisMonthFlights - lastMonthFlights) / lastMonthFlights) * 100).toFixed(1) : 0;

    res.json({
      totalStudents,
      totalInstructors,
      activeInstructors,
      totalAircraft,
      availableAircraft,
      fleetAvailabilityPct: totalAircraft > 0 ? Math.round((availableAircraft / totalAircraft) * 100) : 0,
      todayFlights,
      thisMonthFlights,
      flightChange: parseFloat(flightChange),
      revenueThisMonth: revenueThisMonth.toFixed(2),
      revenueLastMonth: revenueLastMonth.toFixed(2),
      revenueChange: parseFloat(revenueChange),
      openSquawks,
      expiringDocs,
      studentInstructorRatio: activeInstructors > 0 ? (totalStudents / activeInstructors).toFixed(1) : 'N/A',
      avgGpa: avgGpaData._avg.gpa ? parseFloat(avgGpaData._avg.gpa.toFixed(2)) : 0,
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/flights?range=30d ────────────────────
router.get('/flights', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.range || '30d');

    const slots = await prisma.flyingSlot.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true, status: true, startTime: true, endTime: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dailyMap = {};
    slots.forEach(s => {
      const key = s.date.toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, scheduled: 0, completed: 0, cancelled: 0, hours: 0 };
      dailyMap[key][s.status.toLowerCase()]++;
      // Estimate hours from time strings
      const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
      dailyMap[key].hours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Status breakdown totals
    const statusCounts = { scheduled: 0, completed: 0, cancelled: 0 };
    slots.forEach(s => { statusCounts[s.status.toLowerCase()]++; });

    // Heatmap: day-of-week × hour
    const heatmap = {};
    slots.forEach(s => {
      const day = s.date.getDay(); // 0=Sun
      const hour = parseInt((s.startTime || '0').split(':')[0]);
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    res.json({ dailyTrend, statusCounts, heatmap, totalSlots: slots.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/revenue?range=6m ─────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.range || '6m');

    const invoices = await prisma.invoice.findMany({
      where: { issuedDate: { gte: start, lte: end } },
      select: { amount: true, paidAmount: true, status: true, issuedDate: true },
      orderBy: { issuedDate: 'asc' },
    });

    // Monthly trend
    const monthlyMap = {};
    invoices.forEach(inv => {
      const key = `${inv.issuedDate.getFullYear()}-${String(inv.issuedDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, billed: 0, collected: 0, outstanding: 0 };
      const amt = parseFloat(inv.amount || 0);
      const paid = parseFloat(inv.paidAmount || 0);
      monthlyMap[key].billed += amt;
      monthlyMap[key].collected += paid;
      monthlyMap[key].outstanding += (amt - paid);
    });
    const monthlyTrend = Object.values(monthlyMap);

    // Status distribution
    const statusDist = { PENDING: 0, PAID: 0, OVERDUE: 0 };
    invoices.forEach(inv => { statusDist[inv.status] = (statusDist[inv.status] || 0) + 1; });

    const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalCollected = invoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);

    res.json({
      monthlyTrend,
      statusDistribution: statusDist,
      totalBilled: totalBilled.toFixed(2),
      totalCollected: totalCollected.toFixed(2),
      totalOutstanding: (totalBilled - totalCollected).toFixed(2),
      collectionRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/fleet ────────────────────────────────
router.get('/fleet', async (req, res) => {
  try {
    const aircraft = await prisma.aircraft.findMany({
      select: { id: true, tailNumber: true, name: true, status: true, availability: true, totalFlightHours: true },
    });

    const statusDist = {};
    aircraft.forEach(a => {
      const key = a.availability || a.status || 'Unknown';
      statusDist[key] = (statusDist[key] || 0) + 1;
    });

    const squawks = await prisma.squawk.findMany({
      where: { status: 'Open' },
      select: { aircraftId: true, severity: true, issue: true, createdAt: true },
    });

    const squawksBySeverity = {};
    squawks.forEach(sq => {
      squawksBySeverity[sq.severity] = (squawksBySeverity[sq.severity] || 0) + 1;
    });

    // Utilization: flights per aircraft (last 30 days)
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const recentSlots = await prisma.flyingSlot.findMany({
      where: { date: { gte: thirtyAgo } },
      select: { aircraft: true },
    });
    const utilizationMap = {};
    recentSlots.forEach(s => { utilizationMap[s.aircraft] = (utilizationMap[s.aircraft] || 0) + 1; });

    const utilization = aircraft.map(a => ({
      id: a.id, tailNumber: a.tailNumber, name: a.name,
      flightsLast30Days: utilizationMap[a.id] || 0,
      totalFlightHours: a.totalFlightHours || 0,
    })).sort((a, b) => b.flightsLast30Days - a.flightsLast30Days);

    res.json({ statusDistribution: statusDist, squawksBySeverity, openSquawkCount: squawks.length, utilization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/instructors ──────────────────────────
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany({
      where: { isDeleted: false },
      select: {
        id: true, userId: true, employmentStatus: true, department: true, designation: true,
        onLeave: true, licenseStatus: true, medicalStatus: true,
        totalFlightHrsAccum: true, monthlyDualHrs: true, maxDualHrsMonth: true, maxFlightHrsDay: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Department distribution
    const deptDist = {};
    instructors.forEach(i => { deptDist[i.department] = (deptDist[i.department] || 0) + 1; });

    // Status breakdown
    const statusDist = {};
    instructors.forEach(i => { statusDist[i.employmentStatus] = (statusDist[i.employmentStatus] || 0) + 1; });

    // Workload: flights per instructor last 30 days
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const recentSlots = await prisma.flyingSlot.findMany({
      where: { date: { gte: thirtyAgo } },
      select: { instructorId: true, startTime: true, endTime: true },
    });

    const workloadMap = {};
    recentSlots.forEach(s => {
      if (!workloadMap[s.instructorId]) workloadMap[s.instructorId] = { flights: 0, hours: 0 };
      workloadMap[s.instructorId].flights++;
      const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
      workloadMap[s.instructorId].hours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
    });

    const workload = instructors.map(i => ({
      id: i.id,
      name: `${i.user.firstName} ${i.user.lastName}`,
      department: i.department,
      status: i.employmentStatus,
      onLeave: i.onLeave,
      licenseStatus: i.licenseStatus,
      medicalStatus: i.medicalStatus,
      flights: workloadMap[i.userId]?.flights || 0,
      hoursLast30Days: Math.round((workloadMap[i.userId]?.hours || 0) * 10) / 10,
      monthlyDualHrs: i.monthlyDualHrs,
      maxDualHrsMonth: i.maxDualHrsMonth,
      utilizationPct: i.maxDualHrsMonth > 0 ? Math.round((i.monthlyDualHrs / i.maxDualHrsMonth) * 100) : 0,
    })).sort((a, b) => b.flights - a.flights);

    res.json({ departmentDistribution: deptDist, statusDistribution: statusDist, workload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/weather?range=30d ────────────────────
router.get('/weather', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.range || '30d');

    const checks = await prisma.weatherCheck.findMany({
      where: { timestamp: { gte: start, lte: end } },
      select: { timestamp: true, verdict: true, flightCategory: true, reasons: true },
      orderBy: { timestamp: 'asc' },
    });

    // Verdict distribution
    const verdictDist = {};
    checks.forEach(c => { verdictDist[c.verdict] = (verdictDist[c.verdict] || 0) + 1; });

    // Flight category distribution
    const catDist = {};
    checks.forEach(c => {
      if (c.flightCategory) catDist[c.flightCategory] = (catDist[c.flightCategory] || 0) + 1;
    });

    // Daily GO rate
    const dailyMap = {};
    checks.forEach(c => {
      const key = c.timestamp.toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, total: 0, go: 0 };
      dailyMap[key].total++;
      if (c.verdict === 'GO') dailyMap[key].go++;
    });
    const dailyGoRate = Object.values(dailyMap).map(d => ({
      ...d, goRate: d.total > 0 ? Math.round((d.go / d.total) * 100) : 0,
    }));

    // Weather-affected schedules
    const weatherAffected = await prisma.schedule.count({ where: { weatherVerdict: 'NO-GO' } });

    res.json({ verdictDistribution: verdictDist, categoryDistribution: catDist, dailyGoRate, weatherAffectedFlights: weatherAffected, totalChecks: checks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/compliance ───────────────────────────
router.get('/compliance', async (req, res) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Expiring documents
    const expiringDocs = await prisma.document.findMany({
      where: { expiryDate: { lte: in60, gte: now }, status: 'ACTIVE' },
      select: { id: true, title: true, expiryDate: true, category: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 20,
    });

    // Expired documents
    const expiredDocs = await prisma.document.count({ where: { expiryDate: { lt: now }, status: 'ACTIVE' } });

    // Instructor license/medical status
    const instructors = await prisma.instructor.findMany({
      where: { isDeleted: false },
      select: {
        id: true, licenseStatus: true, medicalStatus: true,
        licenseExpiryDate: true, medicalExpiryDate: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const licenseAlerts = instructors.filter(i => i.licenseStatus !== 'VALID');
    const medicalAlerts = instructors.filter(i => i.medicalStatus !== 'VALID');

    // Student license/medical expiry
    const studentLicenses = await prisma.studentLicense.findMany({
      where: { expiryDate: { lte: in60, gte: now } },
      select: { licenseNumber: true, expiryDate: true, student: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    });

    const studentMedicals = await prisma.studentMedical.findMany({
      where: { expiryDate: { lte: in60, gte: now } },
      select: { medicalCertificateNumber: true, expiryDate: true, student: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    });

    res.json({
      expiringDocuments: expiringDocs.map(d => ({
        ...d, daysRemaining: Math.ceil((d.expiryDate - now) / (1000 * 60 * 60 * 24)),
      })),
      expiredDocumentCount: expiredDocs,
      instructorLicenseAlerts: licenseAlerts.map(i => ({
        name: `${i.user.firstName} ${i.user.lastName}`, status: i.licenseStatus, expiryDate: i.licenseExpiryDate,
      })),
      instructorMedicalAlerts: medicalAlerts.map(i => ({
        name: `${i.user.firstName} ${i.user.lastName}`, status: i.medicalStatus, expiryDate: i.medicalExpiryDate,
      })),
      studentLicenseAlerts: studentLicenses,
      studentMedicalAlerts: studentMedicals,
      totalAlerts: licenseAlerts.length + medicalAlerts.length + expiringDocs.length + expiredDocs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/performance — T4 Section 2 ───────────
// Trainee performance by course level, completion rates, pass/fail (completed/cancelled)
router.get('/performance', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.range || '30d');
    const filters = {};
    if (req.query.instructorId) filters.instructorId = parseInt(req.query.instructorId);
    if (req.query.studentId) filters.studentId = parseInt(req.query.studentId);

    // All slots in range
    const slots = await prisma.flyingSlot.findMany({
      where: { date: { gte: start, lte: end }, ...filters },
      select: { status: true, studentId: true, instructorId: true, aircraft: true, startTime: true, endTime: true, date: true },
    });

    const total = slots.length;
    const completed = slots.filter(s => s.status === 'COMPLETED').length;
    const cancelled = slots.filter(s => s.status === 'CANCELLED').length;
    const scheduled = slots.filter(s => s.status === 'SCHEDULED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Hours calculation
    let totalHours = 0;
    slots.forEach(s => {
      const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
      totalHours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
    });

    // Per-student performance
    const studentMap = {};
    slots.forEach(s => {
      if (!studentMap[s.studentId]) studentMap[s.studentId] = { total: 0, completed: 0, cancelled: 0, hours: 0 };
      studentMap[s.studentId].total++;
      studentMap[s.studentId][s.status.toLowerCase()]++;
      const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
      studentMap[s.studentId].hours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
    });

    // Fetch student data (GPA and Names)
    const studentIds = Object.keys(studentMap).map(Number);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, gpa: true },
    });
    
    const traineePerformance = students.map(s => {
      const data = studentMap[s.id] || { total: 0, completed: 0, cancelled: 0, hours: 0 };
      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName}`,
        gpa: s.gpa || 0,
        totalSlots: data.total,
        completed: data.completed,
        cancelled: data.cancelled,
        hours: Math.round(data.hours * 10) / 10,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      };
    }).sort((a, b) => b.totalSlots - a.totalSlots);

    // Course-level breakdown using Course model
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, level: true, durationHours: true },
    });

    const courseBreakdown = courses.map(c => ({
      id: c.id, name: c.name, code: c.code, level: c.level,
      targetHours: c.durationHours,
    }));

    res.json({
      summary: { total, completed, cancelled, scheduled, completionRate, totalHours: Math.round(totalHours * 10) / 10 },
      traineePerformance: traineePerformance.slice(0, 20),
      courseBreakdown,
      passFailRatio: { completed, cancelled, ratio: cancelled > 0 ? (completed / cancelled).toFixed(1) : completed > 0 ? '∞' : '0' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/analytics/progress — T4 Section 3 ─────────────
// Completion trends (daily/weekly/monthly) + training progress per batch
router.get('/progress', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.range || '90d');
    const groupBy = req.query.groupBy || 'daily'; // daily | weekly | monthly

    // All completed slots in range
    const slots = await prisma.flyingSlot.findMany({
      where: { date: { gte: start, lte: end }, status: 'COMPLETED' },
      select: { date: true, startTime: true, endTime: true, studentId: true },
      orderBy: { date: 'asc' },
    });

    // Group by period
    const trendMap = {};
    slots.forEach(s => {
      let key;
      const d = s.date;
      if (groupBy === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = d.toISOString().split('T')[0];
      }
      if (!trendMap[key]) trendMap[key] = { period: key, completions: 0, hours: 0, students: new Set() };
      trendMap[key].completions++;
      trendMap[key].students.add(s.studentId);
      const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
      const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
      trendMap[key].hours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
    });

    const completionTrend = Object.values(trendMap)
      .map(t => ({ period: t.period, completions: t.completions, hours: Math.round(t.hours * 10) / 10, uniqueStudents: t.students.size }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Batch progress — students grouped by batch
    const students = await prisma.student.findMany({
      select: { id: true, firstName: true, lastName: true, batch: true },
    });

    const batchMap = {};
    students.forEach(s => {
      const batch = s.batch || 'Unassigned';
      if (!batchMap[batch]) batchMap[batch] = { batch, studentCount: 0, studentIds: [] };
      batchMap[batch].studentCount++;
      batchMap[batch].studentIds.push(s.id);
    });

    // Get all slots for each batch's students
    const allSlots = await prisma.flyingSlot.findMany({
      select: { studentId: true, status: true, startTime: true, endTime: true },
    });

    // Map User IDs to Student IDs (students in FlyingSlot use userId, not student.id)
    const batchProgress = Object.values(batchMap).map(b => {
      const batchSlots = allSlots.filter(s => b.studentIds.includes(s.studentId));
      const completedSlots = batchSlots.filter(s => s.status === 'COMPLETED');
      let totalHours = 0;
      completedSlots.forEach(s => {
        const [sh, sm] = (s.startTime || '0:0').split(':').map(Number);
        const [eh, em] = (s.endTime || '0:0').split(':').map(Number);
        totalHours += Math.max(0, (eh + em / 60) - (sh + sm / 60));
      });
      return {
        batch: b.batch,
        studentCount: b.studentCount,
        totalSlots: batchSlots.length,
        completed: completedSlots.length,
        cancelled: batchSlots.filter(s => s.status === 'CANCELLED').length,
        completionRate: batchSlots.length > 0 ? Math.round((completedSlots.length / batchSlots.length) * 100) : 0,
        totalHours: Math.round(totalHours * 10) / 10,
        avgHoursPerStudent: b.studentCount > 0 ? Math.round((totalHours / b.studentCount) * 10) / 10 : 0,
      };
    }).sort((a, b) => b.studentCount - a.studentCount);

    res.json({ completionTrend, batchProgress, groupBy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
