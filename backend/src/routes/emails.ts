import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';
import { Role } from '../types';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/emails
// @desc    Get emails based on type (inbox, sent, support)
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const type = req.query.type as string || 'inbox';

    let emails;
    if (type === 'support') {
      // Check if user has permission to see support tickets (SUPPORT or ADMIN roles)
      if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied: Support tickets only available to support agents or admins' });
      }
      emails = await prisma.email.findMany({
        where: {
          isSupport: true,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
          receiver: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'sent') {
      emails = await prisma.email.findMany({
        where: {
          senderId: user.id,
          isSupport: false,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
          receiver: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // default: inbox
      emails = await prisma.email.findMany({
        where: {
          receiverId: user.id,
          isSupport: false,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
          receiver: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.status(200).json(emails);
  } catch (error) {
    console.error('Fetch emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/emails/support
// @desc    Submit a support ticket to help centre
router.post('/support', authGuard, upload.single('attachment'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = await uploadToCloudinaryOrLocal(req.file, 'emails');
    }

    // Find a support user account
    let supportUser = await prisma.user.findFirst({
      where: { role: 'SUPPORT' },
    });

    // Fallback: if no support account exists, assign to system admin
    if (!supportUser) {
      supportUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
    }

    // Fallback 2: if still no user, assign to self
    const receiverId = supportUser ? supportUser.id : user.id;

    const email = await prisma.email.create({
      data: {
        senderId: user.id,
        receiverId,
        subject,
        message,
        attachment: attachmentUrl,
        isSupport: true,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        receiver: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
      },
    });

    return res.status(201).json({
      message: 'Support request sent successfully',
      email,
    });
  } catch (error) {
    console.error('Create support email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/emails
// @desc    Send a normal internal email to another user
router.post('/', authGuard, upload.single('attachment'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { receiverId, subject, message } = req.body;

    if (!receiverId || !subject || !message) {
      return res.status(400).json({ message: 'Receiver, subject, and message are required' });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = await uploadToCloudinaryOrLocal(req.file, 'emails');
    }

    const email = await prisma.email.create({
      data: {
        senderId: user.id,
        receiverId,
        subject,
        message,
        attachment: attachmentUrl,
        isSupport: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
        receiver: { select: { id: true, name: true, email: true, role: true, profilePhoto: true } },
      },
    });

    return res.status(201).json({
      message: 'Email sent successfully',
      email,
    });
  } catch (error) {
    console.error('Create email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/emails/:id/read
// @desc    Mark an email as read
router.put('/:id/read', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Verify user is either sender or receiver, or support/admin
    if (email.receiverId !== user.id && email.senderId !== user.id && user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedEmail = await prisma.email.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json(updatedEmail);
  } catch (error) {
    console.error('Mark email read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/v1/emails/:id
// @desc    Delete an email
router.delete('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Verify user is sender or receiver (or support/admin)
    if (email.receiverId !== user.id && email.senderId !== user.id && user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.email.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
