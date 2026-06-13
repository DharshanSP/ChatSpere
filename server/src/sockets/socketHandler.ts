import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserService } from '../models/User';
import { MessageService } from '../models/Message';
import { GroupService } from '../models/Group';
import { ChatService } from '../models/Chat';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeSocket(io: Server): void {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token as string, config.jwtSecret) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    await UserService.setOnline(userId, true);
    socket.join(userId);
    socket.broadcast.emit('user_online', userId);

    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType, fileUrl, fileName, fileSize, mimeType, replyTo } = data;

        const chat = await ChatService.findById(chatId);
        if (!chat) return;

        const message = await MessageService.create({
          chatId,
          senderId: userId,
          content,
          messageType: messageType || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          mimeType: mimeType || '',
          replyToId: replyTo || undefined,
          deliveredTo: [userId],
        });

        await ChatService.setLastMessage(chatId, message!._id);
        await ChatService.updateTimestamp(chatId);

        chat.participants.forEach((p: any) => {
          io.to(p._id).emit('new_message', { message, chatId });
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('group_message', async (data) => {
      try {
        const { groupId, content, messageType, fileUrl, fileName, fileSize, mimeType } = data;

        const isMember = await GroupService.isMember(groupId, userId);
        if (!isMember) return;

        const message = await MessageService.create({
          chatId: groupId,
          senderId: userId,
          content,
          messageType: messageType || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          mimeType: mimeType || '',
          deliveredTo: [userId],
        });

        await GroupService.setLastMessage(groupId, message!._id);

        const members = await GroupService.getMembers(groupId);
        members.forEach((memberId) => {
          io.to(memberId).emit('new_group_message', { message, groupId });
        });
      } catch (error) {
        console.error('Error sending group message:', error);
      }
    });

    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('typing_start', { userId, chatId });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('typing_stop', { userId, chatId });
    });

    socket.on('message_seen', async (data) => {
      try {
        const { chatId } = data;
        await MessageService.markAsRead(chatId, userId, userId);
        io.to(chatId).emit('messages_read', { chatId, userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', async () => {
      await UserService.setOnline(userId, false);
      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date().toISOString() });
    });
  });
}
