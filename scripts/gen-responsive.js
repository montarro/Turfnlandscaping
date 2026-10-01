/* =====================================================================
   Build step: 800px copies of card and gallery photos.

     node scripts/gen-responsive.js      (run by scripts/build-site.js,
                                          after apply-photos.js)

   Templates offer "<name>-800.webp 800w" in srcset (chrome.js cardSrcset).
   This reads those names back out of the built HTML and writes each one
   from its full-size file in dist/assets/images, so the list can never
   drift from what the pages ask for. A missing source fails the build
   rather than shipping a srcset that points at nothing.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUTDIR = process.env.OUTDIR || path.join(__dirname, "..", "dist");
const IMAGES = path.join(OUTDIR, "assets", "images");

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") pages(p, acc); }
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const wanted = new Set();
for (const file of pages(OUTDIR)) {
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      const hit = url.match(/^\/assets\/images\/([^/]+)-800\.webp$/);
      if (hit) wanted.add(hit[1]);
    }
  }
}

(async () => {
  let made = 0;
  for (const name of [...wanted].sort()) {
    const out = path.join(IMAGES, `${name}-800.webp`);
    if (fs.existsSync(out)) continue; // committed (e.g. blog heroes)
    const src = path.join(IMAGES, `${name}.webp`);
    if (!fs.existsSync(src)) { console.error(`gen-responsive: ${name}-800.webp is in a srcset but ${name}.webp does not exist`); process.exit(1); }
    const meta = await sharp(src).metadata();
    if (meta.width <= 800) fs.copyFileSync(src, out);
    else await sharp(src).resize(800).webp({ quality: 74, effort: 5 }).toFile(out);
    made++;
  }
  console.log(`gen-responsive: ${made} 800px image(s) written for ${wanted.size} srcset name(s)`);
})();
