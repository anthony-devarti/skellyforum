function exportCampaign(db, campaignId) {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) return null;

  const categories = db.prepare('SELECT * FROM categories WHERE campaign_id = ?').all(campaignId);
  const threads = db.prepare('SELECT * FROM threads WHERE campaign_id = ?').all(campaignId);
  const posts = db.prepare('SELECT * FROM posts WHERE campaign_id = ?').all(campaignId);

  return { campaign, categories, threads, posts };
}

function importCampaign(db, payload) {
  const now = new Date().toISOString();
  const inserted = db
    .prepare('INSERT INTO campaigns (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(`${payload.campaign.name} (Imported)`, `${payload.campaign.slug}-imported-${Date.now()}`, payload.campaign.description, now, now);

  const campaignId = inserted.lastInsertRowid;
  const categoryMap = new Map();
  const threadMap = new Map();

  for (const category of payload.categories || []) {
    const res = db
      .prepare(
        `INSERT INTO categories (campaign_id, title, position, is_published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(campaignId, category.title, category.position, category.is_published, now, now);
    categoryMap.set(category.id, Number(res.lastInsertRowid));
  }

  for (const thread of payload.threads || []) {
    const res = db
      .prepare(
        `INSERT INTO threads (campaign_id, category_id, title, milestone_tag, status, manual_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        campaignId,
        categoryMap.get(thread.category_id),
        thread.title,
        thread.milestone_tag,
        thread.status,
        thread.manual_visible,
        now,
        now
      );
    threadMap.set(thread.id, Number(res.lastInsertRowid));
  }

  for (const post of payload.posts || []) {
    db.prepare(
      `INSERT INTO posts
       (campaign_id, thread_id, author_name, body, position, status, manual_visible, backdated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      campaignId,
      threadMap.get(post.thread_id),
      post.author_name,
      post.body,
      post.position,
      post.status,
      post.manual_visible,
      post.backdated_at,
      now,
      now
    );
  }

  return campaignId;
}

module.exports = { exportCampaign, importCampaign };
