import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // 1. Check for Dummy Admin Credentials
    if (email === 'admin@fsms.com' && password === 'admin') {
      const token = jwt.sign(
        { id: 'admin', role: 'ADMIN', name: 'System Admin' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
      );
      return res.json({
        token,
        user: {
          id: 'admin',
          name: 'System Admin',
          role: 'Admin',
          avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=0284c7&color=fff'
        }
      });
    }

    // 2. Check for Instructor / Staff (User table)
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
      const isPlaintextMatch = password === user.password;
      
      if (!isMatch && !isPlaintextMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
      );

      // For instructors, also fetch their Instructor table ID (used in schedules)
      let instructorDbId = null;
      if (user.role === 'INSTRUCTOR') {
        const instructorRecord = await prisma.instructor.findUnique({ where: { userId: user.id } });
        instructorDbId = instructorRecord?.id ?? null;
      }

      return res.json({
        token,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'STAFF' ? 'Staff' : 'Admin',
          avatar: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0284c7&color=fff`,
          ...(instructorDbId !== null && { instructorDbId })
        }
      });
    }

    // 3. Check for Student (StudentAccount table)
    const studentAccount = await prisma.studentAccount.findUnique({
      where: { schoolEmail: email },
      include: {
        student: true
      }
    });

    if (studentAccount) {
      const isMatch = await bcrypt.compare(password, studentAccount.passwordHash).catch(() => false);
      const isPlaintextMatch = password === studentAccount.passwordHash;

      if (!isMatch && !isPlaintextMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: studentAccount.studentId, 
          role: 'STUDENT', 
          name: `${studentAccount.student.firstName} ${studentAccount.student.lastName}` 
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: studentAccount.studentId,
          name: `${studentAccount.student.firstName} ${studentAccount.student.lastName}`,
          role: 'Student',
          avatar: `https://ui-avatars.com/api/?name=${studentAccount.student.firstName}+${studentAccount.student.lastName}&background=0ea5e9&color=fff`
        }
      });
    }

    // 4. No matching user
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
