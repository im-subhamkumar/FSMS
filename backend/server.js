// ============================================================
// FSMS Backend — server.js
// Node.js + Express + Prisma + MySQL
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file
dotenv.config();

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
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

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
// TODO: Mount team module routers below
// ──────────────────────────────────────────
import studentsRouter from './routes/students.js';
import maintenanceRouter from './routes/maintenance.js';

app.use('/api/students', studentsRouter);
app.use('/api/maintenance', maintenanceRouter);

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
