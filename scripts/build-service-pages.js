/* =====================================================================
   Generator for the individual service pages (17 routes).
   Fully self-contained: it duplicates the site header/footer markup
   rather than importing from build-pages.js, and its pages load a
   scoped stylesheet (service-pages.css) on top of the global one, so
   nothing here can alter the homepage or /quote.

   Runs after build-pages.js in the build, so where a route overlaps a
   legacy stub (retaining-walls, soft-landscaping) this version wins.

     node scripts/build-service-pages.js
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://turfandlandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";
const OG = SITE + "/assets/images/og-turf-and-landscaping.webp";

/* ---------- Site chrome (duplicated, not imported — see header note) ---------- */
const HEADER = `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="Turf and Landscaping — home">
        <img class="brand__logo" src="/assets/logo-turf-and-landscaping.png"
             alt="Turf and Landscaping" width="918" height="381" />
      </a>
      <nav class="primary-nav" aria-label="Primary">
        <a href="/#who-we-are">Who We Are</a>
        <a href="/#services">Our Services</a>
        <a href="/#areas">Service Areas</a>
        <a href="/#work">Our Projects</a>
        <a href="/#faq">FAQ</a>
      </nav>
      <div class="header-cta">
        <a class="header-phone" href="tel:${PHONE_TEL}">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1z"/></svg>
          <span>0457&nbsp;357&nbsp;085</span>
        </a>
        <a class="header-call" href="/quote">Free Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false">
          <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" data-open="false" aria-label="Mobile">
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Menu</span>
        <a href="/#who-we-are">Who We Are</a>
        <a href="/#work">Our Projects</a>
        <a href="/#how">How We Work</a>
        <a href="/#areas">Service Areas</a>
        <a href="/#faq">FAQ</a>
      </div>
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Services</span>
        <a href="/services/turf-installation">Turf Installation</a>
        <a href="/services/retaining-walls">Retaining Walls</a>
        <a href="/services/paving-stepping-stones">Paving &amp; Stepping Stones</a>
        <a href="/services/soft-landscaping">Soft Landscaping</a>
        <a href="/services/property-maintenance">Property Maintenance</a>
      </div>
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Get in touch</span>
        <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
        <a href="mailto:info@turfandlandscaping.com.au">info@turfandlandscaping.com.au</a>
      </div>
      <a class="btn btn--primary btn--block" href="/quote">Request a Quote</a>
    </nav>
  </header>`;

const FOOTER = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <a class="brand brand--footer" href="/" aria-label="Turf and Landscaping — home">
            <img class="brand__logo" src="/assets/logo-turf-and-landscaping-white.png"
                 alt="Turf and Landscaping" width="918" height="381" />
          </a>
          <p style="margin-top:1rem;max-width:22rem;">Turf, landscape construction and property care across Melbourne's west and inner suburbs.</p>
          <div class="footer__cta">
            <a class="btn btn--ondark" href="/quote">Request a Quote</a>
          </div>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="/services/turf-installation">Turf Installation</a></li>
            <li><a href="/services/retaining-walls">Retaining Walls</a></li>
            <li><a href="/services/paving-stepping-stones">Paving &amp; Stepping Stones</a></li>
            <li><a href="/services/soft-landscaping">Soft Landscaping</a></li>
            <li><a href="/services/property-maintenance">Property Maintenance</a></li>
          </ul>
        </div>
        <div>
          <h4>Service areas</h4>
          <ul>
            <li><a href="/#areas">Melbourne's West</a></li>
            <li><a href="/#areas">Inner Melbourne</a></li>
            <li><a href="/#areas">Inner North</a></li>
            <li><a href="/#areas">Inner East, South &amp; Bayside</a></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            <li><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></li>
            <li><a href="mailto:info@turfandlandscaping.com.au">info@turfandlandscaping.com.au</a></li>
            <li>Melbourne's West • Inner City • Inner North • Inner East &amp; Bayside</li>
            <li>Mon–Fri 7am–5pm · Sat 8am–2pm</li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© <span id="year">2026</span> Turf and Landscaping</span>
        <span>Melbourne's West • Inner City • Inner North • Inner East &amp; Bayside · Fully insured</span>
      </div>
    </div>
  </footer>
  <script src="/main.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
