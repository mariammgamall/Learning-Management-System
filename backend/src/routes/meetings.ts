import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/meetings
// @desc    Get all active meetings for courses associated with current user
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let courseIds: string[] = [];

    if (user.role === Role.ADMIN) {
      const courses = await prisma.course.findMany({ select: { id: true } });
      courseIds = courses.map((c) => c.id);
    } else if (user.role === Role.DOCTOR) {
      const courses = await prisma.course.findMany({
        where: { doctorId: user.id },
        select: { id: true },
      });
      courseIds = courses.map((c) => c.id);
    } else if (user.role === Role.TA) {
      const assigned = await prisma.courseTA.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      });
      courseIds = assigned.map((a) => a.courseId);
    } else if (user.role === Role.STUDENT) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { courseId: true },
      });
      courseIds = enrollments.map((e) => e.courseId);
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        courseId: { in: courseIds },
        isActive: true,
      },
      include: {
        course: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(meetings);
  } catch (error) {
    console.error('Fetch all meetings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/meetings
// @desc    Create a new online meeting (Doctor/TA only)
router.post('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, courseId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ message: 'title and courseId are required' });
    }

    // Role checks
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (user.role === Role.DOCTOR && course.doctorId !== user.id) {
      return res.status(403).json({ message: 'You do not own this course' });
    } else if (user.role === Role.TA) {
      const isAssigned = await prisma.courseTA.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course as a TA' });
      }
    } else if (user.role !== Role.ADMIN && user.role !== Role.DOCTOR && user.role !== Role.TA) {
      return res.status(403).json({ message: 'Unauthorized to host meetings' });
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        courseId,
        hostId: user.id,
        hostName: user.name,
        hostRole: user.role,
        isActive: true,
      },
    });

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId } });
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        message: `${user.name} (${user.role}) has started a live online meeting: "${title}" in course ${course.code}. Join now!`,
      })),
    });

    return res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/meetings/active/:courseId
// @desc    Get active meetings for a specific course
router.get('/active/:courseId', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const meetings = await prisma.meeting.findMany({
      where: {
        courseId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(meetings);
  } catch (error) {
    console.error('Fetch active meetings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/meetings/:id
// @desc    Get meeting details
router.get('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        course: { select: { code: true, title: true } },
      },
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    console.error('Fetch meeting error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/meetings/:id/end
// @desc    End/Close an active meeting (Host or Admin only)
router.post('/:id/end', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId !== user.id && user.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Only the host or admin can end this meeting' });
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({ message: 'Meeting ended successfully', meeting: updated });
  } catch (error) {
    console.error('End meeting error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/meetings/:id/messages
// @desc    Get meeting chat messages
router.get('/:id/messages', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const messages = await prisma.meetingMessage.findMany({
      where: { meetingId: id },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Fetch meeting messages error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/meetings/:id/messages
// @desc    Post a new chat message in meeting
router.post('/:id/messages', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'message content is required' });
    }

    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting || !meeting.isActive) {
      return res.status(400).json({ message: 'Meeting is not active or does not exist' });
    }

    const chatMessage = await prisma.meetingMessage.create({
      data: {
        meetingId: id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: message.trim(),
      },
    });

    return res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Post meeting message error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// In-memory registry to track active call attendees per meeting room
const activeAttendees: Record<string, any[]> = {};

// @route   POST /api/v1/meetings/:id/join
// @desc    Register user as active attendee in the call
router.post('/:id/join', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    if (!activeAttendees[id]) {
      activeAttendees[id] = [];
    }
    
    const exists = activeAttendees[id].some(a => a.id === user.id);
    if (!exists) {
      activeAttendees[id].push({
        id: user.id,
        name: user.name,
        role: user.role,
      });
    }
    
    return res.status(200).json({ success: true, list: activeAttendees[id] });
  } catch (error) {
    console.error('Join meeting attendee error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/meetings/:id/leave
// @desc    Remove user from active attendees list
router.post('/:id/leave', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    if (activeAttendees[id]) {
      activeAttendees[id] = activeAttendees[id].filter(a => a.id !== user.id);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Leave meeting attendee error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/meetings/:id/participants
// @desc    Get active real-time attendees list
router.get('/:id/participants', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const list = activeAttendees[id] || [];
    return res.status(200).json(list);
  } catch (error) {
    console.error('Get meeting participants error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
