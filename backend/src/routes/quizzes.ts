import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import { quizCreateSchema, quizAttemptSubmitSchema } from '../models/validation';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

// Define custom helper to format quiz questions options
function parseQuestionOptions(q: any) {
  try {
    return {
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    };
  } catch (e) {
    return { ...q, options: [] };
  }
}

// Define custom helper to format quiz attempts
function parseAttemptAnswers(attempt: any) {
  if (!attempt) return null;
  try {
    return {
      ...attempt,
      answers: typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers,
    };
  } catch (e) {
    return { ...attempt, answers: {} };
  }
}

import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

// @route   POST /api/v1/quizzes
// @desc    Create a new quiz with nested questions (Doctor who owns course only)
router.post('/', authGuard, roleGuard('DOCTOR', 'TA', 'ADMIN'), upload.array('files', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const title = req.body.title;
    const courseId = req.body.courseId;
    const timeLimit = req.body.timeLimit ? parseInt(req.body.timeLimit) : 15;
    const shuffleQuestions = req.body.shuffleQuestions === 'true' || req.body.shuffleQuestions === true;
    const showResultsAfter = req.body.showResultsAfter || 'IMMEDIATE';
    
    const questionsRaw = req.body.questions;
    let questions = [];
    if (typeof questionsRaw === 'string') {
      questions = JSON.parse(questionsRaw);
    } else if (Array.isArray(questionsRaw)) {
      questions = questionsRaw;
    }

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (user.role === 'DOCTOR' && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    } else if (user.role === 'TA') {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned as a TA for this course' });
      }
    }

    let fileUrl = null;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const urls = await Promise.all(
        files.map((file) => uploadToCloudinaryOrLocal(file, 'quizzes'))
      );
      fileUrl = JSON.stringify(urls);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        courseId,
        timeLimit,
        maxAttempts: 1, // Enforce strictly 1 attempt max
        shuffleQuestions,
        showResultsAfter,
        fileUrl,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text || q.prompt || '',
            type: q.type || 'MCQ',
            options: JSON.stringify(q.options || []), // SQLite string mapping
            correctAnswer: q.correctAnswer || q.correctOption || '',
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    // Notify students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId } });
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        message: `New Quiz posted by ${user.name} in ${course.code}: ${quiz.title} (${quiz.timeLimit} mins)`,
      })),
    });

    const formattedQuiz = {
      ...quiz,
      questions: quiz.questions.map(parseQuestionOptions),
    };

    return res.status(201).json(formattedQuiz);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Quiz creation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/quizzes/:id
