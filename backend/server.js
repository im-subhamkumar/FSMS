// ============================================================
// FSMS Backend — server.js
// Node.js + Express + Prisma + MySQL
// ============================================================

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────

// CORS — allow requests from the Vite frontend
app.use(
  cors({
    origin: '*', // For development, allow all origins to prevent CORS blocks
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
  })
);

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────
// Routes
// ──────────────────────────────────────────

// Health check — teams can use this to verify the API is up
app.get('/api/health', async (req, res) => {
  try {
    // Ping the database to verify connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      message: 'FSMS API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FSMS API',
    version: '1.0.0',
    docs: 'GET /api/health to check service status',
  });
});

// ──────────────────────────────────────────
// Mount team module routers below
// ──────────────────────────────────────────
// Team Module Routers
// ──────────────────────────────────────────
import studentsRouter from './routes/students.js';
import maintenanceRouter from './routes/maintenance.js';
import instructorsRouter from './routes/instructors.js';
import weatherRouter from './routes/weather.js';
import aircraftRouter from './routes/aircraft.js';
import schedulesRouter from './routes/schedules.js';
import documentsRouter from './routes/documents.js';
import documentCategoriesRouter from './routes/documentCategories.js';
import coursesRouter from './routes/courses.js';
import pricingRatesRouter from './routes/pricingRates.js';
import qualificationTypesRouter from './routes/qualificationTypes.js';
import qualificationRecordsRouter from './routes/qualificationRecords.js';
import slotsRouter from './routes/slots.js';
import slotRequestsRouter from './routes/slotRequests.js';

app.use('/api/students', studentsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/instructors', instructorsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/planes', aircraftRouter);
app.use('/api/aircraft', aircraftRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/document-categories', documentCategoriesRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/pricing-rates', pricingRatesRouter);
app.use('/api/qualification-types', qualificationTypesRouter);
app.use('/api/qualification-records', qualificationRecordsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/slot-requests', slotRequestsRouter);

// T3 — Invoices Module
import invoicesRouter from './routes/invoices.js';
app.use('/api/invoices', invoicesRouter);

// T3 — Report Dashboard Module
import reportRoutes from './routes/reportRoutes.js';
app.use('/api/reports', reportRoutes);

// 404 handler — catches all unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ──────────────────────────────────────────
// Start server
// ──────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FSMS API running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown — close Prisma connection on exit
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
