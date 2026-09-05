/* =====================================================================
   Generator: /blog index + /blog/<slug> articles.

   Source of truth is content/blog/*.md — the drafts are imported verbatim,
   this file only decides how they are presented. Self-contained apart from
   chrome.js, so nothing here can alter the homepage, /quote or /projects.

     node scripts/build-blog.js        (run by scripts/build-site.js)

   No runtime dependencies — the markdown subset the drafts use (h1-h3,
   bullet and numbered lists, paragraphs, inline links) is rendered by hand
   rather than pulling in a parser for four constructs.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const CHROME = require("./chrome.js");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const POSTS_DIR = path.join(ROOT, "content", "blog");
const SITE = "https://bastianolandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";
const AUTHOR = "Sebastian Caus";
const AUTHOR_LINE = `By ${AUTHOR}, owner of Bastiano Landscaping`;

/* ---------- draft link paths -> live routes ----------
   The drafts were written against likely paths. Every entry here has been
   checked against a real generated page; an unmapped /path that does not
   exist aborts the build rather than shipping a dead link. */
const LINK_MAP = {
  "/services/natural-turf": "/services/natural-turf-installation",
  "/services/synthetic-turf": "/services/synthetic-turf-installation",
  "/services/custom-landscaping": "/services/complete-landscape-transformations",
  "/services/plants-mulch": "/services/plants-garden-beds-mulch",
  "/services/pavers-stepping-stones": "/services/paving",
  // no standalone /commercial page exists; commercial work is covered by the
  // property-maintenance service page
  "/commercial": "/services/property-maintenance",
};

/* Routes this site actually serves, for the dead-link check below. */
const KNOWN_ROUTES = new Set(["/", "/quote", "/projects", "/services", "/before-and-after", "/blog"]);
for (const f of fs.readdirSync(path.join(OUTDIR, "services")).filter((f) => f.endsWith(".html"))) {
  KNOWN_ROUTES.add("/services/" + f.replace(/\.html$/, ""));
}
for (const f of fs.readdirSync(path.join(OUTDIR, "projects")).filter((f) => f.endsWith(".html"))) {
  KNOWN_ROUTES.add("/projects/" + f.replace(/\.html$/, ""));
}

/* ---------- topic grouping for the index filters ----------
   Derived from each draft's relatedServices, so the filters can never drift
   from the articles' own metadata. */
const TOPIC_OF_SERVICE = {
  "Natural Turf": "Turf",
  "Synthetic Turf": "Turf",
  "Turf Repair and Patching": "Turf",
  "Custom Landscaping": "Landscaping & Design",
  "Garden Design": "Landscaping & Design",
  "Hard Landscaping": "Landscaping & Design",
  "Pavers and Stepping Stones": "Paving & Structures",
  "Retaining Walls": "Paving & Structures",
  "Plants and Mulch": "Plants & Gardens",
  "Soft Landscaping": "Plants & Gardens",
  "Property Maintenance": "Maintenance & Aftercare",
  "Garden Care": "Maintenance & Aftercare",
  "Lawn Mowing": "Maintenance & Aftercare",
  "Commercial Landscaping": "Commercial",
};
const TOPIC_ORDER = ["Turf", "Landscaping & Design", "Paving & Structures", "Plants & Gardens", "Maintenance & Aftercare", "Commercial"];

/* Service name -> live route, for the "related services" links on an article. */
const SERVICE_ROUTE = {
  "Natural Turf": "/services/natural-turf-installation",
  "Synthetic Turf": "/services/synthetic-turf-installation",
  "Turf Repair and Patching": "/services/turf-repair-patching",
  "Custom Landscaping": "/services/complete-landscape-transformations",
  "Garden Design": "/services/garden-design",
  "Hard Landscaping": "/services/hard-landscaping",
  "Pavers and Stepping Stones": "/services/paving",
  "Retaining Walls": "/services/retaining-walls",
  "Plants and Mulch": "/services/plants-garden-beds-mulch",
  "Soft Landscaping": "/services/soft-landscaping",
  "Property Maintenance": "/services/property-maintenance",
  "Garden Care": "/services/garden-care",
  "Lawn Mowing": "/services/lawn-mowing",
  "Commercial Landscaping": "/services/property-maintenance",
};

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Straight quotes and dashes to typographic ones. The drafts already use
   curly quotes in prose; this only tidies what the markdown syntax leaves. */
