import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { uploadFile } from '../controllers/fileController';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);

export default router;
