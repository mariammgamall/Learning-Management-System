import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role, FileType } from '../types';
import { lectureCreateSchema } from '../models/validation';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';
import * as path from 'path';

const prisma = new PrismaClient();
const router = Router();

// @route   POST /api/v1/lectures
// @desc    Upload a lecture (Doctor owns course OR assigned TA can upload supplementary material)
router.post('/', authGuard, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Since we're parsing a multipart form, let's coerce types correctly
    const parsedData = lectureCreateSchema.parse(req.body);
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Role checks
    if (user.role === Role.DOCTOR && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You are not the doctor for this course' });
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course as a TA' });
      }
    } else if (user.role !== Role.ADMIN && user.role !== Role.DOCTOR && user.role !== Role.TA) {
      return res.status(403).json({ message: 'Unauthorized upload' });
    }

    // Upload using our utility
    console.log(`Uploading file ${req.file.originalname} for Course ${course.title}...`);
    const fileUrl = await uploadToCloudinaryOrLocal(req.file, 'lectures');

    const lecture = await prisma.lecture.create({
      data: {
        title: parsedData.title,
        courseId,
        weekNumber: parsedData.weekNumber,
        fileUrl,
        fileType: parsedData.fileType,
        allowDownload: parsedData.allowDownload,
      },
    });

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId } });
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        message: `New lecture uploaded by ${user.name} in ${course.code}: Week ${lecture.weekNumber} - ${lecture.title}`,
      })),
    });

    return res.status(201).json(lecture);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Lecture upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/lectures/:id/watched
// @desc    Toggle lecture watched/completed status (Student only)
router.post('/:id/watched', authGuard, roleGuard(Role.STUDENT), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const lecture = await prisma.lecture.findUnique({ where: { id } });
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const isEnrolled = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: lecture.courseId } },
    });
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const existingWatched = await prisma.watchedLecture.findUnique({
      where: { studentId_lectureId: { studentId, lectureId: id } },
    });

    if (existingWatched) {
      // Toggle off
      await prisma.watchedLecture.delete({
        where: { id: existingWatched.id },
      });
      return res.status(200).json({ watched: false, message: 'Marked as uncompleted' });
    } else {
      // Toggle on
      await prisma.watchedLecture.create({
        data: { studentId, lectureId: id },
      });
      return res.status(200).json({ watched: true, message: 'Marked as completed' });
    }
  } catch (error) {
    console.error('Toggle watched error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/lectures/:id/allow-download
// @desc    Toggle download permission of lecture (Doctor who owns course only)
router.put('/:id/allow-download', authGuard, roleGuard(Role.DOCTOR, Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { allowDownload } = req.body;

    if (allowDownload === undefined) {
      return res.status(400).json({ message: 'allowDownload boolean field is required' });
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (user.role === Role.DOCTOR && lecture.course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    }

    const updated = await prisma.lecture.update({
      where: { id },
      data: { allowDownload },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Toggle allow-download error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/lectures/:id/download
// @desc    Secure download guard. Validates download permission.
router.get('/:id/download', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // If student, check enrollment AND allowDownload status
    if (user.role === Role.STUDENT) {
      const isEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: lecture.courseId } },
      });
      if (!isEnrolled) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      if (!lecture.allowDownload) {
        return res.status(403).json({ message: 'Doctor has disabled downloads for this file' });
      }
    }

    // Return the URL or stream the file if local
    return res.status(200).json({ fileUrl: lecture.fileUrl });
  } catch (error) {
    console.error('Download lecture error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
