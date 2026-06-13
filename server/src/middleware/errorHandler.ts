import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid ID format' });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ message: 'Duplicate entry' });
    return;
  }

  if (err.message.includes('not allowed')) {
    res.status(400).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}
