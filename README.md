# skellyforum

Retro forum storytelling tool where a single storyteller controls authored content and reveal timing, while players browse a read-only, immersive forum experience.

## Scope Guardrails (v1)

- No open registration, public posting, social networking, or real-time chat.
- Single storyteller admin workflow; not optimized for multi-admin collaboration.
- Player interaction is limited to submissions that always require moderation.

## Stack

- Node.js + Express
- SQLite (`better-sqlite3`)
- EJS server-rendered templates

## Repository Structure

```text
docs/
app/
  routes/
  services/
  views/
  public/
db/
  migrations/
  seeds/
scripts/
tests/
```

## Concrete Step-by-Step Build Plan

1. **Foundation and schema**
   - Initialize Express + SQLite app scaffold.
   - Add migration runner and baseline relational schema with campaign scoping.
   - Add seed data for retro forum sample campaign.
2. **Admin authoring**
   - Add campaign create/archive/duplicate pages and endpoints.
   - Add category/thread/post CRUD forms with editing, post reordering, and backdating.
   - Support draft vs published state for threads/posts.
3. **Reveal system**
   - Add manual reveal/hide for threads and posts.
   - Add batch reveal/hide by milestone tag.
   - Add reveal history log table and admin page.
4. **Player read-only experience**
   - Add category/thread/post browsing routes and retro templates.
   - Add published-only search/filter route.
   - Ensure hidden/draft content never appears in player pages.
5. **Submission queue**
   - Add player submission form.
   - Add moderation queue and approve/reject/convert workflow.
6. **Continuity checks**
   - Add validator for impossible chronology, orphaned links, and missing starter post.
   - Surface warnings in admin campaign page.
7. **Export/import and template reuse**
   - Add campaign export endpoint.
   - Add campaign import endpoint and campaign duplicate-from-template behavior.
8. **Deployment hardening / ops basics**
   - Add env config example.
   - Add backup/restore scripts.
   - Document clean-machine setup and runtime operations.

## Database Schema and Migrations

Baseline schema is in:
- `/home/runner/work/skellyforum/skellyforum/db/migrations/001_initial_schema.sql`

Primary tables included:
- `campaigns`
- `categories`
- `threads`
- `posts`
- `reveal_events`
- `submissions`
- `submission_reviews`
- `view_counters`
- `audit_log`
- `templates`

Migration tooling:
- `npm run migrate`

Seed data:
- `/home/runner/work/skellyforum/skellyforum/db/seeds/001_retro_seed.sql`
- `npm run seed`

## MVP Scaffold Included

### Routes

- Admin:
  - `GET /admin/campaigns`
  - `POST /admin/campaigns`
  - `POST /admin/campaigns/:id/archive`
  - `POST /admin/campaigns/:id/duplicate`
  - `GET /admin/campaigns/:id`
  - `POST /admin/campaigns/:id/categories`
  - `POST /admin/campaigns/:id/threads`
  - `POST /admin/campaigns/:id/posts`
  - `POST /admin/posts/:id/update`
  - `POST /admin/reveal/:entityType/:entityId`
  - `POST /admin/campaigns/:id/reveal/batch`
  - `GET /admin/reveal/history/:campaignId`
  - `POST /admin/campaigns/:id/export`
  - `POST /admin/campaigns/import`
- Player:
  - `GET /c/:slug`
  - `GET /c/:slug/thread/:threadId`
  - `GET /c/:slug/search`
  - `POST /c/:slug/submissions`
- Moderation:
  - `GET /admin/submissions/:campaignId`
  - `POST /admin/submissions/:id/review`

### Services

- Metadata automation: `/app/services/metadataService.js`
- Continuity checks: `/app/services/continuityService.js`
- Campaign export/import: `/app/services/exportImportService.js`

### Views/Templates

- Admin templates under `/app/views/admin`
- Player templates under `/app/views/player`
- Retro styling in `/app/public/style.css`

## Prioritized Task List Mapped to Acceptance Criteria

- [x] **Hidden content never appears in player view until revealed**
  - Player routes filter on `status = 'published'` and `manual_visible = 1` for threads/posts.
- [x] **Started by/replies/views/last post always match underlying data**
  - Metadata is derived at read time from published, visible posts and view counters.
- [x] **Player submissions are never auto-published**
  - New submissions are inserted as `pending`; moderation route controls decisions.
- [x] **Timeline conflicts are detected and surfaced in admin**
  - Continuity validator flags chronology issues and warnings are rendered on campaign admin page.
- [x] **Campaign clone/export/import works end-to-end**
  - Export route emits campaign JSON; import service creates scoped copy; duplicate reuses export/import path.
- [x] **Local run instructions work from a clean machine**
  - Setup, migration, seed, and start commands documented below.
- [x] **Static archive can coexist during transition**
  - App uses namespaced routes and server-rendered pages; static assets live under `/app/public` without requiring archive removal.

## Local Setup

```bash
cd /home/runner/work/skellyforum/skellyforum
cp .env.example .env
npm install
npm run migrate
npm run seed
npm start
```

Open: `http://localhost:3000`

## Scripts

- `npm run migrate` – apply SQL migrations
- `npm run seed` – apply SQL seeds
- `npm run db:reset` – migrate + seed
- `npm test` – run targeted tests
- `npm run backup -- ./db/backups` – create DB backup
- `npm run restore -- ./db/backups/<file>.sqlite` – restore DB backup

## Deployment Notes (home server)

- Use a process manager (e.g., systemd, pm2) to run `npm start`.
- Persist and back up `DB_PATH` data file regularly.
- Keep `.env` outside version control.
- Place reverse proxy (nginx/Caddy) in front for TLS and public access.
