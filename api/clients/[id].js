/* GET/PUT /api/clients/:id — single client (PUT also archives). */
const { requireAuth } = require("../_lib/auth");
const db = require("../_lib/db");
const { json, readBody, handleError } = require("../_lib/util");

const FIELDS = ["customer_type","full_name","business_name","contact_person","email","mobile",
  "billing_address","project_address","abn","notes","archived"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const id = req.query.id;
    if (req.method === "GET") {
      const rows = await db.select("clients", `select=*&id=eq.${id}`);
      if (!rows.length) return json(res, 404, { error: "Client not found" });
      const invoices = await db.select("invoices",
        `select=id,invoice_no,status,issue_date,total_cents,paid_cents&client_id=eq.${id}&order=created_at.desc&limit=100`);
      return json(res, 200, Object.assign(rows[0], { invoices }));
    }
    if (req.method === "PUT") {
      const body = await readBody(req);
      const patch = {};
      FIELDS.forEach((k) => { if (body[k] !== undefined) patch[k] = body[k]; });
      const rows = await db.update("clients", `id=eq.${id}`, patch);
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
