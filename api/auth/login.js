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

    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) return json(res, 503, { error: "Authentication is not configured yet" });

    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!r.ok) {
      recordFailure(req, email);
      return json(res, 401, { error: "Incorrect email or password" });
    }

    clearFailures(req, email);
    setSession(res, email.trim().toLowerCase());
    return json(res, 200, { ok: true, email: email.trim().toLowerCase() });
  } catch (e) { handleError(res, e); }
};
