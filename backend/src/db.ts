import Database from 'better-sqlite3';
import { config } from './config.js';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(config.dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_responses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT NOT NULL,
      user_email   TEXT NOT NULL,
      response_date TEXT NOT NULL,
      in_office    INTEGER NOT NULL,
      responded_at TEXT NOT NULL,
      UNIQUE(user_id, response_date)
    );

    CREATE TABLE IF NOT EXISTS graph_cache (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT NOT NULL,
      cache_date   TEXT NOT NULL,
      in_office    INTEGER,
      fetched_at   TEXT NOT NULL,
      UNIQUE(user_id, cache_date)
    );

    CREATE TABLE IF NOT EXISTS conversation_refs (
      user_id      TEXT PRIMARY KEY,
      ref_json     TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );
  `);
}
