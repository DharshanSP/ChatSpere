import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './src/config';
import { getDb, close } from './src/database';
import userRoutes from './src/routes/userRoutes';
import authRoutes from './src/routes/authRoutes';
import chatRoutes from './src/routes/chatRoutes';
import groupRoutes from './src/routes/groupRoutes';
import fileRoutes from './src/routes/fileRoutes';
import { errorHandler } from './src/middleware/errorHandler';
import { initializeSocket } from './src/sockets/socketHandler';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindow,
    max: config.rateLimitMax,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/files', fileRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    await getDb();
    console.log('Connected to SQLite database');
    initializeSocket(io);

    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      server.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
      });
    }
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', () => {
  close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  close();
  process.exit(0);
});

export { app };
