import "server-only"

import fs from "node:fs"
import path from "node:path"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"

import { guessCategoryStyle } from "./category-style"

export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data")
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budget_members (
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (budget_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  token TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle-ellipsis',
  color TEXT NOT NULL DEFAULT 'slate',
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  sort INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS categories_budget ON categories(budget_id, kind, sort);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  member_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS transactions_budget_date ON transactions(budget_id, date);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS comments_transaction ON comments(transaction_id, created_at);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS attachments_transaction ON attachments(transaction_id);
`

const globalForDb = globalThis as unknown as { babkiDb?: DatabaseSync }

type Row = Record<string, unknown>

// v1 stored an emoji per category; v2 stores a Lucide icon key and a color token.
function migrate(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(categories)").all() as { name: string }[]
  if (!columns.some((c) => c.name === "emoji")) return
  db.exec("BEGIN")
  try {
    db.exec("ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'circle-ellipsis'")
    db.exec("ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT 'slate'")
    const rows = db.prepare("SELECT id, name, kind FROM categories").all() as {
      id: string
      name: string
      kind: "expense" | "income"
    }[]
    const update = db.prepare("UPDATE categories SET icon = ?, color = ? WHERE id = ?")
    for (const r of rows) {
      const style = guessCategoryStyle(r.name, r.kind)
      update.run(style.icon, style.color, r.id)
    }
    db.exec("ALTER TABLE categories DROP COLUMN emoji")
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}

function open() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  const db = new DatabaseSync(path.join(DATA_DIR, "babki.db"))
  db.exec(SCHEMA)
  migrate(db)
  // node:sqlite returns null-prototype rows, which React refuses to pass to
  // Client Components. Hand out plain objects everywhere instead.
  const prepare = db.prepare.bind(db)
  db.prepare = (sql: string) => {
    const statement = prepare(sql)
    const get = statement.get.bind(statement) as (...args: SQLInputValue[]) => Row | undefined
    const all = statement.all.bind(statement) as (...args: SQLInputValue[]) => Row[]
    Object.assign(statement, {
      get: (...args: SQLInputValue[]) => {
        const row = get(...args)
        return row && { ...row }
      },
      all: (...args: SQLInputValue[]) => all(...args).map((row) => ({ ...row })),
    })
    return statement
  }
  return db
}

export const db: DatabaseSync = globalForDb.babkiDb ?? open()
if (process.env.NODE_ENV !== "production") globalForDb.babkiDb = db

export function id() {
  return crypto.randomUUID()
}

export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN")
  try {
    const result = fn()
    db.exec("COMMIT")
    return result
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