</body>
</html>`;

/* ---------- Service data ---------- */
const IMG = {
  turf: "service-natural-turf-solutions.webp",
  turfProject: "project-turf-stepping-stones.webp",
  lawn: "project-lawn-rocks.webp",
  paving: "service-paving-and-stepping-stones.webp",
  walls: "service-retaining-walls.webp",
  soft: "service-soft-landscaping.webp",
  garden: "project-garden-path.webp",
  hero: "hero-landscaping-northwest-melbourne.webp",
};

const SERVICES = [
  {
    slug: "turf-installation",
    name: "Turf Installation",
    tagline: "Natural and synthetic lawns supplied and installed on properly prepared ground.",
    image: IMG.turf,
    intro: "A new lawn transforms a property faster than any other single job — but only if the ground underneath is done right. We handle the full installation: clearing, levelling, base preparation and laying, for both natural and synthetic turf.",
    included: ["Site clearing and old surface removal", "Soil preparation, grading and levelling", "Natural turf supply and laying", "Synthetic turf installation", "Watering-in and simple aftercare advice"],
    body: "Not sure whether natural or synthetic suits you better? It usually comes down to sun, traffic and how much upkeep you want. We'll talk it through on-site and recommend what genuinely fits your yard and budget — see our dedicated natural and synthetic pages for more detail on each.",
    related: ["natural-turf-installation", "synthetic-turf-installation", "turf-repair-patching", "lawn-mowing"],
  },
  {
    slug: "natural-turf-installation",
    name: "Natural Turf Installation",
    tagline: "Fresh, hard-wearing natural lawns laid to suit your soil, sun and lifestyle.",
    image: IMG.turfProject,
    intro: "Nothing beats real grass underfoot. We supply and lay quality natural turf over properly prepared, graded and drained ground, so your new lawn takes quickly and holds up to Melbourne summers, kids and pets.",
    included: ["Help choosing the right variety for your aspect", "Site clearing, weed removal and soil preparation", "Grading and levelling for an even finish", "Careful laying, rolling and joint alignment", "Watering-in guidance for the first weeks"],
    body: "Variety matters: a tougher couch or kikuyu for full sun and heavy traffic, or a soft-leaf buffalo where you want shade tolerance and a plush feel. We'll recommend what suits the spot rather than what's easiest to supply.",
    related: ["synthetic-turf-installation", "turf-installation", "lawn-mowing", "irrigation-repairs"],
  },
  {
    slug: "synthetic-turf-installation",
    name: "Synthetic Turf Installation",
    tagline: "Low-maintenance synthetic lawns that stay green all year round.",
    image: IMG.turf,
    intro: "For shaded courtyards, high-traffic areas, or anyone done with mowing, quality synthetic turf is a genuinely good answer. Installed properly — compacted base, correct drainage, secured edges — it looks sharp year-round with almost no upkeep.",
    included: ["Excavation and compacted base preparation", "Drainage layer done properly", "Quality synthetic turf supply and installation", "Secured, tidy edges and joins", "Infill and final grooming"],
    body: "The difference between synthetic turf that looks premium and turf that looks fake is nearly all in the preparation and the product grade. We'll show you the options and be straight about where synthetic makes sense — and where real grass would serve you better.",
    related: ["natural-turf-installation", "turf-installation", "hard-landscaping", "garden-planting"],
  },
  {
    slug: "turf-repair-patching",
    name: "Turf Repair & Patching",
    tagline: "Bring a tired, patchy lawn back to life without replacing the lot.",
    image: IMG.lawn,
    intro: "Dead patches, worn tracks, dog damage or a lawn that never recovered from summer — often the fix is repair, not replacement. We patch, level and re-establish problem areas so the whole lawn reads as one again.",
    included: ["Assessment of what's actually causing the damage", "Removal and replacement of dead sections", "Levelling of sunken or worn areas", "Matching turf variety to your existing lawn", "Advice to stop the problem recurring"],
    body: "If the lawn is past saving we'll say so and quote a proper reinstallation instead — but plenty of lawns just need targeted repair and better conditions to come good.",
    related: ["turf-installation", "lawn-mowing", "weed-control-spraying", "irrigation-repairs"],
  },
  {
    slug: "paving-stepping-stones",
    name: "Paving & Stepping Stones",
    tagline: "Patios, paths and stepping stones laid dead level on a proper base.",
    image: IMG.paving,
    intro: "Good paving is all in the base you don't see. We excavate, compact and lay a proper sub-base so your patio, path or stepping-stone walk stays flat and true for years — no rocking pavers, no puddles, no weeds pushing through.",
    included: ["Excavation and compacted road-base preparation", "Bluestone, concrete, clay and porcelain pavers", "Stepping-stone paths and garden walkways", "Correct falls for drainage away from the house", "Clean cuts, tight joints and a swept finish"],
    body: "From an entertaining area off the back door to a neat stepping-stone path through the garden, we lay to a string line and a level so the finish looks sharp and drains the way it should.",
    related: ["hard-landscaping", "retaining-walls", "turf-installation", "garden-planting"],
  },
  {
    slug: "retaining-walls",
    name: "Retaining Walls",
    tagline: "Structural walls that hold back slopes and carve out usable, level yard.",
    image: IMG.walls,
    intro: "A retaining wall does real structural work, so it has to be built right. We set posts to the correct depth, use the right materials for the load, and put ag-drain and backfill behind every wall so water has somewhere to go instead of pushing the wall over.",
    included: ["Timber and concrete sleeper walls", "Besser block and rock walls", "Ag-drain, aggregate and correct backfill", "Levelling and terracing of sloping blocks", "Advice on engineering or permits where needed"],
    body: "Whether you're levelling a sloping backyard for a lawn, terracing a garden into usable beds, or holding back a driveway cut, we'll recommend the right wall type and height for the job — and tell you up front if it needs engineering or council sign-off.",
    related: ["hard-landscaping", "paving-stepping-stones", "complete-landscape-transformations", "turf-installation"],
  },
  {
    slug: "hard-landscaping",
    name: "Hard Landscaping",
    tagline: "Paving, pathways, edging and the structural work that shapes a yard.",
    image: IMG.paving,
    intro: "Hard landscaping is the skeleton of a good outdoor space — the paths, edges, walls and surfaces everything else hangs off. We build it level, drained and made to last, so the soft planting on top has something worth sitting on.",
    included: ["Paving and pathways", "Garden edging in timber, steel or masonry", "Retaining walls and terracing", "Drainage built into the job, not bolted on", "Demolition and removal of old surfaces"],
    body: "We're happy quoting a single element or the whole structural stage of a bigger project. Either way the same rule applies: preparation first, because that's what decides whether it still looks right in ten years.",
    related: ["paving-stepping-stones", "retaining-walls", "complete-landscape-transformations", "soft-landscaping"],
  },
  {
    slug: "soft-landscaping",
    name: "Soft Landscaping",
    tagline: "Garden beds, planting and mulch that make the whole yard feel finished.",
    image: IMG.soft,
    intro: "Soft landscaping is what turns a bare block into a garden. We build up good soil, choose plants that suit the spot and your appetite for maintenance, and finish with clean edges and quality mulch so beds look sharp and stay that way.",
    included: ["Garden bed shaping and soil improvement", "Plant selection and planting", "Quality mulch, compost and feature stone", "Timber, steel or masonry garden edging", "Low-maintenance and water-wise planting plans"],
    body: "Tell us how much time you actually want to spend gardening and we'll plan beds to match — from a low-care front garden to a lush, layered backyard.",
    related: ["garden-planting", "mulching", "garden-care", "hedge-trimming-pruning"],
  },
  {
    slug: "garden-planting",
    name: "Garden Planting",
    tagline: "The right plants, in the right spots, planted to establish properly.",
    image: IMG.garden,
    intro: "Plants fail when they're wrong for the position — too much sun, too little, wrong soil, wrong water. We select and plant for your actual conditions, so the garden establishes quickly and keeps looking better each season instead of worse.",
    included: ["Plant selection for your soil, sun and style", "Natives and exotics suited to Melbourne conditions", "Proper soil preparation and planting technique", "Layout and spacing planned for mature size", "Establishment watering and care advice"],
    body: "We're big on hardy, water-wise plants that look good with minimal fuss — and honest about which favourites are high-maintenance choices before you commit to them.",
    related: ["soft-landscaping", "mulching", "garden-care", "irrigation-repairs"],
  },
  {
    slug: "mulching",
    name: "Mulching",
    tagline: "Quality mulch, properly laid — better beds, fewer weeds, less watering.",
    image: IMG.soft,
    intro: "Mulch is the cheapest improvement a garden can get: it holds moisture, suppresses weeds, feeds the soil as it breaks down and instantly tidies the look of every bed. We supply and spread quality mulch at the right depth, with clean edges.",
    included: ["Supply of quality organic and decorative mulches", "Bed preparation and weed removal first", "Spreading at the correct depth", "Clean, defined edges around beds and trees", "Advice on the right mulch for each area"],
    body: "Happy to do a single top-up or mulch an entire property. Combined with planting or garden care it's the fastest way to lift how the whole garden presents.",
    related: ["soft-landscaping", "garden-planting", "garden-care", "weed-control-spraying"],
  },
  {
    slug: "complete-landscape-transformations",
    name: "Complete Landscape Transformations",
    tagline: "Full outdoor makeovers — turf, paving, walls and gardens under one team.",
    image: IMG.hero,
    intro: "Some yards need more than one trade. A complete transformation brings turf, paving, retaining walls, garden beds and planting together under one team and one plan, so each stage is built in the right order and everything lines up at the end.",
    included: ["One plan covering the whole space", "Demolition and site clearing", "Retaining walls, paving and structural work first", "Turf, garden beds and planting to finish", "Staged builds available to suit your budget"],
    body: "Because one team runs the whole job, you don't get the usual gaps between trades — the levels match, the drainage works as one system, and there's a single person accountable for the finish.",
    related: ["hard-landscaping", "turf-installation", "soft-landscaping", "retaining-walls"],
  },
  {
    slug: "lawn-mowing",
    name: "Lawn Mowing",
    tagline: "Regular, reliable mowing that keeps your lawn healthy and sharp.",
    image: IMG.lawn,
    intro: "A good lawn is made by consistent care. We mow at the right height for your grass type — scalping a lawn to stretch out visits is how lawns die — edge it cleanly, and leave the site tidy every time.",
    included: ["Mowing at the correct height for your grass", "Clean edges along paths, beds and fences", "Clippings caught and removed", "Regular schedules or one-off tidy-ups", "Homes and commercial properties"],
    body: "Pair mowing with seasonal feeding and weed control and the lawn doesn't just stay neat — it steadily improves.",
    related: ["turf-repair-patching", "weed-control-spraying", "garden-care", "property-maintenance"],
  },
  {
    slug: "property-maintenance",
    name: "Property Maintenance",
    tagline: "Ongoing care that keeps a property looking the way it was handed over.",
    image: IMG.hero,
    intro: "Whether it's your home, a rental, or a commercial site, regular maintenance protects what the landscaping cost to build. We keep lawns, gardens, hedges and surfaces presentable on a schedule that suits the property.",
    included: ["Lawn mowing and edging", "Garden bed care and seasonal tidy-ups", "Hedge and shrub maintenance", "Weed management", "Flexible schedules for homes and businesses"],
    body: "One reliable team that already knows your property beats juggling separate trades. We'll shape a maintenance schedule around what the site actually needs, not a one-size-fits-all package.",
    related: ["lawn-mowing", "garden-care", "hedge-trimming-pruning", "irrigation-repairs"],
  },
  {
    slug: "garden-care",
    name: "Garden Care",
    tagline: "Seasonal care that keeps garden beds healthy, tidy and thriving.",
    image: IMG.soft,
    intro: "Gardens are living things — they need feeding, pruning, weeding and the occasional hard word. Our garden care keeps beds healthy and presentable through the seasons, so the garden improves year on year instead of slowly going backwards.",
    included: ["Weeding and bed tidy-ups", "Pruning and deadheading", "Soil improvement and feeding", "Mulch top-ups", "Seasonal planting refreshes"],
    body: "We can visit on a regular schedule or do periodic seasonal blitzes — whatever keeps your garden at the standard you want without you spending every weekend on it.",
    related: ["garden-planting", "mulching", "hedge-trimming-pruning", "property-maintenance"],
  },
  {
    slug: "irrigation-repairs",
    name: "Irrigation Repairs",
    tagline: "Get broken irrigation running properly again — and watering what it should.",
    image: IMG.turf,
    intro: "Broken heads, leaking lines, dead zones, controllers nobody remembers how to program — irrigation problems waste water and quietly kill the lawn and garden it was meant to protect. We find the fault and fix it properly.",
    included: ["Fault-finding on existing systems", "Replacing broken heads, valves and fittings", "Repairing damaged lines", "Controller setup and programming", "Adjusting coverage so water lands where it should"],
    body: "If the system's beyond economic repair we'll tell you straight and lay out the options, rather than billing endless small fixes on a system that needs replacing.",
    related: ["turf-repair-patching", "lawn-mowing", "garden-care", "property-maintenance"],
  },
  {
    slug: "weed-control-spraying",
    name: "Weed Control & Spraying",
    tagline: "Targeted weed control that deals with the problem, not just the symptoms.",
    image: IMG.lawn,
    intro: "Weeds are a symptom — of thin turf, bare soil, or beds without mulch. We knock down the existing problem with targeted spraying and hand removal, then fix the conditions that let weeds take hold in the first place.",
    included: ["Broadleaf weed control in lawns", "Path, paving and gravel area spraying", "Garden bed weeding and treatment", "Safe, targeted product selection", "Follow-up treatments where needed"],
    body: "One-off blitz before a sale or event, or scheduled control through the growing season — we'll recommend what the property actually needs.",
    related: ["lawn-mowing", "mulching", "garden-care", "turf-repair-patching"],
  },
  {
    slug: "hedge-trimming-pruning",
    name: "Hedge Trimming & Pruning",
    tagline: "Clean, healthy hedges and shrubs shaped at the right time of year.",
    image: IMG.garden,
    intro: "A sharp hedge lifts a whole property; a butchered one takes years to recover. We trim and prune for shape and plant health — at the right time of year for the species — and clean up everything before we leave.",
    included: ["Formal hedge trimming and shaping", "Shrub and small tree pruning", "Rejuvenation pruning for overgrown plants", "Timing advice per species", "Full green-waste removal"],
    body: "Regular light trims beat occasional heavy cuts — the hedge stays denser, healthier and easier to keep. We can put your hedges on a schedule so they always look their best.",
    related: ["garden-care", "garden-planting", "property-maintenance", "soft-landscaping"],
  },
];

const byId = {};
SERVICES.forEach((s) => { byId[s.slug] = s; });

function jsonLd(s, canonical) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": s.name,
        "serviceType": s.name,
        "description": s.tagline,
        "url": canonical,
        "provider": {
          "@type": "HomeAndConstructionBusiness",
          "name": "Turf and Landscaping",
          "telephone": PHONE_TEL,
          "url": SITE + "/",
          "areaServed": "Melbourne's west and inner suburbs, VIC",
        },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: "Services", item: SITE + "/#services" },
          { "@type": "ListItem", position: 3, name: s.name, item: canonical },
        ],
      },
    ],
  };
}

function page(s) {
  const canonical = `${SITE}/services/${s.slug}`;
  const title = `${s.name} Melbourne | Turf and Landscaping`;
  const desc = `${s.tagline} Serving Melbourne's west and inner suburbs. Free, no-obligation quotes — call ${PHONE_DISPLAY}.`;
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
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
  <meta property="og:image" content="${SITE}/assets/images/${s.image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/favicon.svg" />
  <link rel="stylesheet" href="/style.css" />
  <link rel="stylesheet" href="/service-pages.css" />
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd(s, canonical), null, 2)}
  </script>
