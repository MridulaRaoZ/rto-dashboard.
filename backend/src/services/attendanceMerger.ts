import { config } from '../config.js';

export type AttendanceSource = 'graph' | 'bot' | 'both' | 'none';

export interface DayRecord {
  date: string;
  inOffice: boolean;
  source: AttendanceSource;
}

export interface AttendanceSummary {
  userId: string;
  month: string;
  days: DayRecord[];
  totalInOfficeDays: number;
  target: number;
  status: 'on-track' | 'at-risk' | 'missed';
}

export function mergeAttendance(
  userId: string,
  month: string,
  graphDays: Map<string, boolean>,
  botDays: Map<string, boolean>
): AttendanceSummary {
  const weekdays = getWeekdaysInMonth(month);
  const today = isoDate(new Date());

  const days: DayRecord[] = weekdays
    .filter((d) => d <= today) // exclude future dates
    .map((date) => {
      const graphSays = graphDays.get(date);
      const botSays = botDays.get(date);
      const inOffice = graphSays === true || botSays === true;

      let source: AttendanceSource = 'none';
      if (graphSays === true && botSays === true) source = 'both';
      else if (graphSays === true) source = 'graph';
      else if (botSays === true) source = 'bot';

      return { date, inOffice, source };
    });

  const totalInOfficeDays = days.filter((d) => d.inOffice).length;
  const status = computeStatus(totalInOfficeDays, month, today);

  return { userId, month, days, totalInOfficeDays, target: config.rtoTarget, status };
}

function computeStatus(
  currentCount: number,
  month: string,
  today: string
): AttendanceSummary['status'] {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0);
  const lastDayStr = isoDate(lastDay);

  const remainingNeeded = Math.max(0, config.rtoTarget - currentCount);

  if (remainingNeeded === 0) return 'on-track';

  // Count remaining weekdays from tomorrow to end of month
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const remaining = getWeekdaysInRange(isoDate(tomorrow), lastDayStr).length;

  if (today >= lastDayStr || remaining === 0) {
    // Month is over
    return remainingNeeded > 0 ? 'missed' : 'on-track';
  }

  if (remainingNeeded > remaining) return 'missed';
  if (remainingNeeded / remaining > 0.7) return 'at-risk';
  return 'on-track';
}

// ─── Date utilities ───────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekdaysInMonth(month: string): string[] {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0);
  return getWeekdaysInRange(isoDate(start), isoDate(end));
}

function getWeekdaysInRange(startStr: string, endStr: string): string[] {
  const days: string[] = [];
  const cur = new Date(startStr + 'T12:00:00Z'); // noon UTC avoids DST shifts
  const end = new Date(endStr + 'T12:00:00Z');
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}
