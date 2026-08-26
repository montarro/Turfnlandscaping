/* POST /api/auth/login {email, password}
   Verifies credentials against Supabase Auth, enforces the owner-email
   allowlist and per-IP rate limiting, then sets the HTTP-only session
   cookie. No passwords are stored anywhere in this codebase. */
const { allowedEmails, setSession, checkRateLimit, recordFailure, clearFailures } = require("../_lib/auth");
const { json, readBody, handleError } = require("../_lib/util");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const { email, password } = await readBody(req);
    if (!email || !password) return json(res, 400, { error: "Email and password are required" });

    if (!checkRateLimit(req, email)) {
      return json(res, 429, { error: "Too many attempts — try again in a few minutes" });
    }

    if (allowedEmails().indexOf(email.trim().toLowerCase()) === -1) {
      recordFailure(req, email);
      return json(res, 403, { error: "This account is not authorised" });
    }

    /* Supabase's URL and anon key are PUBLIC client values (the anon key
       ships to every browser in a standard Supabase app), so they live
       here as defaults. A sanity check heals mangled env-var pastes —
       a valid-looking env value still overrides. The service-role key
       and session secret remain env-only secrets. */
    const DEFAULT_URL = "https://podlutvvrclhxmhgupil.supabase.co";
    const DEFAULT_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZGx1dHZ2cmNsaHhtaGd1cGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTU0MDgsImV4cCI6MjEwMzMzMTQwOH0.myymQ_F_z5ApntC5_R2aqWfAswRmPf2RGoEO8K8faWY";
    const envUrl = (process.env.SUPABASE_URL || "").trim();
    const envAnon = (process.env.SUPABASE_ANON_KEY || "").trim();
    const url = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(envUrl) ? envUrl : DEFAULT_URL;
    const anon = (envAnon.startsWith("eyJ") && envAnon.length > 150) ? envAnon : DEFAULT_ANON;

    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!r.ok) {
      let detail = "";
      try { detail = (await r.json()).error_description || ""; } catch (e) {}
      if (r.status === 401 || /api key/i.test(detail)) {
        return json(res, 503, { error: "Auth service key misconfigured — re-paste SUPABASE_ANON_KEY in Vercel [status " + r.status + "]" });
      }
      recordFailure(req, email);
      return json(res, 401, { error: "Incorrect email or password" });
    }

    clearFailures(req, email);
    setSession(res, email.trim().toLowerCase());
    return json(res, 200, { ok: true, email: email.trim().toLowerCase() });
  } catch (e) { handleError(res, e); }
};
