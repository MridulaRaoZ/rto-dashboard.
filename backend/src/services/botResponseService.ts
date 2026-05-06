import { getDb } from '../db.js';

export interface BotResponse {
  response_date: string;
  in_office: boolean;
}

export function upsertBotResponse(
  userId: string,
  userEmail: string,
  date: string,
  inOffice: boolean
): void {
  getDb()
    .prepare(
      `INSERT INTO bot_responses (user_id, user_email, response_date, in_office, responded_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, response_date) DO UPDATE SET
         in_office = excluded.in_office,
         responded_at = excluded.responded_at`
    )
    .run(userId, userEmail, date, inOffice ? 1 : 0, new Date().toISOString());
}

export function getBotResponses(userId: string, month: string): Map<string, boolean> {
  const rows = getDb()
    .prepare(
      `SELECT response_date, in_office FROM bot_responses
       WHERE user_id = ? AND response_date LIKE ?`
    )
    .all(userId, `${month}-%`) as Array<{ response_date: string; in_office: number }>;

  return new Map(rows.map((r) => [r.response_date, r.in_office === 1]));
}

export function saveConversationRef(userId: string, refJson: string): void {
  getDb()
    .prepare(
      `INSERT INTO conversation_refs (user_id, ref_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET ref_json = excluded.ref_json, updated_at = excluded.updated_at`
    )
    .run(userId, refJson, new Date().toISOString());
}

export function getAllConversationRefs(): Array<{ user_id: string; ref_json: string }> {
  return getDb()
    .prepare('SELECT user_id, ref_json FROM conversation_refs')
    .all() as Array<{ user_id: string; ref_json: string }>;
}