const smart = (s) => s.replace(/---/g, "—").replace(/ -- /g, " — ");

function remap(href) {
  if (LINK_MAP[href]) return LINK_MAP[href];
  return href;
}

/* ---------- frontmatter ---------- */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error("no frontmatter");
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    } else {
      v = v.replace(/^"|"$/g, "");
    }
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}

/* ---------- markdown ---------- */
function inline(text, report) {
  let out = esc(smart(text));
  // [label](/path) — the drafts only ever link internally
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const to = remap(href);
    if (to.startsWith("/")) report.links.push(to);
    return `<a href="${to}">${label}</a>`;
  });
  return out;
}

/* An article that is still a draft has no public URL worth sending anyone to,
   so a cross-reference to one keeps its sentence but loses its hyperlink. This
   runs after every draft is loaded, which is what lets a single article be
   published later by flipping one frontmatter field: its inbound links come
   back automatically on the next build. */
function unlinkUnpublished(html, isLive, note) {
  return html.replace(/<a href="(\/blog\/[^"]+)">([^<]*)<\/a>/g, (whole, href, label) => {
    const slug = href.slice(6);
    if (isLive(slug)) return whole;
    note.push(`${href} (still a draft)`);
    return label;
  });
}

function renderMarkdown(body, report) {
  const lines = body.split("\n");
  const out = [];
  let list = null; // "ul" | "ol"
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (let raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }

    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) { closeList(); const n = h[1].length; out.push(`<h${n}>${inline(h[2], report)}</h${n}>`); continue; }

    // the drafts open with an H1 that repeats the title — the page already
    // renders one H1 from the frontmatter, so drop it
    if (/^#\s+/.test(line)) { closeList(); continue; }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (list !== "ul") { closeList(); out.push('<ul class="bl-list">'); list = "ul"; }
      out.push(`<li>${inline(ul[1], report)}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (list !== "ol") { closeList(); out.push('<ol class="bl-list">'); list = "ol"; }
      out.push(`<li>${inline(ol[1], report)}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line, report)}</p>`);
  }
  closeList();
  return out.join("\n            ");
}

/* ---------- load ---------- */
const posts = fs.readdirSync(POSTS_DIR)
  .filter((f) => /^\d+-.*\.md$/.test(f))
  .sort()
  .map((file) => {
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
    const report = { links: [] };
    const html = renderMarkdown(body, report);
    const words = body.split(/\s+/).filter(Boolean).length;
    const services = (data.relatedServices || []).filter((s) => SERVICE_ROUTE[s]);
    const topics = [...new Set((data.relatedServices || []).map((s) => TOPIC_OF_SERVICE[s]).filter(Boolean))];
    return {
      file, ...data, body, html,
      published: String(data.published).trim() === "true",
      links: report.links,
      services, topics,
      readMinutes: Math.max(3, Math.round(words / 210)),
      // first paragraph of the draft, used as the card standfirst
      standfirst: (body.split(/\n\s*\n/).find((p) => p.trim() && !/^#/.test(p.trim())) || "").trim(),
    };
  });

if (posts.length === 0) throw new Error("no blog drafts found in content/blog");

const bySlug = new Map(posts.map((p) => [p.slug, p]));

/* ---------- published vs draft ----------
   `published: true` plus a real datePublished is the whole switch. Every
   article is still generated, so Sebastian can read one before it goes live,
   but a draft is noindex, absent from /blog, absent from the sitemap, and
   never appears in another article's related reading or body links. */
const live = posts.filter((p) => p.published);
const drafts = posts.filter((p) => !p.published);
const isLive = (slug) => bySlug.has(slug) && bySlug.get(slug).published;

if (!live.length) { console.error("Blog build failed — no article has published: true"); process.exit(1); }
for (const p of live) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.datePublished || "")) {
    console.error(`Blog build failed — ${p.file} is published: true but datePublished is not a real date.`);
    process.exit(1);
  }
}
for (const p of drafts) {
  if (p.datePublished) {
    console.error(`Blog build failed — ${p.file} is a draft but carries datePublished "${p.datePublished}". Dates are set when an article actually goes live.`);
    process.exit(1);
  }
}

// links from any article to a still-unpublished one lose their anchor
const unlinked = [];
for (const p of posts) p.html = unlinkUnpublished(p.html, isLive, unlinked);

const usedTopics = TOPIC_ORDER.filter((t) => live.some((p) => p.topics.includes(t)));

/* ---------- dead-link check ----------
   Article-to-article links resolve against the drafts themselves; everything
   else must be a route this build actually produces. */
const badLinks = [];
for (const p of posts) {
  for (const href of p.links) {
    const clean = href.split("#")[0];
    if (clean.startsWith("/blog/")) {
      if (!bySlug.has(clean.slice(6))) badLinks.push(`${p.file}: ${href} (no such article)`);
    } else if (!KNOWN_ROUTES.has(clean)) {
      badLinks.push(`${p.file}: ${href} (no such route)`);
    }
  }
}
if (badLinks.length) {
  console.error("Blog build failed — internal links point at routes that do not exist:");
  badLinks.forEach((b) => console.error("  " + b));
  process.exit(1);
}

/* ---------- related articles ----------
   Scored by shared services first, then shared topic, so the picks follow the
   subject matter rather than publication order. */
function relatedTo(post) {
  return live
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const services = p.services.filter((s) => post.services.includes(s)).length;
      const topics = p.topics.filter((t) => post.topics.includes(t)).length;
      // an article the draft already links to is a deliberate pairing
      const linked = post.links.includes("/blog/" + p.slug) ? 3 : 0;
      return { p, score: services * 2 + topics + linked };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.p.file.localeCompare(b.p.file))
    .slice(0, 3)
    .map((r) => r.p);
}

/* ---------- shared markup ---------- */
const heroImg = (p) => `/assets/images/blog-${p.slug}.webp`;
const cardImg = (p) => `/assets/images/blog-${p.slug}-card.webp`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function humanDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function head({ title, desc, canonical, image, ld, ogType = "website", robots = "index, follow" }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1390874685269007');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=1390874685269007&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#1d3527" />
  <meta name="robots" content="${robots}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Bastiano Landscaping" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}${image}" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE}${image}" />
  <link rel="icon" href="/assets/favicon.png" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/favicon.png" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/service-pages.css" />
  <link rel="stylesheet" href="/blog.css" />
  <script type="application/ld+json">
  ${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body class="editorial">`;
}

