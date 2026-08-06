function extractLinks(body) {
  const matches = body.match(/\[\[thread:(\d+)\]\]/g) || [];
  return matches.map((m) => Number(m.replace(/\D/g, ''))).filter(Boolean);
}

function validateCampaign(db, campaignId) {
  const warnings = [];
  const threads = db
    .prepare('SELECT id, title, starter_post_id FROM threads WHERE campaign_id = ?')
    .all(campaignId);

  const threadIds = new Set(threads.map((t) => t.id));

  for (const thread of threads) {
    const posts = db
      .prepare(
        `SELECT id, position, COALESCE(backdated_at, created_at) AS timeline_at, body
         FROM posts
         WHERE thread_id = ?
         ORDER BY position ASC`
      )
      .all(thread.id);

    if (!thread.starter_post_id || !posts.find((p) => p.id === thread.starter_post_id)) {
      warnings.push({
        type: 'missing_starter_post',
        threadId: thread.id,
        message: `Thread ${thread.title} is missing a valid starter post.`
      });
    }

    for (let i = 1; i < posts.length; i += 1) {
      if (new Date(posts[i].timeline_at) < new Date(posts[i - 1].timeline_at)) {
        warnings.push({
          type: 'impossible_chronology',
          threadId: thread.id,
          message: `Thread ${thread.title} has a post timestamp earlier than a prior post.`
        });
        break;
      }
    }

    const publishedCount = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM posts
         WHERE thread_id = ? AND status = 'published' AND manual_visible = 1`
      )
      .get(thread.id).count;
    const expectedReplies = Math.max(0, publishedCount - 1);

    const metadataReplies = db
      .prepare('SELECT COALESCE((SELECT count(*) - 1 FROM posts WHERE thread_id = ?), 0) AS replies')
      .get(thread.id).replies;

    if (expectedReplies !== metadataReplies) {
      warnings.push({
        type: 'mismatched_counts',
        threadId: thread.id,
        message: `Thread ${thread.title} has mismatched reply counts.`
      });
    }

    for (const post of posts) {
      for (const linkedId of extractLinks(post.body || '')) {
        if (!threadIds.has(linkedId)) {
          warnings.push({
            type: 'orphaned_link',
            threadId: thread.id,
            message: `Thread ${thread.title} references missing thread ${linkedId}.`
          });
        }
      }
    }
  }

  return warnings;
}

module.exports = { validateCampaign };
