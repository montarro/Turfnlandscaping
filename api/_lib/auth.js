/* =====================================================================
   Server-side auth for /api — signed HTTP-only session cookies.
   - Sign-in is verified against Supabase Auth (email + password).
   - Only emails on the allowlist (ADMIN_EMAILS) get a session.
   - Sessions are stateless HMAC-signed tokens; the secret never leaves
     the server and nothing auth-related is stored in localStorage.
   - Best-effort in-memory rate limiting per IP+email (serverless
     instances are ephemeral, so Supabase's own auth rate limits are
     the backstop).
   ===================================================================== */
const crypto = require("crypto");

const COOKIE = "tl_admin_session";
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET missing or too short (need 32+ chars)");
  return s;
}

function allowedEmails() {
  return (process.env.ADMIN_EMAILS || "info@turfandlandscaping.com.au")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/* ---------- token ---------- */
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + mac;
}

function verify(token) {
  if (!token || token.indexOf(".") === -1) return null;
  const [body, mac] = token.split(".");
  const expect = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (allowedEmails().indexOf((payload.email || "").toLowerCase()) === -1) return null;
    return payload;
  } catch (e) { return null; }
}

/* ---------- cookies ---------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function sessionCookie(token, maxAgeSeconds) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function setSession(res, email) {
  const token = sign({ email, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
  res.setHeader("Set-Cookie", sessionCookie(token, SESSION_HOURS * 3600));
}

function clearSession(res) {
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

function getSession(req) {
  return verify(parseCookies(req)[COOKIE]);
}

/* Every data endpoint calls this first. Returns the session or ends the
   response with 401 — callers must stop when it returns null. */
function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not signed in" }));
    return null;
  }
  return session;
}

/* ---------- login rate limiting (best-effort per instance) ---------- */
const attempts = new Map(); // key -> {count, resetAt}
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimitKey(req, email) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  return ip + "|" + (email || "").toLowerCase();
}

function checkRateLimit(req, email) {
  const key = rateLimitKey(req, email);
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) return false;
  return true;
}

function recordFailure(req, email) {
  const key = rateLimitKey(req, email);
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

function clearFailures(req, email) {
  attempts.delete(rateLimitKey(req, email));
}

module.exports = { allowedEmails, setSession, clearSession, getSession, requireAuth, checkRateLimit, recordFailure, clearFailures };
