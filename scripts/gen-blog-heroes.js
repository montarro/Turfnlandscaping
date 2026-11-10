/* =====================================================================
   Blog hero images — manual, run whenever a draft's heroImage changes:

     node scripts/gen-blog-heroes.js                 every article
     node scripts/gen-blog-heroes.js <slug> [...]    only these articles

   Reads the `heroImage` field from each draft in content/blog/, finds that
   filename in the client's raw photo drops (gitignored, never shipped), and
   writes committed WebPs per article:

     assets/images/blog-<slug>.webp         1600x1067 hero + Open Graph
     assets/images/blog-<slug>-1200.webp    1200x800  hero srcset
     assets/images/blog-<slug>-800.webp      800x533  hero srcset (phones)
     assets/images/blog-<slug>-card.webp     800x600  index cards

   Articles not being regenerated still get any missing -1200/-800 files,
   downscaled from their committed 1600px hero, so every article page can
   serve a phone-sized hero without touching the approved crop.

   This is NOT part of the Vercel build: the raw JPGs are not in git, so the
   generated WebPs are committed instead — same arrangement as the photo-*.webp
   homepage images.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const POSTS = path.join(ROOT, "content", "blog");
const OUT = path.join(ROOT, "assets", "images");
// searched in order for each heroImage filename
const RAW_DIRS = [
  path.join(ROOT, "assets", "images", "IMAGES OF FINISHED JOBS", "IMAGES NEW 31 AUG"),
  path.join(ROOT, "assets", "photos", "raw-14-sep"),
  // client-supplied WebPs for the turf pages (committed, so these always exist)
  path.join(ROOT, "assets", "images", "turf images web"),
  // Sebastian's media drop (gitignored, like the folders above)
  path.join(ROOT, "photos-from-seb", "Bastiano Media ", "1 - Natural turf Solutions", "Residential"),
  path.join(ROOT, "photos-from-seb", "Bastiano Media ", "1 - Natural turf Solutions", "Commercial", "Project 1"),
  path.join(ROOT, "photos-from-seb", "Bastiano Media ", "3 - Retaining walls", "Project 1"),
];

/* Photos used inside an article's text (![alt](/assets/images/…) lines in the
   draft). Same arrangement as the heroes: the source is a raw photo drop, the
   committed output is a WebP. `w`/`h` set the shape: 1200x800 for a photo that
   runs the reading column, 800x600 for one in a row of two or three. `pos` is
   a crop as in CROP below. Written when missing, or when its article's slug is
   passed on the command line. */
const SEB = path.join(ROOT, "photos-from-seb", "Bastiano Media ");
const INLINE = [
  // buffalo-couch-kikuyu-turf-melbourne
  { slug: "buffalo-couch-kikuyu-turf-melbourne", out: "blog-inline-sir-walter-buffalo-close-up.webp", w: 800, h: 600,
    from: path.join(ROOT, "assets", "images", "turf images web", "Types of grass", "detail-sir-walter-buffalo-turf-texture.webp") },
  { slug: "buffalo-couch-kikuyu-turf-melbourne", out: "blog-inline-santa-ana-couch-close-up.webp", w: 800, h: 600,
    from: path.join(ROOT, "assets", "images", "turf images web", "Types of grass", "detail-santa-ana-couch-turf-texture.webp") },
  { slug: "buffalo-couch-kikuyu-turf-melbourne", out: "blog-inline-kikuyu-close-up.webp", w: 800, h: 600,
    from: path.join(ROOT, "assets", "images", "turf images web", "Types of grass", "detail-kikuyu-turf-texture.webp") },
  // narrow-side-yard-landscaping-melbourne
  { slug: "narrow-side-yard-landscaping-melbourne", out: "blog-inline-side-yard-townhouse-before.webp", w: 1200, h: 800,
    from: path.join(SEB, "1 - Natural turf Solutions", "Commercial", "Project 1", "PXL_20260318_234326645.jpg") },
  { slug: "narrow-side-yard-landscaping-melbourne", out: "blog-inline-side-yard-timber-edge.webp", w: 800, h: 600,
    from: path.join(ROOT, "assets", "images", "turf images web", "proj-covered-deck-sideyard-after-1.webp") },
  { slug: "narrow-side-yard-landscaping-melbourne", out: "blog-inline-side-path-pebble-planting.webp", w: 800, h: 600,
    from: path.join(SEB, "5 - Garden Design", "1 job", "PXL_20260630_015759504.jpg") },
  // timber-vs-concrete-sleeper-retaining-walls
  { slug: "timber-vs-concrete-sleeper-retaining-walls", out: "blog-inline-sleeper-wall-under-construction.webp", w: 1200, h: 800,
    from: path.join(SEB, "3 - Retaining walls", "Project 1", "PXL_20260727_033747489.jpg") },
  { slug: "timber-vs-concrete-sleeper-retaining-walls", out: "blog-inline-stained-sleeper-wall-front.webp", w: 1200, h: 800,
    from: path.join(SEB, "3 - Retaining walls", "Project 1", "20260820_174415.jpg") },
];

const field = (fm, key) => (fm.match(new RegExp(`^${key}:\\s*"(.*)"\\s*$`, "m")) || [])[1];

/* A centre crop suits most of these photos. Where the subject the article's
   alt text describes sits away from the middle of the frame, name the edge to
   keep — otherwise the crop hides the very thing the photo is there to show.
   A number is the share of the spare height cut from the top (0 = keep the
   top edge, 1 = keep the bottom edge); give hero and card separately when
   their aspect ratios need different framing. */
