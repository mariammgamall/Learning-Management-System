import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';
import { Role } from '../types';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/support/agents
// @desc    Get all support agents (for ticket assignment)
router.get('/agents', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: 'SUPPORT',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
      },
    });
    return res.status(200).json(agents);
  } catch (error) {
    console.error('Fetch support agents error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/support/tickets
// @desc    Get all support tickets (SUPPORT/ADMIN only)
router.get('/tickets', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { status, priority, category, search, sortBy = 'desc' } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status as string;
    if (priority) whereClause.priority = priority as string;
    if (category) whereClause.category = category as string;

    if (search) {
      const term = (search as string).toLowerCase();
      whereClause.OR = [
        { ticketNumber: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { student: { name: { contains: term, mode: 'insensitive' } } },
        { student: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        assignedTo: { select: { id: true, name: true, email: true, profilePhoto: true } },
      },
      orderBy: { createdAt: sortBy === 'asc' ? 'asc' : 'desc' },
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Fetch support tickets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/support/tickets/my
// @desc    Get current user's submitted support tickets (STUDENTS/DOCTORS/TAs)
router.get('/tickets/my', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const tickets = await prisma.supportTicket.findMany({
      where: { studentId: user.id },
      include: {
        student: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        assignedTo: { select: { id: true, name: true, email: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Fetch my tickets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/support/tickets/:id
// @desc    Get detailed ticket workspace
router.get('/tickets/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            enrollments: { include: { course: { select: { title: true } } } },
            studentTickets: {
              where: { NOT: { id } },
              select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        assignedTo: { select: { id: true, name: true, email: true, profilePhoto: true } },
        messages: {
          where: user.role === 'SUPPORT' || user.role === 'ADMIN' ? {} : { isInternal: false },
          include: {
            sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Permission check
    if (ticket.studentId !== user.id && user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: You cannot view this ticket' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Fetch ticket details error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/support/tickets
// @desc    Submit a support ticket
router.post('/tickets', authGuard, upload.single('attachment'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { subject, description, category = 'Technical Issues', priority = 'Medium' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = await uploadToCloudinaryOrLocal(req.file, 'tickets');
    }

    // Generate a unique ticket number LMS-xxxx
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `LMS-${randNum}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        studentId: user.id,
        subject,
        description,
        category,
        priority,
        attachment: attachmentUrl,
        status: 'Open',
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // Create system notification for support agents
    const agents = await prisma.user.findMany({ where: { role: 'SUPPORT' } });
    for (const agent of agents) {
      await prisma.notification.create({
        data: {
          userId: agent.id,
          message: `New support ticket ${ticketNumber} created by ${user.name}: "${subject}"`,
        },
      });
    }

    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/support/tickets/:id/messages
// @desc    Post message response in ticket workspace
router.post('/tickets/:id/messages', authGuard, upload.single('attachment'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { message, isInternal = 'false' } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Permission check
    if (ticket.studentId !== user.id && user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = await uploadToCloudinaryOrLocal(req.file, 'tickets');
    }

    const internalFlag = isInternal === 'true' && (user.role === 'SUPPORT' || user.role === 'ADMIN');

    const ticketMsg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        message,
        attachment: attachmentUrl,
        isInternal: internalFlag,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
      },
    });

    // Automatically update status based on replier role
    let newStatus = ticket.status;
    if (user.role === 'SUPPORT' || user.role === 'ADMIN') {
      if (!internalFlag) {
        newStatus = 'Waiting for Student';
      }
    } else {
      newStatus = 'Open';
    }

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Notify partner
    const notifyId = user.id === ticket.studentId ? ticket.assignedToId : ticket.studentId;
    if (notifyId && !internalFlag) {
      await prisma.notification.create({
        data: {
          userId: notifyId,
          message: `${user.name} replied to ticket ${ticket.ticketNumber}: "${message.substring(0, 40)}..."`,
        },
      });
    }

    return res.status(201).json(ticketMsg);
  } catch (error) {
    console.error('Post message response error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/support/tickets/:id/status
// @desc    Update ticket status
router.put('/tickets/:id/status', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    // Notify student of status update
    await prisma.notification.create({
      data: {
        userId: ticket.studentId,
        message: `Your support ticket ${ticket.ticketNumber} status has been updated to "${status}"`,
      },
    });

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/support/tickets/:id/priority
// @desc    Update ticket priority
router.put('/tickets/:id/priority', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({ message: 'Priority is required' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { priority, updatedAt: new Date() },
    });

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Update priority error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/support/tickets/:id/assign
// @desc    Assign ticket to support agent
router.put('/tickets/:id/assign', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { id } = req.params;
    const { assignedToId } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { assignedToId, updatedAt: new Date() },
      include: {
        assignedTo: { select: { name: true } },
      },
    });

    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          message: `Ticket ${ticket.ticketNumber} has been assigned to you.`,
        },
      });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Assign ticket error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/support/students
// @desc    Get list of all students (SUPPORT/ADMIN only)
router.get('/students', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { search } = req.query;
    const whereClause: any = { role: 'STUDENT' };

    if (search) {
      const term = (search as string).toLowerCase();
      whereClause.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(students);
  } catch (error) {
    console.error('Fetch student list error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/support/students/:studentId
// @desc    Get detailed student overview for support agent (SUPPORT/ADMIN only)
router.get('/students/:studentId', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents only' });
    }

    const { studentId } = req.params;

    const studentProfile = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        isActive: true,
        enrollments: {
          include: {
            course: {
              select: {
                title: true,
                assignments: { include: { submissions: { where: { studentId } } } },
                quizzes: { include: { attempts: { where: { studentId } } } },
              },
            },
          },
        },
        studentTickets: {
          select: { id: true, ticketNumber: true, subject: true, status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json(studentProfile);
  } catch (error) {
    console.error('Fetch student detailed overview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
