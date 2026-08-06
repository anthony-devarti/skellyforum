const express = require('express');
const { getThreadMetadata, incrementView } = require('../services/metadataService');

function playerRouter(db) {
  const router = express.Router();

  router.get('/c/:slug', (req, res) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE slug = ? AND is_archived = 0').get(req.params.slug);
    if (!campaign) return res.status(404).send('Campaign not found');

    const categories = db
      .prepare('SELECT * FROM categories WHERE campaign_id = ? AND is_published = 1 ORDER BY position ASC')
      .all(campaign.id);

    const threads = db
      .prepare(
        `SELECT * FROM threads
         WHERE campaign_id = ? AND status = 'published' AND manual_visible = 1
         ORDER BY created_at ASC`
      )
      .all(campaign.id)
      .map((thread) => ({ ...thread, metadata: getThreadMetadata(db, thread.id) }));

    res.render('player/campaign', { campaign, categories, threads });
  });

  router.get('/c/:slug/thread/:threadId', (req, res) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE slug = ? AND is_archived = 0').get(req.params.slug);
    if (!campaign) return res.status(404).send('Campaign not found');

    const thread = db
      .prepare(
        `SELECT * FROM threads
         WHERE id = ? AND campaign_id = ? AND status = 'published' AND manual_visible = 1`
      )
      .get(req.params.threadId, campaign.id);
    if (!thread) return res.status(404).send('Thread not found');

    incrementView(db, campaign.id, thread.id);

    const posts = db
      .prepare(
        `SELECT * FROM posts
         WHERE thread_id = ? AND status = 'published' AND manual_visible = 1
         ORDER BY datetime(COALESCE(backdated_at, created_at)) ASC, position ASC`
      )
      .all(thread.id);

    res.render('player/thread', { campaign, thread, posts });
  });

  router.get('/c/:slug/search', (req, res) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE slug = ? AND is_archived = 0').get(req.params.slug);
    if (!campaign) return res.status(404).send('Campaign not found');

    const q = `%${(req.query.q || '').trim()}%`;
    const posts = db
      .prepare(
        `SELECT p.id, p.body, p.thread_id, t.title AS thread_title
         FROM posts p
         JOIN threads t ON t.id = p.thread_id
         WHERE p.campaign_id = ?
           AND p.status = 'published'
           AND p.manual_visible = 1
           AND t.status = 'published'
           AND t.manual_visible = 1
           AND p.body LIKE ?`
      )
      .all(campaign.id, q);

    res.render('player/search', { campaign, posts, query: req.query.q || '' });
  });

  return router;
}

module.exports = { playerRouter };
