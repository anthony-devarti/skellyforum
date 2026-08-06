DELETE FROM submission_reviews;
DELETE FROM submissions;
DELETE FROM reveal_events;
DELETE FROM posts;
DELETE FROM threads;
DELETE FROM categories;
DELETE FROM campaigns;

INSERT INTO campaigns (id, name, slug, description, is_archived, created_at, updated_at)
VALUES (1, 'The Harrow Signal', 'harrow-signal', 'Retro bulletin board of unexplained events.', 0, datetime('now'), datetime('now'));

INSERT INTO categories (id, campaign_id, title, position, is_published, created_at, updated_at)
VALUES
  (1, 1, 'Town Records', 1, 1, datetime('now'), datetime('now')),
  (2, 1, 'Witness Accounts', 2, 1, datetime('now'), datetime('now'));

INSERT INTO threads (id, campaign_id, category_id, title, milestone_tag, status, manual_visible, created_at, updated_at)
VALUES
  (1, 1, 1, 'Old Water Tower Files', 'prologue', 'published', 1, datetime('now', '-3 day'), datetime('now')),
  (2, 1, 2, 'Night Shift Call Logs', 'chapter1', 'draft', 0, datetime('now', '-1 day'), datetime('now'));

INSERT INTO posts (id, campaign_id, thread_id, author_name, body, position, status, manual_visible, backdated_at, created_at, updated_at)
VALUES
  (1, 1, 1, 'Archivist', 'Filed sketches indicate unexplained radio patterns.', 1, 'published', 1, datetime('now', '-3 day'), datetime('now', '-3 day'), datetime('now')),
  (2, 1, 1, 'Deputy Hale', 'I heard static from the tower at 2AM.', 2, 'published', 1, datetime('now', '-2 day'), datetime('now', '-2 day'), datetime('now')),
  (3, 1, 2, 'Operator 7', 'Draft evidence pending reveal.', 1, 'draft', 0, datetime('now', '-1 day'), datetime('now', '-1 day'), datetime('now'));

UPDATE threads SET starter_post_id = 1 WHERE id = 1;
UPDATE threads SET starter_post_id = 3 WHERE id = 2;

INSERT INTO templates (name, description, campaign_export_json, created_at)
VALUES ('Starter Retro Mystery', 'A starter campaign template.', '{"campaign":"starter"}', datetime('now'));
