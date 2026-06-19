import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

export async function uploadFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const file = req.file;
    const relativePath = file.path.replace(/\\/g, '/').split('/uploads/')[1];
    res.status(201).json({
      fileUrl: `/uploads/${relativePath}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
