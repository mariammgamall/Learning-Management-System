import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routers
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import coursesRouter from './routes/courses';
import lecturesRouter from './routes/lectures';
import assignmentsRouter from './routes/assignments';
import quizzesRouter from './routes/quizzes';
import dashboardRouter from './routes/dashboard';
import notificationsRouter from './routes/notifications';
import meetingsRouter from './routes/meetings';
import postsRouter from './routes/posts';
import emailsRouter from './routes/emails';
import supportRouter from './routes/support';
import kbRouter from './routes/kb';
import workspaceRouter from './routes/workspace';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup supporting credentialed cookie requests from frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    console.warn('[Server Startup] Warning: Could not create local uploads folder (read-only filesystem):', error);
  }
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/lectures', lecturesRouter);
app.use('/api/v1/assignments', assignmentsRouter);
app.use('/api/v1/quizzes', quizzesRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/meetings', meetingsRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/emails', emailsRouter);
app.use('/api/v1/support', supportRouter);
app.use('/api/v1/kb', kbRouter);
app.use('/api/v1/workspace', workspaceRouter);

// Health Check Endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 LMS EXPRESS SERVER RUNNING ON PORT ${PORT}`);
  console.log(`👉 API Prefix: http://localhost:${PORT}/api/v1`);
  console.log(`==================================================`);
});

export default app;
