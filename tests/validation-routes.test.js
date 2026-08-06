const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { initTestDb } = require('./helpers');
const { createApp } = require('../app/app');

test('admin reveal route rejects invalid entity type', async () => {
  const db = initTestDb();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('C', 'c', now, now);

  const app = createApp(db);
  const res = await request(app).post('/admin/reveal/invalid/1');
  assert.equal(res.status, 400);
});

test('submission route enforces length limits', async () => {
  const db = initTestDb();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('C', 'c', now, now);

  const app = createApp(db);
  const res = await request(app)
    .post('/c/c/submissions')
    .type('form')
    .send({
      player_name: 'p'.repeat(101),
      title: 'valid',
      body: 'valid'
    });

  assert.equal(res.status, 400);
});

test('submission review rejects invalid decision', async () => {
  const db = initTestDb();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO campaigns (id, name, slug, created_at, updated_at) VALUES (1, ?, ?, ?, ?)').run('C', 'c', now, now);
  db.prepare("INSERT INTO submissions (id, campaign_id, player_name, title, body, status, created_at) VALUES (1,1,'P','T','B','pending',?)").run(now);

  const app = createApp(db);
  const res = await request(app).post('/admin/submissions/1/review').type('form').send({ decision: 'maybe' });
  assert.equal(res.status, 400);
});
