const express = require('express');

function submissionsRouter(db) {
  const router = express.Router();

  router.post('/c/:slug/submissions', (req, res) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE slug = ?').get(req.params.slug);
    if (!campaign) return res.status(404).send('Campaign not found');

    const playerName = (req.body.player_name || '').trim();
    const title = (req.body.title || '').trim();
    const body = (req.body.body || '').trim();
    if (!playerName || !title || !body) return res.status(400).send('Missing required fields');
    if (playerName.length > 100 || title.length > 100 || body.length > 10000) {
      return res.status(400).send('Submission exceeds allowed length');
    }

    db.prepare(
      `INSERT INTO submissions (campaign_id, player_name, title, body, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    ).run(campaign.id, playerName, title, body, new Date().toISOString());

    res.redirect(`/c/${campaign.slug}`);
  });

  router.get('/admin/submissions/:campaignId', (req, res) => {
    const submissions = db
      .prepare('SELECT * FROM submissions WHERE campaign_id = ? ORDER BY created_at DESC')
      .all(req.params.campaignId);
    res.render('admin/submissions', { submissions, campaignId: req.params.campaignId });
  });

  router.post('/admin/submissions/:id/review', (req, res) => {
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) return res.status(404).send('Submission not found');

    const now = new Date().toISOString();
    const decision = req.body.decision;
    if (!['approved', 'rejected', 'converted'].includes(decision)) {
      return res.status(400).send('Invalid decision');
    }

    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(decision, submission.id);
    db.prepare(
      `INSERT INTO submission_reviews (submission_id, reviewer, decision, notes, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(submission.id, req.body.reviewer || 'storyteller', decision, req.body.notes || null, now);

    if (decision === 'converted' && req.body.thread_id) {
      db.prepare(
        `INSERT INTO posts (campaign_id, thread_id, author_name, body, position, status, manual_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'published', 1, ?, ?)`
      ).run(
        submission.campaign_id,
        req.body.thread_id,
        submission.player_name || 'Player',
        `${submission.title}\n\n${submission.body}`,
        Number(req.body.position || 999),
        now,
        now
      );
    }

    res.redirect(`/admin/submissions/${submission.campaign_id}`);
  });

  return router;
}

module.exports = { submissionsRouter };
