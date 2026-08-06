function getThreadMetadata(db, threadId) {
  const started = db
    .prepare(`SELECT author_name, COALESCE(backdated_at, created_at) AS started_at
              FROM posts
              WHERE thread_id = ? AND status = 'published' AND manual_visible = 1
              ORDER BY datetime(COALESCE(backdated_at, created_at)) ASC, position ASC
              LIMIT 1`)
    .get(threadId);

  const replies = db
    .prepare(`SELECT COUNT(*) AS count
              FROM posts
              WHERE thread_id = ? AND status = 'published' AND manual_visible = 1`)
    .get(threadId).count;

  const lastPost = db
    .prepare(`SELECT author_name, COALESCE(backdated_at, created_at) AS posted_at
              FROM posts
              WHERE thread_id = ? AND status = 'published' AND manual_visible = 1
              ORDER BY datetime(COALESCE(backdated_at, created_at)) DESC, position DESC
              LIMIT 1`)
    .get(threadId);

  const views = db
    .prepare('SELECT views FROM view_counters WHERE thread_id = ?')
    .get(threadId)?.views || 0;

  return {
    startedBy: started?.author_name || null,
    replies: Math.max(0, replies - 1),
    views,
    lastPostBy: lastPost?.author_name || null,
    lastPostAt: lastPost?.posted_at || null
  };
}

function incrementView(db, campaignId, threadId) {
  db.prepare(
    `INSERT INTO view_counters (campaign_id, thread_id, views)
     VALUES (?, ?, 1)
     ON CONFLICT(thread_id) DO UPDATE SET views = views + 1`
  ).run(campaignId, threadId);
}

module.exports = { getThreadMetadata, incrementView };
