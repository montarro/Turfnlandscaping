/* GET /api/invoices — dashboard list with search/filter + stats.
   POST /api/invoices — save a draft (create or update) via save_invoice RPC. */
const { requireAuth } = require("./_lib/auth");
const db = require("./_lib/db");
const { json, readBody, handleError } = require("./_lib/util");

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    if (req.method === "GET") {
      const u = new URL(req.url, "http://x");
      const q = (u.searchParams.get("q") || "").replace(/[%,()]/g, "");
      const status = u.searchParams.get("status") || "";
      const from = u.searchParams.get("from") || "";
      const to = u.searchParams.get("to") || "";

      let query = "select=id,invoice_no,status,customer_type,client_snapshot,project_address," +
        "issue_date,due_date,total_cents,paid_cents,archived,created_at,revision_of,revision_number" +
        "&archived=eq.false&order=created_at.desc&limit=500";
      if (status && status !== "overdue") query += `&status=eq.${status}`;
      if (from) query += `&issue_date=gte.${from}`;
      if (to) query += `&issue_date=lte.${to}`;
      if (q) query += `&or=(invoice_no.ilike.*${q}*,project_address.ilike.*${q}*,client_snapshot->>name.ilike.*${q}*,client_snapshot->>business.ilike.*${q}*)`;

      let rows = await db.select("invoices", query);
      const today = new Date().toISOString().slice(0, 10);
      rows.forEach((r) => {
        r.balance_cents = (r.total_cents || 0) - (r.paid_cents || 0);
        r.overdue = ["issued", "part_paid"].indexOf(r.status) !== -1 && r.due_date && r.due_date < today && r.balance_cents > 0;
      });
      if (u.searchParams.get("status") === "overdue") rows = rows.filter((r) => r.overdue);

      const outstanding = rows
        .filter((r) => ["issued", "part_paid"].indexOf(r.status) !== -1)
        .reduce((sum, r) => sum + r.balance_cents, 0);
      return json(res, 200, { invoices: rows, outstanding_cents: outstanding });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const id = await db.rpc("save_invoice", { p: body });
      return json(res, 200, { id });
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) { handleError(res, e); }
};
