# Private invoice app — setup

The invoice application lives at `/admin` (SPA) + `/api` (Vercel
serverless functions) + Supabase (auth + Postgres). It is fully
isolated from the public website and ships disabled until the
environment below is configured.

## One-time setup

1. **Create a Supabase project** (free tier is fine) at supabase.com.
2. **Run the migrations, in order**: open the project's SQL editor and
   run `supabase/migrations/001_init.sql`, then `002_jobs.sql` (the
   job board), then `003_ghl_integration.sql` (GHL webhook columns).
3. **Create the admin user**: Supabase Dashboard → Authentication →
   Users → "Add user" → email `sebastian@bastianolandscaping.com.au` with a
   strong password (tick "auto confirm"). Only emails listed in
   `ADMIN_EMAILS` can ever get a session, regardless of who signs up.
4. **Set environment variables** in Vercel (Project → Settings →
   Environment Variables), names from `.env.example`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     (Supabase → Settings → API)
   - `SESSION_SECRET` — any random 32+ character string
   - `ADMIN_EMAILS` — `sebastian@bastianolandscaping.com.au`
   - `REVIEW_KEY` — 20+ character secret for the /review sign-off area
     (the review link's `?k=` value; losing it locks the area out)
   - `GHL_WEBHOOK_SECRET` — 32+ character secret the GHL job-completed
     webhook must send in `X-Webhook-Secret`
   - `BLOB_READ_WRITE_TOKEN` — injected automatically once a Vercel
     Blob store is attached; /review notes are stored there
5. Redeploy. Sign in at `https://app.bastianolandscaping.com.au` (or
   `/admin` on any preview deployment).

## Security notes

- Sessions are HMAC-signed HTTP-only cookies; no client-side password
  checks, nothing auth-related in localStorage.
- The service-role key is only ever used server-side; RLS denies all
  other keys, so the database is unreachable except through the
  authenticated API.
- All `/admin` and `/api` responses carry `X-Robots-Tag: noindex`;
  robots.txt also disallows both (authentication is the real control).
- Login is rate-limited per IP+email (5 tries / 10 min per instance),
  with Supabase's own auth rate limits as the backstop.

## Before the first real invoice

Fill in Settings → legal business name, ABN (if GST registered),
business address and bank details. The app blocks issuing final
invoices until the essentials exist, and blocks tax invoices of
$1,000+ without sufficient buyer identification. Confirm settings
with your accountant or bookkeeper.

## GHL "job completed" webhook

When an opportunity is marked completed in GoHighLevel, a Custom
Webhook action posts it here and the job lands in the admin's
**Needs Invoice** tab (with the usual "Create Invoice" action).
Invoice creation and issuing stay manual.

- **Endpoint**: `POST https://bastianolandscaping.com.au/api/integrations/ghl/job-completed`
  (served by `api/jobs.js` through a `vercel.json` rewrite — no extra
  serverless function, so the 12-function budget is untouched)
- **Auth header**: `X-Webhook-Secret: <value of GHL_WEBHOOK_SECRET>`
  (env var in Vercel, Production + Preview; 64 hex chars). Requests
  without it get 401. `Content-Type: application/json`.
- **Migration**: `supabase/migrations/003_ghl_integration.sql` must be
  applied first (adds `ghl_*` columns + unique indexes to `jobs` and
  `clients`).

JSON body (GHL Custom Webhook → map these keys):

| Key               | GHL field                        | Required |
|-------------------|----------------------------------|----------|
| `location_id`     | Location ID                      | yes — must equal `GHL_LOCATION_ID` when that env var is set |
| `opportunity_id`  | Opportunity ID                   | yes — dedupe key per location |
| `contact_id`      | Contact ID                       | yes — matches/creates the client |
| `name`            | Contact full name                | yes |
| `email`           | Contact email                    | no |
| `phone`           | Contact phone                    | no |
| `address`         | Job/site address                 | no |
| `description`     | Job description / scope          | no |
| `amount`          | Agreed amount in dollars ("2500" or "$2,500.00") | no → `price_cents` |
| `completed_date`  | Completion date, `YYYY-MM-DD`    | no (defaults to today) |

Behaviour: same `opportunity_id` again → the existing job is updated,
never duplicated (a partial unique index also enforces this in the
database). A job that is already `invoiced`/`paid` or linked to an
invoice is never reset — the webhook answers `{ok, skipped:
"already_invoiced"}`. Clients are upserted by `ghl_contact_id`
best-effort; a client failure never drops the job event.
