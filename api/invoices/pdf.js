/* GET /api/invoices/pdf?id=… — renders the invoice as a branded A4 PDF.
   Real selectable text via pdfkit, multi-page with repeated table
   headers, page numbers, DRAFT banner on drafts and a PAID mark when
   fully paid. Issue/download of final invoices is blocked when
   mandatory details are missing — drafts always preview (marked DRAFT). */
const PDFDocument = require("pdfkit");
const { requireAuth } = require("../_lib/auth");
const db = require("../_lib/db");
const { json, handleError } = require("../_lib/util");

const FOREST = "#1d3527";
const FOREST_MID = "#2e5138";
const SAGE = "#e9efdd";
const LINE = "#d8d2c0";
const MUTED = "#64715f";
const INK = "#22302a";

const M = 48;                 // page margin
const W = 595.28 - M * 2;     // A4 content width

function money(cents) {
  const v = (cents || 0) / 100;
  return "$" + v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function lineTotalCents(it) {
  let t = Math.round(Number(it.quantity || 0) * Number(it.unit_price_cents || 0));
  if (it.discount_pct) t -= Math.round(t * Number(it.discount_pct) / 100);
  t -= Number(it.discount_cents || 0);
  return Math.max(t, 0);
}
function sanitizeFilename(s) {
  return (s || "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "Invoice";
}

module.exports = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const u = new URL(req.url, "http://x");
    const id = u.searchParams.get("id");
    if (!id) return json(res, 400, { error: "id required" });

    const rows = await db.select("invoices", `select=*&id=eq.${id}`);
    if (!rows.length) return json(res, 404, { error: "Invoice not found" });
    const inv = rows[0];
    inv.items = await db.select("invoice_items", `select=*&invoice_id=eq.${id}&order=position.asc`);
    inv.scope_sections = await db.select("invoice_scope_sections", `select=*&invoice_id=eq.${id}&order=position.asc`);
    inv.payments = await db.select("payments", `select=*&invoice_id=eq.${id}&order=paid_on.asc`);
    const settings = (await db.select("business_settings", "select=*&id=eq.1"))[0] || {};

    const isDraft = inv.status === "draft";
    const client = inv.client_snapshot || {};

    /* Final-document requirements (drafts always allowed, marked DRAFT) */
    if (!isDraft) {
      const problems = [];
      if (!settings.trading_name && !settings.legal_name) problems.push("business name");
      if (settings.gst_registered && !settings.abn) problems.push("ABN (required for tax invoices)");
      if (!inv.issue_date) problems.push("issue date");
      if (!client.name && !client.business) problems.push("client name");
      if (inv.total_cents >= 100000 && !(client.address || inv.billing_address || client.abn)) {
        problems.push("buyer address or ABN (required for invoices of $1,000 or more)");
      }
      if (problems.length) {
        return json(res, 422, { error: "Cannot produce a final invoice — missing: " + problems.join(", ") });
      }
    }

    /* Try to embed the logo from the deployed site (skip silently if unavailable) */
    let logo = null;
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      const r = await fetch(`${proto}://${host}/assets/logo-turf-and-landscaping.png`);
      if (r.ok) logo = Buffer.from(await r.arrayBuffer());
    } catch (e) { /* no logo — text header only */ }

    const doc = new PDFDocument({ size: "A4", margins: { top: M, bottom: M + 26, left: M, right: M }, bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise((resolve) => doc.on("end", resolve));

    const docTitle = settings.gst_registered ? "TAX INVOICE" : "INVOICE";

    /* ---------- header (first page) ---------- */
    if (logo) { try { doc.image(logo, M, M - 10, { height: 42 }); } catch (e) {} }
    doc.font("Helvetica-Bold").fontSize(20).fillColor(FOREST)
      .text(docTitle, M, M, { width: W, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    const headRight = [
      inv.invoice_no ? "Invoice no: " + inv.invoice_no : "Draft — no number assigned",
      "Issue date: " + fmtDate(inv.issue_date),
      "Due date: " + fmtDate(inv.due_date),
    ];
    doc.text(headRight.join("\n"), M, M + 26, { width: W, align: "right" });

    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK)
      .text(settings.trading_name || settings.legal_name || "", M, M + 40);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    const bizLines = [];
    if (settings.legal_name && settings.legal_name !== settings.trading_name) bizLines.push(settings.legal_name);
    if (settings.abn) bizLines.push("ABN " + settings.abn);
    if (settings.address) bizLines.push(settings.address);
    bizLines.push([settings.phone, settings.email].filter(Boolean).join(" · "));
    doc.text(bizLines.join("\n"));

    doc.moveDown(1);
    let y = Math.max(doc.y, M + 100);

    /* ---------- bill-to / project ---------- */
    doc.roundedRect(M, y, W, 74, 8).fillAndStroke("#fdfcf8", LINE);
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8);
    doc.text("BILL TO", M + 14, y + 10);
    doc.text("PROJECT / SITE", M + W / 2 + 8, y + 10);
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    const billLines = [client.business, client.name, inv.billing_address || client.address,
      client.abn ? "ABN " + client.abn : "", client.email, client.mobile].filter(Boolean).join("\n");
    doc.text(billLines || "—", M + 14, y + 22, { width: W / 2 - 28, height: 46, ellipsis: true });
    const projLines = [inv.project_address || "—",
      inv.po_number ? "PO: " + inv.po_number : "", inv.customer_ref ? "Ref: " + inv.customer_ref : ""]
      .filter(Boolean).join("\n");
    doc.text(projLines, M + W / 2 + 8, y + 22, { width: W / 2 - 22, height: 46, ellipsis: true });
    doc.y = y + 86;

    const ensureSpace = (needed, redraw) => {
      if (doc.y + needed > doc.page.height - M - 30) { doc.addPage(); if (redraw) redraw(); }
    };

    /* ---------- scope of works ---------- */
    if (inv.scope_sections.length) {
      ensureSpace(60);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(FOREST).text("Scope of Works", M, doc.y);
      doc.moveDown(0.4);
      inv.scope_sections.forEach((s) => {
        ensureSpace(46);
        if (s.heading) doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(s.heading, M, doc.y, { width: W });
        if (s.body) doc.font("Helvetica").fontSize(9).fillColor(INK).text(s.body, { width: W });
        const bullet = (arr, label) => {
          const list = (arr || []).filter(Boolean);
          if (!list.length) return;
          if (label) doc.font("Helvetica-Bold").fontSize(8.5).fillColor(MUTED).text(label, { width: W });
          doc.font("Helvetica").fontSize(9).fillColor(INK)
            .list(list, M + 10, doc.y, { width: W - 10, bulletRadius: 1.5, textIndent: 10 });
        };
        bullet(s.bullets, "");
        bullet(s.inclusions, "Inclusions");
        bullet(s.exclusions, "Exclusions");
        if (s.notes) doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(MUTED).text(s.notes, { width: W });
        doc.moveDown(0.6);
      });
      doc.moveDown(0.4);
    }

    /* ---------- items table ---------- */
    const cols = [
      { key: "description", label: "Description", w: 205, align: "left" },
      { key: "qty", label: "Qty", w: 48, align: "right" },
      { key: "unit", label: "Unit", w: 70, align: "left" },
      { key: "price", label: "Unit price", w: 70, align: "right" },
      { key: "disc", label: "Disc.", w: 46, align: "right" },
      { key: "total", label: "Amount", w: 60, align: "right" },
    ];
    const tableHeader = () => {
      const yy = doc.y;
      doc.rect(M, yy, W, 18).fill(FOREST);
      let x = M;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      cols.forEach((c) => { doc.text(c.label, x + 5, yy + 5, { width: c.w - 10, align: c.align }); x += c.w; });
      doc.y = yy + 20;
    };
    if (inv.items.length) {
      ensureSpace(70);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(FOREST).text("Pricing", M, doc.y);
      doc.moveDown(0.4);
      tableHeader();
      inv.items.forEach((it, idx) => {
        const descH = doc.font("Helvetica").fontSize(9)
          .heightOfString(it.description || "—", { width: cols[0].w - 10 });
        const rowH = Math.max(descH + 8, 16);
        ensureSpace(rowH + 4, tableHeader);
        const yy = doc.y;
        if (idx % 2 === 1) doc.rect(M, yy - 2, W, rowH).fill("#f6f3ea");
        let x = M;
        const disc = it.discount_pct ? Number(it.discount_pct) + "%" : (it.discount_cents ? money(it.discount_cents) : "—");
        const cells = {
          description: (it.description || "—") + (it.taxable === false && inv.gst_enabled ? "  (GST-free)" : ""),
          qty: String(Number(it.quantity || 0)),
          unit: it.unit || "",
          price: money(it.unit_price_cents),
          disc: disc,
          total: money(lineTotalCents(it)),
        };
        doc.font("Helvetica").fontSize(9).fillColor(INK);
        cols.forEach((c) => { doc.text(cells[c.key], x + 5, yy + 2, { width: c.w - 10, align: c.align }); x += c.w; });
        doc.y = yy + rowH;
        doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(LINE).lineWidth(0.5).stroke();
        doc.y += 2;
      });
    }

    /* ---------- totals ---------- */
    ensureSpace(150);
    doc.moveDown(0.6);
    const totalsX = M + W - 220;
    const trow = (label, value, bold, big) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(big ? 11 : 9)
        .fillColor(bold ? FOREST : INK);
      const yy = doc.y;
      doc.text(label, totalsX, yy, { width: 130 });
      doc.text(value, totalsX + 130, yy, { width: 90, align: "right" });
      doc.y = yy + (big ? 18 : 14);
    };
    trow(inv.gst_enabled ? "Subtotal (ex. GST)" : "Subtotal", money(inv.subtotal_cents));
    if (inv.discount_cents > 0 || inv.discount_pct) {
      const label = inv.discount_label || "Discount";
      const val = inv.discount_pct ? inv.discount_pct + "%" : "-" + money(inv.discount_cents);
      trow(label, val);
    }
    if (inv.gst_enabled) trow("GST", money(inv.gst_cents));
    doc.moveTo(totalsX, doc.y).lineTo(M + W, doc.y).strokeColor(FOREST).lineWidth(1).stroke();
    doc.y += 4;
    trow(inv.gst_enabled ? "Total (incl. GST)" : "Total", money(inv.total_cents), true, true);
    if (inv.gst_enabled && inv.gst_cents > 0) {
      doc.font("Helvetica-Oblique").fontSize(8).fillColor(MUTED)
        .text("Total includes GST", totalsX, doc.y, { width: 220, align: "right" });
      doc.y += 12;
    }
    if (inv.paid_cents > 0) {
      trow("Amount paid", "-" + money(inv.paid_cents));
      trow("Balance due", money(inv.total_cents - inv.paid_cents), true);
    }

    /* ---------- payments history ---------- */
    if (inv.payments.length) {
      ensureSpace(40 + inv.payments.length * 13);
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(FOREST).text("Payments received", M, doc.y);
      doc.font("Helvetica").fontSize(8.5).fillColor(INK);
      inv.payments.forEach((p) => {
        doc.text(`${fmtDate(p.paid_on)}  ·  ${money(p.amount_cents)}  ·  ${p.method}${p.reference ? "  ·  " + p.reference : ""}`, { width: W });
      });
    }

    /* ---------- payment details / notes / terms ---------- */
    const block = (title, text) => {
      if (!text) return;
      ensureSpace(46);
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(FOREST).text(title, M, doc.y);
      doc.font("Helvetica").fontSize(9).fillColor(INK).text(text, { width: W });
    };
    const bank = [settings.bank_name, settings.account_name,
      settings.bsb ? "BSB: " + settings.bsb : "", settings.account_number ? "Account: " + settings.account_number : ""]
      .filter(Boolean).join("\n");
    block("Payment details", inv.payment_instructions || bank || "");
    block("Payment terms", inv.payment_terms || settings.payment_terms || "");
    block("Notes", inv.notes);
    block("Terms & conditions", inv.terms || settings.default_terms || "");

    /* ---------- stamps + footer on every page ---------- */
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      if (isDraft) {
        doc.save().rotate(-30, { origin: [297, 420] })
          .font("Helvetica-Bold").fontSize(90).fillColor(FOREST).opacity(0.08)
          .text("DRAFT", 100, 360, { width: 400, align: "center" }).restore().opacity(1);
      } else if (inv.status === "paid") {
        doc.save().font("Helvetica-Bold").fontSize(13).fillColor(FOREST_MID).opacity(0.9);
        doc.roundedRect(M + W - 76, M - 14, 76, 24, 6).stroke(FOREST_MID);
        doc.text("PAID", M + W - 76, M - 8, { width: 76, align: "center" });
        doc.restore().opacity(1);
      }
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
      const footY = doc.page.height - M + 6;
      doc.text(
        [settings.trading_name, settings.phone, settings.email, settings.website].filter(Boolean).join("  ·  "),
        M, footY, { width: W - 90, lineBreak: false });
      doc.text(`Page ${i + 1} of ${pages.count}`, M + W - 90, footY, { width: 90, align: "right" });
    }

    doc.end();
    await done;
    const pdf = Buffer.concat(chunks);
    const clientName = sanitizeFilename(client.business || client.name || "Client");
    const number = sanitizeFilename(inv.invoice_no || "DRAFT");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store");
    const disposition = u.searchParams.get("download") === "1" ? "attachment" : "inline";
    res.setHeader("Content-Disposition", `${disposition}; filename="TLV-Invoice-${number}-${clientName}.pdf"`);
    res.end(pdf);
  } catch (e) { handleError(res, e); }
};
