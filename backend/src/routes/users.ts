import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types';
import * as bcrypt from 'bcrypt';
import { authGuard, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

const prisma = new PrismaClient();
const router = Router();

// ==========================================
// 1. Static Profile Routes (Must be first)
// ==========================================

// @route   GET /api/v1/users/profile
// @desc    Get profile details for current logged-in user
router.get('/profile', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/users/profile
// @desc    Update current logged-in user's profile info, email & photo
router.put('/profile', authGuard, upload.single('profilePhoto'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const userId = req.user!.id;

    const data: any = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      data.name = name.trim();
    }

    if (email !== undefined) {
      const emailTrimmed = email.trim().toLowerCase();
      // Simple email validation regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }

      // Check if email is already taken by another user
      const emailConflict = await prisma.user.findFirst({
        where: { email: emailTrimmed, NOT: { id: userId } },
      });
      if (emailConflict) {
        return res.status(400).json({ message: 'Email already taken by another user' });
      }
      data.email = emailTrimmed;
    }

    if (req.file) {
      console.log(`Uploading profile photo for user ${userId}...`);
      data.profilePhoto = await uploadToCloudinaryOrLocal(req.file, 'avatars');
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile details provided for update' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/v1/users/profile/photo
// @desc    Delete current logged-in user's profile photo
router.delete('/profile/photo', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: null,
      },
    });

    return res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 2. Parameterized Routes (Must be last)
// ==========================================

// @route   GET /api/v1/users
// @desc    Get all users (Admin only)
router.get('/', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/v1/users/role/:role
// @desc    Get users filtered by role (Admin only)
router.get('/role/:role', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.params;
    if (!Object.values(Role).includes(role as Role)) {
      return res.status(400).json({ message: 'Invalid role filter' });
    }

    const users = await prisma.user.findMany({
      where: { role: role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users by role error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/users/:id
// @desc    Update user or toggle activation status (Admin only)
router.put('/:id', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is taken
      const emailConflict = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (emailConflict) {
        return res.status(400).json({ message: 'Email already taken by another user' });
      }
      updateData.email = email;
    }
    if (role !== undefined) updateData.role = role as Role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/v1/users/:id
// @desc    Hard delete a user (Admin only)
router.delete('/:id', authGuard, roleGuard(Role.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot delete your own administrative account' });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
