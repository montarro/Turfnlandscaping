/* =====================================================================
   Vercel build: assemble the static site into ./dist
   - copies the hand-written static files
   - generates the service + suburb pages
   - generates the WebP images
   Run automatically by Vercel (see vercel.json buildCommand). Locally:
     npm install && npm run build
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

function copy(rel) {
  const src = path.join(ROOT, rel);
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("copied", rel);
}

// Fresh dist
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Static, hand-written files
["index.html", "quote.html", "404.html", "style.css", "service-pages.css", "projects.css", "projects.js", "main.js", "quote.js", "robots.txt", "sitemap.xml"].forEach(copy);

// Whole assets/ tree (logos, favicon, photography) — copying the directory
// rather than a hand-maintained list means any new asset ships automatically.
// Raw-source folders that must never ship to the public CDN: assets/photos is
// the input to apply-photos.js (pages only ever reference the generated WebP),
// and the ALL-CAPS folders are unprocessed photo drops from the client.
const SKIP_DIRS = new Set(["photos", "IMAGES OF FINISHED JOBS", "BEFORE AND AFTERS", "VIDEOS"]);
const SKIP_FILES = new Set(["homepage rebuild inspo.png", "video hero.mp4"]);
function copyDir(relDir) {
  const src = path.join(ROOT, relDir);
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      if (relDir.startsWith("assets") && SKIP_DIRS.has(entry.name)) continue;
      copyDir(rel);
    } else if (!SKIP_FILES.has(entry.name)) copy(rel);
  }
}
copyDir("assets");
copyDir("admin");

// Generated pages + images, written straight into dist
const env = { ...process.env, OUTDIR: DIST };
execFileSync("node", [path.join(__dirname, "build-pages.js")], { stdio: "inherit", env });
// Individual service pages — runs after build-pages.js so its versions of
// overlapping routes (retaining-walls, soft-landscaping) win.
execFileSync("node", [path.join(__dirname, "build-service-pages.js")], { stdio: "inherit", env });
execFileSync("node", [path.join(__dirname, "build-project-pages.js")], { stdio: "inherit", env });
execFileSync("node", [path.join(__dirname, "gen-images.js")], { stdio: "inherit", env });

// Real photography wins over generated placeholders.
// Anything committed in assets/images/ is copied over the generated files, so
// dropping a real photo in there (same filename) is all it takes to ship it.
const SRC_IMG = path.join(ROOT, "assets", "images");
const DEST_IMG = path.join(DIST, "assets", "images");
if (fs.existsSync(SRC_IMG)) {
  fs.mkdirSync(DEST_IMG, { recursive: true });
  for (const f of fs.readdirSync(SRC_IMG)) {
    if (SKIP_FILES.has(f)) continue;
    if (fs.statSync(path.join(SRC_IMG, f)).isFile()) {
      fs.copyFileSync(path.join(SRC_IMG, f), path.join(DEST_IMG, f));
      console.log("used real asset", f);
    }
  }
}

// Real client photos (assets/photos/) win over everything above.
execFileSync("node", [path.join(__dirname, "apply-photos.js")], { stdio: "inherit", env });

console.log("Build complete ->", DIST);
