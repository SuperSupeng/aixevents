# Security Checklist

Last updated: 2026-05-29

## Current Model

- Public users can read only `datawhale_events_public`.
- Public users can insert new rows into `datawhale_events` only when they are pending submissions.
- Public users cannot select, update, or delete rows directly from `datawhale_events`.
- Edit links use a random token; only `edit_token_hash` is stored in the database.
- Approved-event edits are stored in `pending_update` and do not change the public event until reviewed.
- Admin review uses server-side Vercel functions with `SUPABASE_SERVICE_ROLE_KEY` and `REVIEW_ADMIN_TOKEN`.
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

Do not expose server-only values in Vite code or browser logs.

## Residual Risks

- Anonymous event submission and poster upload can still be spammed. For production hardening, add rate limiting and CAPTCHA or move writes behind a server-side endpoint.
- Public poster objects are intentionally readable. Do not allow submitters to upload private or sensitive images.
- Anyone with an edit token can modify that submission. Treat edit links as private links.

## Verification

- `npm run build`
- Submit a test event and verify it is pending, not visible publicly.
- Approve the event and verify it appears through `datawhale_events_public`.
- Edit an approved event and verify the public event does not change until the pending update is approved.
- Confirm direct anonymous `select`, `update`, and `delete` on `datawhale_events` fail.
