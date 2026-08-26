/* GET/PUT /api/jobs/:id — single job; PUT also handles status moves and
   invoice linking. Marking a job completed stamps completed_date. */
const { requireAuth } = require("../_lib/auth");
const db = require("../_lib/db");
const { json, readBody, handleError } = require("../_lib/util");

const FIELDS = ["client_name","phone","email","address","description","scheduled_date",
  "completed_date","price_cents","notes","status","invoice_id"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const id = req.query.id;
    if (req.method === "GET") {
      const rows = await db.select("jobs", `select=*&id=eq.${id}`);
      if (!rows.length) return json(res, 404, { error: "Job not found" });
      return json(res, 200, rows[0]);
    }
    if (req.method === "PUT") {
      const body = await readBody(req);
      const patch = {};
      FIELDS.forEach((k) => { if (body[k] !== undefined) patch[k] = body[k] === "" ? null : body[k]; });
      if (patch.status === "needs_invoice" && !patch.completed_date) {
        patch.completed_date = new Date().toISOString().slice(0, 10);
      }
      const rows = await db.update("jobs", `id=eq.${id}`, patch);
      if (!rows.length) return json(res, 404, { error: "Job not found" });
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
