const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function initTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const migration = fs.readFileSync(path.join(process.cwd(), 'db', 'migrations', '001_initial_schema.sql'), 'utf8');
  db.exec(migration);
  return db;
}

module.exports = { initTestDb };
