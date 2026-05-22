import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getRecordStatus(expiryDate) {
  if (!expiryDate) return 'VALID';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate);
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const diffDays = Math.ceil((expiryDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays < 30) return 'EXPIRING_SOON';
  return 'VALID';
}

function toLegacyDbStatus(appStatus) {
  if (appStatus === 'EXPIRED') return 'EXPIRED';
  return 'ACTIVE';
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

function mapUserToStudent(user) {
  return {
    id: user.id,
    studentId: `STU-${String(user.id).padStart(4, '0')}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    batch: 'Demo Batch',
  };
}

function mapUserToInstructor(user) {
  return {
    id: user.id,
    employeeId: `INST-${String(user.id).padStart(4, '0')}`,
    designation: 'FLIGHT_INSTRUCTOR',
    employmentStatus: 'ACTIVE',
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
}

function mapHolder(user) {
  if (!user) {
    return {
      type: 'UNASSIGNED',
      id: null,
      label: 'Unassigned',
      meta: null,
    };
  }

  if (user.role === 'INSTRUCTOR') {
    return {
      type: 'INSTRUCTOR',
      id: user.id,
      label: `${user.firstName} ${user.lastName}`.trim(),
      meta: {
        employeeId: `INST-${String(user.id).padStart(4, '0')}`,
        email: user.email,
        designation: 'FLIGHT_INSTRUCTOR',
      },
    };
  }

  return {
    type: 'STUDENT',
    id: user.id,
    label: `${user.firstName} ${user.lastName}`.trim(),
    meta: {
      studentId: `STU-${String(user.id).padStart(4, '0')}`,
      email: user.email,
      batch: 'Demo Batch',
    },
  };
}

function mapRecord(row) {
  const holder = mapHolder(row);
  const issueDate = row.issuedOn;
  const expiryDate = row.expiresOn;

  return {
    id: row.id,
    qualificationTypeId: row.qualificationTypeId,
    studentId: holder.type === 'STUDENT' ? row.userId : null,
    instructorId: holder.type === 'INSTRUCTOR' ? row.userId : null,
    issueDate,
    expiryDate,
    certificateNumber: row.qualificationNumber,
    issuingAuthority: row.issuingAuthority,
    notes: row.remarks,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    qualificationType: {
      id: row.qualificationTypeId,
      code: row.typeCode,
      name: row.typeName,
      description: row.typeDescription,
      validityDays: row.typeValidityDays,
      isActive: Boolean(row.typeIsActive),
    },
    status: getRecordStatus(expiryDate),
    holder,
  };
}

async function getUsersByRole(role) {
  return prisma.$queryRaw`
    SELECT id, firstName, lastName, email, role
    FROM users
    WHERE role = ${role} AND isActive = true
    ORDER BY firstName ASC, lastName ASC
  `;
}

async function getTypeValidityDays(qualificationTypeId) {
  const rows = await prisma.$queryRaw`
    SELECT validityDays
    FROM qualification_types
    WHERE id = ${qualificationTypeId}
    LIMIT 1
  `;
  return rows[0]?.validityDays ?? null;
}

async function getLookupPayload() {
  const [types, studentUsers, instructorUsers] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        qt.id,
        qt.code,
        qt.name,
        qt.description,
        qt.validityDays,
        qt.isActive,
        qt.createdAt,
        qt.updatedAt,
        (
          SELECT COUNT(*)
          FROM qualification_records qr
          WHERE qr.qualificationTypeId = qt.id
        ) AS recordCount
      FROM qualification_types qt
      ORDER BY qt.name ASC
    `,
    getUsersByRole('STUDENT'),
    getUsersByRole('INSTRUCTOR'),
  ]);

  return {
    types: types.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      validityDays: row.validityDays,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: { records: Number(row.recordCount || 0) },
    })),
    students: studentUsers.map(mapUserToStudent),
    instructors: instructorUsers.map(mapUserToInstructor),
    warnings: [],
    counts: {
      types: types.length,
      students: studentUsers.length,
      instructors: instructorUsers.length,
    },
  };
}

