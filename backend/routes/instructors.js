import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────
// File Upload Setup (multer)
// ──────────────────────────────────────────
const UPLOAD_DIR = path.resolve('uploads/instructors');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  },
});

// ──────────────────────────────────────────
// Helper: compute expiry status
// ──────────────────────────────────────────
function getExpiryStatus(expiryDate, warnDays = 60) {
  if (!expiryDate) return 'VALID';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= warnDays) return 'EXPIRING_SOON';
  return 'VALID';
}

function getCurrencyStatus(lastFlightDate) {
  if (!lastFlightDate) return 'NOT_CURRENT';
  const now = new Date();
  const last = new Date(lastFlightDate);
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  if (diffDays > 90) return 'NOT_CURRENT';
  if (diffDays > 75) return 'EXPIRING_SOON';
  return 'CURRENT';
}

// ──────────────────────────────────────────
// Auto-generate Employee ID
// ──────────────────────────────────────────
async function generateEmployeeId() {
  // Use last record's ID, not count() — count drops on soft-delete causing collisions
  const last = await prisma.instructor.findFirst({ orderBy: { id: 'desc' } });
  const year = new Date().getFullYear();
  const parts = last?.employeeId?.split('-');
  const lastNum = parts?.length === 3 ? parseInt(parts[2]) : 0;
  const num = isNaN(lastNum) ? 1 : lastNum + 1;
  return `INST-${year}-${String(num).padStart(3, '0')}`;
}

