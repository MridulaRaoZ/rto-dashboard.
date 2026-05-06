import cron from 'node-cron';
import { config } from '../config.js';
import { sendDailyCheckins } from './botApp.js';

export function startScheduler(): void {
  // Fire at 9:00 AM Mon-Fri in the configured office timezone
  cron.schedule(
    '0 9 * * 1-5',
    async () => {
      console.log('Running daily RTO check-in messages...');
      try {
        await sendDailyCheckins();
        console.log('Daily check-in messages sent.');
      } catch (err) {
        console.error('Scheduler error:', err);
      }
    },
    { timezone: config.officeTimezone }
  );

  console.log(`Bot scheduler started (9am Mon-Fri, ${config.officeTimezone})`);
}
