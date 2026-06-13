import { Response } from 'express';
import { GroupService } from '../models/Group';
import { MessageService } from '../models/Message';
import { UserService } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export async function createGroup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, members } = req.body;

    if (!name || !members || members.length < 2) {
      res.status(400).json({ message: 'Group name and at least 2 members are required' });
      return;
    }

    const group = await GroupService.create({
      name,
      description: description || '',
      creatorId: req.userId!,
      members,
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserGroups(req: AuthRequest, res: Response): Promise<void> {
  try {
    const groups = await GroupService.findByUser(req.userId!);
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getGroupById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const group = await GroupService.findById(req.params.id as string);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.members.some((m: any) => m._id === req.userId)) {
      res.status(403).json({ message: 'Not a member of this group' });
      return;
    }

    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateGroup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, avatar } = req.body;
    const group = await GroupService.findById(req.params.id as string);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.admins.some((a: any) => a._id === req.userId)) {
      res.status(403).json({ message: 'Only admins can update group' });
      return;
    }

    const updated = await GroupService.update(req.params.id as string, { name, description, avatar });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function addMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { members } = req.body;
    const group = await GroupService.findById(req.params.id as string);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.admins.some((a: any) => a._id === req.userId)) {
      res.status(403).json({ message: 'Only admins can add members' });
      return;
    }

    const updated = await GroupService.addMembers(req.params.id as string, members);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const group = await GroupService.findById(req.params.id as string);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.admins.some((a: any) => a._id === req.userId) && userId !== req.userId) {
      res.status(403).json({ message: 'Only admins can remove members' });
      return;
    }

    const updated = await GroupService.removeMember(req.params.id as string, userId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function sendGroupMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { groupId, content, messageType, fileUrl, fileName, fileSize, mimeType } = req.body;

    if (!groupId || !content) {
      res.status(400).json({ message: 'Group ID and content are required' });
      return;
    }

    const isMember = await GroupService.isMember(groupId, req.userId!);
    if (!isMember) {
      res.status(403).json({ message: 'Not a member of this group' });
      return;
    }

    const message = await MessageService.create({
      chatId: groupId,
      senderId: req.userId!,
      content,
      messageType: messageType || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      mimeType: mimeType || '',
      deliveredTo: [req.userId!],
    });

    await GroupService.setLastMessage(groupId, message!._id);

    res.status(201).json({ message, groupId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getGroupMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const group = await GroupService.findById(req.params.groupId as string);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.members.some((m: any) => m._id === req.userId)) {
      res.status(403).json({ message: 'Not a member of this group' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await MessageService.findByChat(req.params.groupId as string, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
