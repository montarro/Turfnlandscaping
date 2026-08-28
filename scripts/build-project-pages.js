/* =====================================================================
   Generator: /projects hub, /projects/<slug> case studies, and
   /before-and-after (which reuses the same data — no duplicate DB).
   Self-contained chrome (header/footer duplicated, not imported), so
   nothing here can alter the homepage, /quote or global files.
   /before-and-after is generated but stays OUT of the sitemap and nav
   until at least five genuine before/after pairs exist.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const PROJECTS = require("./projects-data.js");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://turfandlandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";

const CATEGORIES = ["Turf", "Retaining Walls", "Paving & Stepping Stones", "Hard Landscaping", "Soft Landscaping", "Garden Transformations", "Property Maintenance"];
const usedCategories = CATEGORIES.filter((c) => PROJECTS.some((p) => p.categories.indexOf(c) !== -1));
const pairs = PROJECTS.filter((p) => p.before && p.after);

const img = (name) => `/assets/images/${name}.webp`;

/* ---------- shared chrome ---------- */
const CHROME = require("./chrome.js");
const HEADER = CHROME.HEADER;

const FOOTER = CHROME.FOOTER + `
  <script src="/main.js" defer></script>
  <script src="/projects.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
</body>
</html>`;

function head({ title, desc, canonical, image, ld }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#1d3527" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Turf and Landscaping" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/service-pages.css" />
  <link rel="stylesheet" href="/projects.css" />
  <script type="application/ld+json">
  ${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>`;
}

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function ctaBand() {
  return `<section class="section section--tint">
      <div class="wrap">
        <div class="cta-band">
          <h2>Ready to transform your outdoor space?</h2>
          <p>Free on-site quotes across Melbourne's west and inner suburbs — a clear fixed price, no obligation.</p>
          <div class="cta-band__actions">
            <a class="btn btn--ondark" href="/quote">Request a Free Quote</a>
            <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function card(p) {
  return `<article class="pj-card" data-categories="${p.categories.join("|")}">
    <a class="pj-card__media" href="/projects/${p.slug}" tabindex="-1" aria-hidden="true">
      <img src="${img(p.hero)}" alt="" loading="lazy" width="1200" height="900" />
    </a>
    <div class="pj-card__body">
      <div class="pj-card__tags">${p.categories.map((c) => `<span>${c}</span>`).join("")}</div>
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      <a class="pj-card__link" href="/projects/${p.slug}">View Project ${arrow}</a>
    </div>
  </article>`;
}

/* ---------- hub page ---------- */
function hubPage() {
  const canonical = `${SITE}/projects`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Projects — Turf and Landscaping", url: canonical,
        description: "Completed turf and landscaping projects across Melbourne's west and inner suburbs." },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Projects", item: canonical },
      ] },
    ],
  };
  return head({
    title: "Completed Landscaping Projects Melbourne | Turf and Landscaping",
    desc: "Real completed projects: turf installation, retaining walls, planters and garden transformations across Melbourne's west and inner suburbs. See the work for yourself.",
    canonical, image: img(PROJECTS[0].hero), ld,
  }) + `
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img(PROJECTS[0].hero)}" alt="" width="1200" height="900" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Projects</nav>
        <h1>Real Projects. Built Properly.</h1>
        <p>Completed turf, landscaping and garden transformations from real homes across Melbourne's west and inner suburbs.</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="pj-filters" role="group" aria-label="Filter projects by service">
          <button class="pj-filter active" data-filter="all" aria-pressed="true">All Projects</button>
          ${usedCategories.map((c) => `<button class="pj-filter" data-filter="${c}" aria-pressed="false">${c}</button>`).join("\n          ")}
        </div>
        <div class="pj-grid" id="pj-grid">
          ${PROJECTS.map(card).join("\n          ")}
        </div>
        <p class="pj-empty" id="pj-empty" hidden>No projects in this category yet — check back soon.</p>
      </div>
    </section>
${ctaBand()}
  </main>
${FOOTER}`;
}

