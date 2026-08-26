/* GET /api/invoices/:id — full invoice with items, scope, payments, revisions.
   POST /api/invoices/:id — actions: issue, void, archive, duplicate,
   revision, payment. Issued data is never silently overwritten: edits go
   through save_invoice (drafts only) and revisions create new drafts. */
const { requireAuth } = require("../_lib/auth");
const db = require("../_lib/db");
const { json, readBody, handleError } = require("../_lib/util");

async function loadFull(id) {
  const rows = await db.select("invoices", `select=*&id=eq.${id}`);
  if (!rows.length) return null;
  const inv = rows[0];
  inv.items = await db.select("invoice_items", `select=*&invoice_id=eq.${id}&order=position.asc`);
  inv.scope_sections = await db.select("invoice_scope_sections", `select=*&invoice_id=eq.${id}&order=position.asc`);
  inv.payments = await db.select("payments", `select=*&invoice_id=eq.${id}&order=paid_on.asc`);
  inv.revisions = await db.select("invoices",
    `select=id,invoice_no,status,revision_number,created_at&revision_of=eq.${id}&order=revision_number.asc`);
  return inv;
}

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const id = req.query.id;

    if (req.method === "GET") {
      const inv = await loadFull(id);
      if (!inv) return json(res, 404, { error: "Invoice not found" });
      return json(res, 200, inv);
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      switch (body.action) {
        case "issue": {
          const no = await db.rpc("issue_invoice", { p_id: id });
          return json(res, 200, { invoice_no: no });
        }
        case "void": {
          await db.rpc("void_invoice", { p_id: id, p_reason: body.reason || "" });
          return json(res, 200, { ok: true });
        }
        case "archive": {
          const rows = await db.select("invoices", `select=status&id=eq.${id}`);
          if (!rows.length) return json(res, 404, { error: "Invoice not found" });
          if (rows[0].status !== "draft") return json(res, 400, { error: "Only draft invoices can be archived" });
          await db.update("invoices", `id=eq.${id}`, { archived: true });
          return json(res, 200, { ok: true });
        }
        case "duplicate": {
          const newId = await db.rpc("duplicate_invoice", { p_id: id });
          return json(res, 200, { id: newId });
        }
        case "revision": {
          const newId = await db.rpc("create_revision", { p_id: id });
          return json(res, 200, { id: newId });
        }
        case "payment": {
          await db.rpc("record_payment", { p_id: id, p: body.payment || {} });
          return json(res, 200, { ok: true });
        }
        default:
          return json(res, 400, { error: "Unknown action" });
      }
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
