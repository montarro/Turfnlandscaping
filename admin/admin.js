/* =====================================================================
   Turf and Landscaping Victoria — private invoice app (SPA).
   Plain JS, history-API routing under /admin. All data flows through
   the authenticated /api endpoints via HTTP-only session cookies —
   nothing sensitive lives in localStorage.
   Money is handled in integer cents throughout.
   ===================================================================== */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var state = { email: null, settings: null };

  /* ================= helpers ================= */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(cents) {
    return "$" + ((cents || 0) / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function toCents(str) {
    if (str === "" || str == null) return 0;
    var n = parseFloat(String(str).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
  function fromCents(cents) {
    return cents == null ? "" : ((cents || 0) / 100).toFixed(2);
  }
  function fmtDate(d) {
    if (!d) return "—";
    var p = d.slice(0, 10).split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }
  function toast(msg, isError) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.hidden = false;
    t.style.background = isError ? "#b4231d" : "";
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  async function api(path, opts) {
    opts = opts || {};
    if (opts.body !== undefined && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
      opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers);
    }
    var res = await fetch(path, opts);
    if (res.status === 401) { nav("/admin/login"); throw new Error("Not signed in"); }
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || "Request failed");
    return data;
  }

  function nav(path) { history.pushState({}, "", path); route(); }
  window.addEventListener("popstate", route);
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-nav]");
    if (a) { e.preventDefault(); nav(a.getAttribute("href")); }
  });

  /* ================= chrome ================= */
  function shell(active, inner) {
    app.innerHTML =
      '<div class="frame">' +
      '<header class="topbar">' +
      '<span class="topbar__brand"><img src="/assets/logo-turf-and-landscaping-white.png" alt="" /><strong>Invoices</strong></span>' +
      "<nav>" +
      navLink("/admin/invoices", "Invoices", active === "invoices") +
      navLink("/admin/clients", "Clients", active === "clients") +
      navLink("/admin/pricing", "Pricing", active === "pricing") +
      navLink("/admin/settings", "Settings", active === "settings") +
      "</nav>" +
      '<span class="topbar__user">' + esc(state.email || "") +
      ' <button class="btn btn--sm btn--soft" id="logout">Sign out</button></span>' +
      "</header>" +
      '<main class="main" id="view">' + inner + "</main></div>";
    document.getElementById("logout").addEventListener("click", async function () {
      await api("/api/auth/logout", { method: "POST" });
      nav("/admin/login");
    });
  }
  function navLink(href, label, active) {
    return '<a href="' + href + '" data-nav' + (active ? ' class="active" aria-current="page"' : "") + ">" + label + "</a>";
  }

  /* ================= login ================= */
  function viewLogin() {
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
      '<img src="/assets/logo-turf-and-landscaping.png" alt="Turf and Landscaping" />' +
      "<h1>Sign in</h1><p class=\"hint\">Private area for authorised users only.</p>" +
      '<form id="login-form">' +
      '<label class="f"><span>Email</span><input type="email" id="li-email" autocomplete="username" required /></label>' +
      '<label class="f"><span>Password</span><input type="password" id="li-pass" autocomplete="current-password" required /></label>' +
      '<p class="error-text" id="li-err" role="alert"></p>' +
      '<button class="btn btn--primary" style="width:100%" type="submit">Sign in</button>' +
      "</form></div></div>";
    document.getElementById("login-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var err = document.getElementById("li-err");
      err.textContent = "";
      try {
        var out = await api("/api/auth/login", { method: "POST", body: {
          email: document.getElementById("li-email").value,
          password: document.getElementById("li-pass").value,
        } });
        state.email = out.email;
        nav("/admin/invoices");
      } catch (ex) { err.textContent = ex.message; }
    });
  }

  /* ================= invoices dashboard ================= */
  var STATUS_LABELS = { draft: "Draft", issued: "Issued", part_paid: "Part paid", paid: "Paid", overdue: "Overdue", void: "Void" };
  function badge(inv) {
    var s = inv.overdue ? "overdue" : inv.status;
    var icons = { draft: "✎", issued: "▸", part_paid: "◐", paid: "✓", overdue: "!", void: "✕", archived: "▤" };
    return '<span class="badge badge--' + s + '">' + (icons[s] || "") + " " + (STATUS_LABELS[s] || s) + "</span>";
  }
  function clientLabel(inv) {
    var c = inv.client_snapshot || {};
    return esc(c.business || c.name || "—");
  }

  async function viewInvoices() {
    shell("invoices", "<h1>Invoices</h1><p class=\"hint\">Loading…</p>");
    var filters = state.invFilters || (state.invFilters = { q: "", status: "", from: "", to: "" });
    var qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (filters.status) qs.set("status", filters.status);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    var data;
    try { data = await api("/api/invoices?" + qs.toString()); }
    catch (e) { document.getElementById("view").innerHTML = "<p class=\"error-text\">" + esc(e.message) + "</p>"; return; }

    var counts = { draft: 0, issued: 0, part_paid: 0, paid: 0, overdue: 0, void: 0 };
    data.invoices.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; if (r.overdue) counts.overdue++; });

    var html = '<div class="btnrow" style="justify-content:space-between;margin-bottom:1rem;"><h1 style="margin:0">Invoices</h1>' +
      '<a class="btn btn--primary" href="/admin/invoices/new" data-nav>+ New Invoice</a></div>';

    html += '<div class="stats">';
    html += '<div class="stat stat--money"><strong>' + money(data.outstanding_cents) + "</strong><span>Total outstanding</span></div>";
    ["draft", "issued", "part_paid", "paid", "overdue", "void"].forEach(function (s) {
      html += '<div class="stat' + (filters.status === s ? " active" : "") + '" data-status="' + s + '"><strong>' +
        (counts[s] || 0) + "</strong><span>" + STATUS_LABELS[s] + "</span></div>";
    });
    html += "</div>";

    html += '<div class="card"><div class="btnrow" style="margin-bottom:.8rem;">' +
      '<input type="text" id="inv-q" placeholder="Search client, invoice number or address…" style="max-width:320px" value="' + esc(filters.q) + '" />' +
      '<input type="date" id="inv-from" value="' + esc(filters.from) + '" aria-label="From date" />' +
      '<input type="date" id="inv-to" value="' + esc(filters.to) + '" aria-label="To date" />' +
      '<button class="btn btn--soft btn--sm" id="inv-apply">Apply</button>' +
      (filters.status || filters.q || filters.from ? '<button class="btn btn--ghost btn--sm" id="inv-clear">Clear filters</button>' : "") +
      "</div>";

    if (!data.invoices.length) {
      html += '<p class="empty">No invoices yet. Create your first one.</p></div>';
    } else {
      html += '<div class="tablewrap"><table><thead><tr>' +
        "<th>Invoice</th><th>Client</th><th>Project / site</th><th>Issued</th><th>Due</th>" +
        '<th class="num">Total</th><th class="num">Balance</th><th>Status</th><th></th></tr></thead><tbody>';
      data.invoices.forEach(function (r) {
        html += "<tr>" +
          '<td><a href="/admin/invoices/' + r.id + '" data-nav><strong>' + esc(r.invoice_no || "Draft") + "</strong></a>" +
          (r.revision_of ? ' <span class="hint">rev ' + r.revision_number + "</span>" : "") + "</td>" +
          "<td>" + clientLabel(r) + "</td>" +
          "<td>" + esc(r.project_address || "—") + "</td>" +
          "<td>" + fmtDate(r.issue_date) + "</td>" +
          "<td>" + fmtDate(r.due_date) + "</td>" +
          '<td class="num">' + money(r.total_cents) + "</td>" +
          '<td class="num">' + money(r.balance_cents) + "</td>" +
          "<td>" + badge(r) + "</td>" +
          '<td><a class="btn btn--sm btn--soft" href="/admin/invoices/' + r.id + '" data-nav>Open</a></td></tr>';
      });
      html += "</tbody></table></div></div>";
    }

    document.getElementById("view").innerHTML = html;
    document.querySelectorAll(".stat[data-status]").forEach(function (el) {
      el.addEventListener("click", function () {
        filters.status = filters.status === el.dataset.status ? "" : el.dataset.status;
        viewInvoices();
      });
    });
    var apply = function () {
      filters.q = document.getElementById("inv-q").value.trim();
      filters.from = document.getElementById("inv-from").value;
      filters.to = document.getElementById("inv-to").value;
      viewInvoices();
    };
    document.getElementById("inv-apply").addEventListener("click", apply);
    document.getElementById("inv-q").addEventListener("keydown", function (e) { if (e.key === "Enter") apply(); });
    var clear = document.getElementById("inv-clear");
    if (clear) clear.addEventListener("click", function () { state.invFilters = null; viewInvoices(); });
  }

  /* ================= invoice editor ================= */
  var CATEGORIES = ["Labour", "Materials", "Turf", "Plants", "Mulch and Soil", "Pavers and Hardscape Materials",
    "Equipment or Machinery", "Delivery", "Removal and Disposal", "Call-Out Fee", "Subcontractor", "Maintenance", "Other"];
  var UNITS = ["Hour", "Day", "Square metre", "Linear metre", "Cubic metre", "Each", "Load", "Visit", "Fixed price", "Custom"];
  var SCOPE_HEADINGS = ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation",
    "Finishing Work", "Cleanup", "Ongoing Maintenance", "Additional Work"];
  var SERVICE_TEMPLATES = {
    "Turf installation": ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation", "Cleanup"],
    "Natural turf": ["Site Preparation", "Materials Supplied", "Installation", "Finishing Work", "Cleanup"],
    "Synthetic turf": ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation", "Cleanup"],
    "Turf repair and patching": ["Site Preparation", "Materials Supplied", "Installation", "Cleanup"],
    "Paving and stepping stones": ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation", "Finishing Work", "Cleanup"],
    "Retaining walls": ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation", "Finishing Work", "Cleanup"],
    "Hard landscaping": ["Site Preparation", "Removal and Disposal", "Materials Supplied", "Installation", "Finishing Work", "Cleanup"],
    "Soft landscaping": ["Site Preparation", "Materials Supplied", "Installation", "Finishing Work", "Cleanup"],
    "Garden planting": ["Site Preparation", "Materials Supplied", "Installation", "Cleanup"],
    "Mulching": ["Site Preparation", "Materials Supplied", "Installation", "Cleanup"],
    "Lawn mowing": ["Ongoing Maintenance"],
    "Property maintenance": ["Ongoing Maintenance", "Additional Work"],
    "Garden care": ["Ongoing Maintenance", "Additional Work"],
    "Irrigation repairs": ["Site Preparation", "Materials Supplied", "Installation", "Cleanup"],
    "Weed control and spraying": ["Ongoing Maintenance"],
    "Hedge trimming and pruning": ["Ongoing Maintenance", "Removal and Disposal"],
  };

  function blankInvoice(settings) {
    return {
      id: "", status: "draft", customer_type: "residential",
      client_id: "", client_snapshot: {}, billing_address: "", project_address: "",
      po_number: "", customer_ref: "", job_ref: "", primary_service: "",
      issue_date: new Date().toISOString().slice(0, 10), due_date: "",
      payment_terms: (settings && settings.payment_terms) || "",
      prices_include_gst: false,
      gst_enabled: !!(settings && settings.gst_registered),
      gst_rate_bp: (settings && settings.gst_rate_bp) || 1000,
      discount_cents: 0, discount_pct: null, discount_label: "",
      notes: (settings && settings.default_notes) || "",
      payment_instructions: "", terms: (settings && settings.default_terms) || "",
      items: [], scope_sections: [], payments: [], revisions: [], paid_cents: 0,
    };
  }

  function calcTotals(inv) {
    var lineNet = 0, taxableNet = 0;
    inv.items.forEach(function (it) {
      var t = Math.round((Number(it.quantity) || 0) * (Number(it.unit_price_cents) || 0));
      if (it.discount_pct) t -= Math.round(t * Number(it.discount_pct) / 100);
      t -= Number(it.discount_cents || 0);
      t = Math.max(t, 0);
      it._line_cents = t;
      lineNet += t;
      if (it.taxable !== false) taxableNet += t;
    });
    var invDisc = inv.discount_pct ? Math.round(lineNet * Number(inv.discount_pct) / 100) : Number(inv.discount_cents || 0);
    invDisc = Math.min(Math.max(invDisc, 0), lineNet);
    var factor = lineNet > 0 ? (lineNet - invDisc) / lineNet : 0;
    var taxableAfter = Math.round(taxableNet * factor);
    var gst = 0, subtotal, total;
    if (inv.gst_enabled) {
      if (inv.prices_include_gst) {
        gst = Math.round(taxableAfter * inv.gst_rate_bp / (10000 + inv.gst_rate_bp));
        total = lineNet - invDisc;
        subtotal = total - gst;
      } else {
        subtotal = lineNet - invDisc;
        gst = Math.round(taxableAfter * inv.gst_rate_bp / 10000);
        total = subtotal + gst;
      }
    } else {
      subtotal = lineNet - invDisc;
      total = subtotal;
    }
    return { subtotal_cents: subtotal, gst_cents: gst, total_cents: total, invoice_discount_cents: invDisc, line_net: lineNet };
  }

  async function viewInvoiceEditor(id) {
    shell("invoices", "<p class=\"hint\">Loading…</p>");
    if (!state.settings) { try { state.settings = await api("/api/settings"); } catch (e) { state.settings = null; } }
    var inv;
    if (id === "new") inv = blankInvoice(state.settings);
    else {
      try { inv = await api("/api/invoices/" + id); }
      catch (e) { document.getElementById("view").innerHTML = "<p class=\"error-text\">" + esc(e.message) + "</p>"; return; }
      inv.items = inv.items || [];
      inv.scope_sections = (inv.scope_sections || []).map(function (s) {
        return Object.assign(s, { bullets: s.bullets || [], inclusions: s.inclusions || [], exclusions: s.exclusions || [] });
      });
    }
    var editable = inv.status === "draft";
    var dirty = false, saveTimer = null;

    window.onbeforeunload = function () { return dirty ? true : undefined; };

    function markDirty() {
      if (!editable) return;
      dirty = true;
      setSaveState("Unsaved changes…", "saving");
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 1500);
    }
    function setSaveState(text, cls) {
      var el = document.getElementById("savestate");
      if (el) { el.textContent = text; el.className = "savestate " + (cls || ""); }
    }

    async function saveDraft(silent) {
      if (!editable) return;
      collect();
      var totals = calcTotals(inv);
      var payload = Object.assign({}, inv, totals);
      delete payload.payments; delete payload.revisions; delete payload._line_cents;
      setSaveState("Saving…", "saving");
      try {
        var out = await api("/api/invoices", { method: "POST", body: payload });
        if (!inv.id) { inv.id = out.id; history.replaceState({}, "", "/admin/invoices/" + out.id); }
        dirty = false;
        setSaveState("Saved ✓", "saved");
        if (!silent) toast("Draft saved");
        return true;
      } catch (e) {
        setSaveState("Save failed — " + e.message, "error");
        return false;
      }
    }

    function collect() {
      var g = function (id2) { var el = document.getElementById(id2); return el ? el.value : ""; };
      inv.customer_type = g("f-ctype") || "residential";
      inv.client_snapshot = {
        name: g("f-cname"), business: g("f-cbiz"), email: g("f-cemail"),
        mobile: g("f-cmobile"), address: g("f-caddr"), abn: g("f-cabn"),
      };
      inv.billing_address = g("f-caddr");
      inv.project_address = g("f-paddr");
      inv.po_number = g("f-po"); inv.customer_ref = g("f-cref"); inv.job_ref = g("f-jref");
      inv.primary_service = g("f-service");
      inv.issue_date = g("f-issue"); inv.due_date = g("f-due");
      inv.payment_terms = g("f-terms-short");
      inv.gst_enabled = document.getElementById("f-gst") ? document.getElementById("f-gst").checked : inv.gst_enabled;
      inv.prices_include_gst = g("f-gstmode") === "inc";
      inv.discount_label = g("f-dlabel");
      var dmode = g("f-dmode");
      if (dmode === "pct") { inv.discount_pct = parseFloat(g("f-dval")) || null; inv.discount_cents = 0; }
      else { inv.discount_cents = toCents(g("f-dval")); inv.discount_pct = null; }
      inv.notes = g("f-notes"); inv.payment_instructions = g("f-payinstr"); inv.terms = g("f-terms");
      /* items + scope collected live via row handlers into inv.items / inv.scope_sections */
    }

    /* ----- render ----- */
    function render() {
      var s = state.settings || {};
      var c = inv.client_snapshot || {};
      var ro = editable ? "" : " disabled";
      var totals = calcTotals(inv);

      var head = '<div class="btnrow" style="justify-content:space-between;margin-bottom:1rem;">' +
        '<div><a href="/admin/invoices" data-nav>&larr; Invoices</a>' +
        "<h1 style=\"margin:.2rem 0 0\">" + (inv.invoice_no ? "Invoice " + esc(inv.invoice_no) : "New invoice") + " " + badge(inv) + "</h1>" +
        (inv.revision_of ? '<p class="hint">Revision ' + inv.revision_number + ' of <a href="/admin/invoices/' + inv.revision_of + '" data-nav>original</a></p>' : "") +
        "</div><span class=\"savestate\" id=\"savestate\">" + (editable ? "" : "Issued invoices are read-only — create a revision to make changes") + "</span></div>";

      var main = "";
      /* 1. Client */
      main += '<div class="card"><h2>1 · Client</h2><div class="grid2">' +
        '<label class="f"><span>Type</span><select id="f-ctype"' + ro + '><option value="residential"' + (inv.customer_type === "residential" ? " selected" : "") + '>Residential</option><option value="commercial"' + (inv.customer_type === "commercial" ? " selected" : "") + ">Commercial</option></select></label>" +
        '<label class="f"><span>Pick existing client</span><select id="f-clientpick"' + ro + '><option value="">— manual entry —</option></select></label>' +
        '<label class="f"><span>Full name <span class="req">*</span></span><input type="text" id="f-cname" value="' + esc(c.name) + '"' + ro + " /></label>" +
        '<label class="f"><span>Business name</span><input type="text" id="f-cbiz" value="' + esc(c.business) + '"' + ro + " /></label>" +
        '<label class="f"><span>Email</span><input type="email" id="f-cemail" value="' + esc(c.email) + '"' + ro + " /></label>" +
        '<label class="f"><span>Mobile</span><input type="text" id="f-cmobile" value="' + esc(c.mobile) + '"' + ro + " /></label>" +
        '<label class="f"><span>Billing address</span><input type="text" id="f-caddr" value="' + esc(inv.billing_address || c.address) + '"' + ro + " /></label>" +
        '<label class="f"><span>Client ABN</span><input type="text" id="f-cabn" value="' + esc(c.abn) + '"' + ro + " /></label>" +
        "</div></div>";

      /* 2. Project */
      main += '<div class="card"><h2>2 · Project</h2><div class="grid2">' +
        '<label class="f"><span>Project / site address</span><input type="text" id="f-paddr" value="' + esc(inv.project_address) + '"' + ro + " /></label>" +
        '<label class="f"><span>Primary service</span><select id="f-service"' + ro + '><option value="">Select…</option>' +
        Object.keys(SERVICE_TEMPLATES).map(function (k) { return "<option" + (inv.primary_service === k ? " selected" : "") + ">" + k + "</option>"; }).join("") +
        "</select></label>" +
        '<label class="f"><span>PO number</span><input type="text" id="f-po" value="' + esc(inv.po_number) + '"' + ro + " /></label>" +
        '<label class="f"><span>Customer reference</span><input type="text" id="f-cref" value="' + esc(inv.customer_ref) + '"' + ro + " /></label>" +
        '<label class="f"><span>Internal job reference</span><input type="text" id="f-jref" value="' + esc(inv.job_ref) + '"' + ro + " /></label>" +
        '<label class="f"><span>Issue date <span class="req">*</span></span><input type="date" id="f-issue" value="' + esc(inv.issue_date || "") + '"' + ro + " /></label>" +
        '<label class="f"><span>Due date <span class="req">*</span></span><input type="date" id="f-due" value="' + esc(inv.due_date || "") + '"' + ro + " /></label>" +
        '<label class="f"><span>Payment terms</span><input type="text" id="f-terms-short" value="' + esc(inv.payment_terms) + '"' + ro + " /></label>" +
        "</div></div>";

      /* 3. Scope of works */
      main += '<div class="card"><h2>3 · Scope of Works' +
        (editable ? '<span class="btnrow"><select id="scope-template" class="btn--sm" style="min-height:32px;max-width:220px;"><option value="">Insert template…</option>' +
          '<optgroup label="Headings">' + SCOPE_HEADINGS.map(function (h) { return '<option value="h:' + esc(h) + '">' + esc(h) + "</option>"; }).join("") + "</optgroup>" +
          '<optgroup label="Service templates">' + Object.keys(SERVICE_TEMPLATES).map(function (k) { return '<option value="s:' + esc(k) + '">' + esc(k) + "</option>"; }).join("") + "</optgroup>" +
          '</select><button class="btn btn--soft btn--sm" id="scope-add">+ Section</button></span>' : "") +
        "</h2><div id=\"scope-list\"></div></div>";

      /* 4. Pricing */
      main += '<div class="card"><h2>4 · Pricing' +
        (editable ? '<span class="btnrow"><input type="text" id="cat-search" placeholder="Search saved pricing…" style="max-width:220px;min-height:32px;" />' +
          '<button class="btn btn--soft btn--sm" id="item-add">+ Line item</button></span>' : "") +
        '</h2><div id="cat-results"></div><div class="tablewrap items-table" id="items-wrap"></div></div>';

      /* 5-6. Payment details + notes */
      main += '<div class="card"><h2>5 · Payment Details &amp; Notes</h2><div class="grid2">' +
        '<label class="f"><span>Payment instructions <span class="hint">(defaults to bank details in Settings)</span></span><textarea id="f-payinstr"' + ro + ">" + esc(inv.payment_instructions) + "</textarea></label>" +
        '<label class="f"><span>Notes</span><textarea id="f-notes"' + ro + ">" + esc(inv.notes) + "</textarea></label>" +
        '<label class="f" style="grid-column:1/-1"><span>Terms &amp; conditions</span><textarea id="f-terms"' + ro + ">" + esc(inv.terms) + "</textarea></label>" +
        "</div></div>";

      /* payments history */
      if (inv.payments && inv.payments.length) {
        main += '<div class="card"><h2>Payments received</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th class="num">Amount</th><th>Method</th><th>Reference</th><th>Note</th></tr></thead><tbody>' +
          inv.payments.map(function (p) {
            return "<tr><td>" + fmtDate(p.paid_on) + '</td><td class="num">' + money(p.amount_cents) + "</td><td>" + esc(p.method) + "</td><td>" + esc(p.reference) + "</td><td>" + esc(p.note) + "</td></tr>";
          }).join("") + "</tbody></table></div></div>";
      }
      if (inv.revisions && inv.revisions.length) {
        main += '<div class="card"><h2>Revisions</h2>' + inv.revisions.map(function (r) {
          return '<p><a href="/admin/invoices/' + r.id + '" data-nav>Revision ' + r.revision_number + "</a> — " + esc(r.status) + "</p>";
        }).join("") + "</div>";
      }

      /* ----- right sidebar ----- */
      var side = '<div class="card editor-side"><h2>Totals</h2>' +
        '<label class="f"><span><input type="checkbox" id="f-gst"' + (inv.gst_enabled ? " checked" : "") + (editable ? "" : " disabled") + " /> Registered for GST (Tax Invoice)</span></label>" +
        '<label class="f"><span>Entered prices are</span><select id="f-gstmode"' + ((editable && inv.gst_enabled) ? "" : " disabled") + '><option value="ex"' + (!inv.prices_include_gst ? " selected" : "") + '>GST exclusive</option><option value="inc"' + (inv.prices_include_gst ? " selected" : "") + ">GST inclusive</option></select></label>" +
        '<fieldset><legend>Invoice discount</legend><div class="btnrow">' +
        '<select id="f-dmode" style="max-width:90px"' + ro + '><option value="fixed"' + (!inv.discount_pct ? " selected" : "") + '>$</option><option value="pct"' + (inv.discount_pct ? " selected" : "") + ">%</option></select>" +
        '<input type="text" id="f-dval" style="max-width:100px" value="' + (inv.discount_pct ? inv.discount_pct : (inv.discount_cents ? fromCents(inv.discount_cents) : "")) + '"' + ro + " placeholder=\"0\" />" +
        '</div><label class="f" style="margin-top:.5rem"><span>Label</span><input type="text" id="f-dlabel" value="' + esc(inv.discount_label) + '" placeholder="e.g. Spring Promotion"' + ro + " /></label></fieldset>" +
        '<div class="totals" id="totals-box"></div>' +
        '<hr style="border:none;border-top:1px solid var(--line);margin:1rem 0">' +
        '<div class="btnrow" id="actions"></div>' +
        (s.gst_registered && !s.abn ? '<p class="hint" style="margin-top:.8rem">⚠ Add your ABN in Settings before issuing tax invoices.</p>' : "") +
        '<p class="hint" style="margin-top:.8rem">Invoice settings should be confirmed with your accountant or bookkeeper.</p></div>';

      document.getElementById("view").innerHTML = head + '<div class="editor-layout"><div>' + main + "</div>" + side + "</div>";

      renderScope();
      renderItems();
      renderTotals();
      renderActions();
      bindEditor();
    }

    /* ----- scope sections ----- */
    function renderScope() {
      var box = document.getElementById("scope-list");
      if (!box) return;
      if (!inv.scope_sections.length) {
        box.innerHTML = '<p class="hint">No scope sections yet' + (editable ? " — add one or insert a template." : ".") + "</p>";
        return;
      }
      box.innerHTML = inv.scope_sections.map(function (sec, i) {
        var ro = editable ? "" : " disabled";
        return '<div class="scope-section" data-i="' + i + '">' +
          '<div class="scope-section__head">' +
          '<input type="text" data-k="heading" placeholder="Section heading" value="' + esc(sec.heading) + '"' + ro + " />" +
          (editable ? '<span class="rowtools">' +
            '<button type="button" data-act="up" title="Move up" aria-label="Move up">↑</button>' +
            '<button type="button" data-act="down" title="Move down" aria-label="Move down">↓</button>' +
            '<button type="button" data-act="dup" title="Duplicate" aria-label="Duplicate">⧉</button>' +
            '<button type="button" data-act="del" title="Remove" aria-label="Remove">✕</button></span>' : "") +
          "</div>" +
          '<label class="f"><span>Description of work</span><textarea data-k="body"' + ro + ">" + esc(sec.body) + "</textarea></label>" +
          '<div class="grid2">' +
          '<label class="f"><span>Bullet points <span class="hint">(one per line)</span></span><textarea data-k="bullets"' + ro + ">" + esc((sec.bullets || []).join("\n")) + "</textarea></label>" +
          '<label class="f"><span>Inclusions <span class="hint">(one per line)</span></span><textarea data-k="inclusions"' + ro + ">" + esc((sec.inclusions || []).join("\n")) + "</textarea></label>" +
          '<label class="f"><span>Exclusions <span class="hint">(one per line)</span></span><textarea data-k="exclusions"' + ro + ">" + esc((sec.exclusions || []).join("\n")) + "</textarea></label>" +
          '<label class="f"><span>Completion notes</span><textarea data-k="notes"' + ro + ">" + esc(sec.notes) + "</textarea></label>" +
          "</div></div>";
      }).join("");

      box.querySelectorAll(".scope-section").forEach(function (el) {
        var i = Number(el.dataset.i);
        el.querySelectorAll("[data-k]").forEach(function (input) {
          input.addEventListener("input", function () {
            var k = input.dataset.k;
            if (["bullets", "inclusions", "exclusions"].indexOf(k) !== -1) {
              inv.scope_sections[i][k] = input.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
            } else inv.scope_sections[i][k] = input.value;
            markDirty();
          });
        });
        el.querySelectorAll("[data-act]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var act = btn.dataset.act, arr = inv.scope_sections;
            if (act === "del") arr.splice(i, 1);
            if (act === "dup") arr.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i])));
            if (act === "up" && i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
            if (act === "down" && i < arr.length - 1) { var t2 = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t2; }
            markDirty(); renderScope();
          });
        });
      });
    }

    /* ----- line items ----- */
    function renderItems() {
      var wrap = document.getElementById("items-wrap");
      if (!wrap) return;
      if (!inv.items.length) {
        wrap.innerHTML = '<p class="hint">No line items yet' + (editable ? " — add one or pick from saved pricing." : ".") + "</p>";
        return;
      }
      var ro = editable ? "" : " disabled";
      var head = "<table><thead><tr><th>Category</th><th style=\"min-width:180px\">Description</th><th>Qty</th><th>Unit</th>" +
        "<th>Unit price $</th><th>Disc.</th><th title=\"GST applies\">GST</th><th class=\"num\">Line</th>" + (editable ? "<th></th>" : "") + "</tr></thead><tbody>";
      wrap.innerHTML = head + inv.items.map(function (it, i) {
        return '<tr data-i="' + i + '">' +
          '<td><select data-k="category"' + ro + ">" + CATEGORIES.map(function (cg) { return "<option" + (it.category === cg ? " selected" : "") + ">" + cg + "</option>"; }).join("") + "</select></td>" +
          '<td><input type="text" data-k="description" value="' + esc(it.description) + '"' + ro + " /></td>" +
          '<td style="max-width:70px"><input type="number" step="0.01" min="0" data-k="quantity" value="' + esc(it.quantity) + '"' + ro + " /></td>" +
          '<td><select data-k="unit"' + ro + ">" + UNITS.map(function (un) { return "<option" + (it.unit === un ? " selected" : "") + ">" + un + "</option>"; }).join("") + "</select></td>" +
          '<td style="max-width:90px"><input type="text" data-k="unit_price" value="' + fromCents(it.unit_price_cents) + '"' + ro + " /></td>" +
          '<td style="max-width:80px"><input type="text" data-k="discount" value="' + (it.discount_pct ? it.discount_pct + "%" : (it.discount_cents ? fromCents(it.discount_cents) : "")) + '" placeholder="0 or %"' + ro + " /></td>" +
          '<td style="text-align:center"><input type="checkbox" data-k="taxable"' + (it.taxable !== false ? " checked" : "") + (editable && inv.gst_enabled ? "" : " disabled") + " aria-label=\"GST applies to this line\" /></td>" +
          '<td class="num">' + money(it._line_cents || 0) + "</td>" +
          (editable ? '<td><span class="rowtools">' +
            '<button type="button" data-act="up" aria-label="Move up">↑</button>' +
            '<button type="button" data-act="down" aria-label="Move down">↓</button>' +
            (it._catalogue_id ? '<button type="button" data-act="savedefault" title="Save this as the new default price" aria-label="Save as default price">💾</button>' : "") +
            '<button type="button" data-act="del" aria-label="Remove">✕</button></span></td>' : "") +
          "</tr>";
      }).join("") + "</tbody></table>";

      wrap.querySelectorAll("tr[data-i]").forEach(function (tr) {
        var i = Number(tr.dataset.i);
        tr.querySelectorAll("[data-k]").forEach(function (input) {
          input.addEventListener("input", function () {
            var it = inv.items[i], k = input.dataset.k;
            if (k === "unit_price") it.unit_price_cents = toCents(input.value);
            else if (k === "quantity") it.quantity = Math.max(parseFloat(input.value) || 0, 0);
            else if (k === "taxable") it.taxable = input.checked;
            else if (k === "discount") {
              var v = input.value.trim();
              if (v.slice(-1) === "%") { it.discount_pct = parseFloat(v) || null; it.discount_cents = 0; }
              else { it.discount_cents = toCents(v); it.discount_pct = null; }
            } else it[k] = input.value;
            markDirty(); renderTotals(); refreshLineCell(tr, i);
          });
        });
        tr.querySelectorAll("[data-act]").forEach(function (btn) {
          btn.addEventListener("click", async function () {
            var act = btn.dataset.act, arr = inv.items;
            if (act === "del") { arr.splice(i, 1); }
            if (act === "up" && i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
            if (act === "down" && i < arr.length - 1) { var t2 = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t2; }
            if (act === "savedefault") {
              try {
                await api("/api/pricing/" + arr[i]._catalogue_id, { method: "PUT", body: { price_cents: arr[i].unit_price_cents } });
                toast("Saved as the new default price");
              } catch (e) { toast(e.message, true); }
              return;
            }
            markDirty(); renderItems(); renderTotals();
          });
        });
      });
    }
    function refreshLineCell(tr, i) {
      calcTotals(inv);
      var cells = tr.querySelectorAll("td.num");
      if (cells.length) cells[cells.length - 1].textContent = money(inv.items[i]._line_cents || 0);
    }

    function renderTotals() {
      var box = document.getElementById("totals-box");
      if (!box) return;
      collectSafe();
      var t = calcTotals(inv);
      var rows = "";
      rows += "<div><span>" + (inv.gst_enabled ? "Subtotal (ex. GST)" : "Subtotal") + "</span><span>" + money(t.subtotal_cents) + "</span></div>";
      if (t.invoice_discount_cents > 0) rows += "<div><span>" + esc(inv.discount_label || "Discount") + "</span><span>-" + money(t.invoice_discount_cents) + "</span></div>";
      if (inv.gst_enabled) rows += "<div><span>GST</span><span>" + money(t.gst_cents) + "</span></div>";
      rows += '<div class="grand"><span>Total' + (inv.gst_enabled ? " (incl. GST)" : "") + "</span><span>" + money(t.total_cents) + "</span></div>";
      if (inv.paid_cents > 0) {
        rows += "<div><span>Amount paid</span><span>-" + money(inv.paid_cents) + "</span></div>";
        rows += "<div><strong>Balance due</strong><strong>" + money(t.total_cents - inv.paid_cents) + "</strong></div>";
      }
      box.innerHTML = rows;
    }
    function collectSafe() { try { collect(); } catch (e) {} }

    function validateForIssue() {
      var s = state.settings || {};
      var t = calcTotals(inv);
      var problems = [];
      if (!(s.trading_name || s.legal_name)) problems.push("business name (Settings)");
      if (inv.gst_enabled && !s.abn) problems.push("your ABN (Settings — required for tax invoices)");
      if (!inv.issue_date) problems.push("issue date");
      if (!inv.due_date) problems.push("due date");
      var c = inv.client_snapshot || {};
      if (!(c.name || c.business)) problems.push("client name");
      if (!inv.items.length && !inv.scope_sections.length) problems.push("at least one line item or scope section");
      if (t.total_cents >= 100000 && !(c.address || inv.billing_address || c.abn)) {
        problems.push("customer address or ABN (required for invoices of $1,000+)");
      }
      inv.items.forEach(function (it, i) {
        if (Number(it.quantity) < 0) problems.push("line " + (i + 1) + ": quantity cannot be negative");
        if (Number(it.unit_price_cents) < 0) problems.push("line " + (i + 1) + ": price cannot be negative");
      });
      return problems;
    }

    function renderActions() {
      var box = document.getElementById("actions");
      if (!box) return;
      var b = [];
      if (editable) {
        b.push('<button class="btn btn--primary" id="act-save">Save Draft</button>');
        if (inv.id) {
          b.push('<a class="btn btn--soft" href="/api/invoices/pdf?id=' + inv.id + '" target="_blank" rel="noopener">Preview PDF</a>');
          b.push('<button class="btn btn--ghost" id="act-issue">Issue Invoice</button>');
          b.push('<button class="btn btn--soft" id="act-dup">Duplicate</button>');
          b.push('<button class="btn btn--danger" id="act-archive">Archive draft</button>');
        }
      } else {
        b.push('<a class="btn btn--soft" href="/api/invoices/pdf?id=' + inv.id + '" target="_blank" rel="noopener">Preview PDF</a>');
        b.push('<a class="btn btn--primary" href="/api/invoices/pdf?id=' + inv.id + '&download=1">Download PDF</a>');
        b.push('<button class="btn btn--soft" id="act-print">Print</button>');
        if (["issued", "part_paid"].indexOf(inv.status) !== -1) b.push('<button class="btn btn--primary" id="act-pay">Record payment</button>');
        b.push('<button class="btn btn--soft" id="act-dup">Duplicate</button>');
        if (["issued", "part_paid", "paid"].indexOf(inv.status) !== -1) b.push('<button class="btn btn--ghost" id="act-rev">Create Revision</button>');
        if (inv.status !== "void") b.push('<button class="btn btn--danger" id="act-void">Void</button>');
      }
      box.innerHTML = b.join("");

      var on = function (id2, fn) { var el = document.getElementById(id2); if (el) el.addEventListener("click", fn); };
      on("act-save", function () { saveDraft(); });
      on("act-issue", async function () {
        collect();
        var problems = validateForIssue();
        if (problems.length) { toast("Cannot issue yet — missing: " + problems.join("; "), true); return; }
        if (!(await saveDraft(true))) return;
        if (!confirm("Issue this invoice? It will be assigned the next sequential invoice number and become read-only.")) return;
        try {
          var out = await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "issue" } });
          toast("Issued as " + out.invoice_no);
          dirty = false; viewInvoiceEditor(inv.id);
        } catch (e) { toast(e.message, true); }
      });
      on("act-dup", async function () {
        try {
          if (editable) await saveDraft(true);
          var out = await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "duplicate" } });
          toast("Duplicated"); nav("/admin/invoices/" + out.id);
        } catch (e) { toast(e.message, true); }
      });
      on("act-archive", async function () {
        if (!confirm("Archive this draft? It will be hidden from the invoice list.")) return;
        try { await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "archive" } }); dirty = false; nav("/admin/invoices"); }
        catch (e) { toast(e.message, true); }
      });
      on("act-void", async function () {
        var reason = prompt("Void this invoice? Its number is kept and never reused.\n\nReason for voiding (required):");
        if (reason === null) return;
        try { await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "void", reason: reason } }); viewInvoiceEditor(inv.id); }
        catch (e) { toast(e.message, true); }
      });
      on("act-rev", async function () {
        if (!confirm("Create an editable revision? The original stays preserved exactly as issued.")) return;
        try { var out = await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "revision" } }); nav("/admin/invoices/" + out.id); }
        catch (e) { toast(e.message, true); }
      });
      on("act-print", function () { window.open("/api/invoices/pdf?id=" + inv.id, "_blank"); });
      on("act-pay", function () { paymentModal(); });
    }

    function paymentModal() {
      var t = calcTotals(inv);
      var balance = t.total_cents - inv.paid_cents;
      var div = document.createElement("div");
      div.className = "modal";
      div.innerHTML = '<div class="modal__card" role="dialog" aria-modal="true" aria-label="Record payment">' +
        "<h2>Record payment</h2><p class=\"hint\">Balance due: " + money(balance) + "</p>" +
        '<label class="f"><span>Date</span><input type="date" id="pm-date" value="' + new Date().toISOString().slice(0, 10) + '" /></label>' +
        '<label class="f"><span>Amount ($)</span><input type="text" id="pm-amount" value="' + fromCents(balance) + '" /></label>' +
        '<label class="f"><span>Method</span><select id="pm-method"><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></label>' +
        '<label class="f"><span>Reference</span><input type="text" id="pm-ref" /></label>' +
        '<label class="f"><span>Internal note</span><input type="text" id="pm-note" /></label>' +
        '<p class="error-text" id="pm-err" role="alert"></p>' +
        '<div class="btnrow"><button class="btn btn--primary" id="pm-save">Record payment</button>' +
        '<button class="btn btn--ghost" id="pm-cancel">Cancel</button></div></div>';
      document.body.appendChild(div);
      div.addEventListener("click", function (e) { if (e.target === div) div.remove(); });
      div.querySelector("#pm-cancel").addEventListener("click", function () { div.remove(); });
      div.querySelector("#pm-save").addEventListener("click", async function () {
        var amount = toCents(div.querySelector("#pm-amount").value);
        var err = div.querySelector("#pm-err");
        if (amount <= 0) { err.textContent = "Enter a valid amount."; return; }
        var allowOver = false;
        if (amount > balance) {
          if (!confirm("This payment exceeds the balance due. Record it anyway?")) return;
          allowOver = true;
        }
        try {
          await api("/api/invoices/" + inv.id, { method: "POST", body: { action: "payment", payment: {
            amount_cents: amount, paid_on: div.querySelector("#pm-date").value,
            method: div.querySelector("#pm-method").value, reference: div.querySelector("#pm-ref").value,
            note: div.querySelector("#pm-note").value, allow_overpay: allowOver,
          } } });
          div.remove(); toast("Payment recorded"); viewInvoiceEditor(inv.id);
        } catch (e) { err.textContent = e.message; }
      });
      div.querySelector("#pm-amount").focus();
    }

    /* ----- editor bindings ----- */
    function bindEditor() {
      if (!editable) return;
      ["f-ctype", "f-cname", "f-cbiz", "f-cemail", "f-cmobile", "f-caddr", "f-cabn", "f-paddr", "f-service",
        "f-po", "f-cref", "f-jref", "f-issue", "f-due", "f-terms-short", "f-dlabel", "f-dmode", "f-dval",
        "f-notes", "f-payinstr", "f-terms"].forEach(function (id2) {
        var el = document.getElementById(id2);
        if (el) el.addEventListener("input", function () { markDirty(); renderTotals(); });
      });
      var gst = document.getElementById("f-gst");
      if (gst) gst.addEventListener("change", function () {
        inv.gst_enabled = gst.checked; markDirty(); render();
      });
      var gstmode = document.getElementById("f-gstmode");
      if (gstmode) gstmode.addEventListener("change", function () { inv.prices_include_gst = gstmode.value === "inc"; markDirty(); renderTotals(); });

      document.getElementById("scope-add").addEventListener("click", function () {
        inv.scope_sections.push({ heading: "", body: "", bullets: [], inclusions: [], exclusions: [], notes: "" });
        markDirty(); renderScope();
      });
      document.getElementById("scope-template").addEventListener("change", function (e) {
        var v = e.target.value;
        if (!v) return;
        if (v.slice(0, 2) === "h:") {
          inv.scope_sections.push({ heading: v.slice(2), body: "", bullets: [], inclusions: [], exclusions: [], notes: "" });
        } else {
          (SERVICE_TEMPLATES[v.slice(2)] || []).forEach(function (h) {
            inv.scope_sections.push({ heading: h, body: "", bullets: [], inclusions: [], exclusions: [], notes: "" });
          });
        }
        e.target.value = "";
        markDirty(); renderScope();
      });

      document.getElementById("item-add").addEventListener("click", function () {
        inv.items.push({ category: "Labour", description: "", quantity: 1, unit: "Hour", unit_price_cents: 0, discount_cents: 0, discount_pct: null, taxable: true });
        markDirty(); renderItems(); renderTotals();
      });

      /* catalogue search */
      var catInput = document.getElementById("cat-search");
      var catBox = document.getElementById("cat-results");
      var catTimer;
      catInput.addEventListener("input", function () {
        clearTimeout(catTimer);
        var q = catInput.value.trim();
        if (!q) { catBox.innerHTML = ""; return; }
        catTimer = setTimeout(async function () {
          try {
            var items = await api("/api/pricing?q=" + encodeURIComponent(q));
            catBox.innerHTML = items.slice(0, 8).map(function (p, idx) {
              return '<button type="button" class="btn btn--soft btn--sm" data-cat="' + idx + '" style="margin:.15rem">' +
                esc(p.name) + (p.price_cents != null ? " · " + money(p.price_cents) : " · no price set") + "</button>";
            }).join("") || '<span class="hint">No matches.</span>';
            catBox.querySelectorAll("[data-cat]").forEach(function (btn) {
              btn.addEventListener("click", function () {
                var p = items[Number(btn.dataset.cat)];
                inv.items.push({
                  category: p.category, description: p.description || p.name, quantity: 1,
                  unit: p.unit, unit_price_cents: p.price_cents || 0, discount_cents: 0, discount_pct: null,
                  taxable: p.gst_treatment !== "gst_free", cost_cents: p.cost_cents, markup_pct: p.markup_pct,
                  _catalogue_id: p.id,
                });
                catBox.innerHTML = ""; catInput.value = "";
                markDirty(); renderItems(); renderTotals();
              });
            });
          } catch (e) { catBox.innerHTML = '<span class="hint">' + esc(e.message) + "</span>"; }
        }, 300);
      });

      /* existing-client picker */
      (async function () {
        try {
          var clients = await api("/api/clients");
          var sel = document.getElementById("f-clientpick");
          clients.forEach(function (cl) {
            var opt = document.createElement("option");
            opt.value = cl.id;
            opt.textContent = (cl.business_name || cl.full_name || "Unnamed") + (cl.business_name && cl.full_name ? " — " + cl.full_name : "");
            sel.appendChild(opt);
          });
          sel.addEventListener("change", function () {
            var cl = clients.filter(function (x) { return x.id === sel.value; })[0];
            if (!cl) return;
            inv.client_id = cl.id;
            document.getElementById("f-ctype").value = cl.customer_type;
            document.getElementById("f-cname").value = cl.full_name;
            document.getElementById("f-cbiz").value = cl.business_name;
            document.getElementById("f-cemail").value = cl.email;
            document.getElementById("f-cmobile").value = cl.mobile;
            document.getElementById("f-caddr").value = cl.billing_address;
            document.getElementById("f-cabn").value = cl.abn;
            if (cl.project_address && !document.getElementById("f-paddr").value) {
              document.getElementById("f-paddr").value = cl.project_address;
            }
            markDirty(); renderTotals();
          });
        } catch (e) {}
      })();
    }

    render();
    /* Prefill from ?client= (Clients page "New invoice" button) */
    var params = new URLSearchParams(location.search);
    var pre = params.get("client");
    if (pre && editable) {
      api("/api/clients/" + pre).then(function (cl) {
        inv.client_id = cl.id;
        inv.customer_type = cl.customer_type;
        inv.client_snapshot = { name: cl.full_name, business: cl.business_name, email: cl.email, mobile: cl.mobile, address: cl.billing_address, abn: cl.abn };
        inv.billing_address = cl.billing_address;
        inv.project_address = cl.project_address;
        render(); markDirty();
      }).catch(function () {});
    }
  }

  /* ================= clients ================= */
  async function viewClients() {
    shell("clients", "<h1>Clients</h1><p class=\"hint\">Loading…</p>");
    var q = state.clientQ || "";
    var clients;
    try { clients = await api("/api/clients" + (q ? "?q=" + encodeURIComponent(q) : "")); }
    catch (e) { document.getElementById("view").innerHTML = '<p class="error-text">' + esc(e.message) + "</p>"; return; }

    var html = '<div class="btnrow" style="justify-content:space-between;margin-bottom:1rem;"><h1 style="margin:0">Clients</h1>' +
      '<button class="btn btn--primary" id="cl-new">+ New Client</button></div>' +
      '<div class="card"><div class="btnrow" style="margin-bottom:.8rem;">' +
      '<input type="text" id="cl-q" placeholder="Search name, business, email or mobile…" style="max-width:340px" value="' + esc(q) + '" />' +
      '<button class="btn btn--soft btn--sm" id="cl-search">Search</button></div>' +
      '<div id="cl-form"></div>';

    if (!clients.length) html += '<p class="empty">No clients found.</p>';
    else {
      html += '<div class="tablewrap"><table><thead><tr><th>Client</th><th>Type</th><th>Contact</th><th>Addresses</th><th></th></tr></thead><tbody>' +
        clients.map(function (c) {
          return '<tr><td><strong>' + esc(c.business_name || c.full_name || "Unnamed") + "</strong>" +
            (c.business_name && c.full_name ? '<br><span class="hint">' + esc(c.full_name) + "</span>" : "") + "</td>" +
            "<td>" + (c.customer_type === "commercial" ? "Commercial" : "Residential") + "</td>" +
            "<td>" + esc(c.email || "") + (c.email && c.mobile ? "<br>" : "") + esc(c.mobile || "") + "</td>" +
            "<td>" + esc(c.billing_address || "") + (c.project_address ? '<br><span class="hint">Site: ' + esc(c.project_address) + "</span>" : "") + "</td>" +
            '<td><span class="btnrow">' +
            '<a class="btn btn--sm btn--primary" href="/admin/invoices/new?client=' + c.id + '" data-nav>New invoice</a>' +
            '<button class="btn btn--sm btn--soft" data-edit="' + c.id + '">Edit</button>' +
            '<button class="btn btn--sm btn--ghost" data-history="' + c.id + '">History</button>' +
            '<button class="btn btn--sm btn--danger" data-archive="' + c.id + '">Archive</button>' +
            "</span></td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    html += "</div>";
    document.getElementById("view").innerHTML = html;

    var doSearch = function () { state.clientQ = document.getElementById("cl-q").value.trim(); viewClients(); };
    document.getElementById("cl-search").addEventListener("click", doSearch);
    document.getElementById("cl-q").addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });
    document.getElementById("cl-new").addEventListener("click", function () { clientForm(null); });
    document.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        clientForm(clients.filter(function (c) { return c.id === b.dataset.edit; })[0]);
      });
    });
    document.querySelectorAll("[data-archive]").forEach(function (b) {
      b.addEventListener("click", async function () {
        if (!confirm("Archive this client? They will be hidden from the list.")) return;
        try { await api("/api/clients/" + b.dataset.archive, { method: "PUT", body: { archived: true } }); viewClients(); }
        catch (e) { toast(e.message, true); }
      });
    });
    document.querySelectorAll("[data-history]").forEach(function (b) {
      b.addEventListener("click", async function () {
        try {
          var c = await api("/api/clients/" + b.dataset.history);
          var list = (c.invoices || []).map(function (r) {
            return '<p><a href="/admin/invoices/' + r.id + '" data-nav>' + esc(r.invoice_no || "Draft") + "</a> — " +
              esc(r.status) + " — " + money(r.total_cents) + "</p>";
          }).join("") || '<p class="hint">No invoices for this client yet.</p>';
          document.getElementById("cl-form").innerHTML =
            '<fieldset><legend>Invoice history — ' + esc(c.business_name || c.full_name) + "</legend>" + list + "</fieldset>";
        } catch (e) { toast(e.message, true); }
      });
    });

    function clientForm(c) {
      var isNew = !c;
      c = c || { customer_type: "residential" };
      var f = function (k) { return esc(c[k] || ""); };
      document.getElementById("cl-form").innerHTML =
        '<fieldset><legend>' + (isNew ? "New client" : "Edit client") + "</legend><div class=\"grid2\">" +
        '<label class="f"><span>Type</span><select id="cf-type"><option value="residential"' + (c.customer_type === "residential" ? " selected" : "") + '>Residential</option><option value="commercial"' + (c.customer_type === "commercial" ? " selected" : "") + ">Commercial</option></select></label>" +
        '<label class="f"><span>Full name</span><input type="text" id="cf-name" value="' + f("full_name") + '" /></label>' +
        '<label class="f"><span>Business name</span><input type="text" id="cf-biz" value="' + f("business_name") + '" /></label>' +
        '<label class="f"><span>Contact person</span><input type="text" id="cf-contact" value="' + f("contact_person") + '" /></label>' +
        '<label class="f"><span>Email</span><input type="email" id="cf-email" value="' + f("email") + '" /></label>' +
        '<label class="f"><span>Mobile</span><input type="text" id="cf-mobile" value="' + f("mobile") + '" /></label>' +
        '<label class="f"><span>Billing address</span><input type="text" id="cf-bill" value="' + f("billing_address") + '" /></label>' +
        '<label class="f"><span>Project / service address</span><input type="text" id="cf-proj" value="' + f("project_address") + '" /></label>' +
        '<label class="f"><span>ABN</span><input type="text" id="cf-abn" value="' + f("abn") + '" /></label>' +
        '<label class="f"><span>Notes</span><input type="text" id="cf-notes" value="' + f("notes") + '" /></label>' +
        '</div><div class="btnrow"><button class="btn btn--primary" id="cf-save">' + (isNew ? "Create client" : "Save changes") + "</button>" +
        '<button class="btn btn--ghost" id="cf-cancel">Cancel</button></div>' +
        '<p class="error-text" id="cf-err" role="alert"></p></fieldset>';
      document.getElementById("cf-cancel").addEventListener("click", function () { document.getElementById("cl-form").innerHTML = ""; });
      document.getElementById("cf-save").addEventListener("click", async function () {
        var body = {
          customer_type: document.getElementById("cf-type").value,
          full_name: document.getElementById("cf-name").value.trim(),
          business_name: document.getElementById("cf-biz").value.trim(),
          contact_person: document.getElementById("cf-contact").value.trim(),
          email: document.getElementById("cf-email").value.trim(),
          mobile: document.getElementById("cf-mobile").value.trim(),
          billing_address: document.getElementById("cf-bill").value.trim(),
          project_address: document.getElementById("cf-proj").value.trim(),
          abn: document.getElementById("cf-abn").value.trim(),
          notes: document.getElementById("cf-notes").value.trim(),
        };
        var err = document.getElementById("cf-err");
        if (!body.full_name && !body.business_name) { err.textContent = "Enter a name or business name."; return; }
        try {
          if (isNew) await api("/api/clients", { method: "POST", body: body });
          else await api("/api/clients/" + c.id, { method: "PUT", body: body });
          toast("Client saved"); viewClients();
        } catch (e) { err.textContent = e.message; }
      });
    }
  }

  /* ================= pricing ================= */
  async function viewPricing() {
    shell("pricing", "<h1>Pricing</h1><p class=\"hint\">Loading…</p>");
    var items;
    try { items = await api("/api/pricing"); }
    catch (e) { document.getElementById("view").innerHTML = '<p class="error-text">' + esc(e.message) + "</p>"; return; }

    var html = '<div class="btnrow" style="justify-content:space-between;margin-bottom:1rem;"><h1 style="margin:0">Pricing catalogue</h1>' +
      '<button class="btn btn--primary" id="pr-new">+ New item</button></div>' +
      '<div class="card"><p class="hint">Reusable pre-priced items for the invoice builder. Starter items ship without prices — enter your own rates and they\'ll be saved as your defaults.</p>' +
      '<div id="pr-form"></div>';
    if (!items.length) html += '<p class="empty">No catalogue items.</p>';
    else {
      html += '<div class="tablewrap"><table><thead><tr><th>Item</th><th>Category</th><th>Unit</th><th class="num">Default price</th><th>GST</th><th></th></tr></thead><tbody>' +
        items.map(function (p) {
          return "<tr><td><strong>" + esc(p.name) + "</strong>" + (p.description ? '<br><span class="hint">' + esc(p.description) + "</span>" : "") + "</td>" +
            "<td>" + esc(p.category) + "</td><td>" + esc(p.unit) + "</td>" +
            '<td class="num">' + (p.price_cents != null ? money(p.price_cents) : '<span class="hint">not set</span>') + "</td>" +
            "<td>" + (p.gst_treatment === "gst_free" ? "GST-free" : "Taxable") + "</td>" +
            '<td><span class="btnrow"><button class="btn btn--sm btn--soft" data-edit="' + p.id + '">Edit</button>' +
            '<button class="btn btn--sm btn--danger" data-archive="' + p.id + '">Archive</button></span></td></tr>';
        }).join("") + "</tbody></table></div>";
    }
    html += "</div>";
    document.getElementById("view").innerHTML = html;

    document.getElementById("pr-new").addEventListener("click", function () { priceForm(null); });
    document.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { priceForm(items.filter(function (p) { return p.id === b.dataset.edit; })[0]); });
    });
    document.querySelectorAll("[data-archive]").forEach(function (b) {
      b.addEventListener("click", async function () {
        if (!confirm("Archive this catalogue item?")) return;
        try { await api("/api/pricing/" + b.dataset.archive, { method: "PUT", body: { archived: true } }); viewPricing(); }
        catch (e) { toast(e.message, true); }
      });
    });

    function priceForm(p) {
      var isNew = !p;
      p = p || { gst_treatment: "taxable", unit: "Each", category: "Other" };
      document.getElementById("pr-form").innerHTML =
        '<fieldset><legend>' + (isNew ? "New catalogue item" : "Edit item") + '</legend><div class="grid2">' +
        '<label class="f"><span>Name <span class="req">*</span></span><input type="text" id="pf-name" value="' + esc(p.name || "") + '" /></label>' +
        '<label class="f"><span>Category</span><select id="pf-cat">' + CATEGORIES.map(function (cg) { return "<option" + (p.category === cg ? " selected" : "") + ">" + cg + "</option>"; }).join("") + "</select></label>" +
        '<label class="f"><span>Default description</span><input type="text" id="pf-desc" value="' + esc(p.description || "") + '" /></label>' +
        '<label class="f"><span>Unit</span><select id="pf-unit">' + UNITS.map(function (un) { return "<option" + (p.unit === un ? " selected" : "") + ">" + un + "</option>"; }).join("") + "</select></label>" +
        '<label class="f"><span>Default selling price ($)</span><input type="text" id="pf-price" value="' + (p.price_cents != null ? fromCents(p.price_cents) : "") + '" placeholder="leave blank if not set" /></label>' +
        '<label class="f"><span>GST treatment</span><select id="pf-gst"><option value="taxable"' + (p.gst_treatment === "taxable" ? " selected" : "") + '>Taxable</option><option value="gst_free"' + (p.gst_treatment === "gst_free" ? " selected" : "") + ">GST-free</option></select></label>" +
        '<label class="f"><span>Internal cost ($, optional)</span><input type="text" id="pf-cost" value="' + (p.cost_cents != null ? fromCents(p.cost_cents) : "") + '" /></label>' +
        '<label class="f"><span>Markup % (optional)</span><input type="number" step="0.1" id="pf-markup" value="' + (p.markup_pct != null ? p.markup_pct : "") + '" /></label>' +
        '<label class="f" style="grid-column:1/-1"><span>Notes</span><input type="text" id="pf-notes" value="' + esc(p.notes || "") + '" /></label>' +
        '</div><div class="btnrow"><button class="btn btn--primary" id="pf-save">Save</button>' +
        '<button class="btn btn--ghost" id="pf-cancel">Cancel</button></div>' +
        '<p class="error-text" id="pf-err" role="alert"></p></fieldset>';
      document.getElementById("pf-cancel").addEventListener("click", function () { document.getElementById("pr-form").innerHTML = ""; });
      document.getElementById("pf-save").addEventListener("click", async function () {
        var priceRaw = document.getElementById("pf-price").value.trim();
        var costRaw = document.getElementById("pf-cost").value.trim();
        var body = {
          name: document.getElementById("pf-name").value.trim(),
          category: document.getElementById("pf-cat").value,
          description: document.getElementById("pf-desc").value.trim(),
          unit: document.getElementById("pf-unit").value,
          price_cents: priceRaw === "" ? null : toCents(priceRaw),
          gst_treatment: document.getElementById("pf-gst").value,
          cost_cents: costRaw === "" ? null : toCents(costRaw),
          markup_pct: parseFloat(document.getElementById("pf-markup").value) || null,
          notes: document.getElementById("pf-notes").value.trim(),
        };
        var err = document.getElementById("pf-err");
        if (!body.name) { err.textContent = "Name is required."; return; }
        try {
          if (isNew) await api("/api/pricing", { method: "POST", body: body });
          else await api("/api/pricing/" + p.id, { method: "PUT", body: body });
          toast("Saved"); viewPricing();
        } catch (e) { err.textContent = e.message; }
      });
    }
  }

  /* ================= settings ================= */
  var SETTINGS_FIELDS = [
    ["legal_name", "Legal business name", "text"],
    ["trading_name", "Trading name", "text"],
    ["owner_name", "Owner / contact name", "text"],
    ["abn", "ABN", "text"],
    ["address", "Business / service address", "text"],
    ["phone", "Phone", "text"],
    ["email", "Email", "email"],
    ["website", "Website", "text"],
    ["bank_name", "Bank name", "text"],
    ["account_name", "Account name", "text"],
    ["bsb", "BSB", "text"],
    ["account_number", "Account number", "text"],
    ["payment_terms", "Default payment terms", "text"],
    ["invoice_prefix", "Invoice number prefix", "text"],
    ["next_invoice_no", "Next invoice number", "number"],
    ["currency", "Currency", "text"],
    ["date_format", "Date format", "text"],
  ];

  async function viewSettings() {
    shell("settings", "<h1>Settings</h1><p class=\"hint\">Loading…</p>");
    var s;
    try { s = await api("/api/settings"); state.settings = s; }
    catch (e) { document.getElementById("view").innerHTML = '<p class="error-text">' + esc(e.message) + "</p>"; return; }

    var html = "<h1>Business settings</h1><div class=\"card\"><div class=\"grid2\">";
    SETTINGS_FIELDS.forEach(function (f) {
      html += '<label class="f"><span>' + f[1] + '</span><input type="' + f[2] + '" id="st-' + f[0] + '" value="' + esc(s[f[0]] == null ? "" : s[f[0]]) + '" /></label>';
    });
    html += '<label class="f"><span><input type="checkbox" id="st-gst"' + (s.gst_registered ? " checked" : "") + " /> Registered for GST?</span>" +
      '<span class="hint">When on, invoices become “TAX INVOICE” and your ABN is required.</span></label>' +
      '<label class="f"><span>GST rate (%)</span><input type="number" step="0.1" id="st-gstrate" value="' + (s.gst_rate_bp / 100) + '" /></label>' +
      '<label class="f" style="grid-column:1/-1"><span>Default invoice notes</span><textarea id="st-notes">' + esc(s.default_notes) + "</textarea></label>" +
      '<label class="f" style="grid-column:1/-1"><span>Default invoice terms</span><textarea id="st-terms">' + esc(s.default_terms) + "</textarea></label>" +
      "</div>" +
      '<div class="btnrow"><button class="btn btn--primary" id="st-save">Save settings</button>' +
      '<span class="savestate" id="st-state"></span></div>' +
      '<p class="hint" style="margin-top:1rem">Invoice settings should be confirmed with your accountant or bookkeeper.</p>';

    var missing = [];
    if (!s.legal_name) missing.push("legal business name");
    if (!s.abn) missing.push("ABN");
    if (!s.address) missing.push("business address");
    if (!s.bank_name || !s.bsb || !s.account_number) missing.push("bank details");
    if (missing.length) {
      html += '<p class="hint" style="color:var(--warn)">⚠ Still needed before issuing your first final invoice: ' + missing.join(", ") + ".</p>";
    }
    html += "</div>";
    document.getElementById("view").innerHTML = html;

    document.getElementById("st-save").addEventListener("click", async function () {
      var body = {};
      SETTINGS_FIELDS.forEach(function (f) {
        var v = document.getElementById("st-" + f[0]).value;
        body[f[0]] = f[2] === "number" ? parseInt(v, 10) || 1 : v.trim();
      });
      body.gst_registered = document.getElementById("st-gst").checked;
      body.gst_rate_bp = Math.round((parseFloat(document.getElementById("st-gstrate").value) || 10) * 100);
      body.default_notes = document.getElementById("st-notes").value;
      body.default_terms = document.getElementById("st-terms").value;
      var stateEl = document.getElementById("st-state");
      stateEl.textContent = "Saving…"; stateEl.className = "savestate saving";
      try {
        state.settings = await api("/api/settings", { method: "PUT", body: body });
        stateEl.textContent = "Saved ✓"; stateEl.className = "savestate saved";
      } catch (e) { stateEl.textContent = e.message; stateEl.className = "savestate error"; }
    });
  }

  /* ================= router ================= */
  async function route() {
    window.onbeforeunload = null;
    var p = location.pathname.replace(/\/$/, "");
    if (p === "/admin" || p === "") { nav("/admin/invoices"); return; }
    if (p === "/admin/login") { viewLogin(); return; }

    if (!state.email) {
      try { var me = await api("/api/auth/me"); state.email = me.email; }
      catch (e) {
        if (location.pathname !== "/admin/login") nav("/admin/login");
        return;
      }
    }
    if (p === "/admin/invoices") return viewInvoices();
    if (p === "/admin/invoices/new") return viewInvoiceEditor("new");
    var m = p.match(/^\/admin\/invoices\/([0-9a-f-]{8,})$/);
    if (m) return viewInvoiceEditor(m[1]);
    if (p === "/admin/clients") return viewClients();
    if (p === "/admin/pricing") return viewPricing();
    if (p === "/admin/settings") return viewSettings();
    nav("/admin/invoices");
  }

  route();
})();
