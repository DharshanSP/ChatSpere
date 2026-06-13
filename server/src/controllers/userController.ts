import { Response } from 'express';
import { UserService } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const searchQuery = req.query.search as string;
    const users = searchQuery
      ? await UserService.search(searchQuery, req.userId)
      : await UserService.getAll(req.userId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await UserService.findById(req.params.id as string);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { displayName, bio, avatar } = req.body;
    const user = await UserService.update(req.userId!, { displayName, bio, avatar });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getOnlineUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await UserService.getOnlineUsers(req.userId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
