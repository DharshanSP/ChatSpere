import multer from 'multer';
import path from 'path';
import { config } from '../config';
import fs from 'fs';

const allowedMimeTypes: Record<string, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  files: ['application/pdf', 'application/zip', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  voice_messages: ['audio/webm', 'audio/ogg', 'audio/wav'],
};

function getUploadFolder(fieldName: string): string {
  const folderMap: Record<string, string> = {
    avatar: 'avatars',
    image: 'images',
    video: 'videos',
    file: 'files',
    audio: 'audio',
    voice: 'voice_messages',
  };
  return folderMap[fieldName] || 'files';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getUploadFolder(file.fieldname);
    const uploadPath = path.join(config.uploadDir, folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

function fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const folder = getUploadFolder(file.fieldname);
  const allowedTypes = allowedMimeTypes[folder];
  if (allowedTypes && allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed for ${folder}`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
});
