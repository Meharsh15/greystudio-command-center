import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb() {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) throw new Error('Turso is not configured.');
    db = createClient({ url, authToken });
  }
  return db;
}

export async function initDb() {
  const d = getDb();
  const statements = [
    "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, occurred_at TEXT NOT NULL, raw TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('in','out')), amount REAL NOT NULL, reason TEXT, category TEXT, source TEXT NOT NULL DEFAULT 'quick', created_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at)",
    "CREATE TABLE IF NOT EXISTS debts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, principal REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, deadline TEXT, notes TEXT, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', priority TEXT NOT NULL DEFAULT 'medium', due_date TEXT, area TEXT NOT NULL DEFAULT 'business', notes TEXT, created_at TEXT NOT NULL, completed_at TEXT)",
    "CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, service TEXT, value REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'lead', next_action TEXT, next_action_date TEXT, notes TEXT, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS shop_daily (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, footfall INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS ai_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL)"
  ];
  await d.batch(statements.map((sql) => ({ sql })), 'write');
  const settings = {
    survival_monthly: '28300',
    debt_months: '12',
    target_profit_min: '200000',
    target_profit_max: '500000',
    seed_v1: '1'
  };
  for (const [key, value] of Object.entries(settings)) {
    await d.execute({ sql:'INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', args:[key,value] });
  }
  const seed = await d.execute({ sql:"SELECT value FROM settings WHERE key='seed_v1'", args:[] });
  if (seed.rows[0]?.value === '1') {
    const count = await d.execute({ sql:'SELECT COUNT(*) AS c FROM debts', args:[] });
    if (Number(count.rows[0]?.c ?? 0) === 0) {
      const now = new Date().toISOString();
      await d.batch([
        {sql:'INSERT INTO debts(name,principal,paid,deadline,notes,created_at) VALUES(?,?,?,?,?,?)',args:['Zero-interest debt A',600000,0,'2027-10-05','Original setup context',now]},
        {sql:'INSERT INTO debts(name,principal,paid,deadline,notes,created_at) VALUES(?,?,?,?,?,?)',args:['Zero-interest debt B',65000,0,'2027-10-05','Original setup context',now]},
        {sql:'INSERT INTO debts(name,principal,paid,deadline,notes,created_at) VALUES(?,?,?,?,?,?)',args:['Zero-interest debt C',10000,0,'2027-10-05','Original setup context',now]}
      ], 'write');
    }
    await d.execute({sql:"UPDATE settings SET value='2' WHERE key='seed_v1'",args:[]});
  }
  return d;
}

export async function getSettings() {
  const r = await getDb().execute({sql:'SELECT key,value FROM settings',args:[]});
  const out: Record<string,string> = {};
  for (const row of r.rows) out[String(row.key)] = String(row.value);
  return out;
}