const test = require('node:test');
const assert = require('node:assert/strict');
const { initTestDb } = require('./helpers');
const { validateCampaign } = require('../app/services/continuityService');

test('continuity validator catches chronology, orphan links, and missing starter', () => {
  const db = initTestDb();

  db.exec(`
    INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, 'C', 'c', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO categories (id, campaign_id, title, position, created_at, updated_at) VALUES (1,1,'Cat',1,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
    INSERT INTO threads (id, campaign_id, category_id, title, status, manual_visible, starter_post_id, created_at, updated_at) VALUES
      (1,1,1,'T1','published',1,NULL,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
    INSERT INTO posts (id, campaign_id, thread_id, author_name, body, position, status, manual_visible, backdated_at, created_at, updated_at) VALUES
      (1,1,1,'A','First [[thread:999]]',1,'published',1,'2026-01-02T00:00:00.000Z','2026-01-02T00:00:00.000Z','2026-01-02T00:00:00.000Z'),
      (2,1,1,'B','Second',2,'published',1,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
  `);

  const warnings = validateCampaign(db, 1);
  const types = warnings.map((w) => w.type);

  assert.match(types.join(','), /missing_starter_post/);
  assert.match(types.join(','), /impossible_chronology/);
  assert.match(types.join(','), /orphaned_link/);
});