async function validatePayload(payload, recordId = null) {
  const qualificationTypeId = parseOptionalInt(payload.qualificationTypeId);
  const studentId = parseOptionalInt(payload.studentId);
  const instructorId = parseOptionalInt(payload.instructorId);
  const userId = studentId || instructorId;
  const expectedRole = instructorId ? 'INSTRUCTOR' : 'STUDENT';

  if (!qualificationTypeId) return { error: 'qualificationTypeId is required' };
  if ((studentId && instructorId) || (!studentId && !instructorId)) {
    return { error: 'Exactly one of studentId or instructorId is required' };
  }
  if (!payload.issueDate) return { error: 'issueDate is required' };

  const issueDate = new Date(payload.issueDate);
  if (Number.isNaN(issueDate.getTime())) return { error: 'issueDate must be a valid date' };

  const typeRows = await prisma.$queryRaw`
    SELECT id, validityDays
    FROM qualification_types
    WHERE id = ${qualificationTypeId}
    LIMIT 1
  `;
  const qualificationType = typeRows[0];
  if (!qualificationType) return { error: 'Qualification type not found' };

  let expiryDate = null;
  if (payload.expiryDate) {
    expiryDate = new Date(payload.expiryDate);
    if (Number.isNaN(expiryDate.getTime())) return { error: 'expiryDate must be a valid date' };
  }

  const shouldAutoRecalculateExpiry =
    payload.autoRecalculateExpiry === true ||
    payload.autoRecalculateExpiry === 'true' ||
    (!payload.expiryDate && Number.isInteger(qualificationType.validityDays) && qualificationType.validityDays > 0);

  if (shouldAutoRecalculateExpiry && Number.isInteger(qualificationType.validityDays) && qualificationType.validityDays > 0) {
    expiryDate = addDays(issueDate, qualificationType.validityDays);
  }

  if (expiryDate && expiryDate < issueDate) {
    return { error: 'expiryDate cannot be earlier than issueDate' };
  }

  const users = await prisma.$queryRaw`
    SELECT id, role
    FROM users
    WHERE id = ${userId} AND isActive = true
    LIMIT 1
  `;
  const holder = users[0];
  if (!holder) return { error: `${expectedRole === 'INSTRUCTOR' ? 'Instructor' : 'Student'} not found` };
  if (holder.role !== expectedRole) {
    return { error: `Selected holder is not an ${expectedRole.toLowerCase()}` };
  }

  const certificateNumber = payload.certificateNumber?.trim() || null;
  if (certificateNumber) {
    const duplicates = await prisma.$queryRaw`
      SELECT id
      FROM qualification_records
      WHERE qualificationNumber = ${certificateNumber}
        AND (${recordId === null ? Prisma.sql`1 = 1` : Prisma.sql`id <> ${recordId}`})
      LIMIT 1
    `;
    if (duplicates.length) return { error: 'Certificate number already exists' };
  }

  const recordStatus = getRecordStatus(expiryDate);

  return {
    data: {
      qualificationTypeId,
      userId,
      issueDate,
      expiryDate,
      certificateNumber,
      issuingAuthority: payload.issuingAuthority?.trim() || null,
      notes: payload.notes?.trim() || null,
      recordStatus,
      dbStatus: toLegacyDbStatus(recordStatus),
    },
  };
}

