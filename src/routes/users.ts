import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { name, email, password } = parse.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Create user failed:', err);
    return res.status(500).json({ error: 'failed-to-create-user' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  return res.json(users);
});

export default router;
