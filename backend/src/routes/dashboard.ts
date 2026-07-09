import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/dashboard/stats
// @desc    Get dashboard metrics customized for the current logged-in role
router.get('/stats', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'ADMIN') {
      const [userCount, courseCount, enrollmentCount, doctorCount, taCount, studentCount] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.user.count({ where: { role: Role.DOCTOR } }),
        prisma.user.count({ where: { role: Role.TA } }),
        prisma.user.count({ where: { role: Role.STUDENT } }),
      ]);

      const activeUsers = await prisma.user.count({ where: { isActive: true } });

      return res.status(200).json({
        role: 'ADMIN',
        metrics: {
          totalUsers: userCount,
          totalCourses: courseCount,
          totalEnrollments: enrollmentCount,
          doctors: doctorCount,
          tas: taCount,
          students: studentCount,
          activeUsers,
        },
      });
    }

    if (user.role === 'DOCTOR') {
      const ownCourses = await prisma.course.findMany({
        where: { doctorId: user.id },
        select: { id: true },
      });
      const courseIds = ownCourses.map((c) => c.id);

      const [enrolledCount, lectureCount, assignmentCount, pendingSubmissions, quizCount] = await Promise.all([
        prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
        prisma.lecture.count({ where: { courseId: { in: courseIds } } }),
        prisma.assignment.count({ where: { courseId: { in: courseIds } } }),
        prisma.submission.count({
          where: {
            assignment: { courseId: { in: courseIds } },
            grade: null,
          },
        }),
        prisma.quiz.count({ where: { courseId: { in: courseIds } } }),
      ]);

      return res.status(200).json({
        role: 'DOCTOR',
        metrics: {
          coursesCount: courseIds.length,
          totalEnrolledStudents: enrolledCount,
          lecturesCount: lectureCount,
          assignmentsCount: assignmentCount,
          pendingGrading: pendingSubmissions,
          quizzesCount: quizCount,
        },
      });
    }

    if (user.role === 'TA') {
      const assignedTAs = await prisma.courseTA.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      });
      const courseIds = assignedTAs.map((a) => a.courseId);

      const [enrolledCount, pendingSubmissions, totalLectures] = await Promise.all([
        prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
        prisma.submission.count({
          where: {
            assignment: { courseId: { in: courseIds } },
            grade: null,
          },
        }),
        prisma.lecture.count({ where: { courseId: { in: courseIds } } }),
      ]);

      return res.status(200).json({
        role: 'TA',
        metrics: {
          assignedCourses: courseIds.length,
          totalStudents: enrolledCount,
          pendingGrading: pendingSubmissions,
          lecturesUploaded: totalLectures,
        },
      });
    }

    if (user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);

      const totalCourseLectures = await prisma.lecture.count({
        where: { courseId: { in: courseIds } },
      });

      const watchedLectures = await prisma.watchedLecture.count({
        where: {
          studentId: user.id,
          lecture: { courseId: { in: courseIds } },
        },
      });

      const lectureCompletion = totalCourseLectures > 0 ? Math.round((watchedLectures / totalCourseLectures) * 100) : 0;

      // Calculate average assignment grade
      const submissions = await prisma.submission.findMany({
        where: {
          studentId: user.id,
          grade: { not: null },
        },
        select: { grade: true },
      });
      const avgGrade = submissions.length > 0
        ? submissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.length
        : 0;

      // Calculate average quiz grade
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          studentId: user.id,
          score: { not: null },
        },
        select: { score: true },
      });
      const avgQuizGrade = quizAttempts.length > 0
        ? quizAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizAttempts.length
        : 0;

      const [pendingAssignmentsCount, pendingAssignmentsList, completedQuizzes] = await Promise.all([
        prisma.assignment.count({
          where: {
            courseId: { in: courseIds },
            submissions: { none: { studentId: user.id } },
            deadline: { gt: new Date() },
          },
        }),
        prisma.assignment.findMany({
          where: {
            courseId: { in: courseIds },
            submissions: { none: { studentId: user.id } },
            deadline: { gt: new Date() },
          },
          select: {
            id: true,
            title: true,
            deadline: true,
            course: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
          orderBy: {
            deadline: 'asc',
          },
        }),
        prisma.quizAttempt.count({
          where: {
            studentId: user.id,
            submittedAt: { not: null },
          },
        }),
      ]);

      return res.status(200).json({
        role: Role.STUDENT,
        metrics: {
          enrolledCoursesCount: courseIds.length,
          lectureCompletionPercentage: lectureCompletion,
          averageAssignmentGrade: Math.round(avgGrade * 10) / 10,
          averageQuizGrade: Math.round(avgQuizGrade * 10) / 10,
          pendingAssignmentsCount,
          quizzesTakenCount: completedQuizzes,
        },
        pendingAssignments: pendingAssignmentsList,
      });
    }

    return res.status(400).json({ message: 'Invalid role' });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
