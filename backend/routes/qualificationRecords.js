import express from 'express';
import { PrismaClient } from '@prisma/client';

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

function mapStudent(student) {
  return {
    id: student.id,
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    batch: student.batch,
  };
}

function mapInstructor(instructor) {
  return {
    id: instructor.id,
    employeeId: instructor.employeeId,
    designation: instructor.designation,
    employmentStatus: instructor.employmentStatus,
    user: {
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
    },
  };
}

function mapHolder(row) {
  if (row.instructorId) {
    return {
      type: 'INSTRUCTOR',
      id: row.instructorId,
      label: `${row.instructorFirstName || ''} ${row.instructorLastName || ''}`.trim(),
      meta: {
        employeeId: row.employeeId,
        email: row.instructorEmail,
        designation: row.designation,
      },
    };
  }

  if (row.studentId) {
    return {
      type: 'STUDENT',
      id: row.studentId,
      label: `${row.studentFirstName || ''} ${row.studentLastName || ''}`.trim(),
      meta: {
        studentId: row.studentCode,
        email: row.studentEmail,
        batch: row.studentBatch,
      },
    };
  }

  return {
    type: 'UNASSIGNED',
    id: null,
    label: 'Unassigned',
    meta: null,
  };
}

function mapRecord(row) {
  const holder = mapHolder(row);

  return {
    id: row.id,
    qualificationTypeId: row.qualificationTypeId,
    studentId: row.studentId,
    instructorId: row.instructorId,
    issueDate: row.issueDate,
    expiryDate: row.expiryDate,
    certificateNumber: row.certificateNumber,
    issuingAuthority: row.issuingAuthority,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    qualificationType: {
      id: row.qualificationTypeId,
      code: row.typeCode,
      name: row.typeName,
      description: row.typeDescription,
      validityDays: null,
      isActive: Boolean(row.typeIsActive),
    },
    status: getRecordStatus(row.expiryDate),
    holder,
  };
}

async function getStudents() {
  const rows = await prisma.$queryRaw`
    SELECT id, studentId, firstName, lastName, email, batch
    FROM students
    ORDER BY firstName ASC, lastName ASC
  `;

  return rows.map(mapStudent);
}

async function getInstructors() {
  const rows = await prisma.$queryRaw`
    SELECT
      i.id,
      i.employeeId,
      i.designation,
      i.employmentStatus,
      u.firstName,
      u.lastName,
      u.email
    FROM instructors i
    JOIN users u ON u.id = i.userId
    WHERE i.isDeleted = false
    ORDER BY u.firstName ASC, u.lastName ASC
  `;

  return rows.map(mapInstructor);
}

async function getLookupPayload() {
  const [types, students, instructors] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        qt.id,
        qt.code,
        qt.name,
        qt.description,
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
    getStudents(),
    getInstructors(),
  ]);

  return {
    types: types.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      validityDays: null,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: { records: Number(row.recordCount || 0) },
    })),
    students,
    instructors,
    warnings: [],
    counts: {
      types: types.length,
      students: students.length,
      instructors: instructors.length,
    },
  };
}