const FOOTER = CHROME.FOOTER + CHROME.FOOTER_SCRIPTS + `
</body>
</html>`;

function ctaBand(heading, body) {
  return `<section class="section section--tint">
      <div class="wrap">
        <div class="cta-band">
          <h2>${heading}</h2>
          <p>${body}</p>
          <div class="cta-band__actions">
            <a class="btn btn--ondark" href="/quote">Request a Free Quote</a>
            <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </section>`;
}

/* ---------- index ---------- */
function indexPage() {
  const canonical = `${SITE}/blog`;
  const featured = live[0];
  const rest = live.slice(1);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "Landscaping Advice — Bastiano Landscaping",
        url: canonical,
        description: "Practical turf and landscaping advice for Melbourne properties, written by Sebastian Caus.",
        publisher: { "@type": "Organization", name: "Bastiano Landscaping", url: SITE },
        blogPost: live.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE}/blog/${p.slug}`,
          datePublished: p.datePublished,
          author: { "@type": "Person", name: AUTHOR },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: "Advice", item: canonical },
        ],
      },
    ],
  };

  return head({
    title: "Landscaping & Turf Advice for Melbourne Properties | Bastiano Landscaping",
    desc: "Practical turf, paving, retaining wall and garden advice for Melbourne homes and properties — written by Sebastian Caus, owner of Bastiano Landscaping.",
    canonical, image: heroImg(featured), ld,
  }) + `
