import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';
import type { Server as SocketIOServer, Socket } from 'socket.io';

const router = Router();

const createPollSchema = z.object({
  question: z.string().min(1),
  isPublished: z.boolean().optional().default(false),
  creatorId: z.string().cuid(),
  options: z.array(z.string().min(1)).min(2),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = createPollSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { question, isPublished, creatorId, options } = parse.data;
    // Ensure creator exists to avoid FK errors
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) return res.status(400).json({ error: 'creatorId not found' });
    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished: Boolean(isPublished),
        creatorId,
        options: { create: options.map((text) => ({ text })) },
      },
      include: { options: true },
    });
    return res.status(201).json(poll);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Create poll failed:', err);
    return res.status(500).json({ error: 'failed-to-create-poll' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  const polls = await prisma.poll.findMany({ include: { options: true }, orderBy: { createdAt: 'desc' } });
  return res.json(polls);
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const poll = await prisma.poll.findUnique({ where: { id }, include: { options: {
    include: { _count: { select: { votes: true } } },
  } } });
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  return res.json(poll);
});

// Socket.IO rooms management for per-poll subscriptions
export const registerPollSocket = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    socket.on('poll:join', (pollId: string) => {
      socket.join(`poll:${pollId}`);
    });
    socket.on('poll:leave', (pollId: string) => {
      socket.leave(`poll:${pollId}`);
    });
  });
};

export default router;
