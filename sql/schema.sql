CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, occurred_at TEXT NOT NULL, raw TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in','out')), amount REAL NOT NULL,
  reason TEXT, category TEXT, source TEXT NOT NULL DEFAULT 'quick', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, principal REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0, deadline TEXT, notes TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium', due_date TEXT, area TEXT NOT NULL DEFAULT 'business',
  notes TEXT, created_at TEXT NOT NULL, completed_at TEXT
);
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, service TEXT,
  value REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'lead',
  next_action TEXT, next_action_date TEXT, notes TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shop_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE,
  footfall INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);