const CROP = {
  // the garden border and house sit along the top of a tall phone photo
  "natural-vs-synthetic-turf-melbourne": "top",
  // wide daylight shot of the whole finished front yard — trim sky, keep the garden
  "how-to-plan-complete-landscaping-project": "bottom",
  // tall courtyard shot: keep the whole pebble-framed lawn square, the tree trunk and the sleeper path
  "small-backyard-landscaping-ideas-melbourne": { hero: 0.85, card: 0.8 },
  // tall phone shot of the crew on the school grounds: keep the building, hoop and the kneeling worker
  "commercial-landscaping-scope-checklist-melbourne": { hero: 0.4, card: 0.35 },
  // sprinkler lawn: the head and its flag sit mid-frame; keep the playhouse and fence line above it
  "new-landscape-maintenance-guide": { hero: 0.45, card: 0.45 },
  // tall phone shot: a crew member and ute stand at the right edge, so keep the
  // left three-quarters (x/w are shares of the width) and the lawn mid-frame
  "buffalo-couch-kikuyu-turf-melbourne": { hero: { x: 0, w: 0.76, y: 0.47 }, card: { x: 0, w: 0.76, y: 0.45 } },
};

const SIZES = {
  hero: { w: 1600, h: 1067, q: 72, file: (s) => `blog-${s}.webp` },
  h1200: { w: 1200, h: 800, q: 72, file: (s) => `blog-${s}-1200.webp` },
  h800: { w: 800, h: 533, q: 70, file: (s) => `blog-${s}-800.webp` },
  card: { w: 800, h: 600, q: 74, file: (s) => `blog-${s}-card.webp` },
};

async function cropTo(src, size, pos) {
  const box = pos && typeof pos === "object";
  if (typeof pos !== "number" && !box) {
    return sharp(src).resize(size.w, size.h, { fit: "cover", position: pos || "centre" });
  }
  // metadata() reports the stored orientation; work on the upright image
  const upright = await sharp(src).rotate().toBuffer();
  const m = await sharp(upright).metadata();
  const ratio = size.w / size.h;
  // a box { x, w, y } narrows the frame first: x and w are shares of the width,
  // y is the share of the spare height cut from the top
  const frameW = box ? Math.round(m.width * pos.w) : m.width;
  const frameLeft = box ? Math.round(m.width * pos.x) : 0;
  const share = box ? pos.y : pos;
  let w = frameW, h = Math.round(frameW / ratio);
  if (h > m.height) { h = m.height; w = Math.round(m.height * ratio); }
  const left = frameLeft + Math.round((frameW - w) / 2);
  const top = Math.round((m.height - h) * share);
  return sharp(upright).extract({ left, top, width: w, height: h }).resize(size.w, size.h);
}

(async () => {
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of fs.readdirSync(POSTS).filter((f) => /^\d+-.*\.md$/.test(f)).sort()) {
    const src = fs.readFileSync(path.join(POSTS, file), "utf8");
    const fm = src.split(/^---\s*$/m)[1] || "";
    const slug = field(fm, "slug");
    const hero = field(fm, "heroImage");
    if (!slug || !hero) { console.error("skipped (no slug/heroImage):", file); continue; }

    if (only.length && !only.includes(slug)) {
      // keep the committed crop; only add the srcset sizes it is missing
      const committed = path.join(OUT, SIZES.hero.file(slug));
      if (!fs.existsSync(committed)) continue;
      for (const key of ["h1200", "h800"]) {
        const out = path.join(OUT, SIZES[key].file(slug));
        if (fs.existsSync(out)) continue;
        await sharp(committed).resize(SIZES[key].w, SIZES[key].h, { fit: "cover" })
          .webp({ quality: SIZES[key].q, effort: 6 }).toFile(out);
        console.log(`${SIZES[key].file(slug)}  <-  ${SIZES.hero.file(slug)} (downscaled)`);
      }
      continue;
    }

    const from = RAW_DIRS.map((d) => path.join(d, hero)).find((p) => fs.existsSync(p));
    if (!from) { console.error("MISSING SOURCE:", hero, "for", slug, "— the committed blog-*.webp files stay as they are."); continue; }

    const crop = CROP[slug];
    for (const [key, size] of Object.entries(SIZES)) {
      const pos = crop && typeof crop === "object" ? (key === "card" ? crop.card : crop.hero) : crop;
      await (await cropTo(from, size, pos)).webp({ quality: size.q, effort: 6 }).toFile(path.join(OUT, size.file(slug)));
    }
    console.log(`blog-${slug} (hero, 1200, 800, card)  <-  ${path.relative(ROOT, from)}${crop ? `  [${JSON.stringify(crop)}]` : ""}`);
  }

  for (const img of INLINE) {
    const out = path.join(OUT, img.out);
    if (fs.existsSync(out) && !only.includes(img.slug)) continue;
    if (!fs.existsSync(img.from)) { console.error("MISSING SOURCE:", path.relative(ROOT, img.from), "for", img.out); continue; }
    await (await cropTo(img.from, { w: img.w, h: img.h }, img.pos)).webp({ quality: 72, effort: 6 }).toFile(out);
    console.log(`${img.out}  <-  ${path.relative(ROOT, img.from)}`);
  }
})();
