import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard, AuthenticatedRequest } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { uploadToCloudinaryOrLocal } from '../utils/cloudinary';

const prisma = new PrismaClient();
const router = Router();

// @route   GET /api/v1/posts
// @desc    Get all feed posts
router.get('/', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePhoto: true,
          },
        },
        likes: {
          select: {
            id: true,
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profilePhoto: true,
              },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    profilePhoto: true,
                  },
                },
              },
            },
          },
        },
        media: true,
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Fetch feed posts error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/posts
// @desc    Create a new feed post
router.post('/', authGuard, upload.array('media', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, eventTitle, eventDate } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    
    // Check if the post is completely empty (no text, no files, and no event)
    if ((!content || !content.trim()) && (!files || files.length === 0) && !eventTitle) {
      return res.status(400).json({ message: 'Post content, media files, or event title is required' });
    }

    const mediaData: { url: string; type: string }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadToCloudinaryOrLocal(file, 'posts');
        const type = file.mimetype.startsWith('video/') ? 'VIDEO' : 'PHOTO';
        mediaData.push({ url, type });
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: content ? content.trim() : '',
        authorId: req.user!.id,
        imageUrl: mediaData.length > 0 ? mediaData[0].url : null, // Set for backwards compatibility
        eventTitle: eventTitle || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        media: {
          create: mediaData,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePhoto: true,
          },
        },
        likes: { select: { id: true } },
        comments: true,
        media: true,
      },
    });

    return res.status(201).json(newPost);
  } catch (error) {
    console.error('Create feed post error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/posts/:id/like
// @desc    Toggle like on a feed post
router.post('/:id/like', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likes: { select: { id: true } } },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const hasLiked = post.likes.some((u) => u.id === userId);

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: hasLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
      include: {
        likes: { select: { id: true } },
      },
    });

    return res.status(200).json({
      message: hasLiked ? 'Post unliked' : 'Post liked',
      likes: updatedPost.likes,
    });
  } catch (error) {
    console.error('Toggle post like error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/v1/posts/:id/comment
// @desc    Comment on a feed post
router.post('/:id/comment', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const { content, parentId } = req.body;
    const userId = req.user!.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    // If reply, make sure parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        postId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Create feed post comment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
