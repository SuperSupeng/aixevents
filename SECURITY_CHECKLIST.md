# Security Checklist

Last updated: 2026-05-29

## Current Model

- Public users can read only `datawhale_events_public`.
- Public users can insert new rows into `datawhale_events` only when they are pending submissions.
- Public users cannot select, update, or delete rows directly from `datawhale_events`.
- Edit links use a random token; only `edit_token_hash` is stored in the database.
- Approved-event edits are stored in `pending_update` and do not change the public event until reviewed.
- Admin review uses server-side Cloudflare Pages Functions with `SUPABASE_SERVICE_ROLE_KEY` and `REVIEW_ADMIN_TOKEN`.
- Admin UI at `/admin` calls only `/api/admin/submissions`; it must not import Supabase service credentials.
- Admin write actions are limited to `approve`, `reject`, `set_feature`, and `reorder_featured`.
- Admin write actions attempt to append audit records to `datawhale_admin_audit_logs`.
- Poster uploads go to `datawhale-event-posters`, limited to JPG, PNG, WebP, and 5 MB.

## Required Supabase Setup

Run `database/schema.sql` for a full setup. If only policies need to be repaired, run `supabase_rls_setup.sql`.

The public insert policy must keep these fields locked down:

- `review_status = 'pending'`
- `reviewed_at IS NULL`
- `published_at IS NULL`
- `review_note IS NULL`
- `pending_update IS NULL`
- `update_status = 'none'`
- `update_note IS NULL`
- `is_featured = false`
- `featured_rank IS NULL`
- `edit_token_hash IS NOT NULL`

## Environment Variables

Client-visible:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_ADMIN_TOKEN`
- `ADMIN_ALLOWED_ORIGINS` (optional comma-separated allowlist for non-production admin origins)
- `STATS_API_KEY`
- `IP_HASH_SALT`

Do not expose server-only values in Vite code or browser logs.

## Admin API Rules

- Keep `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Pages Functions only.
- Do not add generic table update, raw SQL, or arbitrary field patch endpoints for admin UI convenience.
- Keep `/api/admin/*` responses `no-store` and `noindex`.
- Keep the legacy `/api/review-submission` endpoint as a redirect to `/api/admin/submissions`, not as a separate write path.
- Keep CORS restricted to same-origin plus explicit `ADMIN_ALLOWED_ORIGINS`.
- Store admin tokens only in session storage on the browser side; do not put tokens in URLs.
- Run `database/schema.sql` after schema changes so `datawhale_admin_audit_logs` exists before production use.

## Residual Risks

- Anonymous event submission and poster upload can still be spammed. For production hardening, add rate limiting and CAPTCHA or move writes behind a server-side endpoint.
- Public poster objects are intentionally readable. Do not allow submitters to upload private or sensitive images.
- Anyone with an edit token can modify that submission. Treat edit links as private links.
- `REVIEW_ADMIN_TOKEN` is still a shared secret. For multi-person operations, put `/admin` behind Cloudflare Access or migrate to Supabase Auth with an explicit admin role.

## Verification

- `npm run build`
- Submit a test event and verify it is pending, not visible publicly.
- Approve the event and verify it appears through `datawhale_events_public`.
- Edit an approved event and verify the public event does not change until the pending update is approved.
- Confirm direct anonymous `select`, `update`, and `delete` on `datawhale_events` fail.
- Confirm `/admin` can list pending items only after a valid token is supplied.
- Confirm approving, rejecting, recommendation changes, and recommendation reorder operations create rows in `datawhale_admin_audit_logs`.
