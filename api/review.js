/* =====================================================================
   /api/review — feedback for the private blog review area (/review).

   Access is by a secret link key, not an admin login: the reviewer opens
   /review?k=<REVIEW_KEY> and the page sends that key on every call.
   The key is compared in constant time against the REVIEW_KEY env var.

     GET  /api/review                 -> { reviewer, round, blogs: [...] }
     POST /api/review { slug, action } -> the updated record for that slug
          action "note"        + text          add a note
          action "delete_note" + id            remove a note
          action "status"      + status        pending | approved | changes

   Feedback is stored as one JSON document per article in a private
   Vercel Blob store (api/_lib/store.js). Nothing here can publish
   an article — publishing is a frontmatter change in content/blog.
   ===================================================================== */
const crypto = require("crypto");
const store = require("./_lib/store");
const { json, readBody, handleError } = require("./_lib/util");
const CONFIG = require("../content/blog-review.json");

const STATUSES = ["pending", "approved", "changes"];
/* Extra document for "ideas for future articles" — notes only, no status. */
const IDEAS = "_ideas";
const ALLOWED = CONFIG.slugs.concat(IDEAS);
const MAX_NOTE = 4000;

function keyMatches(req) {
  const expected = String(process.env.REVIEW_KEY || "");
  if (expected.length < 20) {
    const err = new Error("REVIEW_KEY is not configured on this deployment");
    err.statusCode = 503;
    throw err;
  }
  const u = new URL(req.url, "http://x");
  const provided = String(req.headers["x-review-key"] || u.searchParams.get("k") || "");
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function blank(slug) {
  return { slug, status: "pending", status_at: null, notes: [], updated_at: null };
}

async function load(slug) {
  const doc = await store.getJson(`${slug}.json`);
  return doc ? Object.assign(blank(slug), doc) : blank(slug);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    if (!keyMatches(req)) return json(res, 401, { error: "This review link is not valid" });

    if (req.method === "GET" && new URL(req.url, "http://x").searchParams.get("health") === "1") {
      /* Key-protected diagnostics: no values, just whether storage answers. */
      const out = { tokenSet: !!process.env.BLOB_READ_WRITE_TOKEN };
      try { await store.getJson("__health__.json"); out.storage = "ok"; }
      catch (e) { out.storage = String(e.message).slice(0, 200); }
      return json(res, 200, out);
    }

    if (req.method === "GET") {
      const blogs = await Promise.all(CONFIG.slugs.map(load));
      const ideas = await load(IDEAS);
      return json(res, 200, { reviewer: CONFIG.reviewer, round: CONFIG.round, blogs, ideas });
    }

    const body = await readBody(req);
    const slug = String(body.slug || "");
    if (!ALLOWED.includes(slug)) return json(res, 400, { error: "Unknown article" });

    const rec = await load(slug);
    const now = new Date().toISOString();

    if (body.action === "note") {
      const text = String(body.text || "").trim();
      if (!text) return json(res, 400, { error: "Write a note first" });
      if (text.length > MAX_NOTE) return json(res, 400, { error: `Notes are limited to ${MAX_NOTE} characters` });
      rec.notes.push({ id: crypto.randomUUID(), text, by: CONFIG.reviewer, at: now });
    } else if (body.action === "delete_note") {
      const before = rec.notes.length;
      rec.notes = rec.notes.filter((n) => n.id !== String(body.id || ""));
      if (rec.notes.length === before) return json(res, 404, { error: "Note not found" });
    } else if (body.action === "status") {
      if (slug === IDEAS) return json(res, 400, { error: "Ideas have no status" });
      const status = String(body.status || "");
      if (!STATUSES.includes(status)) return json(res, 400, { error: "Unknown status" });
      rec.status = status;
      rec.status_at = now;
    } else {
      return json(res, 400, { error: "Unknown action" });
    }

    rec.updated_at = now;
    await store.putJson(`${slug}.json`, rec);
    return json(res, 200, rec);
  } catch (e) { handleError(res, e); }
};
