import { Response } from 'express';
import { ChatService } from '../models/Chat';
import { MessageService } from '../models/Message';
import { UserService } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export async function createChat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      res.status(400).json({ message: 'Participant ID is required' });
      return;
    }

    if (participantId === req.userId) {
      res.status(400).json({ message: 'Cannot create chat with yourself' });
      return;
    }

    const participant = await UserService.findById(participantId);
    if (!participant) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const existingChat = await ChatService.findExisting([req.userId!, participantId]);
    if (existingChat) {
      res.json(existingChat);
      return;
    }

    const chat = await ChatService.create([req.userId!, participantId]);
    res.status(201).json(chat);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserChats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chats = await ChatService.findByUser(req.userId!);
    res.json(chats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getChatById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chat = await ChatService.findById(req.params.id as string);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    if (!chat.participants.some((p: any) => p._id === req.userId)) {
      res.status(403).json({ message: 'Not a participant of this chat' });
      return;
    }

    res.json(chat);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { chatId, content, messageType, fileUrl, fileName, fileSize, mimeType, replyTo } = req.body;

    if (!chatId || !content) {
      res.status(400).json({ message: 'Chat ID and content are required' });
      return;
    }

    const chat = await ChatService.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    if (!chat.participants.some((p: any) => p._id === req.userId)) {
      res.status(403).json({ message: 'Not a participant of this chat' });
      return;
    }

    const message = await MessageService.create({
      chatId,
      senderId: req.userId!,
      content,
      messageType: messageType || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      mimeType: mimeType || '',
      replyToId: replyTo || undefined,
      deliveredTo: [req.userId!],
    });

    await ChatService.setLastMessage(chatId, message!._id);
    await ChatService.updateTimestamp(chatId);

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = req.params.chatId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const chat = await ChatService.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    if (!chat.participants.some((p: any) => p._id === req.userId)) {
      res.status(403).json({ message: 'Not a participant of this chat' });
      return;
    }

    const result = await MessageService.findByChat(chatId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { chatId } = req.body;
    await MessageService.markAsRead(chatId, req.userId!, req.userId!);
    res.json({ message: 'Messages marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