${CHROME.HEADER}
  <main id="main">
    <section class="section bl-intro">
      <div class="wrap">
        <nav class="breadcrumb breadcrumb--onlight" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Advice</nav>
        <h1>Landscaping <em class="accent-i">Advice</em></h1>
        <p class="bl-intro__lead">Practical guidance on turf, paving, retaining walls and garden care for Melbourne properties — the questions we are asked most often on site, answered properly. Written by Sebastian Caus, owner of Bastiano Landscaping.</p>
      </div>
    </section>

    <section class="bl-featured-band">
      <div class="wrap">
        <article class="bl-featured">
          <a class="bl-featured__media" href="/blog/${featured.slug}" tabindex="-1" aria-hidden="true">
            <img src="${heroImg(featured)}" alt="" width="1600" height="1067" fetchpriority="high" />
          </a>
          <div class="bl-featured__body">
            <span class="bl-kicker">Start here</span>
            <h2><a href="/blog/${featured.slug}">${esc(featured.title)}</a></h2>
            <p>${esc(featured.standfirst)}</p>
            <div class="bl-meta">
              <span>${esc(featured.topics[0] || "Advice")}</span>
              <span>${featured.readMinutes} min read</span>
            </div>
            <a class="bl-more" href="/blog/${featured.slug}">Read the guide ${arrow}</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="bl-filters" role="group" aria-label="Filter advice by topic">
          <button class="bl-filter active" data-filter="all" aria-pressed="true">All Topics</button>
          ${usedTopics.map((t) => `<button class="bl-filter" data-filter="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("\n          ")}
        </div>
        <div class="bl-grid" id="bl-grid">
          ${rest.map(indexCard).join("\n          ")}
        </div>
        <p class="bl-empty" id="bl-empty" hidden>No articles on that topic yet.</p>
      </div>
    </section>
${ctaBand("Want this looked at on your own property?", "Free on-site quotes across Melbourne's west and inner suburbs — a clear fixed price, no obligation.")}
  </main>
${FOOTER.replace("</body>", '  <script src="/blog.js" defer></script>\n</body>')}`;
}

function indexCard(p) {
  return `<article class="bl-card" data-topics="${esc(p.topics.join("|"))}">
            <a class="bl-card__media" href="/blog/${p.slug}" tabindex="-1" aria-hidden="true">
              <img src="${cardImg(p)}" alt="" loading="lazy" width="800" height="600" />
            </a>
            <div class="bl-card__body">
              <span class="bl-card__topic">${esc(p.topics[0] || "Advice")}</span>
              <h3><a href="/blog/${p.slug}">${esc(p.title)}</a></h3>
              <p>${esc(p.standfirst)}</p>
              <div class="bl-meta"><span>${p.readMinutes} min read</span></div>
            </div>
          </article>`;
}

/* ---------- article ---------- */
function articlePage(p) {
  const canonical = `${SITE}/blog/${p.slug}`;
  const related = relatedTo(p);
  const articleNode = {
        "@type": "BlogPosting",
        headline: p.title,
        description: p.metaDescription,
        image: SITE + heroImg(p),
        datePublished: p.datePublished,
        dateModified: p.dateReviewed,
        inLanguage: "en-AU",
        author: { "@type": "Person", name: AUTHOR, jobTitle: "Owner, Bastiano Landscaping" },
        publisher: {
          "@type": "Organization",
          name: "Bastiano Landscaping",
          url: SITE,
          logo: { "@type": "ImageObject", url: SITE + "/assets/logo-turf-and-landscaping.png" },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };
  const breadcrumbNode = {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: "Advice", item: SITE + "/blog" },
          { "@type": "ListItem", position: 3, name: p.title, item: canonical },
        ],
  };
  const ld = {
    "@context": "https://schema.org",
    "@graph": p.published ? [articleNode, breadcrumbNode] : [breadcrumbNode],
  };

  return head({
    title: p.metaTitle + " | Bastiano Landscaping",
    desc: p.metaDescription,
    canonical, image: heroImg(p), ld, ogType: "article",
    robots: p.published ? "index, follow" : "noindex, nofollow",
  }) + `
${CHROME.HEADER}
  <main id="main">
    <article class="bl-article">
      <header class="bl-head">
        <div class="wrap bl-head__inner">
          <nav class="breadcrumb breadcrumb--onlight" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Advice</a><span>/</span>${esc(p.title)}</nav>
          <h1>${esc(p.title)}</h1>
          <p class="bl-standfirst">${esc(p.standfirst)}</p>
          <div class="bl-byline">
            <span class="bl-byline__author">${AUTHOR_LINE}</span>
            <span class="bl-byline__dates">${p.published
              ? `Published <time datetime="${p.datePublished}">${humanDate(p.datePublished)}</time>
              · Last reviewed <time datetime="${p.dateReviewed}">${humanDate(p.dateReviewed)}</time>
              · ${p.readMinutes} min read`
              : `Not yet published · ${p.readMinutes} min read`}</span>
          </div>
          ${p.published ? "" : `<p class="bl-draftnote" role="note">
            <strong>Draft — not published.</strong> This page is not listed on the blog, not in the sitemap, and marked noindex. It goes live by setting <code>published: true</code> and a real <code>datePublished</code> in <code>content/blog/${p.file}</code>.
          </p>`}
        </div>
      </header>

      <figure class="bl-hero">
        <div class="wrap">
          <img src="${heroImg(p)}" alt="${esc(p.heroAlt)}" width="1600" height="1067" fetchpriority="high" />
          <figcaption>${esc(p.heroAlt)} — a completed Bastiano Landscaping project.</figcaption>
        </div>
      </figure>

      <div class="wrap bl-layout">
        <div class="bl-body">
          <div class="prose bl-prose">
            ${p.html}
          </div>

          <aside class="bl-endcta">
            <h2>Talk it through with Sebastian</h2>
            <p>Every property is different. A free on-site quote gets you a clear fixed price and an honest read on what your yard actually needs.</p>
            <a class="btn btn--primary" href="/quote">Request a Free Quote</a>
            <a class="bl-endcta__phone" href="tel:${PHONE_TEL}">or call ${PHONE_DISPLAY}</a>
          </aside>
        </div>

        <aside class="bl-side">
          <div class="sp-side__card">
            <h2>Services in this article</h2>
            <div class="sp-related">
              ${p.services.map((s) => `<a href="${SERVICE_ROUTE[s]}">${esc(s)} ${arrow}</a>`).join("\n              ")}
            </div>
          </div>
          <div class="sp-side__card">
            <h2>Prefer to call?</h2>
            <a class="sp-side__phone" href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
            <p>Mon–Fri 7am–9pm · Sat 7am–5pm · Sun closed</p>
          </div>
        </aside>
      </div>

      ${related.length ? `<section class="section section--tint bl-related">
        <div class="wrap">
          <h2>Related reading</h2>
          <div class="bl-grid bl-grid--related">
            ${related.map(indexCard).join("\n            ")}
          </div>
        </div>
      </section>` : ""}
    </article>
  </main>
${FOOTER}`;
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUTDIR, "blog"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "blog.html"), indexPage());
console.log("wrote blog.html");
for (const p of posts) {
  fs.writeFileSync(path.join(OUTDIR, "blog", `${p.slug}.html`), articlePage(p));
  console.log("wrote blog/" + p.slug + ".html");
}
console.log("Done:", posts.length + 1, "blog pages");

