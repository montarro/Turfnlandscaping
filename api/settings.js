/* GET/PUT /api/settings — the singleton business-settings row. */
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

const EDITABLE = ["legal_name","trading_name","owner_name","abn","gst_registered","address","phone","email",
  "website","bank_name","account_name","bsb","account_number","payment_terms","default_notes","default_terms",
  "invoice_prefix","next_invoice_no","gst_rate_bp","currency","date_format","logo_url"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (req.method === "GET") {
      const rows = await db.select("business_settings", "select=*&id=eq.1");
      return json(res, 200, rows[0] || null);
    }
    if (req.method === "PUT") {
      const body = await readBody(req);
      const patch = {};
      EDITABLE.forEach((k) => { if (body[k] !== undefined) patch[k] = body[k]; });
      const rows = await db.update("business_settings", "id=eq.1", patch);
      return json(res, 200, rows[0]);
    }
    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
