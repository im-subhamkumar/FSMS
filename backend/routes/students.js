import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────
// File Upload Setup (multer)
// ──────────────────────────────────────────
const UPLOAD_DIR = path.resolve('uploads/students');
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
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  },
});

/*
---------------------------------------------------
Generate Student ID like FSMS-STU-0001
---------------------------------------------------
*/
async function generateStudentId() {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" }
  });

  if (!lastStudent) {
    return "FSMS-STU-0001";
  }

  // Safely parse — guard against unexpected ID formats
  const parts = lastStudent.studentId?.split("-");
  const lastNumber = parts?.length === 3 ? parseInt(parts[2]) : 0;
  const newNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `FSMS-STU-${String(newNumber).padStart(4, "0")}`;
}

/*
---------------------------------------------------
GET all students
---------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        licenses: true,
        medicals: true
      }
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
---------------------------------------------------
GET single student
---------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        licenses: true,
        medicals: true,
        documents: true,
        account: true
      }
    });

    // Return 404 instead of null body if student not found
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
---------------------------------------------------
CREATE student
---------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      dob,
      gender,
      nationality,
      phone,
      address,
      city,
      state,
      pincode,

      batch,

      licenseNumber,
      licenseType,
      licenseIssueDate,
      licenseExpiryDate,

      medicalCertificateNumber,
      medicalIssueDate,
      medicalExpiryDate,

      schoolEmail,
      passwordHash,

      documents
    } = req.body;

    const studentId = await generateStudentId();

    const result = await prisma.$transaction(async (tx) => {

      const student = await tx.student.create({
        data: {
          studentId,
          firstName,
          lastName,
          email,
          dob: new Date(dob),
          gender,
          nationality,
          phone,
          address,
          city,
          state,
          pincode,
          batch
        }
      });

      await tx.studentLicense.create({
        data: {
          studentId: student.id,
          licenseNumber,
          licenseType,
          issueDate: new Date(licenseIssueDate),
          expiryDate: new Date(licenseExpiryDate)
        }
      });

      await tx.studentMedical.create({
        data: {
          studentId: student.id,
          medicalCertificateNumber,
          issueDate: new Date(medicalIssueDate),
          expiryDate: new Date(medicalExpiryDate)
        }
      });

      await tx.studentAccount.create({
        data: {
          studentId: student.id,
          schoolEmail,
          passwordHash
        }
      });

      if (documents && documents.length > 0) {
        await tx.studentDocument.createMany({
          data: documents.map((doc) => ({
            studentId: student.id,
            documentType: doc.documentType,
            fileUrl: doc.fileUrl
          }))
        });
      }

      return student;
    });

    res.status(201).json(result);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/*
---------------------------------------------------
UPDATE student
---------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const {
      firstName,
      lastName,
      email,
      dob,
      gender,
      nationality,
      phone,
      address,
      city,
      state,
      pincode,

      batch,

      licenseId,
      licenseNumber,
      licenseType,
      licenseIssueDate,
      licenseExpiryDate,

      medicalId,
      medicalCertificateNumber,
      medicalIssueDate,
      medicalExpiryDate,

      accountId,
      schoolEmail,
      passwordHash,
      documents
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {

      // 1️⃣ Update student basic info
      const student = await tx.student.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          dob: new Date(dob),
          gender,
          nationality,
          phone,
          address,
          city,
          state,
          pincode,
          batch
        }
      });

      // 2️⃣ Update license
      if (licenseId) {
        await tx.studentLicense.update({
          where: { id: licenseId },
          data: {
            licenseNumber,
            licenseType,
            issueDate: new Date(licenseIssueDate),
            expiryDate: new Date(licenseExpiryDate)
          }
        });
      }

      // 3️⃣ Update medical certificate
      if (medicalId) {
        await tx.studentMedical.update({
          where: { id: medicalId },
          data: {
            medicalCertificateNumber,
            issueDate: new Date(medicalIssueDate),
            expiryDate: new Date(medicalExpiryDate)
          }
        });
      }

      // 4️⃣ Update account
      if (accountId) {
        await tx.studentAccount.update({
          where: { id: accountId },
          data: {
            schoolEmail,
            passwordHash
          }
        });
      }

      // 5️⃣ Update documents
      if (documents) {
        await tx.studentDocument.deleteMany({ where: { studentId: id } });
        if (documents.length > 0) {
          await tx.studentDocument.createMany({
            data: documents.map((doc) => ({
              studentId: id,
              documentType: doc.documentType,
              fileUrl: doc.fileUrl
            }))
          });
        }
      }

      return student;
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
---------------------------------------------------
DELETE student
---------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    console.log("Deleting student:", id);

    await prisma.$transaction(async (tx) => {
      // Use raw SQL to bypass Prisma transaction concurrency bugs related to foreign keys
      await tx.$executeRaw`DELETE FROM student_documents WHERE studentId = ${id}`;
      await tx.$executeRaw`DELETE FROM student_licenses WHERE studentId = ${id}`;
      await tx.$executeRaw`DELETE FROM student_medicals WHERE studentId = ${id}`;
      await tx.$executeRaw`DELETE FROM student_accounts WHERE studentId = ${id}`;
      await tx.$executeRaw`DELETE FROM students WHERE id = ${id}`;
    });

    res.json({ message: "Student deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// POST /api/students/:id/documents — upload file
// ──────────────────────────────────────────
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { documentType } = req.body;
    const studentId = parseInt(req.params.id);

    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        documentType: documentType || 'General',
        fileUrl: `/uploads/students/${req.file.filename}`,
      },
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────
// DELETE /api/students/:id/documents/:docId
// ──────────────────────────────────────────
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const doc = await prisma.studentDocument.findFirst({
      where: {
        id: parseInt(req.params.docId),
        studentId: parseInt(req.params.id),
      },
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.resolve(`.${doc.fileUrl}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.studentDocument.delete({ where: { id: doc.id } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;