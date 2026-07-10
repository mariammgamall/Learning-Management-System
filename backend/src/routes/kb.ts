import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/kb
// @desc    Get all KB articles (filtered by category if provided)
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    const whereClause: any = {};
    if (category) {
      whereClause.category = category as string;
    }

    const articles = await prisma.kBArticle.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(articles);
  } catch (error) {
    console.error('Fetch KB articles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/kb
// @desc    Create a new KB article (SUPPORT/ADMIN only)
router.post('/', authGuard, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Support agents or admins only' });
    }

    const { title, category, description, content } = req.body;
    if (!title || !category || !description || !content) {
      return res.status(400).json({ message: 'All fields (title, category, description, content) are required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinaryOrLocal(req.file, 'kb');
    }

    const article = await prisma.kBArticle.create({
      data: {
        title,
        category,
        description,
        content,
        imageUrl,
      },
    });

    return res.status(201).json(article);
  } catch (error) {
    console.error('Create KB article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/v1/kb/:id
// @desc    Update a KB article (SUPPORT/ADMIN only)
router.put('/:id', authGuard, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { title, category, description, content } = req.body;

    const existing = await prisma.kBArticle.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'KB Article not found' });
    }

    const data: any = {};
    if (title) data.title = title;
    if (category) data.category = category;
    if (description) data.description = description;
    if (content) data.content = content;

    if (req.file) {
      data.imageUrl = await uploadToCloudinaryOrLocal(req.file, 'kb');
    }

    const article = await prisma.kBArticle.update({
      where: { id },
      data,
    });

    return res.status(200).json(article);
  } catch (error) {
    console.error('Update KB article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/v1/kb/:id
// @desc    Delete a KB article (SUPPORT/ADMIN only)
router.delete('/:id', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const existing = await prisma.kBArticle.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'KB Article not found' });
    }

    await prisma.kBArticle.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'KB Article deleted successfully' });
  } catch (error) {
    console.error('Delete KB article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
