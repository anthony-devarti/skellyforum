const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function createDb(dbPath) {
  const resolved = dbPath || process.env.DB_PATH || path.join(process.cwd(), 'db', 'skellyforum.sqlite');
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(resolved);
  db.pragma('foreign_keys = ON');
  return db;
}

module.exports = { createDb };
