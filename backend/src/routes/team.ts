import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../auth/middleware.js';
import { getDirectReports, getWorkLocationDays } from '../services/graphService.js';
import { getBotResponses } from '../services/botResponseService.js';
import { mergeAttendance } from '../services/attendanceMerger.js';

const router = Router();

router.get(
  '/team/:managerId',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const caller = (req as AuthenticatedRequest).user;
    const { managerId } = req.params;
    const month = (req.query.month as string) ?? currentMonth();

    if (!isValidMonth(month)) {
      res.status(400).json({ error: 'month must be YYYY-MM' });
      return;
    }

    if (!caller.roles.includes('Manager') || caller.oid !== managerId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const userToken = (req.headers.authorization as string).slice(7);

    try {
      const reports = await getDirectReports(managerId, userToken);

      const summaries = await Promise.all(
        reports.map(async (report) => {
          const [graphDays, botDays] = await Promise.all([
            getWorkLocationDays(report.id, month, userToken),
            Promise.resolve(getBotResponses(report.id, month)),
          ]);
          const summary = mergeAttendance(report.id, month, graphDays, botDays);
          return {
            ...summary,
            name: report.displayName,
            email: report.mail ?? report.userPrincipalName,
          };
        })
      );

      res.json({ managerId, month, team: summaries });
    } catch (err) {
      console.error('team error', err);
      res.status(500).json({ error: 'Failed to fetch team data' });
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
