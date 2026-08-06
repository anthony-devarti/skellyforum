const fs = require('fs');
const path = require('path');
const { createDb } = require('../app/db');

const db = createDb();
const seedDir = path.join(process.cwd(), 'db', 'seeds');
const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');
  db.exec(sql);
  // eslint-disable-next-line no-console
  console.log(`Applied seed: ${file}`);
}
