/* =====================================================================
   Generator: the private blog review area.

     /review        — Sebastian's page: read each article, leave notes,
                      mark Approved / Changes requested
     /review/owner  — read-only summary of his notes and statuses

   Which articles are in the round comes from content/blog-review.json,
   shared with api/review.js. Article metadata is read from the same
   content/blog/*.md the blog build uses, so titles and heroes can't
   drift. Both pages are noindex, unlinked from the site, and only work
   with the secret key in the URL (?k=…), which api/review.js checks.

   Nothing here publishes anything: the articles stay drafts until their
   frontmatter says published: true.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const POSTS_DIR = path.join(ROOT, "content", "blog");
const CONFIG = require(path.join(ROOT, "content", "blog-review.json"));

function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error("no frontmatter");
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^"|"$/g, "");
  }
  return { data, body: m[2] };
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- articles in this round ---------- */
const all = fs.readdirSync(POSTS_DIR).filter((f) => /^\d+-.*\.md$/.test(f)).map((file) => {
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    file, slug: data.slug, title: data.title, heroAlt: data.heroAlt,
    published: String(data.published).trim() === "true",
    readMinutes: Math.max(3, Math.round(words / 210)),
    standfirst: (body.split(/\n\s*\n/).find((p) => p.trim() && !/^#/.test(p.trim())) || "").trim(),
  };
});
const articles = CONFIG.slugs.map((slug, i) => {
  const a = all.find((p) => p.slug === slug);
  if (!a) throw new Error(`blog-review.json: no article with slug "${slug}"`);
  if (a.published) throw new Error(`blog-review.json: "${slug}" is already published — the review round is for drafts only`);
  return Object.assign({ n: i + 1 }, a);
});

/* ---------- shared shell ---------- */
const CSS = `
  *,*::before,*::after{box-sizing:border-box}
  :root{--cream:#faf8f2;--white:#fff;--sage:#e9efdd;--forest:#1d3527;--forest-700:#2e5138;--ink:#22302a;--muted:#64715f;--line:#e2dcc9;--gold:#e9a70a;--error:#b4231d;--ok:#2e5138;--r:16px}
  html{color-scheme:light}
  body{margin:0;background:var(--cream);color:var(--ink);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-text-size-adjust:100%}
  .top{background:var(--forest);color:#fff;padding:1.1rem 1rem}
  .top .in{max-width:820px;margin:0 auto;display:flex;align-items:center;gap:.8rem;flex-wrap:wrap}
  .top img{height:34px;width:auto}
  .top h1{font-size:1.05rem;margin:0;font-weight:600}
  .top small{opacity:.8;display:block;font-size:.85rem}
  .wrap{max-width:820px;margin:0 auto;padding:1rem}
  .intro{background:var(--sage);border-radius:var(--r);padding:1rem 1.1rem;margin:.5rem 0 1.2rem;font-size:.95rem}
  .intro p{margin:.3rem 0}
  .card{background:var(--white);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-bottom:1.4rem;box-shadow:0 2px 10px rgba(29,53,39,.05)}
  .card__hero{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;background:var(--sage)}
  .card__body{padding:1.1rem 1.1rem 1.25rem}
  .kicker{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 .3rem}
  .card h2{font-size:1.25rem;line-height:1.3;margin:0 0 .5rem}
  .stand{color:var(--muted);margin:0 0 .9rem;font-size:.95rem}
  .row{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center}
  .btn{appearance:none;border:1px solid var(--forest-700);border-radius:999px;background:var(--forest-700);color:#fff;font:inherit;font-weight:600;padding:.7rem 1.1rem;min-height:46px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.4rem;line-height:1.1}
  .btn:disabled{opacity:.55;cursor:default}
  .btn--ghost{background:transparent;color:var(--forest)}
  .btn--ok{background:var(--ok);border-color:var(--ok)}
  .btn--warn{background:#fff;color:#7a4a00;border-color:#d9a441}
  .btn--danger{background:transparent;color:var(--error);border-color:transparent;padding:.4rem .6rem;min-height:36px;font-weight:500;font-size:.85rem}
  .btn.is-on{outline:3px solid rgba(233,167,10,.55);outline-offset:2px}
  .badge{display:inline-flex;align-items:center;gap:.35rem;border-radius:999px;padding:.3rem .75rem;font-size:.82rem;font-weight:600;background:#f0ede4;color:var(--muted)}
  .badge--approved{background:#dff0e2;color:#1f5a30}
  .badge--changes{background:#fdf3d6;color:#7a4a00}
  .preview{margin:.9rem 0 0}
  .preview iframe{width:100%;height:72vh;border:1px solid var(--line);border-radius:12px;background:#fff;margin-top:.6rem}
  .preview summary{cursor:pointer;color:var(--forest);font-weight:600;list-style:none;display:inline-flex;align-items:center;gap:.4rem}
  .preview summary::-webkit-details-marker{display:none}
  .preview summary::before{content:"▸";font-size:.9em}
  .preview[open] summary::before{content:"▾"}
  h3{font-size:.95rem;margin:1.2rem 0 .5rem}
  .notes{list-style:none;margin:0;padding:0}
  .note{border:1px solid var(--line);border-radius:12px;padding:.7rem .85rem;margin-bottom:.55rem;background:#fcfbf7}
  .note p{margin:0;white-space:pre-wrap;word-wrap:break-word}
  .note .meta{display:flex;justify-content:space-between;align-items:center;gap:.5rem;color:var(--muted);font-size:.8rem;margin-top:.35rem}
  .empty{color:var(--muted);font-size:.92rem;margin:0 0 .5rem}
  textarea{width:100%;min-height:110px;font:inherit;padding:.75rem .85rem;border:1px solid var(--line);border-radius:12px;background:#fff;resize:vertical}
  textarea:focus,.btn:focus-visible{outline:3px solid rgba(46,81,56,.35);outline-offset:1px}
  .status{margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line)}
  .hint{color:var(--muted);font-size:.85rem;margin:.5rem 0 0}
  .toast{position:fixed;left:50%;bottom:1.2rem;transform:translateX(-50%);background:var(--forest);color:#fff;padding:.7rem 1.1rem;border-radius:999px;font-size:.92rem;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s;max-width:90vw;text-align:center}
  .toast.show{opacity:1}
  .toast.err{background:var(--error)}
  .gate{max-width:560px;margin:3rem auto;padding:1.5rem;background:#fff;border:1px solid var(--line);border-radius:var(--r);text-align:center}
  .sum{display:grid;gap:.4rem;margin:0 0 1.2rem;padding:0;list-style:none}
  .sum li{display:flex;justify-content:space-between;gap:.8rem;align-items:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:.7rem .9rem}
  .sum a{color:var(--forest);font-weight:600;text-decoration:none}
  footer{text-align:center;color:var(--muted);font-size:.82rem;padding:2rem 1rem}
  @media (max-width:480px){.btn{flex:1 1 auto;justify-content:center}.preview iframe{height:80vh}}
`;

function shell({ title, body, script }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <meta name="referrer" content="no-referrer" />
  <title>${esc(title)}</title>
  <link rel="icon" href="/assets/favicon.png?v=3" type="image/png" sizes="192x192" />
  <style>${CSS}</style>
</head>
<body>
  ${body}
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script>${script}</script>
</body>
</html>`;
}

/* Shared browser-side helpers: key from the URL, authenticated fetch, toast. */
const COMMON_JS = `
  var KEY = new URLSearchParams(location.search).get("k") || "";
  try { if (KEY) sessionStorage.setItem("blogReviewKey", KEY); else KEY = sessionStorage.getItem("blogReviewKey") || ""; } catch (e) {}
  function api(method, body) {
    return fetch("/api/review", {
      method: method, headers: { "Content-Type": "application/json", "x-review-key": KEY },
      body: body ? JSON.stringify(body) : undefined, cache: "no-store"
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Request failed"); return d; }); });
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = "toast"; }, isErr ? 4200 : 2200);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function when(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  }
  var LABEL = { pending: "Not reviewed yet", approved: "Approved", changes: "Changes requested" };
  function badge(status) { return '<span class="badge badge--' + status + '">' + LABEL[status] + '</span>'; }
  function gate(msg) {
    document.getElementById("main").innerHTML = '<div class="gate"><h2>' + esc(msg) + '</h2><p>Ask Khaled for the current review link.</p></div>';
  }
`;

const header = (sub) => `<header class="top"><div class="in">
    <div><h1>Bastiano Landscaping · Blog review</h1><small>${esc(sub)}</small></div>
  </div></header>`;

/* ---------- Sebastian's page ---------- */
function reviewerPage() {
  const cards = articles.map((a) => `
    <article class="card" id="card-${a.slug}" data-slug="${a.slug}">
      <img class="card__hero" src="/assets/images/blog-${a.slug}.webp" alt="${esc(a.heroAlt)}" loading="lazy" width="1200" height="800" />
      <div class="card__body">
        <p class="kicker">Article ${a.n} of ${articles.length} · ${a.readMinutes} min read</p>
        <h2>${esc(a.title)}</h2>
        <p class="stand">${esc(a.standfirst)}</p>
        <div class="row">
          <a class="btn" href="/blog/${a.slug}" target="_blank" rel="noopener">Read the full article ↗</a>
          <span class="badge badge--pending" data-badge>Loading…</span>
        </div>
        <details class="preview" data-preview>
          <summary>Preview it here instead</summary>
          <iframe data-src="/blog/${a.slug}" title="Preview: ${esc(a.title)}" loading="lazy"></iframe>
        </details>

        <h3>Your notes and suggested changes</h3>
        <ul class="notes" data-notes></ul>
        <textarea data-text placeholder="Anything wrong, missing or worth changing? Prices, timing, technical details, wording…" maxlength="4000"></textarea>
        <div class="row" style="margin-top:.6rem">
          <button class="btn btn--ghost" type="button" data-add>Add note</button>
        </div>

        <div class="status">
          <h3 style="margin-top:0">Your verdict</h3>
          <div class="row">
            <button class="btn btn--ok" type="button" data-status="approved">✓ Approve</button>
            <button class="btn btn--warn" type="button" data-status="changes">Changes requested</button>
          </div>
          <p class="hint">Approving does not publish anything — Khaled schedules each article once you're happy with it.</p>
        </div>
      </div>
    </article>`).join("\n");

  const body = `
  ${header(CONFIG.round)}
  <main class="wrap" id="main">
    <div class="intro">
      <p><strong>Hi ${esc(CONFIG.reviewer)} — three articles are ready for your check.</strong></p>
      <p>For each one: read it, add any notes, then tap <strong>Approve</strong> or <strong>Changes requested</strong>. Everything saves straight away and Khaled sees it on his side.</p>
    </div>
    ${cards}
  </main>
  <footer>Private review page · not listed on the website · ${esc(CONFIG.round)}</footer>`;

  const script = COMMON_JS + `
  var state = {};
  function render(rec) {
    var card = document.querySelector('[data-slug="' + rec.slug + '"]'); if (!card) return;
    state[rec.slug] = rec;
    card.querySelector("[data-badge]").outerHTML = badge(rec.status).replace('class="badge', 'data-badge class="badge');
    card.querySelectorAll("[data-status]").forEach(function (b) { b.classList.toggle("is-on", b.dataset.status === rec.status); });
    var list = card.querySelector("[data-notes]");
    list.innerHTML = rec.notes.length ? rec.notes.map(function (n) {
      return '<li class="note"><p>' + esc(n.text) + '</p><div class="meta"><span>' + esc(n.by) + ' · ' + when(n.at) + '</span><button class="btn btn--danger" type="button" data-del="' + n.id + '">Remove</button></div></li>';
    }).join("") : '<li class="empty">No notes yet.</li>';
  }
  function busy(card, on) { card.querySelectorAll("button").forEach(function (b) { b.disabled = on; }); }
  function act(card, payload, okMsg) {
    busy(card, true);
    return api("POST", payload).then(function (rec) { render(rec); if (okMsg) toast(okMsg); })
      .catch(function (e) { toast(e.message, true); })
      .then(function () { busy(card, false); });
  }
  document.querySelectorAll(".card").forEach(function (card) {
    var slug = card.dataset.slug;
    card.querySelector("[data-add]").addEventListener("click", function () {
      var ta = card.querySelector("[data-text]"); var text = ta.value.trim();
      if (!text) { toast("Write a note first", true); ta.focus(); return; }
      act(card, { slug: slug, action: "note", text: text }, "Note saved").then(function () { if (state[slug] && state[slug].notes.some(function (n) { return n.text === text; })) ta.value = ""; });
    });
    card.querySelectorAll("[data-status]").forEach(function (b) {
      b.addEventListener("click", function () {
        act(card, { slug: slug, action: "status", status: b.dataset.status }, b.dataset.status === "approved" ? "Marked as approved" : "Marked as changes requested");
      });
    });
    card.addEventListener("click", function (e) {
      var del = e.target.closest("[data-del]"); if (!del) return;
      if (!confirm("Remove this note?")) return;
      act(card, { slug: slug, action: "delete_note", id: del.dataset.del }, "Note removed");
    });
    var det = card.querySelector("[data-preview]");
    det.addEventListener("toggle", function () { var f = det.querySelector("iframe"); if (det.open && !f.src) f.src = f.dataset.src; });
  });
  if (!KEY) { gate("This page needs its private link"); }
  else api("GET").then(function (d) { d.blogs.forEach(render); }).catch(function (e) { gate(e.message); });
  `;
  return shell({ title: "Blog review — Bastiano Landscaping", body, script });
}

/* ---------- owner view ---------- */
function ownerPage() {
  const body = `
  ${header("Owner view — " + CONFIG.round)}
  <main class="wrap" id="main">
    <div class="intro">
      <p><strong>What ${esc(CONFIG.reviewer)} has said about each article.</strong> Read-only — this updates every time you open or refresh it.</p>
      <p><button class="btn btn--ghost" type="button" id="refresh">Refresh</button> <span class="hint" id="stamp" style="display:inline"></span></p>
    </div>
    <ul class="sum" id="sum"></ul>
    <div id="detail"></div>
  </main>
  <footer>Private owner view · not listed on the website</footer>`;

  const meta = JSON.stringify(articles.map((a) => ({ slug: a.slug, title: a.title, n: a.n })));
  const script = COMMON_JS + `
  var META = ${meta};
  function load() {
    api("GET").then(function (d) {
      var by = {}; d.blogs.forEach(function (b) { by[b.slug] = b; });
      document.getElementById("sum").innerHTML = META.map(function (m) {
        var r = by[m.slug] || { status: "pending", notes: [] };
        return '<li><a href="#a-' + m.slug + '">' + m.n + '. ' + esc(m.title) + '</a>' + badge(r.status) + '</li>';
      }).join("");
      document.getElementById("detail").innerHTML = META.map(function (m) {
        var r = by[m.slug] || { status: "pending", notes: [], updated_at: null };
        return '<article class="card" id="a-' + m.slug + '"><div class="card__body">' +
          '<p class="kicker">Article ' + m.n + '</p><h2>' + esc(m.title) + '</h2>' +
          '<div class="row">' + badge(r.status) + (r.status_at ? '<span class="hint" style="margin:0">set ' + when(r.status_at) + '</span>' : '') +
          '<a class="btn btn--ghost" href="/blog/' + m.slug + '" target="_blank" rel="noopener">Open draft ↗</a></div>' +
          '<h3>Notes (' + r.notes.length + ')</h3><ul class="notes">' +
          (r.notes.length ? r.notes.map(function (n) { return '<li class="note"><p>' + esc(n.text) + '</p><div class="meta"><span>' + esc(n.by) + ' · ' + when(n.at) + '</span></div></li>'; }).join("") : '<li class="empty">No notes yet.</li>') +
          '</ul></div></article>';
      }).join("");
      document.getElementById("stamp").textContent = "Loaded " + when(new Date().toISOString());
    }).catch(function (e) { gate(e.message); });
  }
  document.getElementById("refresh").addEventListener("click", load);
  if (!KEY) gate("This page needs its private link"); else load();
  `;
  return shell({ title: "Blog review — owner view", body, script });
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUTDIR, "review"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "review.html"), reviewerPage());
fs.writeFileSync(path.join(OUTDIR, "review", "owner.html"), ownerPage());
console.log(`Review area: /review + /review/owner for ${articles.length} draft(s): ${articles.map((a) => a.slug).join(", ")}`);
