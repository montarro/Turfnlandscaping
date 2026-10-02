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
const BLOG = require("./blog-index.js");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://bastianolandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";

const ALL = [...DATA.primary, ...DATA.secondary, ...DATA.extra];
const bySlug = {};
ALL.forEach((s) => { bySlug[s.slug] = s; });
const img = (name) => `/assets/images/${name}.webp`;

/* Three service images are still the branded gradients gen-images.js draws
   until a real photo lands in assets/photos/ (slots soft / design / turf —
   see apply-photos.js). They work as a hero backdrop, but they show no
   work: the hero gets alt="" and shares use the branded logo card. */
const PLACEHOLDER_SLOTS = { "service-soft-landscaping": "soft", "service-garden-design": "design", "service-natural-turf-solutions": "turf" };
const isPlaceholder = (name) => PLACEHOLDER_SLOTS[name] &&
  ![".jpg", ".jpeg", ".png", ".webp"].some((ext) => fs.existsSync(path.join(ROOT, "assets", "photos", PLACEHOLDER_SLOTS[name] + ext)));
const SHARE_CARD = { image: "/assets/images/og-bastiano-landscaping.jpg", alt: "Bastiano Landscaping logo" };
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- shared chrome ---------- */
const CHROME = require("./chrome.js");
const HEADER = CHROME.HEADER;

