/**
 * Local SQLite store — tasks, steps, config.
 * No external database required.
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;

  const dir = process.env.AUTOWORKER_DATA || join(process.cwd(), ".autoworker");
  mkdirSync(dir, { recursive: true });

  _db = new Database(join(dir, "autoworker.db"));
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      task TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      started_at TEXT,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      step INTEGER,
      tool TEXT,
      args TEXT,
      output TEXT,
      error TEXT,
      ts TEXT
    );
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return _db;
}

export function getConfig(key: string): string | null {
  const row = db().prepare("SELECT value FROM config WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setConfig(key: string, value: string): void {
  db().prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, value);
}
