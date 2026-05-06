import { Router } from 'express';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { sendDailyCheckins } from '../bot/botApp.js';

const router = Router();

// Internal endpoint to manually trigger daily check-ins (protected by shared secret)
router.post('/bot/send-daily', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-scheduler-secret'];
  if (secret !== config.botSchedulerSecret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    await sendDailyCheckins();
    res.json({ ok: true, message: 'Daily check-in messages sent' });
  } catch (err) {
    console.error('Manual trigger error:', err);
    res.status(500).json({ error: 'Failed to send check-ins' });
  }
});

export default router;
