/* =====================================================================
   Blog hero images — manual, run once whenever a draft's heroImage changes:

     node scripts/gen-blog-heroes.js

   Reads the `heroImage` field from every draft in content/blog/, finds that
   filename in the client's raw photo drop (which is gitignored and never
   ships), and writes two committed WebPs per article:

     assets/images/blog-<slug>.webp        1600x1067 hero + Open Graph
     assets/images/blog-<slug>-card.webp    800x600  index cards

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
const RAW = path.join(ROOT, "assets", "images", "IMAGES OF FINISHED JOBS", "IMAGES NEW 31 AUG");

const field = (fm, key) => (fm.match(new RegExp(`^${key}:\\s*"(.*)"\\s*$`, "m")) || [])[1];

/* A centre crop suits most of these photos. Where the subject the article's
   alt text describes sits away from the middle of the frame, name the edge to
   keep — otherwise the crop hides the very thing the photo is there to show. */
const CROP = {
  // the garden border and house sit along the top of a tall phone photo
  "natural-vs-synthetic-turf-melbourne": "top",
};

(async () => {
  if (!fs.existsSync(RAW)) {
    console.error("Raw photo folder missing:", RAW);
    console.error("Nothing to do — the committed blog-*.webp files stay as they are.");
    process.exit(0);
  }
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of fs.readdirSync(POSTS).filter((f) => f.endsWith(".md")).sort()) {
    const src = fs.readFileSync(path.join(POSTS, file), "utf8");
    const fm = src.split(/^---\s*$/m)[1] || "";
    const slug = field(fm, "slug");
    const hero = field(fm, "heroImage");
    if (!slug || !hero) { console.error("skipped (no slug/heroImage):", file); continue; }

    const from = path.join(RAW, hero);
    if (!fs.existsSync(from)) { console.error("MISSING SOURCE:", hero, "for", slug); continue; }

    const pos = CROP[slug] || "centre";
    await sharp(from).resize(1600, 1067, { fit: "cover", position: pos })
      .webp({ quality: 72, effort: 6 }).toFile(path.join(OUT, `blog-${slug}.webp`));
    await sharp(from).resize(800, 600, { fit: "cover", position: pos })
      .webp({ quality: 74, effort: 6 }).toFile(path.join(OUT, `blog-${slug}-card.webp`));
    console.log(`blog-${slug}.webp + -card.webp  <-  ${hero}${pos === "centre" ? "" : `  [${pos}]`}`);
  }
})();