router.get('/lookups', async (_req, res) => {
  try {
    res.json(await getLookupPayload());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        qr.id,
        qr.userId,
        qr.qualificationTypeId,
        qr.qualificationNumber,
        qr.issuedOn,
        qr.expiresOn,
        qr.issuingAuthority,
        qr.status AS recordDbStatus,
        qr.remarks,
        qr.createdAt,
        qr.updatedAt,
        qt.code AS typeCode,
        qt.name AS typeName,
        qt.description AS typeDescription,
        qt.validityDays AS typeValidityDays,
        qt.isActive AS typeIsActive,
        u.firstName,
        u.lastName,
        u.email,
        u.role
      FROM qualification_records qr
      LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
      LEFT JOIN users u ON u.id = qr.userId
      ORDER BY qr.createdAt DESC
    `;

    let records = rows.map(mapRecord);

    const studentId = parseOptionalInt(req.query.studentId);
    const instructorId = parseOptionalInt(req.query.instructorId);
    const qualificationTypeId = parseOptionalInt(req.query.qualificationTypeId);
    const holderType = req.query.holderType;
    const status = req.query.status;
    const search = req.query.search?.trim().toLowerCase();

    if (studentId) records = records.filter((record) => record.studentId === studentId);
    if (instructorId) records = records.filter((record) => record.instructorId === instructorId);
    if (qualificationTypeId) records = records.filter((record) => record.qualificationTypeId === qualificationTypeId);
    if (holderType) records = records.filter((record) => record.holder.type === holderType);
    if (status) records = records.filter((record) => record.status === status);
    if (search) {
      records = records.filter((record) =>
        [
          record.qualificationType?.code,
          record.qualificationType?.name,
          record.certificateNumber,
          record.issuingAuthority,
          record.notes,
          record.holder?.label,
          record.holder?.meta?.studentId,
          record.holder?.meta?.employeeId,
          record.holder?.meta?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search)
      );
    }

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await prisma.$queryRaw`
      SELECT
        qr.id,
        qr.userId,
        qr.qualificationTypeId,
        qr.qualificationNumber,
        qr.issuedOn,
        qr.expiresOn,
        qr.issuingAuthority,
        qr.status AS recordDbStatus,
        qr.remarks,
        qr.createdAt,
        qr.updatedAt,
        qt.code AS typeCode,
        qt.name AS typeName,
        qt.description AS typeDescription,
        qt.validityDays AS typeValidityDays,
        qt.isActive AS typeIsActive,
        u.firstName,
        u.lastName,
        u.email,
        u.role
      FROM qualification_records qr
      LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
      LEFT JOIN users u ON u.id = qr.userId
      WHERE qr.id = ${id}
      LIMIT 1
    `;

    if (!rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json(mapRecord(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const validation = await validatePayload(req.body);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const data = validation.data;
    await prisma.$executeRaw`
      INSERT INTO qualification_records
        (userId, qualificationTypeId, qualificationNumber, issuedOn, expiresOn, issuingAuthority, status, remarks, createdAt, updatedAt)
      VALUES
        (${data.userId}, ${data.qualificationTypeId}, ${data.certificateNumber}, ${data.issueDate}, ${data.expiryDate}, ${data.issuingAuthority}, ${data.dbStatus}, ${data.notes}, NOW(3), NOW(3))
    `;

    const created = await prisma.$queryRaw`SELECT MAX(id) AS id FROM qualification_records`;
    const createdId = created[0]?.id;
    const rows = await prisma.$queryRaw`
      SELECT
        qr.id,
        qr.userId,
        qr.qualificationTypeId,
        qr.qualificationNumber,
        qr.issuedOn,
        qr.expiresOn,
        qr.issuingAuthority,
        qr.status AS recordDbStatus,
        qr.remarks,
        qr.createdAt,
        qr.updatedAt,
        qt.code AS typeCode,
        qt.name AS typeName,
        qt.description AS typeDescription,
        qt.validityDays AS typeValidityDays,
        qt.isActive AS typeIsActive,
        u.firstName,
        u.lastName,
        u.email,
        u.role
      FROM qualification_records qr
      LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
      LEFT JOIN users u ON u.id = qr.userId
      WHERE qr.id = ${createdId}
      LIMIT 1
    `;

    res.status(201).json(mapRecord(rows[0]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRows = await prisma.$queryRaw`
      SELECT *
      FROM qualification_records
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!existingRows.length) return res.status(404).json({ error: 'Record not found' });

    const existing = existingRows[0];
    const currentUserRows = await prisma.$queryRaw`
      SELECT role
      FROM users
      WHERE id = ${existing.userId}
      LIMIT 1
    `;
    const currentRole = currentUserRows[0]?.role;

    const mergedPayload = {
      qualificationTypeId: req.body.qualificationTypeId ?? existing.qualificationTypeId,
      studentId:
        req.body.studentId !== undefined
          ? req.body.studentId
          : currentRole === 'STUDENT'
            ? existing.userId
            : null,
      instructorId:
        req.body.instructorId !== undefined
          ? req.body.instructorId
          : currentRole === 'INSTRUCTOR'
            ? existing.userId
            : null,
      issueDate: req.body.issueDate ?? existing.issuedOn,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : existing.expiresOn,
      certificateNumber: req.body.certificateNumber !== undefined ? req.body.certificateNumber : existing.qualificationNumber,
      issuingAuthority: req.body.issuingAuthority !== undefined ? req.body.issuingAuthority : existing.issuingAuthority,
      notes: req.body.notes !== undefined ? req.body.notes : existing.remarks,
      autoRecalculateExpiry: req.body.autoRecalculateExpiry,
    };

    const validation = await validatePayload(mergedPayload, id);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const data = validation.data;
    await prisma.$executeRaw`
      UPDATE qualification_records
      SET
        userId = ${data.userId},
        qualificationTypeId = ${data.qualificationTypeId},
        qualificationNumber = ${data.certificateNumber},
        issuedOn = ${data.issueDate},
        expiresOn = ${data.expiryDate},
        issuingAuthority = ${data.issuingAuthority},
        status = ${data.dbStatus},
        remarks = ${data.notes},
        updatedAt = NOW(3)
      WHERE id = ${id}
    `;

    const rows = await prisma.$queryRaw`
      SELECT
        qr.id,
        qr.userId,
        qr.qualificationTypeId,
        qr.qualificationNumber,
        qr.issuedOn,
        qr.expiresOn,
        qr.issuingAuthority,
        qr.status AS recordDbStatus,
        qr.remarks,
        qr.createdAt,
        qr.updatedAt,
        qt.code AS typeCode,
        qt.name AS typeName,
        qt.description AS typeDescription,
        qt.validityDays AS typeValidityDays,
        qt.isActive AS typeIsActive,
        u.firstName,
        u.lastName,
        u.email,
        u.role
      FROM qualification_records qr
      LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
      LEFT JOIN users u ON u.id = qr.userId
      WHERE qr.id = ${id}
      LIMIT 1
    `;

    res.json(mapRecord(rows[0]));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await prisma.$executeRaw`
      DELETE FROM qualification_records
      WHERE id = ${id}
    `;
    if (!deleted) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Qualification record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