async function validatePayload(payload, recordId = null) {
  const qualificationTypeId = parseOptionalInt(payload.qualificationTypeId);
  const studentId = parseOptionalInt(payload.studentId);
  const instructorId = parseOptionalInt(payload.instructorId);

  if (!qualificationTypeId) return { error: 'qualificationTypeId is required' };
  if ((studentId && instructorId) || (!studentId && !instructorId)) {
    return { error: 'Exactly one of studentId or instructorId is required' };
  }
  if (!payload.issueDate) return { error: 'issueDate is required' };

  const issueDate = new Date(payload.issueDate);
  if (Number.isNaN(issueDate.getTime())) return { error: 'issueDate must be a valid date' };

  const typeRows = await prisma.$queryRaw`
    SELECT id
    FROM qualification_types
    WHERE id = ${qualificationTypeId}
    LIMIT 1
  `;
  if (!typeRows.length) return { error: 'Qualification type not found' };

  let expiryDate = null;
  if (payload.expiryDate) {
    expiryDate = new Date(payload.expiryDate);
    if (Number.isNaN(expiryDate.getTime())) return { error: 'expiryDate must be a valid date' };
  }

  if (expiryDate && expiryDate < issueDate) {
    return { error: 'expiryDate cannot be earlier than issueDate' };
  }

  if (studentId) {
    const studentRows = await prisma.$queryRaw`
      SELECT id
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `;
    if (!studentRows.length) return { error: 'Student not found' };
  }

  if (instructorId) {
    const instructorRows = await prisma.$queryRaw`
      SELECT id
      FROM instructors
      WHERE id = ${instructorId} AND isDeleted = false
      LIMIT 1
    `;
    if (!instructorRows.length) return { error: 'Instructor not found' };
  }

  const certificateNumber = payload.certificateNumber?.trim() || null;
  if (certificateNumber) {
    const duplicateRows = recordId === null
      ? await prisma.$queryRaw`
          SELECT id
          FROM qualification_records
          WHERE certificateNumber = ${certificateNumber}
          LIMIT 1
        `
      : await prisma.$queryRaw`
          SELECT id
          FROM qualification_records
          WHERE certificateNumber = ${certificateNumber}
            AND id <> ${recordId}
          LIMIT 1
        `;

    if (duplicateRows.length) return { error: 'Certificate number already exists' };
  }

  return {
    data: {
      qualificationTypeId,
      studentId,
      instructorId,
      issueDate,
      expiryDate,
      certificateNumber,
      issuingAuthority: payload.issuingAuthority?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
  };
}

async function getRecordById(id) {
  const rows = await prisma.$queryRaw`
    SELECT
      qr.id,
      qr.qualificationTypeId,
      qr.studentId,
      qr.instructorId,
      qr.issueDate,
      qr.expiryDate,
      qr.certificateNumber,
      qr.issuingAuthority,
      qr.notes,
      qr.createdAt,
      qr.updatedAt,
      qt.code AS typeCode,
      qt.name AS typeName,
      qt.description AS typeDescription,
      qt.isActive AS typeIsActive,
      s.studentId AS studentCode,
      s.firstName AS studentFirstName,
      s.lastName AS studentLastName,
      s.email AS studentEmail,
      s.batch AS studentBatch,
      i.employeeId,
      i.designation,
      u.firstName AS instructorFirstName,
      u.lastName AS instructorLastName,
      u.email AS instructorEmail
    FROM qualification_records qr
    LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
    LEFT JOIN students s ON s.id = qr.studentId
    LEFT JOIN instructors i ON i.id = qr.instructorId
    LEFT JOIN users u ON u.id = i.userId
    WHERE qr.id = ${id}
    LIMIT 1
  `;

  return rows[0] || null;
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
        qr.qualificationTypeId,
        qr.studentId,
        qr.instructorId,
        qr.issueDate,
        qr.expiryDate,
        qr.certificateNumber,
        qr.issuingAuthority,
        qr.notes,
        qr.createdAt,
        qr.updatedAt,
        qt.code AS typeCode,
        qt.name AS typeName,
        qt.description AS typeDescription,
        qt.isActive AS typeIsActive,
        s.studentId AS studentCode,
        s.firstName AS studentFirstName,
        s.lastName AS studentLastName,
        s.email AS studentEmail,
        s.batch AS studentBatch,
        i.employeeId,
        i.designation,
        u.firstName AS instructorFirstName,
        u.lastName AS instructorLastName,
        u.email AS instructorEmail
      FROM qualification_records qr
      LEFT JOIN qualification_types qt ON qt.id = qr.qualificationTypeId
      LEFT JOIN students s ON s.id = qr.studentId
      LEFT JOIN instructors i ON i.id = qr.instructorId
      LEFT JOIN users u ON u.id = i.userId
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
    const row = await getRecordById(id);
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(mapRecord(row));
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
        (qualificationTypeId, studentId, instructorId, issueDate, expiryDate, certificateNumber, issuingAuthority, notes, createdAt, updatedAt)
      VALUES
        (${data.qualificationTypeId}, ${data.studentId}, ${data.instructorId}, ${data.issueDate}, ${data.expiryDate}, ${data.certificateNumber}, ${data.issuingAuthority}, ${data.notes}, NOW(3), NOW(3))
    `;

    const created = await prisma.$queryRaw`SELECT MAX(id) AS id FROM qualification_records`;
    const row = await getRecordById(created[0]?.id);
    res.status(201).json(mapRecord(row));
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
    const mergedPayload = {
      qualificationTypeId: req.body.qualificationTypeId ?? existing.qualificationTypeId,
      studentId: req.body.studentId !== undefined ? req.body.studentId : existing.studentId,
      instructorId: req.body.instructorId !== undefined ? req.body.instructorId : existing.instructorId,
      issueDate: req.body.issueDate ?? existing.issueDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : existing.expiryDate,
      certificateNumber: req.body.certificateNumber !== undefined ? req.body.certificateNumber : existing.certificateNumber,
      issuingAuthority: req.body.issuingAuthority !== undefined ? req.body.issuingAuthority : existing.issuingAuthority,
      notes: req.body.notes !== undefined ? req.body.notes : existing.notes,
    };

    const validation = await validatePayload(mergedPayload, id);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const data = validation.data;
    await prisma.$executeRaw`
      UPDATE qualification_records
      SET
        qualificationTypeId = ${data.qualificationTypeId},
        studentId = ${data.studentId},
        instructorId = ${data.instructorId},
        issueDate = ${data.issueDate},
        expiryDate = ${data.expiryDate},
        certificateNumber = ${data.certificateNumber},
        issuingAuthority = ${data.issuingAuthority},
        notes = ${data.notes},
        updatedAt = NOW(3)
      WHERE id = ${id}
    `;

    const row = await getRecordById(id);
    res.json(mapRecord(row));
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
