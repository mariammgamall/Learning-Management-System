import { z } from 'zod';

export const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(), // Don't enforce complexity on login so existing/older accounts still work, but zod will still check it is a string.
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: strongPassword,
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['ADMIN', 'DOCTOR', 'TA', 'STUDENT']),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: strongPassword,
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['DOCTOR', 'TA', 'STUDENT']),
});

export const courseCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  code: z.string().min(2, 'Course code must be at least 2 characters long'),
  doctorId: z.string().uuid('Invalid Doctor ID'),
  isPublished: z.boolean().optional().default(false),
});

export const lectureCreateSchema = z.object({
  title: z.string().min(2, 'Lecture title must be at least 2 characters long'),
  weekNumber: z.coerce.number().int().min(1, 'Week number must be at least 1'),
  fileType: z.enum(['VIDEO', 'PDF', 'SLIDES', 'OTHER']),
  allowDownload: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
});

export const assignmentCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  deadline: z.string().datetime('Invalid ISO datetime string'),
  maxScore: z.coerce.number().int().min(1, 'Max score must be at least 1').optional().default(100),
});

export const submissionGradeSchema = z.object({
  grade: z.coerce.number().min(0, 'Grade must be at least 0').max(100, 'Grade cannot exceed 100'),
  feedback: z.string().optional(),
});

export const questionSchema = z.object({
  text: z.string().min(2, 'Question text must be at least 2 characters'),
  type: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER']),
  options: z.array(z.string()).default([]),
  correctAnswer: z.string().min(1, 'Correct answer must be provided'),
  points: z.coerce.number().int().min(1).optional().default(1),
});

export const quizCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  timeLimit: z.coerce.number().int().min(1, 'Time limit must be at least 1 minute'),
  maxAttempts: z.coerce.number().int().min(1, 'Max attempts must be at least 1').optional().default(1),
  shuffleQuestions: z.boolean().optional().default(false),
  showResultsAfter: z.enum(['IMMEDIATE', 'AFTER_DEADLINE']).optional().default('IMMEDIATE'),
  questions: z.array(questionSchema).min(1, 'Quiz must have at least 1 question'),
});

export const quizAttemptSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()), // questionId -> answer
});