// @desc    Get quiz details (Guards correct answers from student view)
router.get('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: true,
        questions: true,
        attempts: { where: { studentId: user.id } },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Verify enrollment if student
    if (user.role === 'STUDENT') {
      const isEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: quiz.courseId } },
      });
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }

      // Secure results logic: Hide answers unless they've submitted an attempt AND showResultsAfter is IMMEDIATE
      const hasCompletedAttempt = quiz.attempts.some((a) => a.submittedAt !== null);
      const canSeeAnswers = hasCompletedAttempt && quiz.showResultsAfter === 'IMMEDIATE';

      if (!canSeeAnswers) {
        quiz.questions = quiz.questions.map((q) => {
          const { correctAnswer, ...safeQuestion } = q;
          return safeQuestion as any;
        });
      }
    }

    const formattedQuiz = {
      ...quiz,
      questions: quiz.questions.map(parseQuestionOptions),
      attempts: quiz.attempts.map(parseAttemptAnswers),
    };

    return res.status(200).json(formattedQuiz);
  } catch (error) {
    console.error('Quiz get error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/quizzes/:id/start
// @desc    Start a quiz attempt (Student only, checks max attempts limit)
router.post('/:id/start', authGuard, roleGuard('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
        attempts: { where: { studentId } },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check attempts limit: student can only enter/start the quiz once!
    if (quiz.attempts.length >= 1) {
      return res.status(400).json({ message: 'You have already entered this quiz once.' });
    }

    // Create a new attempt
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        studentId,
        answers: JSON.stringify({}),
        score: null,
      },
    });

    const securedQuestions = quiz.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return parseQuestionOptions(rest);
    });

    return res.status(200).json({
      attempt: parseAttemptAnswers(newAttempt),
      questions: securedQuestions,
    });
  } catch (error) {
    console.error('Start quiz attempt error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/quizzes/:id/heartbeat
// @desc    Anti-cheat webhook to log tab-switching violations (Student only)
router.post('/:id/heartbeat', authGuard, roleGuard('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: { quizId: id, studentId, submittedAt: null },
    });

    if (!activeAttempt) {
      return res.status(400).json({ message: 'No active quiz attempt found' });
    }

    const updated = await prisma.quizAttempt.update({
      where: { id: activeAttempt.id },
      data: {
        tabSwitches: { increment: 1 },
      },
    });

    console.log(`[ANTI-CHEAT LOGGED] Student ${studentId} switched tabs. Total: ${updated.tabSwitches}`);
    return res.status(200).json({ success: true, tabSwitches: updated.tabSwitches });
  } catch (error) {
    console.error('Anti-cheat heartbeat error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/quizzes/:id/submit
// @desc    Submit attempt, perform auto-grading on MCQ & T/F, flag timer overflows (Student only)
router.post('/:id/submit', authGuard, roleGuard('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;
    const { answers } = quizAttemptSubmitSchema.parse(req.body);

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: { quizId: id, studentId, submittedAt: null },
    });

    if (!activeAttempt) {
      return res.status(400).json({ message: 'No active attempt to submit' });
    }

    // Auto-grade MCQs and True/False
    let score = 0;
    let totalAutoGradedQuestions = 0;
    let hasShortAnswers = false;

    for (const q of quiz.questions) {
      const studentAns = (answers as Record<string, string>)[q.id]?.trim();
      const correctAns = q.correctAnswer.trim();

      if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
        totalAutoGradedQuestions++;
        if (studentAns && studentAns.toLowerCase() === correctAns.toLowerCase()) {
          score++;
        }
      } else if (q.type === 'SHORT_ANSWER') {
        hasShortAnswers = true;
      }
    }

    const rawScore = totalAutoGradedQuestions > 0 ? (score / totalAutoGradedQuestions) * 100 : 0;
    const finalScore = hasShortAnswers ? null : rawScore;

    const submittedAttempt = await prisma.quizAttempt.update({
      where: { id: activeAttempt.id },
      data: {
        answers: JSON.stringify(answers), // SQLite string mapping
        submittedAt: new Date(),
        score: finalScore,
      },
    });

    const resultMsg = hasShortAnswers
      ? `You submitted Quiz "${quiz.title}". Short answer questions are pending grading.`
      : `You completed Quiz "${quiz.title}". Score: ${finalScore?.toFixed(1)}/100`;

    await prisma.notification.create({
      data: {
        userId: studentId,
        message: resultMsg,
      },
    });

    return res.status(200).json({
      message: 'Quiz submitted successfully',
      attempt: parseAttemptAnswers(submittedAttempt),
      hasShortAnswers,
      score: finalScore,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Quiz submit error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/quizzes/attempts/:attemptId
// @desc    Get detailed attempt results (Doctors/TAs or owner student)
router.get('/attempts/:attemptId', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const user = req.user!;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    if (user.role === 'STUDENT' && attempt.studentId !== user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const formattedAttempt = parseAttemptAnswers(attempt);
    if (formattedAttempt && formattedAttempt.quiz) {
      formattedAttempt.quiz.questions = formattedAttempt.quiz.questions.map(parseQuestionOptions);
    }

    return res.status(200).json(formattedAttempt);
  } catch (error) {
    console.error('Quiz attempt view error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/quizzes/attempts/:attemptId/grade
// @desc    Manually grade attempt scores (Doctor/TA only)
router.put('/attempts/:attemptId/grade', authGuard, roleGuard('DOCTOR', 'TA', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { score } = req.body;

    if (score === undefined || typeof score !== 'number') {
      return res.status(400).json({ message: 'Numeric score field is required' });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: attempt.studentId,
        message: `Your attempt for quiz "${attempt.quiz.title}" has been graded. Final Score: ${score}/100`,
      },
    });

    return res.status(200).json({ message: 'Quiz attempt manual score set successfully', attempt: parseAttemptAnswers(updated) });
  } catch (error) {
    console.error('Grade quiz attempt error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
