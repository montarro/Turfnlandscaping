/* =====================================================================
   Generator for the /services hub + all individual service pages.
   Content comes from scripts/services-data.js. Self-contained chrome;
   loads scoped stylesheets only (service-pages.css + projects.css for
   the shared gallery/before-after components) — no global changes.
   Runs after build-pages.js so its richer versions of overlapping
   routes win.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const DATA = require("./services-data.js");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://turfandlandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";

const ALL = [...DATA.primary, ...DATA.secondary, ...DATA.extra];
const bySlug = {};
ALL.forEach((s) => { bySlug[s.slug] = s; });
const img = (name) => `/assets/images/${name}.webp`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

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
<body class="editorial">`;
}

function ctaBand(title) {
  return `<section class="section section--tint">
      <div class="wrap">
        <div class="cta-band">
          <h2>${title || "Ready to get started?"}</h2>
          <p>Free on-site quotes across Melbourne's west and inner suburbs — a clear fixed price, no obligation.</p>
          <div class="cta-band__actions">
            <a class="btn btn--ondark" href="/quote">Request a Quote</a>
            <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
          </div>
        </div>
      </div>
    </section>`;
}

/* ---------- service page ---------- */
function servicePage(s) {
  const canonical = `${SITE}/services/${s.slug}`;
  const title = `${s.name.replace(/&/g, "&amp;")} Melbourne | Turf and Landscaping`;
  const desc = `${s.tagline} Serving Melbourne's west and inner suburbs. Free, no-obligation quotes — call ${PHONE_DISPLAY}.`;
  const graph = [
    { "@type": "Service", name: s.name, serviceType: s.name, description: s.tagline, url: canonical,
      provider: { "@type": "HomeAndConstructionBusiness", name: "Turf and Landscaping", telephone: PHONE_TEL, url: SITE + "/",
        areaServed: "Melbourne's west and inner suburbs, VIC" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Services", item: SITE + "/services" },
      { "@type": "ListItem", position: 3, name: s.name, item: canonical },
    ] },
  ];
  if (s.faqs && s.faqs.length) {
    graph.push({ "@type": "FAQPage", mainEntity: s.faqs.map(([q, a]) => ({
      "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  }
  const ld = { "@context": "https://schema.org", "@graph": graph };

  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const m = s.maintenance;

  let body = "";
  body += `<div class="prose"><p class="lead">${s.intro}</p>`;
  if (s.whoFor) body += `<h2>Who this service suits</h2><p>${s.whoFor}</p>`;
  if (s.problems) body += `<h2>Problems we solve</h2><ul>${s.problems.map((p) => `<li>${p}</li>`).join("")}</ul>`;
  body += `<h2>What's included</h2></div>
  <ul class="sp-checklist">${(s.included || []).map((i) => `<li>${i}</li>`).join("")}</ul>`;

  if (s.options) {
    body += `<div class="prose"><h2>Options &amp; materials</h2></div>
    <div class="sp-options">${s.options.map(([t, d]) => `<div class="sp-option"><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>`;
  }
  if (s.process) {
    body += `<div class="prose"><h2>How the work is completed</h2></div>
    <ol class="sp-steps">${s.process.map((p) => `<li>${p}</li>`).join("")}</ol>`;
  }
  if (s.prepDrainage) body += `<div class="prose"><h2>Preparation &amp; drainage</h2><p>${s.prepDrainage}</p></div>`;
  if (s.resiCom) body += `<div class="prose"><h2>Residential &amp; commercial</h2><p>${s.resiCom}</p></div>`;

  if (m) {
    body += `<div class="prose"><h2>One-off or ongoing — how it works</h2>
    <p><strong>One-off visits.</strong> ${m.oneOff}</p>
    <p><strong>Recurring schedules.</strong> ${m.recurring}</p>
    <p><strong>At home.</strong> ${m.resi}</p>
    <p><strong>Commercial &amp; body corporate.</strong> ${m.com}</p>
    <p><strong>A scope built for you.</strong> ${m.custom}</p></div>`;
  }

  if (s.beforeAfter) {
    const ba = s.beforeAfter;
    body += `<div class="prose"><h2>Before &amp; after</h2>
    <p>${ba.note} <a href="${ba.link}">View the full project</a>.</p></div>
    <div class="ba" data-ba tabindex="0" role="slider" aria-label="Before and after comparison. Use arrow keys to move the divider." aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
      <img class="ba__before" src="${img(ba.before.img)}" alt="${ba.before.alt}" loading="lazy" width="1200" height="900" />
      <img class="ba__after" src="${img(ba.after.img)}" alt="${ba.after.alt}" loading="lazy" width="1200" height="900" />
      <span class="ba__label ba__label--after">After</span>
      <span class="ba__label ba__label--before">Before</span>
      <div class="ba__divider"></div>
      <div class="ba__handle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 6l-4 6 4 6M16 6l4 6-4 6"/></svg></div>
    </div>`;
  }

  if (s.gallery) {
    body += `<div class="prose"><h2>From our recent work</h2></div>
    <div class="pj-gallery">${s.gallery.map((g) => `<figure><img src="${img(g.img)}" alt="${g.alt}" loading="lazy" width="1200" height="900" /></figure>`).join("")}</div>`;
  }

  if (s.faqs) {
    body += `<div class="prose"><h2>Common questions</h2></div>
    <div class="faq">${s.faqs.map(([q, a]) => `<details><summary>${q} ${chev}</summary><div class="faq__answer"><p>${a}</p></div></details>`).join("")}</div>`;
  }

  body += `<div class="prose"><h2>Where we work</h2>
  <p>We provide ${s.name.toLowerCase().replace(/&/g, "and")} across Melbourne's west and selected inner-city, northern, eastern and bayside areas. <a href="/#areas">See our full service area</a>, or get in touch to confirm your suburb.</p>
  <h2>Related services</h2></div>
  <div class="sp-related">${(s.related || []).map((slug) => {
    const r = bySlug[slug];
    return r ? `<a href="/services/${r.slug}">${r.name.replace(/&/g, "&amp;")} ${arrow}</a>` : "";
  }).join("")}</div>`;

  return head({ title, desc, canonical, image: img(s.image), ld }) + `
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img(s.image)}" alt="" width="1200" height="900" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/services">Services</a><span>/</span>${s.name.replace(/&/g, "&amp;")}</nav>
        <h1>${s.name.replace(/&/g, "&amp;")}</h1>
        <p>${s.tagline}</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap sp-layout">
        <div>${body}</div>
        <aside class="sp-side">
          <div class="sp-side__card">
            <h2>Free, no-obligation quote</h2>
            <p>Tell us about the job and we'll come out, measure up and give you a clear fixed price.</p>
            <a class="btn btn--primary" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          </div>
          <div class="sp-side__card">
            <h2>Prefer to call?</h2>
            <a class="sp-side__phone" href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
            <p>Mon–Fri 7am–7pm · Sat–Sun 8am–5pm</p>
          </div>
          <div class="sp-side__card sp-side__card--promo">
            <h2>Spring Sale</h2>
            <p>Call-out fee normally $150 — currently <strong>FREE</strong>.</p>
          </div>
        </aside>
      </div>
    </section>
${ctaBand()}
  </main>
${FOOTER}`;
}

/* ---------- services hub ---------- */
function hubCard(s) {
  return `<a class="pj-card sp-hubcard" href="/services/${s.slug}">
    <span class="pj-card__media"><img src="${img(s.image)}" alt="" loading="lazy" width="1200" height="900" /></span>
    <span class="pj-card__body">
      <h3>${s.name.replace(/&/g, "&amp;")}</h3>
      <p>${s.tagline}</p>
      <span class="pj-card__link">Explore ${arrow}</span>
    </span>
  </a>`;
}

function hubPage() {
  const canonical = `${SITE}/services`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Services — Turf and Landscaping", url: canonical,
        description: "Turf, landscape construction and property care services across Melbourne's west and inner suburbs." },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Services", item: canonical },
      ] },
    ],
  };
  return head({
    title: "Turf & Landscaping Services Melbourne | Turf and Landscaping",
    desc: "Every service under one team: natural and synthetic turf, retaining walls, paving, garden design, planting, mulch and full property maintenance across Melbourne's west and inner suburbs.",
    canonical, image: img("hero-landscaping-northwest-melbourne"), ld,
  }) + `
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img("hero-landscaping-northwest-melbourne")}" alt="" width="1920" height="1080" fetchpriority="high" /></div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Services</nav>
        <h1>Our <em class="accent-i">Services.</em></h1>
        <p>Turf, landscape construction and property care — every service delivered by one accountable team, across Melbourne's west and inner suburbs.</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section__head">
          <span class="eyebrow">Build &amp; transform</span>
          <h2>Turf &amp; landscape construction</h2>
          <p class="lead">The flagship services that build and transform outdoor spaces.</p>
        </div>
        <div class="pj-grid">
          ${DATA.primary.map(hubCard).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section section--tint">
      <div class="wrap">
        <div class="section__head">
          <span class="eyebrow">Care &amp; maintain</span>
          <h2>Property care &amp; maintenance</h2>
          <p class="lead">Ongoing care that protects the landscaping you've invested in.</p>
        </div>
        <div class="pj-grid">
          ${DATA.secondary.map(hubCard).join("\n          ")}
        </div>
      </div>
    </section>
${ctaBand("Not sure which service you need?")}
  </main>
${FOOTER}`;
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUTDIR, "services"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "services.html"), hubPage());
console.log("wrote services.html (hub)");
let count = 1;
ALL.forEach((s) => {
  fs.writeFileSync(path.join(OUTDIR, "services", `${s.slug}.html`), servicePage(s));
  console.log("wrote services/" + s.slug + ".html");
  count++;
});
console.log("Done:", count, "service pages");
