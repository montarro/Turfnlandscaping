/* =====================================================================
   Generator: local area pages, /areas/<slug>, from scripts/areas-data.js.

     node scripts/build-area-pages.js      (run by scripts/build-site.js)

   Also the guard for the service-area register: the suburbs in
   areas-data.js REGIONS must match the chips and the areaServed schema in
   index.html exactly, so the site never claims two different coverages.

   A page is generated for every AREAS entry so it can be previewed, but a
   draft (published: false) is noindex, carries a draft banner, shows its
   [[EDITORIAL: ...]] notes, and is never in the sitemap (check-sitemap.js
   ignores noindex pages). Publishing requires at least one confirmed local
   project and no editorial notes left anywhere on the page — the build
   stops otherwise. Suburbs without a page are unaffected: they stay in the
   register and in the quote form's reach.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const CHROME = require("./chrome.js");
const { REGIONS, AREAS } = require("./areas-data.js");
const PROJECTS = require("./projects-data.js");
const DATA = require("./services-data.js");
const BLOG = require("./blog-index.js");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://bastianolandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";
const img = (name) => `/assets/images/${name}.webp`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- register guard: areas-data.js vs index.html ---------- */
{
  const home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const chips = [...home.matchAll(/<span class="chip chip--static">([^<]+)<\/span>/g)].map((m) => m[1].trim());
  const schema = [...home.matchAll(/\{ "@type": "City", "name": "([^"]+)" \}/g)].map((m) => m[1]).filter((n) => n !== "Melbourne");
  const register = REGIONS.flatMap((r) => r.suburbs);
  const same = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
  if (!same(chips, register) || !same(schema, register)) {
    const diff = (x, y) => x.filter((n) => !y.includes(n));
    throw new Error(`service-area register out of step — areas-data.js has ${register.length} suburbs; index.html chips ${chips.length} (missing: ${diff(register, chips).join(", ") || "none"}; extra: ${diff(chips, register).join(", ") || "none"}); index.html schema ${schema.length} (missing: ${diff(register, schema).join(", ") || "none"}; extra: ${diff(schema, register).join(", ") || "none"})`);
  }
  for (const r of REGIONS) {
    const count = new RegExp(`<span class="region__name">${r.name.replace(/&/g, "&amp;")}</span><span class="region__count">${r.suburbs.length} suburbs</span>`);
    if (!count.test(home)) throw new Error(`index.html: the "${r.name}" region must show "${r.suburbs.length} suburbs"`);
  }
  console.log(`service-area register: ${register.length} suburbs, index.html chips and schema match`);
}

/* ---------- content helpers ---------- */
const ALL_SERVICES = [...DATA.primary, ...DATA.secondary, ...DATA.extra];
const service = (slug) => {
  const s = ALL_SERVICES.find((x) => x.slug === slug);
  if (!s) throw new Error(`areas: no service page ${slug}`);
  return s;
};
/* The three services the growth plan prioritises, as the hub cards. */
const PRIORITY = [
  ["complete-landscape-transformations", "svc-custom-landscaping", "Complete transformations", "The whole yard planned and built as one job: clearing, levels, walls, paths, turf and planting in the right order."],
  ["natural-turf-installation", "svc-natural-turf", "Natural turf", "Instant turf supplied and laid on cleared, levelled and drained ground, then watered in with care notes."],
  ["synthetic-turf-installation", "svc-synthetic-turf", "Synthetic turf", "A compacted crushed-rock base with proper falls, the turf seamed and secured, infilled and power brushed."],
];
const LIVE_POSTS = BLOG.publishedPosts();
const ALL_SLUGS = new Set(BLOG.allPosts().map((p) => p.slug));

/* A text field is either verified prose or a draft-only editorial note. */
const isNote = (t) => /^\[\[EDITORIAL:/.test(String(t || "").trim());
function noteOrProse(t) {
  if (!t) return "";
  const m = String(t).trim().match(/^\[\[EDITORIAL:\s*(.*?)\]\]$/);
  if (m) return `<p class="bl-editorial" role="note"><strong>Editorial note (draft only):</strong> ${esc(m[1])}</p>`;
  return `<p>${esc(t)}</p>`;
}

function head({ title, desc, canonical, robots, ld }) {
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
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bastiano Landscaping" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/assets/images/og-bastiano-landscaping.jpg" />
  <meta property="og:image:alt" content="Bastiano Landscaping logo" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE}/assets/images/og-bastiano-landscaping.jpg" />
  <link rel="icon" href="/assets/favicon.png?v=3" type="image/png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" sizes="180x180" />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-800.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-700.woff2" crossorigin />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/service-pages.css" />
  <link rel="stylesheet" href="/projects.css" />
  <link rel="stylesheet" href="/blog.css" />
  <script type="application/ld+json">
  ${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body class="editorial">`;
}

const FOOTER = CHROME.FOOTER + `
  <script src="/main.js" defer></script>
  <script src="/projects.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;

/* ---------- guards ---------- */
function validate(a) {
  const region = REGIONS.find((r) => r.name === a.region);
  if (!region) throw new Error(`areas/${a.slug}: unknown region "${a.region}"`);
  if (!region.suburbs.includes(a.name)) throw new Error(`areas/${a.slug}: "${a.name}" is not in the ${a.region} register`);
  for (const lp of a.localProjects || []) {
    if (!PROJECTS.some((p) => p.slug === lp.slug)) throw new Error(`areas/${a.slug}: localProjects lists "${lp.slug}" but scripts/projects-data.js has no such project`);
    if (!lp.note || isNote(lp.note)) throw new Error(`areas/${a.slug}: localProjects "${lp.slug}" needs a confirmed note`);
  }
  for (const g of a.guides || []) {
    if (!ALL_SLUGS.has(g)) throw new Error(`areas/${a.slug}: guides lists "${g}" but content/blog has no such article`);
  }
  if (a.published) {
    const notes = [a.siteNotes, a.evidenceNote].filter(isNote);
    if (notes.length) throw new Error(`areas/${a.slug} is published: true but still carries ${notes.length} [[EDITORIAL: ...]] note(s). Supply the facts or keep it a draft.`);
    if (!(a.localProjects || []).length) throw new Error(`areas/${a.slug} is published: true but has no confirmed local project — a local page without local evidence is a doorway page.`);
  }
}

/* ---------- page ---------- */
function areaPage(a) {
  validate(a);
  const canonical = `${SITE}/areas/${a.slug}`;
  const h1 = `Landscaping and turf installation in ${a.name}`;
  const title = `Landscaping & Turf Installation ${a.name} | Bastiano Landscaping`;
  const desc = `Complete landscape transformations, natural turf and synthetic turf for ${a.name} homes. One team, a free on-site quote and a clear fixed price. Call ${PHONE_DISPLAY}.`;
  const graph = [
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Service Areas", item: SITE + "/#areas" },
      { "@type": "ListItem", position: 3, name: a.name, item: canonical },
    ] },
  ];
  if (a.published) {
    graph.unshift({ "@type": "Service", name: `Landscaping and turf installation in ${a.name}`, serviceType: "Landscaping", url: canonical,
      provider: { "@type": "HomeAndConstructionBusiness", "@id": SITE + "/#business", name: "Bastiano Landscaping", telephone: PHONE_TEL, url: SITE + "/" },
      areaServed: { "@type": "City", name: a.name } });
  }
  const ld = { "@context": "https://schema.org", "@graph": graph };
  const guides = (a.guides || []).map((slug) => LIVE_POSTS.find((p) => p.slug === slug)).filter(Boolean).slice(0, 4);
  const projects = (a.localProjects || []).map((lp) => ({ ...PROJECTS.find((p) => p.slug === lp.slug), note: lp.note }));

  return head({ title, desc, canonical, robots: a.published ? "index, follow" : "noindex, nofollow", ld }) + `
${CHROME.HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img("hero-landscaping-northwest-melbourne")}" alt="" width="1920" height="1080" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/#areas">Service Areas</a><span>/</span>${esc(a.name)}</nav>
        <h1>${esc(h1)}</h1>
        <p>Complete transformations, natural turf and synthetic turf for ${esc(a.name)} homes, built by one team and quoted free on site.</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap sp-layout">
        <div>
          ${a.published ? "" : `<p class="bl-draftnote" role="note">
            <strong>Draft — not published.</strong> This page is marked noindex, is not linked from the site and is not in the sitemap. It goes live by setting <code>published: true</code> in <code>scripts/areas-data.js</code>, which the build allows only once a confirmed local project is listed and every editorial note below has been replaced with verified facts.
          </p>`}
          <div class="prose">
            <p class="lead">${esc(a.name)} is one of the ${esc(a.region)} suburbs in our <a href="/#areas">service area</a>. Sebastian and the team build complete landscapes and lay natural and synthetic turf for homes across ${esc(a.region)}, including ${esc(a.name)}, with the same free on-site quote and clear fixed price as everywhere they work.</p>
            <h2>What we do in ${esc(a.name)}</h2>
          </div>
          <div class="sp-projects">${PRIORITY.map(([slug, image, label, blurb]) => {
            service(slug);
            return `<a class="pj-card sp-hubcard" href="/services/${slug}">
            <span class="pj-card__media"><img src="${img(image)}"${CHROME.cardSrcset(img(image), "(min-width: 1020px) 400px, (min-width: 700px) 46vw, 92vw")} alt="" loading="lazy" width="1200" height="900" /></span>
            <span class="pj-card__body"><h3>${label}</h3><p>${blurb}</p><span class="pj-card__link">Explore ${arrow}</span></span>
          </a>`;
          }).join("")}</div>
          <div class="prose">
            <p>Retaining walls, paving and stepping stones, garden beds and planting, and ongoing property care are quoted alongside these or on their own. <a href="/services">See every service</a>.</p>

            <h2>Our work in ${esc(a.name)}</h2>
            ${projects.length ? "" : noteOrProse(a.evidenceNote)}
          </div>
          ${projects.length ? `<div class="sp-projects">${projects.map((p) => `<a class="pj-card sp-hubcard" href="/projects/${p.slug}">
            <span class="pj-card__media"><img src="${img(p.hero)}"${CHROME.cardSrcset(img(p.hero), "(min-width: 1020px) 400px, (min-width: 700px) 46vw, 92vw")} alt="" loading="lazy" width="1200" height="900" /></span>
            <span class="pj-card__body"><h3>${esc(p.title)}</h3><p>${esc(p.note)}</p><span class="pj-card__link">View project ${arrow}</span></span>
          </a>`).join("")}</div>` : ""}
          <div class="prose">
            <h2>Working on ${esc(a.name)} blocks</h2>
            ${noteOrProse(a.siteNotes)}
            ${guides.length ? `<h2>Guides worth reading first</h2>` : ""}
          </div>
          ${guides.length ? `<div class="sp-related">${guides.map((g) => `<a href="/blog/${g.slug}">${esc(g.title)} ${arrow}</a>`).join("")}</div>` : ""}
        </div>
        <aside class="sp-side">
          <div class="sp-side__card">
            <h2>Free, no-obligation quote</h2>
            <p>Tell us about the job and we'll come out, measure up and give you a clear fixed price.</p>
            <a class="btn btn--primary" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          </div>
          <div class="sp-side__card">
            <h2>Prefer to call?</h2>
            <a class="sp-side__phone" href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
            <p>Mon–Fri 7am–9pm · Sat 7am–5pm · Sun closed</p>
          </div>
        </aside>
      </div>
    </section>
    <section class="section section--tint">
      <div class="wrap">
        <div class="cta-band">
          <h2>Planning work on a ${esc(a.name)} property?</h2>
          <p>Send a few photos and the work you have in mind. Free on-site quotes, a clear fixed price, no obligation.</p>
          <div class="cta-band__actions">
            <a class="btn btn--ondark" href="/quote">Request a Quote</a>
            <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </section>
  </main>
${FOOTER}`;
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUTDIR, "areas"), { recursive: true });
for (const a of AREAS) {
  fs.writeFileSync(path.join(OUTDIR, "areas", `${a.slug}.html`), areaPage(a));
  console.log(`wrote areas/${a.slug}.html (${a.published ? "published" : "draft — noindex, unlinked"})`);
}
console.log("Done:", AREAS.length, "area pages");
