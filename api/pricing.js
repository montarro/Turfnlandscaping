/* GET /api/pricing (list, ?q=) · POST (create catalogue item) */
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

const FIELDS = ["name","category","description","unit","price_cents","gst_treatment",
  "cost_cents","markup_pct","archived","notes"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (req.method === "GET") {
      const u = new URL(req.url, "http://x");
      const q = (u.searchParams.get("q") || "").replace(/[%,()]/g, "");
      const archived = u.searchParams.get("archived") === "1";
      let query = `select=*&archived=eq.${archived}&order=category.asc,name.asc&limit=500`;
      if (q) query += `&or=(name.ilike.*${q}*,category.ilike.*${q}*)`;
      return json(res, 200, await db.select("pricing_items", query));
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!body.name) return json(res, 400, { error: "Item name is required" });
      const row = {};
      FIELDS.forEach((k) => { if (body[k] !== undefined) row[k] = body[k]; });
      const rows = await db.insert("pricing_items", row);
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
