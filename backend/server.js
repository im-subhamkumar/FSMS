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
    origin: [
      'http://localhost:5173',           // local dev (host machine)
      'http://frontend:5173',            // docker network alias
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
  })
);

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
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
// Team Module Routers
// ──────────────────────────────────────────
import studentsRouter from './routes/students.js';
import maintenanceRouter from './routes/maintenance.js';
import instructorsRouter from './routes/instructors.js';
import weatherRouter from './routes/weather.js';
import aircraftRouter from './routes/aircraft.js';
import documentsRouter from './routes/documents.js';
import documentCategoriesRouter from './routes/documentCategories.js';

app.use('/api/students', studentsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/instructors', instructorsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/aircraft', aircraftRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/document-categories', documentCategoriesRouter);

// T3 — Invoices & Reports Dashboard
import invoicesRouter from './routes/invoices.js';
import reportsRouter from './routes/reports.js';
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports', reportsRouter);

// T9/T14 — Courses & Pricing Rates (route files exist but were not mounted upstream)
import coursesRouter from './routes/courses.js';
import pricingRatesRouter from './routes/pricingRates.js';
app.use('/api/courses', coursesRouter);
app.use('/api/pricing-rates', pricingRatesRouter);

// 404 handler — catches all unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
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
