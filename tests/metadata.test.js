const test = require('node:test');
const assert = require('node:assert/strict');
const { initTestDb } = require('./helpers');
const { getThreadMetadata } = require('../app/services/metadataService');

test('metadata is derived from published visible posts and views', () => {
  const db = initTestDb();
  const now = new Date().toISOString();

  db.prepare('INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('C', 'c', now, now);
  db.prepare('INSERT INTO categories (id, campaign_id, title, position, created_at, updated_at) VALUES (1,1,?,1,?,?)').run('Cat', now, now);
  db.prepare("INSERT INTO threads (id, campaign_id, category_id, title, status, manual_visible, created_at, updated_at) VALUES (1,1,1,?,'published',1,?,?)").run('T', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,1,'published',1,?,?)").run('Alice', 'Start', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,2,'published',1,?,?)").run('Bob', 'Reply', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,3,'draft',1,?,?)").run('Hidden', 'Draft', now, now);
  db.prepare('INSERT INTO view_counters (campaign_id, thread_id, views) VALUES (1,1,7)').run();

  const metadata = getThreadMetadata(db, 1);
  assert.equal(metadata.startedBy, 'Alice');
  assert.equal(metadata.replies, 1);
  assert.equal(metadata.views, 7);
  assert.equal(metadata.lastPostBy, 'Bob');
});
