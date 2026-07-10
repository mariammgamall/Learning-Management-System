import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import { courseCreateSchema } from '../models/validation';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/courses
// @desc    Get courses based on user role (Admin: all, Doctor: own, TA: assigned, Student: enrolled or all catalog if ?catalog=true)
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const catalog = req.query.catalog === 'true';

    if (user.role === Role.ADMIN) {
      const courses = await prisma.course.findMany({
        include: {
          doctor: { select: { id: true, name: true, email: true } },
          tas: { include: { ta: { select: { id: true, name: true } } } },
          _count: { select: { enrollments: true, lectures: true } },
        },
      });
      return res.status(200).json(courses);
    }

    if (user.role === Role.DOCTOR) {
      const courses = await prisma.course.findMany({
        where: { doctorId: user.id },
        include: {
          tas: { include: { ta: { select: { id: true, name: true } } } },
          _count: { select: { enrollments: true, lectures: true } },
        },
      });
      return res.status(200).json(courses);
    }

    if (user.role === Role.TA) {
      const courses = await prisma.course.findMany({
        where: {
          tas: { some: { userId: user.id } },
        },
        include: {
          doctor: { select: { id: true, name: true } },
          tas: { include: { ta: { select: { id: true, name: true } } } },
          _count: { select: { enrollments: true, lectures: true } },
        },
      });
      return res.status(200).json(courses);
    }

    if (user.role === Role.STUDENT) {
      if (catalog) {
        // Return published courses student is NOT currently enrolled in
        const enrolledCourses = await prisma.enrollment.findMany({
          where: { studentId: user.id },
          select: { courseId: true },
        });
        const enrolledIds = enrolledCourses.map((e) => e.courseId);

        const courses = await prisma.course.findMany({
          where: {
            isPublished: true,
            id: { notIn: enrolledIds },
          },
          include: {
            doctor: { select: { id: true, name: true } },
            _count: { select: { lectures: true } },
          },
        });
        return res.status(200).json(courses);
      } else {
        // Return courses student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: user.id },
          include: {
            course: {
              include: {
                doctor: { select: { id: true, name: true } },
                _count: { select: { lectures: true } },
              },
            },
          },
        });
        return res.status(200).json(enrollments.map((e) => e.course));
      }
    }

    return res.status(400).json({ message: 'Invalid role' });
  } catch (error) {
    console.error('Fetch courses error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/courses/:id
// @desc    Get detailed course content
router.get('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check permissions
    let restrictContent = false;
    if (user.role === Role.STUDENT) {
      const isEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: id } },
      });
      if (!isEnrolled) {
        restrictContent = true;
      }
    } else if (user.role === Role.TA) {
      const isTaAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId: id, userId: user.id } },
      });
      if (!isTaAssigned) {
        return res.status(403).json({ message: 'Not assigned to this course' });
      }
    } else if (user.role === Role.DOCTOR) {
      const course = await prisma.course.findUnique({ where: { id } });
      if (course?.doctorId !== user.id) {
        return res.status(403).json({ message: 'Not owner of this course' });
      }
    }

    if (restrictContent) {
      // Return metadata only for purchase preview
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true, email: true } },
          tas: { include: { ta: { select: { id: true, name: true, email: true } } } },
        },
      });
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(200).json({
        ...course,
        lectures: [],
        assignments: [],
        quizzes: [],
      });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        tas: { include: { ta: { select: { id: true, name: true, email: true } } } },
        announcements: {
          orderBy: { createdAt: 'desc' },
          include: {
            publisher: { select: { id: true, name: true, role: true } },
            comments: {
              where: { parentId: null },
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, name: true, role: true, profilePhoto: true } },
                replies: {
                  orderBy: { createdAt: 'asc' },
                  include: {
                    user: { select: { id: true, name: true, role: true, profilePhoto: true } }
                  }
                }
              }
            }
          }
        },
        lectures: {
          orderBy: [{ weekNumber: 'asc' }, { createdAt: 'asc' }],
          include: {
            watchedBy: {
              where: { studentId: user.id },
            },
            publisher: { select: { id: true, name: true, role: true } },
            comments: {
              where: { parentId: null },
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, name: true, role: true, profilePhoto: true } },
                replies: {
                  orderBy: { createdAt: 'asc' },
                  include: {
                    user: { select: { id: true, name: true, role: true, profilePhoto: true } }
                  }
                }
              }
            }
          },
        },
        assignments: {
          orderBy: { deadline: 'asc' },
          include: {
            submissions: user.role === Role.STUDENT
              ? {
                  where: { studentId: user.id },
                }
              : {
                  include: {
                    student: { select: { id: true, name: true, email: true } },
                  },
                },
          },
        },
        quizzes: {
          orderBy: { createdAt: 'asc' },
          include: {
            questions: true,
            attempts: user.role === Role.STUDENT
              ? {
                  where: { studentId: user.id },
                }
              : {
                  include: {
                    student: { select: { id: true, name: true, email: true } },
                  },
                },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Filter private comments for students
    if (user.role === Role.STUDENT) {
      if (course.announcements) {
        course.announcements.forEach((ann: any) => {
          if (ann.comments) {
            ann.comments = ann.comments.filter((c: any) => {
              return !c.isPrivate || c.userId === user.id;
            });
          }
        });
      }
      if (course.lectures) {
        course.lectures.forEach((lec: any) => {
          if (lec.comments) {
            lec.comments = lec.comments.filter((c: any) => {
              return !c.isPrivate || c.userId === user.id;
            });
          }
        });
      }
    }

    if (course.quizzes) {
      course.quizzes.forEach((quiz: any) => {
        if (quiz.questions) {
          quiz.questions = quiz.questions.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          }));
        }
        if (quiz.attempts) {
          quiz.attempts = quiz.attempts.map((att: any) => {
            let parsedAnswers = {};
            try {
              parsedAnswers = typeof att.answers === 'string' ? JSON.parse(att.answers) : att.answers;
            } catch (e) {
              parsedAnswers = {};
            }
            return {
              ...att,
              answers: parsedAnswers,
            };
          });
        }
      });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error('Fetch course details error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses
// @desc    Create a new course (Admin only)
router.post('/', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = courseCreateSchema.parse(req.body);

    const isDoctor = await prisma.user.findUnique({
      where: { id: body.doctorId, role: Role.DOCTOR },
    });

    if (!isDoctor) {
      return res.status(400).json({ message: 'The assigned doctorId does not belong to a valid DOCTOR user' });
    }

    const existingCode = await prisma.course.findUnique({
      where: { code: body.code },
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Course code is already in use' });
    }

    const newCourse = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        code: body.code,
        doctorId: body.doctorId,
        isPublished: body.isPublished,
      },
      include: {
        doctor: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(newCourse);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Create course error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/courses/:id
// @desc    Update course content (Admin or Owner Doctor only)
router.put('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { title, description, isPublished, doctorId } = req.body;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Role checks
    if (user.role === Role.DOCTOR && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You can only update your own courses' });
    } else if (user.role !== Role.ADMIN && user.role !== Role.DOCTOR) {
      return res.status(403).json({ message: 'Unauthorized course modify' });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: title !== undefined ? title : course.title,
        description: description !== undefined ? description : course.description,
        isPublished: isPublished !== undefined ? isPublished : course.isPublished,
        doctorId: (user.role === Role.ADMIN && doctorId) ? doctorId : course.doctorId,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/v1/courses/:id
// @desc    Delete a course (Admin only)
router.delete('/:id', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/:id/enroll
// @desc    Enroll in a course (Student only)
router.post('/:id/enroll', authGuard, roleGuard(Role.STUDENT), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentToken } = req.body;
    const studentId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: 'Active course not found for enrollment' });
    }

    // Payment Gateway Check
    if (course.isPaid && paymentToken !== 'DEMO_PAYMENT_SUCCESS') {
      return res.status(402).json({
        message: 'Payment required for this course',
        requiresCheckout: true,
        price: course.price,
      });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId: id } },
      update: {},
      create: { studentId, courseId: id },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        message: `Successfully enrolled in ${course.code}: ${course.title}`,
      },
    });

    return res.status(200).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    console.error('Enroll course error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/:id/assign-ta
// @desc    Assign a TA to a course (Admin only)
router.post('/:id/assign-ta', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { taId } = req.body;

    if (!taId) {
      return res.status(400).json({ message: 'taId is required' });
    }

    const taUser = await prisma.user.findUnique({ where: { id: taId, role: Role.TA } });
    if (!taUser) {
      return res.status(400).json({ message: 'Provided taId does not belong to a valid TA' });
    }

    const courseTA = await prisma.courseTA.create({
      data: { courseId: id, userId: taId },
    });

    return res.status(200).json({ message: 'TA assigned successfully', courseTA });
  } catch (error) {
    console.error('Assign TA error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/courses/:id/students
// @desc    List enrolled students + their progress (watched lectures count vs total) (Admin/Doctor/TA only)
router.get('/:id/students', authGuard, roleGuard(Role.ADMIN, Role.DOCTOR, Role.TA), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get all students enrolled
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            watched: {
              where: { lecture: { courseId: id } },
            },
          },
        },
      },
    });

    const totalLectures = await prisma.lecture.count({ where: { courseId: id } });

    const studentProgress = enrollments.map((e) => {
      const watchedCount = e.student.watched.length;
      const progressPercent = totalLectures > 0 ? Math.round((watchedCount / totalLectures) * 100) : 0;
      return {
        id: e.student.id,
        name: e.student.name,
        email: e.student.email,
        watchedCount,
        totalLectures,
        progressPercent,
      };
    });

    return res.status(200).json(studentProgress);
  } catch (error) {
    console.error('Fetch student progress error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/courses/:id/attendance
// @desc    Get attendance status for all enrolled students on a specific date (Admin/Doctor/TA only)
router.get('/:id/attendance', authGuard, roleGuard(Role.ADMIN, Role.DOCTOR, Role.TA), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query parameter is required (YYYY-MM-DD)' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId: id,
        date: String(date),
      },
    });

    const recordsMap = new Map(attendanceRecords.map((r) => [r.studentId, r.status]));

    const result = enrollments.map((e) => ({
      studentId: e.student.id,
      name: e.student.name,
      email: e.student.email,
      status: recordsMap.get(e.student.id) || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/:id/attendance
// @desc    Save/update attendance records for a specific date (Admin/Doctor/TA only)
router.post('/:id/attendance', authGuard, roleGuard(Role.ADMIN, Role.DOCTOR, Role.TA), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'date and records array are required' });
    }

    const promises = records.map((record: any) =>
      prisma.attendance.upsert({
        where: {
          courseId_studentId_date: {
            courseId: id,
            studentId: record.studentId,
            date: String(date),
          },
        },
        update: {
          status: record.status,
        },
        create: {
          courseId: id,
          studentId: record.studentId,
          date: String(date),
          status: record.status,
        },
      })
    );

    await Promise.all(promises);

    return res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Save attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/courses/:id/my-attendance
// @desc    Get the student's own attendance records for a course
router.get('/:id/my-attendance', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    // Check if enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: id },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId: id,
        studentId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error('Fetch my-attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/attendance/session
// @desc    Generate code-based attendance check-in session (Doctor/TA only)
router.post('/attendance/session', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { courseId, date } = req.body;

    if (!courseId || !date) {
      return res.status(400).json({ message: 'Course ID and date are required' });
    }

    // Verify user is associated with course as Doctor or TA
    if (user.role === Role.DOCTOR) {
      const course = await prisma.course.findFirst({ where: { id: courseId, doctorId: user.id } });
      if (!course) return res.status(403).json({ message: 'Forbidden' });
    } else if (user.role === Role.TA) {
      const taCourse = await prisma.courseTA.findFirst({ where: { courseId, userId: user.id } });
      if (!taCourse) return res.status(403).json({ message: 'Forbidden' });
    } else if (user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Deactivate previous sessions for same date and course
    await prisma.attendanceSession.updateMany({
      where: { courseId, date, isActive: true },
      data: { isActive: false },
    });

    // Generate random 6-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const session = await prisma.attendanceSession.create({
      data: {
        courseId,
        date,
        code,
        isActive: true,
      },
    });

    return res.status(200).json(session);
  } catch (error) {
    console.error('Create attendance session error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/attendance/checkin
// @desc    Check-in attendance using a code (Student only)
router.post('/attendance/checkin', authGuard, roleGuard(Role.STUDENT), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Check-in code is required' });
    }

    // Find active session
    const session = await prisma.attendanceSession.findFirst({
      where: { code: code.trim().toUpperCase(), isActive: true },
      include: { course: true },
    });

    if (!session) {
      return res.status(400).json({ message: 'Invalid or expired check-in code' });
    }

    // Verify student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: session.courseId } },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check if record exists for this date, course and student
    const existing = await prisma.attendance.findFirst({
      where: {
        courseId: session.courseId,
        studentId,
        date: session.date,
      },
    });

    let record;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: 'PRESENT' },
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          courseId: session.courseId,
          studentId,
          date: session.date,
          status: 'PRESENT',
        },
      });
    }

    return res.status(200).json({
      message: `Checked in successfully for ${session.course.code}: ${session.course.title}`,
      record,
    });
  } catch (error) {
    console.error('Attendance check-in error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/:id/announcements
// @desc    Post an announcement (Admin, Doctor, or TA only)
router.post('/:id/announcements', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Role checks
    if (user.role === Role.DOCTOR && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'Not authorized for this course' });
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId: id, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course as a TA' });
      }
    } else if (user.role !== Role.ADMIN && user.role !== Role.DOCTOR && user.role !== Role.TA) {
      return res.status(403).json({ message: 'Unauthorized announcement post' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        courseId: id,
        content,
        publisherId: user.id,
      },
      include: {
        publisher: { select: { id: true, name: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, profilePhoto: true } }
          }
        }
      }
    });

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: id } });
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        message: `New Announcement in ${course.code} by ${user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      })),
    });

    return res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/courses/:id/comments
// @desc    Add a comment to an announcement or a lecture (All active course users)
router.post('/:id/comments', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { content, lectureId, announcementId, isPrivate, parentId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (!lectureId && !announcementId) {
      return res.status(400).json({ message: 'lectureId or announcementId must be specified' });
    }

    // Verify course permissions
    if (user.role === Role.STUDENT) {
      const isEnrolled = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: id } },
      });
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId: id, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    } else if (user.role === Role.DOCTOR) {
      const course = await prisma.course.findUnique({ where: { id } });
      if (course?.doctorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized for this course' });
      }
    }

    let resolvedIsPrivate = !!isPrivate;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });
      if (parentComment && parentComment.isPrivate) {
        resolvedIsPrivate = true;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        lectureId: lectureId || undefined,
        announcementId: announcementId || undefined,
        isPrivate: resolvedIsPrivate,
        parentId: parentId || undefined,
      },
      include: {
        user: { select: { id: true, name: true, role: true, profilePhoto: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true, profilePhoto: true } }
          }
        }
      }
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
