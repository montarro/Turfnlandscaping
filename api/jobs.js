/* GET /api/jobs (list, ?q= searches client/phone/address/description)
   POST /api/jobs (create)
   POST /api/integrations/ghl/job-completed (vercel.json rewrite adds
   ?ghl=job-completed) — GHL webhook, authenticated by secret header
   instead of the admin session. */
const crypto = require("crypto");
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

const FIELDS = ["client_name","phone","email","address","description","scheduled_date",
  "completed_date","price_cents","notes","status","invoice_id"];

/* GHL ids go into PostgREST filter strings, so their shape is enforced. */
const GHL_ID = /^[A-Za-z0-9_-]{1,64}$/;

function secretsMatch(sent, expected) {
  const a = crypto.createHash("sha256").update(String(sent || "")).digest();
  const b = crypto.createHash("sha256").update(String(expected || "")).digest();
  return crypto.timingSafeEqual(a, b);
}

async function ghlJobCompleted(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const expected = process.env.GHL_WEBHOOK_SECRET || "";
  if (expected.length < 32) return json(res, 503, { error: "GHL_WEBHOOK_SECRET is not configured on this deployment" });
  if (!secretsMatch(req.headers["x-webhook-secret"], expected)) {
    return json(res, 401, { error: "Invalid webhook secret" });
  }

  const body = await readBody(req);
  const s = (k) => String(body[k] == null ? "" : body[k]).trim();
  const locationId = s("location_id"), opportunityId = s("opportunity_id"), contactId = s("contact_id");
  const name = s("name");

  const missing = [];
  if (!locationId) missing.push("location_id");
  if (!opportunityId) missing.push("opportunity_id");
  if (!contactId) missing.push("contact_id");
  if (!name) missing.push("name");
  if (missing.length) return json(res, 400, { error: "Missing required fields: " + missing.join(", ") });
  for (const [label, v] of [["location_id", locationId], ["opportunity_id", opportunityId], ["contact_id", contactId]]) {
    if (!GHL_ID.test(v)) return json(res, 400, { error: "Invalid " + label });
  }
  if (process.env.GHL_LOCATION_ID && locationId !== process.env.GHL_LOCATION_ID) {
    return json(res, 403, { error: "Unknown location" });
  }

  /* agreed amount: dollars in, integer cents stored */
  let priceCents = null;
  const amountRaw = s("amount").replace(/[^0-9.]/g, "");
  if (amountRaw && !isNaN(parseFloat(amountRaw))) priceCents = Math.round(parseFloat(amountRaw) * 100);

  let completedDate = s("completed_date").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(completedDate)) completedDate = new Date().toISOString().slice(0, 10);

  /* Best-effort client upsert by GHL contact id — the job row is the
     point of this webhook, so a client hiccup never fails the event. */
  try {
    const existing = await db.select("clients", `select=id&ghl_contact_id=eq.${contactId}&limit=1`);
    const contact = { full_name: name, email: s("email"), mobile: s("phone"), project_address: s("address") };
    if (existing.length) await db.update("clients", `id=eq.${existing[0].id}`, contact);
    else await db.insert("clients", Object.assign({ ghl_contact_id: contactId }, contact));
  } catch (e) { /* logged server-side only */ console.log("ghl client upsert failed: " + e.message); }

  const jobFields = {
    client_name: name,
    phone: s("phone"),
    email: s("email"),
    address: s("address"),
    description: s("description"),
    completed_date: completedDate,
    ghl_contact_id: contactId,
  };
  if (priceCents != null) jobFields.price_cents = priceCents;

  const found = await db.select("jobs",
    `select=id,status,invoice_id&ghl_location_id=eq.${locationId}&ghl_opportunity_id=eq.${opportunityId}&limit=1`);

  if (found.length) {
    const job = found[0];
    /* Never reset a job that already has an invoice behind it. */
    if (job.invoice_id || job.status === "invoiced" || job.status === "paid") {
      return json(res, 200, { ok: true, job_id: job.id, skipped: "already_invoiced" });
    }
    const rows = await db.update("jobs", `id=eq.${job.id}`, Object.assign({ status: "needs_invoice" }, jobFields));
    return json(res, 200, { ok: true, job_id: rows[0].id, updated: true });
  }

  try {
    const rows = await db.insert("jobs", Object.assign({
      status: "needs_invoice",
      ghl_location_id: locationId,
      ghl_opportunity_id: opportunityId,
    }, jobFields));
    return json(res, 200, { ok: true, job_id: rows[0].id, created: true });
  } catch (e) {
    /* Retry raced with a concurrent duplicate — the unique index caught
       it; report the existing row as success (idempotent). */
    const again = await db.select("jobs",
      `select=id&ghl_location_id=eq.${locationId}&ghl_opportunity_id=eq.${opportunityId}&limit=1`);
    if (again.length) return json(res, 200, { ok: true, job_id: again[0].id, duplicate: true });
    throw e;
  }
}

module.exports = async (req, res) => {
  try {
    const u0 = new URL(req.url, "http://x");
    if (u0.searchParams.get("ghl") === "job-completed") return await ghlJobCompleted(req, res);

    if (!requireAuth(req, res)) return;
    if (req.method === "GET") {
      const u = new URL(req.url, "http://x");
      const q = (u.searchParams.get("q") || "").replace(/[%,()]/g, "");
      let query = "select=*&order=scheduled_date.asc.nullslast,created_at.asc&limit=500";
      if (q) query += `&or=(client_name.ilike.*${q}*,phone.ilike.*${q}*,address.ilike.*${q}*,description.ilike.*${q}*)`;
      return json(res, 200, await db.select("jobs", query));
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!body.client_name) return json(res, 400, { error: "Client name is required" });
      const row = {};
      FIELDS.forEach((k) => { if (body[k] !== undefined && body[k] !== "") row[k] = body[k]; });
      const rows = await db.insert("jobs", row);
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
