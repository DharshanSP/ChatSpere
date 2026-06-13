import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { createChat, getUserChats, getChatById, sendMessage, getMessages, markAsRead } from '../controllers/chatController';
import {
  validate, createChatSchema, sendMessageSchema,
  getMessagesSchema, markAsReadSchema, chatIdParamSchema,
} from '../middleware/validation';

const router = Router();

router.post('/', authenticate, validate(createChatSchema), createChat);
router.get('/', authenticate, getUserChats);
router.get('/:id', authenticate, validate(chatIdParamSchema), getChatById);
router.post('/message', authenticate, validate(sendMessageSchema), sendMessage);
router.get('/:chatId/messages', authenticate, validate(getMessagesSchema), getMessages);
router.put('/read', authenticate, validate(markAsReadSchema), markAsRead);

export default router;
