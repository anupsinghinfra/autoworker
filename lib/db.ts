/**
 * Pokio database — SQLite locally, swap for Postgres in production.
 * Stores: pokios (AI employees), orgs, connections.
 * Agent execution data lives in oncell — this is just the org chart.
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;

  const dir = process.env.POKIO_DATA || join(process.cwd(), ".pokio");
  mkdirSync(dir, { recursive: true });

  _db = new Database(join(dir, "pokio.db"));
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      oncell_api_key TEXT,
      plan TEXT DEFAULT 'starter',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pokios (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      level TEXT DEFAULT 'senior',
      oncell_agent_id TEXT,
      config TEXT DEFAULT '{}',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (org_id) REFERENCES orgs(id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      pokio_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pokio_id) REFERENCES pokios(id)
    );
  `);

  return _db;
}

// ─── Pokio CRUD ──────────────────────────────────────────────────────────

export interface Pokio {
  id: string;
  org_id: string;
  name: string;
  role: string;
  level: string;
  oncell_agent_id: string | null;
  config: Record<string, unknown>;
  status: string;
  created_at: string;
}

export function createPokio(orgId: string, name: string, role: string, level = "senior"): Pokio {
  const id = `pok_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  db().prepare(
    "INSERT INTO pokios (id, org_id, name, role, level) VALUES (?, ?, ?, ?, ?)"
  ).run(id, orgId, name, role, level);
  return getPokio(id)!;
}

export function getPokio(id: string): Pokio | null {
  const row = db().prepare("SELECT * FROM pokios WHERE id = ?").get(id) as any;
  if (!row) return null;
  return { ...row, config: JSON.parse(row.config || "{}") };
}

export function listPokios(orgId: string): Pokio[] {
  const rows = db().prepare("SELECT * FROM pokios WHERE org_id = ? ORDER BY created_at DESC").all(orgId) as any[];
  return rows.map(r => ({ ...r, config: JSON.parse(r.config || "{}") }));
}

export function updatePokio(id: string, updates: Partial<Pokio>): void {
  if (updates.oncell_agent_id !== undefined) {
    db().prepare("UPDATE pokios SET oncell_agent_id = ? WHERE id = ?").run(updates.oncell_agent_id, id);
  }
  if (updates.status !== undefined) {
    db().prepare("UPDATE pokios SET status = ? WHERE id = ?").run(updates.status, id);
  }
  if (updates.config !== undefined) {
    db().prepare("UPDATE pokios SET config = ? WHERE id = ?").run(JSON.stringify(updates.config), id);
  }
}

export function deletePokio(id: string): void {
  db().prepare("DELETE FROM connections WHERE pokio_id = ?").run(id);
  db().prepare("DELETE FROM pokios WHERE id = ?").run(id);
}

// ─── Org CRUD ────────────────────────────────────────────────────────────

export function getOrCreateOrg(name: string, oncellApiKey?: string): string {
  const existing = db().prepare("SELECT id FROM orgs WHERE name = ?").get(name) as any;
  if (existing) return existing.id;

  const id = `org_${Date.now()}`;
  db().prepare("INSERT INTO orgs (id, name, oncell_api_key) VALUES (?, ?, ?)").run(id, name, oncellApiKey || null);
  return id;
}
