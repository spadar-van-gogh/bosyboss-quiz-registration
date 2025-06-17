import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  duration: z.number().min(30).max(300),
  maxTeams: z.number().min(1).max(50),
  minTeamSize: z.number().min(2).max(10),
  maxTeamSize: z.number().min(2).max(10),
  location: z.string().optional(),
  price: z.number().min(0).default(0)
});

// GET /api/quizzes - Get all active quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        status: 'ACTIVE',
        date: {
          gte: new Date() // Only future quizzes
        }
      },
      include: {
        _count: {
          select: {
            teamRegistrations: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Add availability info
    const quizzesWithAvailability = quizzes.map(quiz => ({
      ...quiz,
      availableSpots: quiz.maxTeams - quiz._count.teamRegistrations,
      isFull: quiz._count.teamRegistrations >= quiz.maxTeams
    }));

    return res.json(quizzesWithAvailability);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// GET /api/quizzes/:id - Get specific quiz with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teamRegistrations: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quizWithAvailability = {
      ...quiz,
      availableSpots: quiz.maxTeams - quiz._count.teamRegistrations,
      isFull: quiz._count.teamRegistrations >= quiz.maxTeams
    };

    return res.json(quizWithAvailability);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// POST /api/quizzes - Create new quiz (admin only)
router.post('/', async (req, res) => {
  try {
    const validatedData = createQuizSchema.parse(req.body);
    
    const quiz = await prisma.quiz.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date)
      }
    });

    return res.status(201).json(quiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating quiz:', error);
    return res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// PUT /api/quizzes/:id - Update quiz (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createQuizSchema.partial().parse(req.body);
    
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.date && { date: new Date(validatedData.date) })
      }
    });

    return res.json(updatedQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error updating quiz:', error);
    return res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// DELETE /api/quizzes/:id - Delete quiz (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.quiz.delete({
      where: { id }
    });

    return res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

export default router;