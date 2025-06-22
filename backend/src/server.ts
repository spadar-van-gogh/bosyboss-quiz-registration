import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import quizRoutes from './routes/quizzes';
import registrationRoutes from './routes/registrations';  
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT || 8080;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://127.0.0.1:3000',
//       'https://bosyboss-quiz-registration.vercel.app'
//     ];
    
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
    
//     callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
//   optionsSuccessStatus: 200
// }));
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Разрешаем запросы без origin (например, мобильные приложения, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://bosyboss-quiz-registration.vercel.app', // ваш точный Vercel URL
      'https://bosyboss-quiz-registration-production.up.railway.app', // ваш Railway URL
      process.env.FRONTEND_URL, // из переменных окружения
    ].filter(Boolean); // убираем undefined значения
    
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('CORS: Origin blocked');
      // В development разрешаем все, в production блокируем
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Временное решение для отладки CORS
app.use((req, res, next) => {
  if (process.env.DEBUG_CORS) {
    console.log('DEBUG_CORS активен, разрешаем все origins');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'You are already registered for this quiz'
    });
  }
  
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});