/* ---------- sitemap guard ----------
   sitemap.xml is hand-maintained (build-site.js copies it verbatim). It must
   list every published article and no draft — checked both ways, because
   either mistake is silent: a missing entry hides a live article from Google,
   and a stale entry submits an unfinished one. */
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const listed = (u) => sitemap.includes(`<loc>${SITE}${u}</loc>`);
const missing = ["/blog", ...live.map((p) => "/blog/" + p.slug)].filter((u) => !listed(u));
const stale = drafts.map((p) => "/blog/" + p.slug).filter(listed);
if (missing.length || stale.length) {
  console.error("Blog build failed — sitemap.xml is out of step with content/blog:");
  missing.forEach((u) => console.error("  missing (published): " + u));
  stale.forEach((u) => console.error("  present (draft, must be removed): " + u));
  process.exit(1);
}

console.log(`\nPublished (${live.length}) — in /blog, in sitemap.xml, indexable:`);
live.forEach((p) => console.log(`  ${p.datePublished}  /blog/${p.slug}`));
console.log(`\nDrafts (${drafts.length}) — built for review only: noindex, not in /blog, not in sitemap.xml:`);
drafts.forEach((p) => console.log(`  /blog/${p.slug}`));
if (unlinked.length) {
  console.log("\nBody links dropped because their target is still a draft (text kept):");
  [...new Set(unlinked)].forEach((u) => console.log("  " + u));
}
