import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../auth/middleware.js';
import { getWorkLocationDays } from '../services/graphService.js';
import { getBotResponses } from '../services/botResponseService.js';
import { mergeAttendance } from '../services/attendanceMerger.js';

const router = Router();

router.get(
  '/attendance/:userId',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const caller = (req as AuthenticatedRequest).user;
    const { userId } = req.params;
    const month = (req.query.month as string) ?? currentMonth();

    if (!isValidMonth(month)) {
      res.status(400).json({ error: 'month must be YYYY-MM' });
      return;
    }

    // Employees can only view their own data; managers can view anyone
    const isManager = caller.roles.includes('Manager');
    if (!isManager && caller.oid !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const authHeader = req.headers.authorization as string;
    const userToken = authHeader.slice(7);

    try {
      const [graphDays, botDays] = await Promise.all([
        getWorkLocationDays(userId, month, userToken),
        Promise.resolve(getBotResponses(userId, month)),
      ]);

      const summary = mergeAttendance(userId, month, graphDays, botDays);
      res.json(summary);
    } catch (err) {
      console.error('attendance error', err);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }
);

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}

export default router;