/* ---------- detail pages ---------- */
function detailPage(p, prev, next) {
  const canonical = `${SITE}/projects/${p.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: p.title, description: p.summary, image: SITE + img(p.hero),
        author: { "@type": "Organization", name: "Turf and Landscaping" },
        publisher: { "@type": "Organization", name: "Turf and Landscaping", logo: { "@type": "ImageObject", url: SITE + "/assets/logo-turf-and-landscaping.png" } },
        mainEntityOfPage: canonical },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Projects", item: SITE + "/projects" },
        { "@type": "ListItem", position: 3, name: p.title, item: canonical },
      ] },
    ],
  };
  const hasPair = p.before && p.after;
  return head({
    title: `${p.title} | Turf and Landscaping`,
    desc: p.summary,
    canonical, image: img(p.hero), ld,
  }) + `
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img(p.hero)}" alt="${p.gallery[0] ? "" : ""}" width="1200" height="900" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/projects">Projects</a><span>/</span>${p.title}</nav>
        <h1>${p.title}</h1>
        <p>${p.summary}</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap pj-layout">
        <div>
          <div class="prose">
            <h2>The brief</h2>
            <p>${p.challenge}</p>
            <h2>What we did</h2>
          </div>
          <ul class="sp-checklist">
            ${p.scope.map((s) => `<li>${s}</li>`).join("\n            ")}
          </ul>
          <div class="prose">
            <h2>How we approached it</h2>
            <p>${p.approach}</p>
            <h2>The result</h2>
            <p>${p.outcome}</p>
          </div>

          ${hasPair ? `
          <h2 class="pj-h2">Before &amp; after</h2>
          <p class="hint-line">Drag the handle — or use the arrow keys — to compare.</p>
          <div class="ba" data-ba tabindex="0" role="slider" aria-label="Before and after comparison. Use arrow keys to move the divider." aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <img class="ba__before" src="${img(p.before.img)}" alt="${p.before.alt}" loading="lazy" width="1200" height="900" />
            <img class="ba__after" src="${img(p.after.img)}" alt="${p.after.alt}" loading="lazy" width="1200" height="900" />
            <span class="ba__label ba__label--after">After</span>
            <span class="ba__label ba__label--before">Before</span>
            <div class="ba__divider"></div>
            <div class="ba__handle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 6l-4 6 4 6M16 6l4 6-4 6"/></svg></div>
          </div>
          <noscript><p>Interactive comparison needs JavaScript — both photos appear in the gallery below.</p></noscript>` : ""}

          <h2 class="pj-h2">Project gallery</h2>
          <div class="pj-gallery">
            ${p.gallery.map((g) => `<figure><img src="${img(g.img)}" alt="${g.alt}" loading="lazy" width="1200" height="900" /></figure>`).join("\n            ")}
          </div>

          <div class="pj-pagenav">
            ${prev ? `<a href="/projects/${prev.slug}">&larr; ${prev.title}</a>` : "<span></span>"}
            ${next ? `<a href="/projects/${next.slug}">${next.title} &rarr;</a>` : "<span></span>"}
          </div>
        </div>

        <aside class="sp-side">
          <div class="sp-side__card">
            <h2>Project snapshot</h2>
            <ul class="pj-facts">
              <li><span>Services</span><strong>${p.categories.join(", ")}</strong></li>
              ${p.completed ? `<li><span>Completed</span><strong>${p.completed}</strong></li>` : ""}
            </ul>
          </div>
          <div class="sp-side__card">
            <h2>Services on this project</h2>
            <div class="sp-related">
              ${p.relatedServices.map(([href, label]) => `<a href="${href}">${label} ${arrow}</a>`).join("\n              ")}
            </div>
          </div>
          <div class="sp-side__card">
            <h2>Want a result like this?</h2>
            <p>Free on-site quotes — a clear fixed price, no obligation.</p>
            <a class="btn btn--primary" href="/quote">Request a Quote</a>
          </div>
          <div class="sp-side__card">
            <h2>Prefer to call?</h2>
            <a class="sp-side__phone" href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
            <p>Mon–Fri 7am–7pm · Sat–Sun 8am–5pm</p>
          </div>
        </aside>
      </div>
    </section>