// ──────────────────────────────────────────
// GET /api/instructors — list all (with filters)
// ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      status,
      designation,
      department,
      medicalStatus,
      licenseStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = { isDeleted: false };

    if (status) where.employmentStatus = status;
    if (designation) where.designation = designation;
    if (department) where.department = department;
    if (medicalStatus) where.medicalStatus = medicalStatus;
    if (licenseStatus) where.licenseStatus = licenseStatus;

    if (search) {
      where.OR = [
        { employeeId: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
        { phone: { contains: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
          reportingTo: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.instructor.count({ where }),
    ]);

    res.json({
      data: instructors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// GET /api/instructors/available — list instructors available for dispatch on a given date
// ──────────────────────────────────────────
router.get('/available', async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();

    const instructors = await prisma.instructor.findMany({
      where: {
        isDeleted: false,
        employmentStatus: 'ACTIVE',
        medicalStatus: { not: 'EXPIRED' },
        onLeave: false,
        OR: [
          { leaveFrom: null },
          { leaveFrom: { gt: checkDate } },
          { leaveTo: { lt: checkDate } },
        ],
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// GET /api/instructors/:id — single instructor
// ──────────────────────────────────────────
// ⚠️ IMPORTANT: /available MUST remain registered BEFORE /:id
// Express matches routes in declaration order. If /:id comes first,
// the string "available" will be parsed as an :id param and fail.
router.get('/:id', async (req, res) => {
  try {
    const instructor = await prisma.instructor.findFirst({
      where: { id: parseInt(req.params.id), isDeleted: false },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
        reportingTo: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        documents: { orderBy: { uploadedAt: 'desc' } },
        changeLogs: { orderBy: { changedAt: 'desc' }, take: 50 },
      },
    });

    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    res.json(instructor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// POST /api/instructors — create new instructor
// ──────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      // User fields
      email,
      firstName,
      lastName,
      password = 'changeme123',
      // Section B
      designation,
      department,
      dateOfJoining,
      employmentType,
      reportingToId,
      // Section A
      dateOfBirth,
      gender,
      nationality,
      phone,
      emergencyPhone,
      address,
      city,
      state,
      pinCode,
      country,
      // Section C
      licenseNumber,
      licenseTypes,
      issuingAuthority,
      licenseIssueDate,
      licenseExpiryDate,
      ratings,
      typeRatings,
      // Section D
      medicalClass,
      medicalCertNumber,
      medicalIssuingAME,
      medicalIssueDate,
      medicalExpiryDate,
      // Section E
      totalHours,
      picHours,
      dualHours,
      simHours,
      nightHours,
      instrumentHours,
      aircraftFlown,
      lastFlightDate,
      // Section F
      subjectsCanTeach,
      fisDate,
      // Section G
      workDays,
      preferredStartTime,
      preferredEndTime,
      maxFlightHrsDay,
      maxDualHrsMonth,
      canDoSim,
      canDoGround,
      canDoNight,
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !designation || !department || !dateOfJoining || !employmentType) {
      return res.status(400).json({ error: 'Missing required fields: email, firstName, lastName, designation, department, dateOfJoining, employmentType' });
    }

    const employeeId = await generateEmployeeId();
    const licenseStatus = getExpiryStatus(licenseExpiryDate, 60);
    const medicalStatus = getExpiryStatus(medicalExpiryDate, 30);
    const flightCurrencyStatus = getCurrencyStatus(lastFlightDate);

    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          password, // TODO: hash in production
          role: 'INSTRUCTOR',
        },
      });

      // Create instructor profile
      const instructor = await tx.instructor.create({
        data: {
          userId: user.id,
          employeeId,
          designation,
          department,
          dateOfJoining: new Date(dateOfJoining),
          employmentType,
          reportingToId: reportingToId ? parseInt(reportingToId) : null,
          // Section A
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          nationality,
          phone,
          emergencyPhone,
          address,
          city,
          state,
          pinCode,
          country: country || 'India',
          // Section C
          licenseNumber,
          licenseTypes: licenseTypes ? JSON.stringify(licenseTypes) : null,
          issuingAuthority,
          licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate) : null,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
          ratings: ratings ? JSON.stringify(ratings) : null,
          typeRatings: typeRatings ? JSON.stringify(typeRatings) : null,
          licenseStatus,
          // Section D
          medicalClass,
          medicalCertNumber,
          medicalIssuingAME,
          medicalIssueDate: medicalIssueDate ? new Date(medicalIssueDate) : null,
          medicalExpiryDate: medicalExpiryDate ? new Date(medicalExpiryDate) : null,
          medicalStatus,
          // Section E
          totalHours: totalHours ? parseFloat(totalHours) : 0,
          picHours: picHours ? parseFloat(picHours) : 0,
          dualHours: dualHours ? parseFloat(dualHours) : 0,
          simHours: simHours ? parseFloat(simHours) : 0,
          nightHours: nightHours ? parseFloat(nightHours) : 0,
          instrumentHours: instrumentHours ? parseFloat(instrumentHours) : 0,
          aircraftFlown: aircraftFlown ? JSON.stringify(aircraftFlown) : null,
          lastFlightDate: lastFlightDate ? new Date(lastFlightDate) : null,
          flightCurrencyStatus,
          // Section F
          subjectsCanTeach: subjectsCanTeach ? JSON.stringify(subjectsCanTeach) : null,
          fisDate: fisDate ? new Date(fisDate) : null,
          // Section G
          workDays: workDays ? JSON.stringify(workDays) : null,
          preferredStartTime,
          preferredEndTime,
          maxFlightHrsDay: maxFlightHrsDay ? parseFloat(maxFlightHrsDay) : 8,
          maxDualHrsMonth: maxDualHrsMonth ? parseFloat(maxDualHrsMonth) : 100,
          canDoSim: canDoSim !== undefined ? Boolean(canDoSim) : true,
          canDoGround: canDoGround !== undefined ? Boolean(canDoGround) : true,
          canDoNight: canDoNight !== undefined ? Boolean(canDoNight) : false,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return instructor;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// PUT /api/instructors/:id — update instructor
// ──────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.instructor.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return res.status(404).json({ error: 'Instructor not found' });

    const adminUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : 1;
    const updates = { ...req.body };

    // Recalculate status fields if expiry dates changed
    if (updates.licenseExpiryDate !== undefined) {
      updates.licenseStatus = getExpiryStatus(updates.licenseExpiryDate, 60);
    }
    if (updates.medicalExpiryDate !== undefined) {
      updates.medicalStatus = getExpiryStatus(updates.medicalExpiryDate, 30);
    }
    if (updates.lastFlightDate !== undefined) {
      updates.flightCurrencyStatus = getCurrencyStatus(updates.lastFlightDate);
    }

    // Sanitize JSON array fields
    const jsonFields = ['licenseTypes', 'ratings', 'typeRatings', 'aircraftFlown', 'subjectsCanTeach', 'workDays'];
    for (const field of jsonFields) {
      if (updates[field] !== undefined && Array.isArray(updates[field])) {
        updates[field] = JSON.stringify(updates[field]);
      }
    }

    // Sanitize date fields
    const dateFields = ['dateOfBirth', 'dateOfJoining', 'licenseIssueDate', 'licenseExpiryDate',
      'medicalIssueDate', 'medicalExpiryDate', 'lastFlightDate', 'fisDate', 'leaveFrom', 'leaveTo'];
    for (const field of dateFields) {
      if (updates[field]) updates[field] = new Date(updates[field]);
    }

    // Remove fields that shouldn't be directly updated
    delete updates.userId;
    delete updates.employeeId;
    delete updates.isDeleted;
    delete updates.createdAt;

    // Build change log entries
    const changeLogs = [];
    for (const [key, newVal] of Object.entries(updates)) {
      const oldVal = existing[key];
      const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : '';
      const newStr = newVal !== null && newVal !== undefined ? String(newVal) : '';
      if (oldStr !== newStr) {
        changeLogs.push({
          instructorId: id,
          changedBy: adminUserId,
          fieldChanged: key,
          oldValue: oldStr,
          newValue: newStr,
        });
      }
    }

    const [instructor] = await prisma.$transaction([
      prisma.instructor.update({
        where: { id },
        data: updates,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      ...changeLogs.map((log) => prisma.instructorChangeLog.create({ data: log })),
    ]);

    res.json(instructor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// PATCH /api/instructors/:id/status — change employment status
// ──────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: { employmentStatus: status },
    });

    res.json(instructor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// DELETE /api/instructors/:id — soft delete
// ──────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const adminUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : 1;

    await prisma.$transaction([
      prisma.instructor.update({
        where: { id },
        data: { isDeleted: true, employmentStatus: 'INACTIVE' },
      }),
      prisma.instructorChangeLog.create({
        data: {
          instructorId: id,
          changedBy: adminUserId,
          fieldChanged: 'isDeleted',
          oldValue: 'false',
          newValue: 'true',
          note: 'Instructor soft-deleted by admin',
        },
      }),
    ]);

    res.json({ message: 'Instructor deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// GET /api/instructors/:id/documents
// ──────────────────────────────────────────
router.get('/:id/documents', async (req, res) => {
  try {
    const docs = await prisma.instructorDocument.findMany({
      where: { instructorId: parseInt(req.params.id) },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// POST /api/instructors/:id/documents — upload file
// ──────────────────────────────────────────
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { category, label } = req.body;
    const adminUserId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : 1;
    const instructorId = parseInt(req.params.id);

    console.log(`--- [UPLOAD] Receipt for Instructor ${instructorId} ---`);
    console.log(`File: ${req.file.originalname} -> ${req.file.filename}`);
    console.log(`Category: ${category}, Label: ${label}`);

    const doc = await prisma.instructorDocument.create({
      data: {
        instructorId,
        category: category || 'General',
        label: label || req.file.originalname,
        fileName: req.file.filename,
        fileUrl: `/uploads/instructors/${req.file.filename}`,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadedBy: adminUserId,
      },
    });

    console.log(`--- [UPLOAD] Success: Document ID ${doc.id} created ---`);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// DELETE /api/instructors/:id/documents/:docId
// ──────────────────────────────────────────
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const doc = await prisma.instructorDocument.findFirst({
      where: {
        id: parseInt(req.params.docId),
        instructorId: parseInt(req.params.id),
      },
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete physical file
    const filePath = path.resolve(`.${doc.fileUrl}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.instructorDocument.delete({ where: { id: doc.id } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// GET /api/instructors/:id/changelog
// ──────────────────────────────────────────
router.get('/:id/changelog', async (req, res) => {
  try {
    const logs = await prisma.instructorChangeLog.findMany({
      where: { instructorId: parseInt(req.params.id) },
      orderBy: { changedAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// GET /api/instructors/:id/photo — serve profile photo (redirect)
// ──────────────────────────────────────────
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const id = parseInt(req.params.id);
    const photoUrl = `/uploads/instructors/${req.file.filename}`;
    const updated = await prisma.instructor.update({
      where: { id },
      data: { profilePhotoUrl: photoUrl },
    });
    res.json({ profilePhotoUrl: updated.profilePhotoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
