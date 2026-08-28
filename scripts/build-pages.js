/* =====================================================================
   Static page generator for service + suburb stub pages.
   Produces plain static HTML into /services and /suburbs so the site
   stays a no-build, plain-HTML deploy. Re-run after editing content:

     node scripts/build-pages.js

   No runtime dependencies — pure Node.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || ROOT;
const SITE = "https://turfandlandscaping.com.au";
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";
const OG = SITE + "/assets/images/og-turf-and-landscaping.webp";

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- Service area (authoritative, client-verified) ----------
   Craigieburn / Mickleham / Sunbury / Melton / Point Cook are no longer
   confirmed service areas and must not appear as claimed coverage
   anywhere on the site unless separately re-verified by the client. */
const SERVICE_AREA_STATEMENT =
  "Serving Melbourne's western suburbs and selected inner-city, northern, eastern and bayside areas.";
const SERVICE_AREA_STRIP =
  "Melbourne's West • Inner City • Inner North • Inner East & Bayside";
const SERVICE_REGIONS = [
  {
    name: "Melbourne's West",
    suburbs: ["Hoppers Crossing", "Werribee", "Altona Meadows", "Altona", "Newport", "Williamstown", "Yarraville", "Seddon", "Sunshine", "Caroline Springs", "Footscray", "Kingsville", "Maribyrnong", "Maidstone", "Spotswood", "Brooklyn"],
  },
  {
    name: "Inner Melbourne",
    suburbs: ["Docklands", "West Melbourne", "North Melbourne", "South Melbourne", "Port Melbourne", "East Melbourne", "Kensington", "Flemington", "Carlton"],
  },
  {
    name: "Inner North",
    suburbs: ["Brunswick", "Fitzroy", "Collingwood", "Abbotsford", "Clifton Hill"],
  },
  {
    name: "Inner East, South and Bayside",
    suburbs: ["Richmond", "Cremorne", "South Yarra", "Toorak", "Prahran", "Kew", "Brighton"],
  },
];
const AREA_SUBURBS = SERVICE_REGIONS.flatMap((r) => r.suburbs);

