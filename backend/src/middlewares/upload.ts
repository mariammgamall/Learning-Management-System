import multer from 'multer';

// Memory storage to support direct uploads to Cloudinary or disk fallback in memory buffer
const storage = multer.memoryStorage();

// Generical multi-upload middleware with 50MB limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max general limit
  },
});

// Enforced limit for Assignment submission upload (max 20MB)
export const submissionUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB assignment submission limit
  },
});
