const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { initTestDb } = require('./helpers');
const { createApp } = require('../app/app');

test('player thread view excludes hidden and draft content', async () => {
  const db = initTestDb();
  const now = new Date().toISOString();

  db.prepare('INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('C', 'c', now, now);
  db.prepare('INSERT INTO categories (id, campaign_id, title, position, created_at, updated_at) VALUES (1,1,?,1,?,?)').run('Cat', now, now);
  db.prepare("INSERT INTO threads (id, campaign_id, category_id, title, status, manual_visible, created_at, updated_at) VALUES (1,1,1,?,'published',1,?,?)").run('Thread', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,1,'published',1,?,?)").run('Alice', 'Visible post', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,2,'published',0,?,?)").run('Bob', 'Hidden post', now, now);
  db.prepare("INSERT INTO posts (thread_id, campaign_id, author_name, body, position, status, manual_visible, created_at, updated_at) VALUES (1,1,?,?,3,'draft',1,?,?)").run('Carol', 'Draft post', now, now);

  const app = createApp(db);
  const res = await request(app).get('/c/c/thread/1');
  assert.equal(res.status, 200);
  assert.match(res.text, /Visible post/);
  assert.doesNotMatch(res.text, /Hidden post/);
  assert.doesNotMatch(res.text, /Draft post/);
});