/* ---------- Shared chrome ---------- */
function head({ title, desc, canonical, image = OG }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="theme-color" content="#0e3b23" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Turf and Landscaping" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_AU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" href="/assets/favicon.png" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/favicon.png" />
  <link rel="stylesheet" href="/style.css" />`;
}

const CHROME = require("./chrome.js");
const HEADER = CHROME.HEADER;

const FOOTER = CHROME.FOOTER + `
  <script src="/main.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
</body>
</html>`;

function heroActions() {
  return `<div class="page-hero__actions">
        <a class="btn btn--call" href="/quote">Request a Quote</a>
        <a class="btn btn--ondark" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
      </div>`;
}

function ctaBand() {
  return `<div class="cta-band">
        <h2>Ready for a free on-site quote?</h2>
        <p>Tell us about your yard and we'll come out, measure up and give you a clear fixed price — no obligation.</p>
        <div class="cta-band__actions">
          <a class="btn btn--call" href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a>
          <a class="btn btn--ondark" href="/quote">Request a quote online</a>
        </div>
      </div>`;
}

/* ---------- Service pages ---------- */
const SERVICES = [
  {
    name: "Natural Turf Solutions",
    image: "service-natural-turf-solutions.webp",
    imageAlt: "Roll of fresh natural turf being laid over prepared soil",
    tagline: "Fresh, hard-wearing lawns supplied and laid to suit your soil, sun and lifestyle.",
    desc:
      "New natural turf supplied and laid across Melbourne's west and inner suburbs. Proper soil prep, warm-season varieties and a lawn that lasts. Free on-site quotes — call 0457 357 085.",
    intro:
      "A healthy lawn is the fastest way to lift the look of a whole property — and the biggest disappointment if it's laid over poor ground. We supply and lay quality natural turf on soil that's been properly prepared, graded and drained, so your new lawn takes quickly and holds up to Melbourne summers, kids and pets.",
    included: [
      "Site clearing, weed removal and soil preparation",
      "Grading and levelling for a smooth, even finish",
      "Supply of quality warm-season turf suited to your aspect",
      "Careful laying, rolling and joint alignment",
      "Watering-in and simple aftercare advice",
    ],
    body:
      "We help you choose the right variety for the spot — a tougher couch or kikuyu for a lawn that cops full sun and foot traffic, or a soft-leaf buffalo where you want shade tolerance and a plush feel underfoot. Whether it's a small front verge or a full backyard, we handle the whole job, leave the site tidy, and tell you exactly how to water it in for the first few weeks.",
  },
  {
    name: "Paving & Stepping Stones",
    image: "service-paving-and-stepping-stones.webp",
    imageAlt: "Bluestone paving laid level across an outdoor patio area",
    tagline: "Patios, paths and pool surrounds laid dead level and built to last.",
    desc:
      "Paving and stepping-stone paths across Melbourne's west and inner suburbs — bluestone, concrete and clay pavers on a proper base with correct drainage. Free on-site quotes: call 0457 357 085.",
    intro:
      "Good paving is all in the base you don't see. We excavate, compact and lay a proper sub-base so your patio, path or pool surround stays flat and true for years — no rocking pavers, no puddles, no weeds pushing through the joints.",
    included: [
      "Excavation and compacted road-base preparation",
      "Bluestone, concrete, clay and porcelain pavers",
      "Stepping-stone paths and garden walkways",
      "Correct falls for drainage away from the house",
      "Clean cuts, tight joints and a swept finish",
    ],
    body:
      "From an entertaining area off the back door to a neat path down the side of the house, we lay to a string line and a level so the finish looks sharp and drains the way it should. We'll talk you through paver options to match your home and budget, and make sure water runs away from your slab, not toward it.",
  },
  {
    name: "Retaining Walls",
    image: "service-retaining-walls.webp",
    imageAlt: "Concrete sleeper retaining wall holding back a garden bed",
    tagline: "Structural walls that hold back slopes and carve out usable, level yard.",
    desc:
      "Retaining walls across Melbourne's west and inner suburbs — timber and concrete sleepers, besser block and rock walls, built with proper drainage. Free on-site quotes: call 0457 357 085.",
    intro:
      "A retaining wall does real structural work, so it has to be built right. We set posts to the correct depth, use the right materials for the load, and put ag-drain and backfill behind every wall so water has somewhere to go instead of pushing the wall over.",
    included: [
      "Timber and concrete sleeper walls",
      "Besser block and rendered walls",
      "Natural rock and boulder walls",
      "Ag-drain, aggregate and correct backfill",
      "Levelling and terracing of sloping blocks",
    ],
    body:
      "Whether you're levelling a sloping backyard for a lawn, terracing a garden into usable beds, or holding back a driveway cut, we'll recommend the right wall type and height for the job. We build plenty of boundary and split-level walls across our service area, and we'll let you know if a job needs engineering or council sign-off before we start.",
  },
  {
    name: "Soft Landscaping",
    image: "service-soft-landscaping.webp",
    imageAlt: "Freshly mulched garden bed planted with native shrubs",
    tagline: "Garden beds, mulch and planting that make the whole yard feel finished.",
    desc:
      "Soft landscaping across Melbourne's west and inner suburbs — garden beds, planting, quality soil, mulch and edging. Low-maintenance gardens done right. Free on-site quotes: call 0457 357 085.",
    intro:
      "Soft landscaping is what turns a bare block into a garden. We build up good soil, choose plants that suit the spot and your appetite for maintenance, and finish with clean edges and quality mulch so beds look sharp and stay that way.",
    included: [
      "Garden bed shaping and soil improvement",
      "Plant selection and planting",
      "Quality mulch, compost and feature stone",
      "Timber, steel or masonry garden edging",
      "Low-maintenance and water-wise planting plans",
    ],
    body:
      "We're big on hardy, water-wise plants that look good with minimal fuss — natives and exotics that handle our hot summers and clay soils. Tell us how much time you want to spend gardening and we'll plan beds to match, from a low-care front garden to a lush, layered backyard.",
  },
  {
    name: "Garden Design",
    image: "service-garden-design.webp",
    imageAlt: "Hand-drawn garden design plan showing a landscaped courtyard layout",
    tagline: "A clear plan for your outdoor space, costed and ready to build.",
    desc:
      "Garden design across Melbourne's west and inner suburbs — concept plans, planting schedules and staged build options that you can actually afford to build. Free on-site quotes: call 0457 357 085.",
    intro:
      "A good design saves money by getting the decisions right before anyone picks up a shovel. We map out how your space should flow — lawn, paving, beds, screening and features — and give you a plan you can build in one go or stage over time.",
    included: [
      "On-site consultation and measure-up",
      "Concept and layout plans",
      "Plant and materials schedule",
      "Costing and staged build options",
      "The option to have us build the whole thing",
    ],
    body:
      "Because we design and build, our plans are realistic and buildable — no drawings full of features you'll never afford. We'll balance the look you're after with your budget and how the space needs to work day to day, then hand you a clear plan. When you're ready to build, our team can bring it to life.",
  },
];

function serviceJsonLd(s, canonical) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": s.name,
        "serviceType": s.name,
        "description": s.tagline,
        "url": canonical,
        "areaServed": AREA_SUBURBS.map((n) => ({ "@type": "City", name: n })),
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

function servicePage(s) {
  const sl = slug(s.name);
  const canonical = `${SITE}/services/${sl}`;
  const title = `${s.name.replace(/&/g, "&amp;")} — Melbourne's West &amp; Inner Suburbs | Turf and Landscaping`;
  const others = SERVICES.filter((x) => x.name !== s.name);
  return `${head({ title, desc: s.desc, canonical, image: SITE + "/assets/images/" + s.image })}
  <script type="application/ld+json">
  ${JSON.stringify(serviceJsonLd(s, canonical), null, 2)}
  </script>
</head>
<body class="editorial">
${HEADER}
  <main id="main">
    <section class="page-hero">
      <div class="page-hero__media">
        <img src="/assets/images/${s.image}" alt="${s.imageAlt}" width="1200" height="750" fetchpriority="high" />
      </div>
      <div class="wrap page-hero__inner">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/#services">Services</a><span>/</span>${s.name.replace(/&/g, "&amp;")}</nav>
        <h1>${s.name.replace(/&/g, "&amp;")} across Melbourne's west &amp; inner suburbs</h1>
        <p>${s.tagline}</p>
        ${heroActions()}
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="prose">
          <p class="lead">${s.intro}</p>
          <h2>What's included</h2>
          <ul>
${s.included.map((i) => `            <li>${i}</li>`).join("\n")}
          </ul>
          <h2>Local, reliable and built to last</h2>
          <p>${s.body}</p>
          <h2>Where we work</h2>
          <p>We provide ${s.name.toLowerCase().replace(/&/g, "and")} across Melbourne's west and selected inner-city, northern, eastern and bayside areas. <a href="/#areas">See our full service area</a> or get in touch to confirm your suburb.</p>
        </div>

        <div class="prose" style="margin-top:2.4rem;">
          <h2>Other services</h2>
          <div class="chip-row">
${others.map((o) => `            <a class="chip" href="/services/${slug(o.name)}">${o.name.replace(/&/g, "&amp;")}</a>`).join("\n")}
          </div>
        </div>

        <div style="margin-top:2.4rem;">
          ${ctaBand()}
        </div>
      </div>
    </section>
  </main>
${FOOTER}`;
}

/* ---------- Suburb pages: retired ----------
   Per-suburb pages were thin, templated stubs with no genuinely unique
   content per suburb, and half the suburbs they covered are no longer
   verified service areas. Coverage is now presented on the homepage via
   the regional Service Areas section instead of one page per suburb.
   Re-introduce a suburb page only when it can carry real, location-
   specific content (e.g. completed local projects). */

/* ---------- Write files ---------- */
fs.mkdirSync(path.join(OUTDIR, "services"), { recursive: true });

let count = 0;
for (const s of SERVICES) {
  const file = path.join(OUTDIR, "services", `${slug(s.name)}.html`);
  fs.writeFileSync(file, servicePage(s));
  console.log("wrote services/" + slug(s.name) + ".html");
  count++;
}
console.log("Done:", count, "pages");
