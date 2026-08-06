const fs = require('fs');
const path = require('path');
const { createDb } = require('../app/db');

const db = createDb();
const migrationDir = path.join(process.cwd(), 'db', 'migrations');
const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();

db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
)`);

for (const file of files) {
  const already = db.prepare('SELECT 1 FROM schema_migrations WHERE filename = ?').get(file);
  if (already) continue;

  const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
  db.exec(sql);
  db.prepare('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
  // eslint-disable-next-line no-console
  console.log(`Applied migration: ${file}`);
}
