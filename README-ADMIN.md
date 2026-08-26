# Private invoice app — setup

The invoice application lives at `/admin` (SPA) + `/api` (Vercel
serverless functions) + Supabase (auth + Postgres). It is fully
isolated from the public website and ships disabled until the
environment below is configured.

## One-time setup

1. **Create a Supabase project** (free tier is fine) at supabase.com.
2. **Run the migration**: open the project's SQL editor and paste the
   contents of `supabase/migrations/001_init.sql`, then run it.
3. **Create the admin user**: Supabase Dashboard → Authentication →
   Users → "Add user" → email `info@turfandlandscaping.com.au` with a
   strong password (tick "auto confirm"). Only emails listed in
   `ADMIN_EMAILS` can ever get a session, regardless of who signs up.
4. **Set environment variables** in Vercel (Project → Settings →
   Environment Variables), names from `.env.example`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     (Supabase → Settings → API)
   - `SESSION_SECRET` — any random 32+ character string
   - `ADMIN_EMAILS` — `info@turfandlandscaping.com.au`
5. Redeploy. Sign in at `/admin/login`.

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
