import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all documents with optional filters
router.get('/', async (req, res) => {
  try {
    const { studentId, instructorId, aircraftId, categoryId, status } = req.query;
    
    let where = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (instructorId) where.instructorId = parseInt(instructorId);
    if (aircraftId) where.aircraftId = aircraftId;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        category: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        },
        student: { select: { firstName: true, lastName: true } },
        instructor: { select: { firstName: true, lastName: true } },
        aircraft: { select: { name: true, model: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get document history (versions)
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: parseInt(id) },
      orderBy: { version: 'desc' }
    });
    res.json(versions);
  } catch (error) {
    console.error("Error fetching document versions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a new document or a new version of an existing document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { 
      title, categoryId, status, expiryDate, 
      studentId, instructorId, aircraftId, description,
      documentId // If provided, means it's a new version
    } = req.body;

    let doc;
    
    // Convert IDs to int or undefined
    const sId = studentId ? parseInt(studentId) : undefined;
    const iId = instructorId ? parseInt(instructorId) : undefined;
    const aId = aircraftId || undefined;
    const cId = categoryId ? parseInt(categoryId) : undefined;
    
    const fileUrl = `${req.file.filename}`;

    if (documentId) {
      // Adding a new version to existing document
      const parsedDocId = parseInt(documentId);
      const existingDoc = await prisma.document.findUnique({
        where: { id: parsedDocId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
      });
      
      if (!existingDoc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const nextVersion = existingDoc.versions.length > 0 ? existingDoc.versions[0].version + 1 : 1;

      // Update document metadata if provided
      const updateData = {};
      if (title) updateData.title = title;
      if (cId) updateData.categoryId = cId;
      if (status) updateData.status = status;
      if (expiryDate) updateData.expiryDate = new Date(expiryDate);
      if (studentId !== undefined) updateData.studentId = sId;
      if (instructorId !== undefined) updateData.instructorId = iId;
      if (aircraftId !== undefined) updateData.aircraftId = aId;
      
      doc = await prisma.document.update({
        where: { id: parsedDocId },
        data: {
          ...updateData,
          versions: {
            create: {
              version: nextVersion,
              fileUrl,
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              description: description || undefined
            }
          }
        },
        include: {
          category: true,
          versions: { orderBy: { version: 'desc' }, take: 1 }
        }
      });
    } else {
      // Create entirely new document
      if (!title || !cId) {
        return res.status(400).json({ error: 'Title and categoryId are required for a new document' });
      }
      
      doc = await prisma.document.create({
        data: {
          title,
          categoryId: cId,
          status: status || 'ACTIVE',
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          studentId: sId,
          instructorId: iId,
          aircraftId: aId,
          versions: {
            create: {
              version: 1,
              fileUrl,
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              description: description || undefined
            }
          }
        },
        include: {
          category: true,
          versions: { orderBy: { version: 'desc' }, take: 1 }
        }
      });
    }

    res.status(201).json(doc);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