const FOOTER = CHROME.FOOTER + `
  <script src="/main.js" defer></script>
  <script src="/projects.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;

/* Google shows roughly the first 155-160 characters of a description, so
   take the fullest wording that fits rather than letting the phone number
   at the end get cut off. */
const DESC_MAX = 160;
function fitDesc(lead, endings) {
  return endings.map((e) => `${lead} ${e}`).find((d) => d.length <= DESC_MAX) || lead;
}

function head({ title, desc, canonical, image, imageAlt, ld }) {
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
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#1d3527" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bastiano Landscaping" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}${image}" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${SITE}${image}" />
  <link rel="icon" href="/assets/favicon.png?v=3" type="image/png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" sizes="180x180" />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-800.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-700.woff2" crossorigin />
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
  const title = `${s.name.replace(/&/g, "&amp;")} Melbourne | Bastiano Landscaping`;
  const desc = fitDesc(s.tagline, [
    `Serving Melbourne's west and inner suburbs. Free, no-obligation quotes — call ${PHONE_DISPLAY}.`,
    `Serving Melbourne's west and inner suburbs. Free quotes — call ${PHONE_DISPLAY}.`,
    `Melbourne's west and inner suburbs. Free quotes: ${PHONE_DISPLAY}.`,
    `Free quotes across Melbourne's west and inner suburbs.`,
  ]);
  const graph = [
    { "@type": "Service", name: s.name, serviceType: s.name, description: s.tagline, url: canonical,
      // same @id as the homepage LocalBusiness, so Google reads one business, not 23
      provider: { "@type": "HomeAndConstructionBusiness", "@id": SITE + "/#business", name: "Bastiano Landscaping", telephone: PHONE_TEL, url: SITE + "/" },
      areaServed: "Melbourne's west and inner suburbs, VIC" },
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
  body += `<div class="prose"><p class="lead">${s.intro}</p></div>`;
  /* Before/after sits directly under the intro — it's the most persuasive
     content on the page, so it comes before the detail sections. */
  if (s.beforeAfter) {
    const ba = s.beforeAfter;
    body += CHROME.beforeAfterBlock({
      before: { src: img(ba.before.img), alt: ba.before.alt },
      after: { src: img(ba.after.img), alt: ba.after.alt },
      intro: ba.link ? `${ba.note} <a href="${ba.link}">View the full project</a>.` : ba.note,
    });
  }
  body += `<div class="prose">`;
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

  if (s.gallery) {
    // photos already loaded full-size on this page reuse that file
    const fullSize = new Set([s.image, s.beforeAfter && s.beforeAfter.before.img, s.beforeAfter && s.beforeAfter.after.img]);
    body += `<div class="prose"><h2>From our recent work</h2></div>
    <div class="pj-gallery">${s.gallery.map((g) => `<figure><img src="${img(g.img)}"${fullSize.has(g.img) ? "" : CHROME.cardSrcset(img(g.img), "(min-width: 700px) 380px, 92vw")} alt="${g.alt}" loading="lazy" width="1200" height="900" /></figure>`).join("")}</div>`;
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

  /* Published articles written about this service — the articles already
     link here, so this closes the loop for readers (and crawlers) arriving
     on the service page. Drafts never appear. */
  const advice = BLOG.publishedPosts().filter((p) => p.routes.includes(`/services/${s.slug}`)).slice(0, 3);
  if (advice.length) {
    body += `<div class="prose"><h2>Related guides</h2></div>
  <div class="sp-related">${advice.map((p) => `<a href="/blog/${p.slug}">${p.title.replace(/&/g, "&amp;")} ${arrow}</a>`).join("")}</div>`;
  }

  const placeholder = !s.image || isPlaceholder(s.image);
  const heroAlt = placeholder ? "" : `${s.name.replace(/&/g, "&amp;")} by Bastiano Landscaping`;
  return head({ title, desc, canonical,
    image: placeholder ? SHARE_CARD.image : img(s.image),
    imageAlt: placeholder ? SHARE_CARD.alt : heroAlt, ld }) + `
${HEADER}
  <main id="main">
    <section class="page-hero${s.image ? "" : " page-hero--plain"}">
      ${s.image ? `<div class="page-hero__media"><img src="${img(s.image)}" alt="${heroAlt}" width="1200" height="900" fetchpriority="high" /></div>` : ""}
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
            <p>Mon–Fri 7am–9pm · Sat 7am–5pm · Sun closed</p>
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

/* ---------- services hub ----------
   The hub mirrors the homepage "Our Services" grid (index.html) one-to-one:
   same seven services, same order, same labels, blurbs and photos. Keep the
   two lists in sync when a card is added or removed. */
const HOME_SERVICES = [
  { slug: "natural-turf-installation", label: "Natural Turf", image: "svc-natural-turf", blurb: "Instant natural turf supplied and laid on properly prepared, level ground." },
  { slug: "synthetic-turf-installation", label: "Synthetic Turf", image: "svc-synthetic-turf", blurb: "Always-green synthetic lawns with no mowing and no watering." },
  { slug: "complete-landscape-transformations", label: "Custom Landscaping", image: "svc-custom-landscaping", blurb: "Complete yard designs built around your property, from structure to planting." },
  { slug: "paving", label: "Pavers &amp; Stepping Stones", image: "svc-pavers-stepping", blurb: "Paths and paved areas laid dead level on a proper compacted base." },
  { slug: "retaining-walls", label: "Retaining Walls", image: "svc-retaining-walls", blurb: "Timber and sleeper walls that turn slopes into level, usable ground." },
  { slug: "plants-garden-beds-mulch", label: "Plants &amp; Mulch", image: "ill-plants-mulch", blurb: "Plant selection, quality soil and mulch that keep beds healthy and tidy." },
  { slug: "property-maintenance", label: "Property &amp; Garden Care", image: "photo-established-lawn-watering", blurb: "Regular mowing, hedging and upkeep that keep a finished yard sharp." },
];
function homeHubCard(c) {
  if (!ALL.some((s) => s.slug === c.slug)) throw new Error(`hub: no service page for ${c.slug}`);
  return `<a class="pj-card sp-hubcard" href="/services/${c.slug}">
    <span class="pj-card__media"><img src="${img(c.image)}"${CHROME.cardSrcset(img(c.image))} alt="" loading="lazy" width="1200" height="900" /></span>
    <span class="pj-card__body">
      <h3>${c.label}</h3>
      <p>${c.blurb}</p>
      <span class="pj-card__link">Explore ${arrow}</span>
    </span>
  </a>`;
}

/* Every service page, grouped, under the photo grid — the grid shows the
   seven headline services, this list makes the other pages one click from
   the hub instead of reachable only through related links. The build fails
   if a service page is missing from it or listed twice. */
const HUB_GROUPS = [
  ["Turf", ["natural-turf-installation", "synthetic-turf-installation", "turf-installation", "turf-preparation-levelling-drainage", "turf-repair-patching"]],
  ["Landscape construction", ["complete-landscape-transformations", "garden-design", "hard-landscaping", "paving", "stepping-stone-paths", "retaining-walls", "timber-decking", "landscaping-features"]],
  ["Gardens &amp; planting", ["soft-landscaping", "plants-garden-beds-mulch", "garden-planting", "mulching", "irrigation-repairs"]],
  ["Property care", ["property-maintenance", "lawn-mowing", "garden-care", "hedge-trimming-pruning", "weed-control-spraying"]],
];
{
  const listed = HUB_GROUPS.flatMap(([, slugs]) => slugs);
  const missing = ALL.map((x) => x.slug).filter((slug) => !listed.includes(slug));
  const unknown = listed.filter((slug) => !bySlug[slug]);
  const twice = listed.filter((slug, i) => listed.indexOf(slug) !== i);
  if (missing.length || unknown.length || twice.length) {
    throw new Error(`services hub list out of step — missing: ${missing.join(", ")}; unknown: ${unknown.join(", ")}; duplicated: ${twice.join(", ")}`);
  }
}

function hubPage() {
  const canonical = `${SITE}/services`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Services — Bastiano Landscaping", url: canonical,
        description: "Turf, landscape construction and property care services across Melbourne's west and inner suburbs." },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Services", item: canonical },
      ] },
    ],
  };
  return head({
    title: "Landscaping &amp; Turf Services in Melbourne | Bastiano Landscaping",
    desc: "Natural and synthetic turf, retaining walls, paving, garden design, planting and property maintenance — one team across Melbourne's west and inner suburbs.",
    canonical, image: img("hero-landscaping-northwest-melbourne"), imageAlt: "Landscaped backyard with fresh turf and garden beds in Melbourne's west", ld,
  }) + `
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media"><img src="${img("hero-landscaping-northwest-melbourne")}" alt="Landscaped backyard with fresh turf and garden beds in Melbourne's west" width="1920" height="1080" fetchpriority="high" /></div>
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
          <span class="eyebrow">What we do</span>
          <h2>Turf, landscaping &amp; property care</h2>
          <p class="lead">The same seven services shown on our homepage — every one delivered by one accountable team.</p>
        </div>
        <div class="pj-grid">
          ${HOME_SERVICES.map(homeHubCard).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section sp-all-section" aria-labelledby="all-services-h">
      <div class="wrap">
        <div class="section__head">
          <h2 id="all-services-h">Every service we offer</h2>
          <p class="lead">Each service has its own page explaining what is included, how the work is done and the questions we are asked most.</p>
        </div>
        <div class="sp-all">
          ${HUB_GROUPS.map(([label, slugs]) => `<div>
            <h3>${label}</h3>
            <div class="sp-related">${slugs.map((slug) => `<a href="/services/${slug}">${bySlug[slug].name.replace(/&/g, "&amp;")} ${arrow}</a>`).join("")}</div>
          </div>`).join("\n          ")}
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
