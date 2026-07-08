import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/notifications
// @desc    Get user notifications
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/notifications/read
// @desc    Mark all notifications as read
router.put('/read', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read notifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
