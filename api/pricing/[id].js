/* PUT /api/pricing/:id — edit or archive a catalogue item. */
const { requireAuth } = require("../_lib/auth");
const db = require("../_lib/db");
const { json, readBody, handleError } = require("../_lib/util");

const FIELDS = ["name","category","description","unit","price_cents","gst_treatment",
  "cost_cents","markup_pct","archived","notes"];

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (req.method !== "PUT") return json(res, 405, { error: "Method not allowed" });
    const body = await readBody(req);
    const patch = {};
    FIELDS.forEach((k) => { if (body[k] !== undefined) patch[k] = body[k]; });
    const rows = await db.update("pricing_items", `id=eq.${req.query.id}`, patch);
    return json(res, 200, rows[0]);
  } catch (e) { handleError(res, e); }
};
