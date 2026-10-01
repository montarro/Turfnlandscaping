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
};

const SIZES = {
  hero: { w: 1600, h: 1067, q: 72, file: (s) => `blog-${s}.webp` },
  h1200: { w: 1200, h: 800, q: 72, file: (s) => `blog-${s}-1200.webp` },
  h800: { w: 800, h: 533, q: 70, file: (s) => `blog-${s}-800.webp` },
  card: { w: 800, h: 600, q: 74, file: (s) => `blog-${s}-card.webp` },
};

async function cropTo(src, size, pos) {
  if (typeof pos !== "number") {
    return sharp(src).resize(size.w, size.h, { fit: "cover", position: pos || "centre" });
  }
  const m = await sharp(src).rotate().metadata();
  const ratio = size.w / size.h;
  let w = m.width, h = Math.round(m.width / ratio);
  if (h > m.height) { h = m.height; w = Math.round(m.height * ratio); }
  const left = Math.round((m.width - w) / 2);
  const top = Math.round((m.height - h) * pos);
  return sharp(src).rotate().extract({ left, top, width: w, height: h }).resize(size.w, size.h);
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
})();
