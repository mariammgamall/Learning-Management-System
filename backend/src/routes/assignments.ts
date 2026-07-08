import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import { assignmentCreateSchema, submissionGradeSchema } from '../models/validation';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { submissionUpload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

const prisma = new PrismaClient();
const router = Router();

import { upload } from '../middlewares/upload';

// @route   POST /api/v1/assignments
// @desc    Create a new assignment (Doctor who owns course only)
router.post('/', authGuard, roleGuard(Role.DOCTOR, Role.ADMIN), upload.array('files', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description, deadline, courseId } = req.body;
    const maxScore = req.body.maxScore ? parseInt(req.body.maxScore) : 100;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (user.role === Role.DOCTOR && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    }

    let fileUrl = null;
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const urls = await Promise.all(
        files.map((file) => uploadToCloudinaryOrLocal(file, 'assignments'))
      );
      fileUrl = JSON.stringify(urls);
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId,
        deadline: new Date(deadline),
        maxScore,
        fileUrl,
      },
    });

    // Notify students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId } });
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        message: `New Assignment posted by ${user.name} in ${course.code}: ${assignment.title} (Due: ${assignment.deadline.toLocaleDateString()})`,
      })),
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Assignment create error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/assignments/:id/submit
// @desc    Submit assignment (Student only, flags LATE if deadline passed, max 20MB)
router.post('/:id/submit', authGuard, roleGuard(Role.STUDENT), submissionUpload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check enrollment
    const isEnrolled = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const isLate = new Date() > assignment.deadline;

    console.log(`Uploading assignment file for student ${studentId}...`);
    const fileUrl = await uploadToCloudinaryOrLocal(req.file, 'submissions');

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId: id, studentId } },
      update: {
        fileUrl,
        submittedAt: new Date(),
        isLate,
        grade: null, // Reset grade on resubmit
        feedback: null,
        gradedBy: null,
        isTaGraded: false,
        taGradeReview: false,
      },
      create: {
        assignmentId: id,
        studentId,
        fileUrl,
        isLate,
      },
    });

    return res.status(200).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/assignments/:id/submissions
// @desc    Get all submissions for an assignment (Doctor/TA only)
router.get('/:id/submissions', authGuard, roleGuard(Role.DOCTOR, Role.TA, Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Auth validation
    if (user.role === Role.DOCTOR && assignment.course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId: assignment.courseId, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned as a TA' });
      }
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/assignments/submissions/:submissionId/grade
// @desc    Grade submission (TA grades flag as TA-graded, Doctor grades resolve)
router.put('/submissions/:submissionId/grade', authGuard, roleGuard(Role.DOCTOR, Role.TA, Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const user = req.user!;
    const body = submissionGradeSchema.parse(req.body);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Role checks
    const courseId = submission.assignment.courseId;
    if (user.role === Role.DOCTOR && submission.assignment.course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned as a TA' });
      }
    }

    const isTaGraded = user.role === Role.TA;

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: body.grade,
        feedback: body.feedback || '',
        gradedBy: user.id,
        isTaGraded,
        taGradeReview: !isTaGraded, // True if graded directly by Doctor (doesn't need review), False if TA (awaits Doctor approval)
      },
    });

    // Notify student (only if graded by doctor or admin directly, TAs wait for doctor approval)
    if (!isTaGraded) {
      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          message: `Your submission for "${submission.assignment.title}" has been graded: ${body.grade}/${submission.assignment.maxScore}`,
        },
      });
    }

    return res.status(200).json({ message: 'Graded successfully', submission: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Grading error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/assignments/submissions/:submissionId/approve-ta-grade
// @desc    Approve/Confirm a TA-graded submission (Doctor only)
router.post('/submissions/:submissionId/approve-ta-grade', authGuard, roleGuard(Role.DOCTOR, Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const user = req.user!;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (user.role === Role.DOCTOR && submission.assignment.course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    }

    const approved = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        taGradeReview: true, // Grade is now officially approved by Doctor
      },
    });

    // Notify student that the TA-graded assignment is approved and released
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        message: `Your TA grade for "${submission.assignment.title}" has been approved: ${approved.grade}/${submission.assignment.maxScore}`,
      },
    });

    return res.status(200).json({ message: 'TA grade approved successfully', submission: approved });
  } catch (error) {
    console.error('Approve TA grade error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
