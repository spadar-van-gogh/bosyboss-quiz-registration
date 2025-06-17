import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Middleware to verify JWT token
const authenticateAdmin = async (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId, isActive: true }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { email, isActive: true }
    });

    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/dashboard - Dashboard stats
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const totalQuizzes = await prisma.quiz.count();
    const activeQuizzes = await prisma.quiz.count({
      where: { status: 'ACTIVE' }
    });
    const totalTeamRegistrations = await prisma.teamRegistration.count();
    const confirmedTeamRegistrations = await prisma.teamRegistration.count({
      where: { status: 'CONFIRMED' }
    });

    // Recent team registrations
    const recentTeamRegistrations = await prisma.teamRegistration.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        quiz: {
          select: { title: true, date: true }
        }
      }
    });

    // Quiz stats
    const quizStats = await prisma.quiz.findMany({
      include: {
        _count: {
          select: {
            teamRegistrations: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    return res.json({
      stats: {
        totalQuizzes,
        activeQuizzes,
        totalTeamRegistrations,
        confirmedTeamRegistrations
      },
      recentTeamRegistrations,
      quizStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// GET /api/admin/registrations - Get all team registrations with filters
router.get('/registrations', authenticateAdmin, async (req, res) => {
  try {
    const { quizId, status, page = '1', limit = '50' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (quizId) where.quizId = quizId;
    if (status) where.status = status;

    const teamRegistrations = await prisma.teamRegistration.findMany({
      where,
      include: {
        quiz: {
          select: { title: true, date: true, startTime: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    const total = await prisma.teamRegistration.count({ where });

    return res.json({
      teamRegistrations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching team registrations:', error);
    return res.status(500).json({ error: 'Failed to fetch team registrations' });
  }
});

// GET /api/admin/export/:quizId - Export team registrations to CSV
router.get('/export/:quizId', authenticateAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        teamRegistrations: {
          where: { status: 'CONFIRMED' },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Generate CSV for team registrations
    const headers = ['Название команды', 'Размер команды', 'Имя капитана', 'Фамилия капитана', 'Email', 'Телефон', 'Опыт', 'Дата регистрации'];
    const csvData = [
      headers.join(','),
      ...quiz.teamRegistrations.map(reg => [
        reg.teamName,
        reg.teamSize,
        reg.captainFirstName,
        reg.captainLastName,
        reg.captainEmail,
        reg.captainPhone,
        reg.experience,
        new Date(reg.createdAt).toLocaleDateString('ru-RU')
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}_team_registrations.csv"`);
    return res.send('\uFEFF' + csvData); // BOM for proper UTF-8 encoding
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
});

// PUT /api/admin/registrations/:id/status - Update team registration status
router.put('/registrations/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED', 'WAITLIST'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const registration = await prisma.teamRegistration.update({
      where: { id },
      data: { status },
      include: { quiz: true }
    });

    return res.json(registration);
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;