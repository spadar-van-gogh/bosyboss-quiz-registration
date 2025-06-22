import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendTeamConfirmationEmail } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema for team registration
const teamRegistrationSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters').max(50, 'Team name is too long'),
  teamSize: z.number().min(2, 'Team must have at least 2 members').max(10, 'Team size cannot exceed 10 members'),
  captainFirstName: z.string().min(2, 'Captain first name must be at least 2 characters'),
  captainLastName: z.string().min(2, 'Captain last name must be at least 2 characters'),
  captainEmail: z.string().email('Invalid email address'),
  captainPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  experience: z.enum(['BEGINNER', 'EXPERIENCED', 'PROFESSIONAL']).default('BEGINNER'),
  howHeardAbout: z.string().optional(),
  notes: z.string().max(500).optional(),
  quizId: z.string().min(1, 'Quiz ID is required')
});

// POST /api/registrations/team - Create new team registration
router.post('/team', async (req, res) => {
  try {
    const validatedData = teamRegistrationSchema.parse(req.body);
    
    // Check if quiz exists and has available spots
    const quiz = await prisma.quiz.findUnique({
      where: { id: validatedData.quizId },
      include: {
        _count: {
          select: {
            teamRegistrations: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Quiz is not available for registration' });
    }

    if (new Date(quiz.date) < new Date()) {
      return res.status(400).json({ error: 'Cannot register for past quiz' });
    }

    // Check team size limits
    if (validatedData.teamSize < quiz.minTeamSize) {
      return res.status(400).json({ 
        error: `Team size must be at least ${quiz.minTeamSize} members` 
      });
    }

    if (validatedData.teamSize > quiz.maxTeamSize) {
      return res.status(400).json({ 
        error: `Team size cannot exceed ${quiz.maxTeamSize} members` 
      });
    }

    // Check if quiz is full
    const isFull = quiz._count.teamRegistrations >= quiz.maxTeams;
    const registrationStatus = isFull ? 'WAITLIST' : 'CONFIRMED';

    // Create team registration
    const registration = await prisma.teamRegistration.create({
      data: {
        ...validatedData,
        status: registrationStatus
      },
      include: {
        quiz: true
      }
    });

    // Send confirmation email
    // try {
    //   await sendTeamConfirmationEmail(registration);
    // } catch (emailError) {
    //   console.error('Failed to send confirmation email:', emailError);
    // }
      try {
        console.log('Email отправка временно отключена');
        console.log('Регистрация для:', registration.captainEmail);
          // await sendTeamConfirmationEmail(registration);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
          // Don't fail the registration if email fails
    }

    // Update quiz status if it's now full
    if (registrationStatus === 'CONFIRMED' && quiz._count.teamRegistrations + 1 >= quiz.maxTeams) {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: { status: 'FULL' }
      });
    }

    return res.status(201).json({
      message: registrationStatus === 'CONFIRMED' 
        ? 'Team registration successful!' 
        : 'Added to waitlist - we\'ll notify you if a spot opens up',
      registration,
      status: registrationStatus
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    // Handle duplicate team name
    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: 'Team name already exists for this quiz'
      });
    }

    console.error('Error creating team registration:', error);
    return res.status(500).json({ error: 'Failed to create team registration' });
  }
});

// GET /api/registrations/team/:id - Get team registration details
router.get('/team/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.teamRegistration.findUnique({
      where: { id },
      include: {
        quiz: true
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Team registration not found' });
    }

    return res.json(registration);
  } catch (error) {
    console.error('Error fetching team registration:', error);
    return res.status(500).json({ error: 'Failed to fetch team registration' });
  }
});

// PUT /api/registrations/team/:id/cancel - Cancel team registration
router.put('/team/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.teamRegistration.findUnique({
      where: { id },
      include: { quiz: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Team registration not found' });
    }

    if (registration.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Team registration is already cancelled' });
    }

    // Cancel the registration
    await prisma.teamRegistration.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // If quiz was full, update status and promote waitlist
    if (registration.quiz.status === 'FULL' && registration.status === 'CONFIRMED') {
      // Find first waitlisted team
      const waitlistedRegistration = await prisma.teamRegistration.findFirst({
        where: {
          quizId: registration.quizId,
          status: 'WAITLIST'
        },
        include: { quiz: true },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (waitlistedRegistration) {
        // Promote from waitlist
        const promotedRegistration = await prisma.teamRegistration.update({
          where: { id: waitlistedRegistration.id },
          data: { status: 'CONFIRMED' },
          include: { quiz: true }
        });
        
        // Send promotion email
        // try {
        //   await sendTeamConfirmationEmail(promotedRegistration);
        // } catch (emailError) {
        //   console.error('Failed to send promotion email:', emailError);
        // }
        try {
          console.log('Promotion email временно отключен');
            // await sendTeamConfirmationEmail(promotedRegistration);
        } catch (emailError) {
          console.error('Failed to send promotion email:', emailError);
        }

      } else {
        // No one on waitlist, change quiz status back to active
        await prisma.quiz.update({
          where: { id: registration.quizId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    return res.json({ message: 'Team registration cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling team registration:', error);
    return res.status(500).json({ error: 'Failed to cancel team registration' });
  }
});

// GET /api/registrations/check-team/:teamName/:quizId - Check if team name is taken
router.get('/check-team/:teamName/:quizId', async (req, res) => {
  try {
    const { teamName, quizId } = req.params;
    
    const registration = await prisma.teamRegistration.findUnique({
      where: {
        teamName_quizId: {
          teamName,
          quizId
        }
      }
    });

    return res.json({
      isTaken: !!registration,
      status: registration?.status || null
    });
  } catch (error) {
    console.error('Error checking team name:', error);
    return res.status(500).json({ error: 'Failed to check team name' });
  }
});

export default router;