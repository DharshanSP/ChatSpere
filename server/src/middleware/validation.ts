import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: any; query?: any; params?: any };
      if (result.body) req.body = result.body;
      if (result.query) req.query = result.query;
      if (result.params) req.params = result.params;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const messages = error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
        res.status(400).json({ message: 'Validation error', errors: messages });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  };
}

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    displayName: z.string().min(1, 'Display name is required').max(50),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Chat schemas
export const createChatSchema = z.object({
  body: z.object({
    participantId: z.string().uuid('Invalid participant ID'),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().uuid('Invalid chat ID'),
    content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
    messageType: z.enum(['text', 'image', 'video', 'file', 'audio', 'voice']).optional(),
    fileUrl: z.string().max(500).optional(),
    fileName: z.string().max(255).optional(),
    fileSize: z.number().max(52428800).optional(),
    mimeType: z.string().max(100).optional(),
    replyTo: z.string().uuid().optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID'),
  }),
});

export const markAsReadSchema = z.object({
  body: z.object({
    chatId: z.string().uuid('Invalid chat ID'),
  }),
});

// Group schemas
export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required').max(100),
    description: z.string().max(500).optional(),
    members: z.array(z.string().uuid()).min(2, 'At least 2 members required').max(100),
  }),
});

export const updateGroupSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    avatar: z.string().max(500).optional(),
  }),
});

export const groupIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID'),
  }),
});

export const addMembersSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID'),
  }),
  body: z.object({
    members: z.array(z.string().uuid()).min(1).max(100),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const sendGroupMessageSchema = z.object({
  body: z.object({
    groupId: z.string().uuid('Invalid group ID'),
    content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
    messageType: z.enum(['text', 'image', 'video', 'file', 'audio', 'voice']).optional(),
    fileUrl: z.string().max(500).optional(),
    fileName: z.string().max(255).optional(),
    fileSize: z.number().max(52428800).optional(),
    mimeType: z.string().max(100).optional(),
  }),
});

export const getGroupMessagesSchema = z.object({
  params: z.object({
    groupId: z.string().uuid('Invalid group ID'),
  }),
});

// User schemas
export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().max(500).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const searchQuerySchema = z.object({});

export const chatIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid chat ID'),
  }),
});
