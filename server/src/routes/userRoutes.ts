import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getUsers, getUserById, updateProfile, getOnlineUsers } from '../controllers/userController';
import { validate, updateProfileSchema, userIdParamSchema, searchQuerySchema } from '../middleware/validation';

const router = Router();

router.get('/', authenticate, validate(searchQuerySchema), getUsers);
router.get('/online', authenticate, getOnlineUsers);
router.get('/:id', authenticate, validate(userIdParamSchema), getUserById);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
