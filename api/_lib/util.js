/* Shared helpers for the /api functions. */

/* Gate for the hidden invoice trash: valid only when the request carries
   the access key set in the TRASH_KEY env var. No env var, no trash. */
function trashKeyOk(req) {
  const expected = String(process.env.TRASH_KEY || "");
  if (expected.length < 6) return false;
  return String(req.headers["x-trash-key"] || "") === expected;
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString() || "{}";
  return JSON.parse(raw);
}

function handleError(res, e) {
  json(res, e.statusCode || 500, { error: e.message || "Server error" });
}

module.exports = { json, readBody, handleError, trashKeyOk };
