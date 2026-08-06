const express = require('express');
const { validateCampaign } = require('../services/continuityService');
const { exportCampaign, importCampaign } = require('../services/exportImportService');

function adminRouter(db) {
  const router = express.Router();

  router.get('/campaigns', (req, res) => {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY updated_at DESC').all();
    res.render('admin/campaigns', { campaigns });
  });

  router.post('/campaigns', (req, res) => {
    const now = new Date().toISOString();
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.prepare(
      'INSERT INTO campaigns (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(req.body.name, slug, req.body.description || '', now, now);
    res.redirect('/admin/campaigns');
  });

  router.post('/campaigns/:id/archive', (req, res) => {
    db.prepare('UPDATE campaigns SET is_archived = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
    res.redirect('/admin/campaigns');
  });

  router.post('/campaigns/:id/duplicate', (req, res) => {
    const data = exportCampaign(db, Number(req.params.id));
    if (!data) return res.status(404).send('Campaign not found');
    importCampaign(db, data);
    res.redirect('/admin/campaigns');
  });

  router.get('/campaigns/:id', (req, res) => {
    const campaignId = Number(req.params.id);
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) return res.status(404).send('Campaign not found');

    const categories = db.prepare('SELECT * FROM categories WHERE campaign_id = ? ORDER BY position ASC').all(campaignId);
    const threads = db.prepare('SELECT * FROM threads WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId);
    const posts = db.prepare('SELECT * FROM posts WHERE campaign_id = ? ORDER BY thread_id, position ASC').all(campaignId);
    const warnings = validateCampaign(db, campaignId);

    res.render('admin/campaign-detail', { campaign, categories, threads, posts, warnings });
  });

  router.post('/campaigns/:id/categories', (req, res) => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO categories (campaign_id, title, position, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, req.body.title, Number(req.body.position || 0), Number(req.body.is_published || 1), now, now);
    res.redirect(`/admin/campaigns/${req.params.id}`);
  });

  router.post('/campaigns/:id/threads', (req, res) => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO threads (campaign_id, category_id, title, milestone_tag, status, manual_visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.params.id,
      req.body.category_id,
      req.body.title,
      req.body.milestone_tag || null,
      req.body.status || 'draft',
      Number(req.body.manual_visible || 1),
      now,
      now
    );
    res.redirect(`/admin/campaigns/${req.params.id}`);
  });

  router.post('/campaigns/:id/posts', (req, res) => {
    const now = new Date().toISOString();
    const inserted = db.prepare(
      `INSERT INTO posts (campaign_id, thread_id, author_name, body, position, status, manual_visible, backdated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.params.id,
      req.body.thread_id,
      req.body.author_name,
      req.body.body,
      Number(req.body.position || 0),
      req.body.status || 'draft',
      Number(req.body.manual_visible || 1),
      req.body.backdated_at || null,
      now,
      now
    );

    const thread = db.prepare('SELECT starter_post_id FROM threads WHERE id = ?').get(req.body.thread_id);
    if (!thread.starter_post_id) {
      db.prepare('UPDATE threads SET starter_post_id = ?, updated_at = ? WHERE id = ?').run(inserted.lastInsertRowid, now, req.body.thread_id);
    }

    res.redirect(`/admin/campaigns/${req.params.id}`);
  });

  router.post('/posts/:id/update', (req, res) => {
    db.prepare(
      `UPDATE posts
       SET body = ?, position = ?, status = ?, manual_visible = ?, backdated_at = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      req.body.body,
      Number(req.body.position || 0),
      req.body.status,
      Number(req.body.manual_visible || 0),
      req.body.backdated_at || null,
      new Date().toISOString(),
      req.params.id
    );
    res.redirect(`/admin/campaigns/${req.body.campaign_id}`);
  });

  router.post('/reveal/:entityType/:entityId', (req, res) => {
    const { entityType, entityId } = req.params;
    if (!['thread', 'post'].includes(entityType)) {
      return res.status(400).send('Invalid entity type');
    }
    const table = entityType === 'thread' ? 'threads' : 'posts';
    const row = db.prepare(`SELECT campaign_id, manual_visible FROM ${table} WHERE id = ?`).get(entityId);
    if (!row) return res.status(404).send('Not found');

    const action = row.manual_visible ? 'hide' : 'reveal';
    db.prepare(`UPDATE ${table} SET manual_visible = ?, updated_at = ? WHERE id = ?`).run(row.manual_visible ? 0 : 1, new Date().toISOString(), entityId);
    db.prepare(
      `INSERT INTO reveal_events (campaign_id, entity_type, entity_id, action, reason, milestone_tag, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(row.campaign_id, entityType, entityId, action, req.body.reason || null, null, new Date().toISOString());

    res.redirect(`/admin/campaigns/${row.campaign_id}`);
  });

  router.post('/campaigns/:id/reveal/batch', (req, res) => {
    const rows = db.prepare('SELECT id, manual_visible FROM threads WHERE campaign_id = ? AND milestone_tag = ?').all(req.params.id, req.body.milestone_tag);
    const now = new Date().toISOString();
    const action = req.body.action === 'hide' ? 0 : 1;

    for (const row of rows) {
      db.prepare('UPDATE threads SET manual_visible = ?, updated_at = ? WHERE id = ?').run(action, now, row.id);
      db.prepare(
        `INSERT INTO reveal_events (campaign_id, entity_type, entity_id, action, reason, milestone_tag, created_at)
         VALUES (?, 'thread', ?, ?, ?, ?, ?)`
      ).run(req.params.id, row.id, action ? 'reveal' : 'hide', req.body.reason || null, req.body.milestone_tag, now);
    }

    res.redirect(`/admin/reveal/history/${req.params.id}`);
  });

  router.get('/reveal/history/:campaignId', (req, res) => {
    const events = db.prepare('SELECT * FROM reveal_events WHERE campaign_id = ? ORDER BY created_at DESC').all(req.params.campaignId);
    res.render('admin/reveal-history', { events, campaignId: req.params.campaignId });
  });

  router.post('/campaigns/:id/export', (req, res) => {
    const data = exportCampaign(db, Number(req.params.id));
    if (!data) return res.status(404).send('Campaign not found');
    res.type('application/json').send(JSON.stringify(data, null, 2));
  });

  router.post('/campaigns/import', express.json({ limit: '1mb' }), (req, res) => {
    const campaignId = importCampaign(db, req.body);
    res.status(201).json({ campaignId });
  });

  return router;
}

module.exports = { adminRouter };
