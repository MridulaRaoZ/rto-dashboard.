import {
  ConfidentialClientApplication,
  OnBehalfOfRequest,
  type AuthenticationResult,
} from '@azure/msal-node';
import { config } from '../config.js';
import { getDb } from '../db.js';

const msalApp = new ConfidentialClientApplication({
  auth: {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
  },
});

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const CALENDAR_SCOPES = ['https://graph.microsoft.com/Calendars.Read'];
const USER_SCOPES = ['https://graph.microsoft.com/User.Read.All'];

// ─── Token helpers ──────────────────────────────────────────────────────────

async function getOboToken(userAccessToken: string, scopes: string[]): Promise<string> {
  const req: OnBehalfOfRequest = { oboAssertion: userAccessToken, scopes };
  const result: AuthenticationResult | null = await msalApp.acquireTokenOnBehalfOf(req);
  if (!result?.accessToken) throw new Error('OBO token acquisition failed');
  return result.accessToken;
}

async function graphGet<T>(url: string, accessToken: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph API ${res.status}: ${body}`);
    }
    const json = (await res.json()) as { value: T[]; '@odata.nextLink'?: string };
    results.push(...json.value);
    nextUrl = json['@odata.nextLink'] ?? null;
  }
  return results;
}

// ─── Work location (Outlook calendar) ───────────────────────────────────────

interface GraphCalendarEvent {
  id: string;
  isAllDay: boolean;
  showAs: string;
  start: { dateTime: string; timeZone: string };
  locations: Array<{ displayName: string }>;
}

export async function getWorkLocationDays(
  userId: string,
  month: string, // "2026-05"
  userAccessToken: string
): Promise<Map<string, boolean>> {
  const db = getDb();
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  const [year, mon] = month.split('-').map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 0); // last day of month
  const today = new Date();
  const cutoff = endDate < today ? endDate : today;

  // Collect all weekdays in range
  const weekdays = getWeekdays(startDate, cutoff);

  // Check cache: fetch dates we already have (not stale)
  const cached = db
    .prepare(
      `SELECT cache_date, in_office FROM graph_cache
       WHERE user_id = ? AND cache_date >= ? AND cache_date <= ?
         AND fetched_at > ?`
    )
    .all(
      userId,
      isoDate(startDate),
      isoDate(cutoff),
      new Date(Date.now() - CACHE_TTL_MS).toISOString()
    ) as Array<{ cache_date: string; in_office: number | null }>;

  const cachedDates = new Set(cached.map((r) => r.cache_date));
  const missing = weekdays.filter((d) => !cachedDates.has(d));

  if (missing.length > 0) {
    // Fetch the full month from Graph (cheaper than per-day calls)
    const token = await getOboToken(userAccessToken, CALENDAR_SCOPES);
    const start = `${isoDate(startDate)}T00:00:00Z`;
    const end = `${isoDate(cutoff)}T23:59:59Z`;
    const url =
      `${GRAPH_BASE}/users/${userId}/calendarView` +
      `?startDateTime=${start}&endDateTime=${end}` +
      `&$select=subject,start,end,locations,isAllDay,showAs`;

    const events = await graphGet<GraphCalendarEvent>(url, token);

    // Build a map: date → isInOffice
    const eventMap = new Map<string, boolean>();
    for (const ev of events) {
      if (!ev.isAllDay) continue;
      const date = ev.start.dateTime.slice(0, 10);
      const loc = ev.locations?.[0]?.displayName ?? '';
      if (loc.toLowerCase().includes(config.officeLocationLabel.toLowerCase())) {
        eventMap.set(date, true);
      } else if (loc.length > 0) {
        // Explicit non-office location (e.g. "Home", "Remote")
        if (!eventMap.has(date)) eventMap.set(date, false);
      }
    }

    // Upsert into cache
    const upsert = db.prepare(`
      INSERT INTO graph_cache (user_id, cache_date, in_office, fetched_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, cache_date) DO UPDATE SET
        in_office = excluded.in_office,
        fetched_at = excluded.fetched_at
    `);
    const now = new Date().toISOString();
    for (const date of missing) {
      const val = eventMap.has(date) ? (eventMap.get(date) ? 1 : 0) : null;
      upsert.run(userId, date, val, now);
    }
  }

  // Re-read from cache
  const all = db
    .prepare(
      `SELECT cache_date, in_office FROM graph_cache
       WHERE user_id = ? AND cache_date >= ? AND cache_date <= ?`
    )
    .all(userId, isoDate(startDate), isoDate(cutoff)) as Array<{
    cache_date: string;
    in_office: number | null;
  }>;

  const result = new Map<string, boolean>();
  for (const row of all) {
    if (row.in_office === 1) result.set(row.cache_date, true);
    else if (row.in_office === 0) result.set(row.cache_date, false);
    // null = no Graph data for that day → omit from map
  }
  return result;
}

// ─── Direct reports (manager view) ──────────────────────────────────────────

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export async function getDirectReports(
  managerId: string,
  userAccessToken: string
): Promise<GraphUser[]> {
  const token = await getOboToken(userAccessToken, USER_SCOPES);
  return graphGet<GraphUser>(
    `${GRAPH_BASE}/users/${managerId}/directReports?$select=id,displayName,mail,userPrincipalName`,
    token
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekdays(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days.push(isoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}
