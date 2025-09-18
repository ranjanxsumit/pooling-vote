import dotenv from 'dotenv';
// Load .env and override any existing env vars so the chosen DATABASE_URL is used
dotenv.config({ override: true });
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import type { Request, Response } from 'express';
import { prisma } from './db.js';
import userRouter from './routes/users.js';
import pollRouter, { registerPollSocket } from './routes/polls.js';
import voteRouter from './routes/votes.js';
import { setIO } from './socket.js';


const app = express();
// Relax CSP for simple local testing; keep other Helmet protections.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Routers
app.use('/api/users', userRouter);
app.use('/api/polls', pollRouter);
app.use('/api/votes', voteRouter);

// Root route for convenience in browser
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Real-Time Polling API',
    health: '/health',
    api: {
      users: ['/api/users (GET, POST)'],
      polls: ['/api/polls (GET, POST)', '/api/polls/:id (GET)'],
      votes: ['/api/votes (POST)'],
    },
    ws: {
      join: "emit 'poll:join' with pollId",
      leave: "emit 'poll:leave' with pollId",
      results: "listen 'poll:results'",
    },
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// DB health endpoint for quick connectivity checks
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DB health failed:', err);
    res.status(500).json({ status: 'error', error: 'database-unreachable' });
  }
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Register socket handlers for polls (rooms per poll)
registerPollSocket(io);
setIO(io);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Try to connect to the database first so we can show a clear message
prisma
  .$connect()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Connected to db');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to db:', err);
  })
  .finally(() => {
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  });

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export type { SocketIOServer };