${ctaBand()}
  </main>
${FOOTER}`;
}

/* ---------- before & after page (unpublished until ≥5 real pairs) ---------- */
function beforeAfterPage() {
  const canonical = `${SITE}/before-and-after`;
  const published = pairs.length >= 5;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Before & After", item: canonical },
      ] },
    ],
  };
  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Landscaping Before &amp; After Transformations | Turf and Landscaping Victoria</title>
  <meta name="description" content="See genuine before-and-after turf, paving, retaining-wall and garden transformations completed across Melbourne's west and inner suburbs." />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#1d3527" />
  <meta name="robots" content="${published ? "index, follow" : "noindex, follow"}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Landscaping Before &amp; After Transformations | Turf and Landscaping Victoria" />
  <meta property="og:description" content="Genuine before-and-after landscaping transformations from Melbourne's west and inner suburbs." />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}${img(pairs[0] ? pairs[0].after.img : PROJECTS[0].hero)}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/service-pages.css" />
  <link rel="stylesheet" href="/projects.css" />
  <script type="application/ld+json">
  ${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img(pairs[0] ? pairs[0].after.img : PROJECTS[0].hero)}" alt="" width="1200" height="900" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Before &amp; After</nav>
        <span class="eyebrow eyebrow--light">Real Transformations</span>
        <h1>Landscaping Before &amp; After Transformations</h1>
        <p>Genuine completed turf and landscaping projects from across Melbourne's west and inner suburbs — drag the divider to see the difference for yourself.</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Free Quote</a>
          <a class="btn btn--outline-light" href="/projects">View All Projects</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        ${pairs.map((p, i) => `
        <article class="pj-ba-item">
          <h2>${p.title}</h2>
          <p class="hint-line">${p.categories.join(" · ")}${pairs.length > 1 ? ` · ${i + 1} of ${pairs.length}` : ""} — drag the handle or use arrow keys to compare.</p>
          <div class="ba" data-ba tabindex="0" role="slider" aria-label="Before and after: ${p.title}. Use arrow keys to move the divider." aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <img class="ba__before" src="${img(p.before.img)}" alt="${p.before.alt}" ${i === 0 ? "" : 'loading="lazy"'} width="1200" height="900" />
            <img class="ba__after" src="${img(p.after.img)}" alt="${p.after.alt}" ${i === 0 ? "" : 'loading="lazy"'} width="1200" height="900" />
            <span class="ba__label ba__label--after">After</span>
            <span class="ba__label ba__label--before">Before</span>
            <div class="ba__divider"></div>
            <div class="ba__handle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 6l-4 6 4 6M16 6l4 6-4 6"/></svg></div>
          </div>
          <p>${p.summary}</p>
          <a class="pj-card__link" href="/projects/${p.slug}">View Full Project ${arrow}</a>
        </article>`).join("\n")}
        ${pairs.length < 5 ? '<p class="hint-line" style="margin-top:2rem">More transformations are being documented — this page grows as each project is completed and photographed.</p>' : ""}
      </div>
    </section>
${ctaBand()}
  </main>
${FOOTER}`;
  return { html, published };
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUTDIR, "projects"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "projects.html"), hubPage());
console.log("wrote projects.html");
PROJECTS.forEach((p, i) => {
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  fs.writeFileSync(path.join(OUTDIR, "projects", `${p.slug}.html`), detailPage(p, prev, next));
  console.log("wrote projects/" + p.slug + ".html");
});
const ba = beforeAfterPage();
fs.writeFileSync(path.join(OUTDIR, "before-and-after.html"), ba.html);
console.log("wrote before-and-after.html (" + (ba.published ? "published" : "noindex — fewer than 5 genuine pairs") + ")");
console.log("Done:", PROJECTS.length + 2, "pages");
