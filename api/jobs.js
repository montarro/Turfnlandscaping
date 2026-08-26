/* GET /api/jobs (list, ?q= searches client/phone/address/description)
   POST /api/jobs (create) */
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

const FIELDS = ["client_name","phone","email","address","description","scheduled_date",
  "completed_date","price_cents","notes","status","invoice_id"];

module.exports = async (req, res) => {
  try {
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
