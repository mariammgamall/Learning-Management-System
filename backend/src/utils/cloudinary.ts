import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function uploadToCloudinaryOrLocal(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `lms/${folder}`,
          resource_type: 'auto',
          public_id: path.parse(file.originalname).name + '_' + Date.now(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || '');
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    // Local fallback inside the backend workspace directory
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    fs.writeFileSync(filePath, file.buffer);
    
    // Return server absolute link
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${backendUrl}/uploads/${folder}/${uniqueFilename}`;
  }
}