</head>
<body>
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media">
        <img src="/assets/images/${s.image}" alt="${s.name} — Turf and Landscaping" width="1200" height="750" fetchpriority="high" />
      </div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/#services">Services</a><span>/</span>${s.name}</nav>
        <h1>${s.name}</h1>
        <p>${s.tagline}</p>
        <div class="page-hero__actions">
          <a class="btn btn--ondark" href="/quote">Request a Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
          <a class="btn btn--outline-light" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap sp-layout">
        <div>
          <div class="prose">
            <p class="lead">${s.intro}</p>
            <h2>What's included</h2>
          </div>
          <ul class="sp-checklist">
${s.included.map((i) => `            <li>${i}</li>`).join("\n")}
          </ul>
          <div class="prose">
            <p>${s.body}</p>
            <h2>Where we work</h2>
            <p>We provide ${s.name.toLowerCase()} across Melbourne's west and selected inner-city, northern, eastern and bayside areas. <a href="/#areas">See our full service area</a>, or get in touch to confirm your suburb.</p>
            <h2>Related services</h2>
          </div>
          <div class="sp-related">
${s.related.map((r) => `            <a href="/services/${r}">${byId[r].name} ${arrow}</a>`).join("\n")}
          </div>
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
            <p>Mon–Fri 7am–5pm · Sat 8am–2pm</p>
          </div>
          <div class="sp-side__card sp-side__card--promo">
            <h2>Spring Sale</h2>
            <p>Call-out fee normally $150 — currently <strong>FREE</strong>.</p>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section--tint">
      <div class="wrap">
        <div class="cta-band">
          <h2>Ready to get started?</h2>
          <p>Free on-site quotes across Melbourne's west and inner suburbs — a clear fixed price, no obligation.</p>
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

/* ---------- Write files ---------- */
fs.mkdirSync(path.join(OUTDIR, "services"), { recursive: true });
let count = 0;
for (const s of SERVICES) {
  fs.writeFileSync(path.join(OUTDIR, "services", `${s.slug}.html`), page(s));
  console.log("wrote services/" + s.slug + ".html");
  count++;
}
console.log("Done:", count, "service pages");
