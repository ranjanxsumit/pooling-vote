import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';
import { getIO } from '../socket.js';

const router = Router();

const voteSchema = z.object({
  userId: z.string().cuid(),
  pollOptionId: z.string().cuid(),
});

router.post('/', async (req: Request, res: Response) => {
  const parse = voteSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { userId, pollOptionId } = parse.data;

  // Ensure option and poll exist
  const option = await prisma.pollOption.findUnique({ where: { id: pollOptionId }, include: { poll: true } });
  if (!option) return res.status(404).json({ error: 'Poll option not found' });

  // Create vote (unique per user-option enforced by schema)
  try {
    await prisma.vote.create({ data: { userId, pollOptionId } });
  } catch (e) {
    return res.status(409).json({ error: 'User already voted for this option' });
  }

  // Aggregate counts for the poll and broadcast
  const pollId = option.pollId;
  const options = await prisma.pollOption.findMany({
    where: { pollId },
    select: { id: true, text: true, _count: { select: { votes: true } } },
  });
  const payload = options.map((o: { id: string; text: string; _count: { votes: number } }) => ({ id: o.id, text: o.text, votes: o._count.votes }));

  const io = getIO();
  io.to(`poll:${pollId}`).emit('poll:results', { pollId, options: payload });

  return res.status(201).json({ ok: true });
});

export default router;
