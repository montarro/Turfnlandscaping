/* GET /api/clients (list, ?q= search, ?archived=) · POST (create) */
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

const FIELDS = ["customer_type","full_name","business_name","contact_person","email","mobile",
  "billing_address","project_address","abn","notes","archived"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (req.method === "GET") {
      const u = new URL(req.url, "http://x");
      const q = (u.searchParams.get("q") || "").replace(/[%,()]/g, "");
      const archived = u.searchParams.get("archived") === "1";
      let query = `select=*&archived=eq.${archived}&order=updated_at.desc&limit=500`;
      if (q) query += `&or=(full_name.ilike.*${q}*,business_name.ilike.*${q}*,email.ilike.*${q}*,mobile.ilike.*${q}*)`;
      return json(res, 200, await db.select("clients", query));
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const row = {};
      FIELDS.forEach((k) => { if (body[k] !== undefined) row[k] = body[k]; });
      const rows = await db.insert("clients", row);
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
