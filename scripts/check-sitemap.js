/* =====================================================================
   Build guard: sitemap.xml must match the indexable pages in dist/.

     node scripts/check-sitemap.js        (run last by scripts/build-site.js)

   sitemap.xml is hand-maintained, so two silent mistakes are possible:
   a page that Google may index but is never submitted, and a submitted URL
   that is missing, redirected or marked noindex. Either fails the build.
   Pages that are deliberately private (admin app, review area, 404) are
   ignored, and so is anything carrying a noindex robots meta tag.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTDIR = process.env.OUTDIR || path.join(ROOT, "dist");
const SITE = "https://bastianolandscaping.com.au";
const PRIVATE = [/^\/admin(\/|$)/, /^\/review(\/|$)/, /^\/404$/];

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") pages(p, acc); }
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const indexable = new Set();
const all = new Set();
for (const file of pages(OUTDIR)) {
  let route = "/" + path.relative(OUTDIR, file).split(path.sep).join("/").replace(/\.html$/, "");
  if (route === "/index") route = "/";
  all.add(route);
  if (PRIVATE.some((re) => re.test(route))) continue;
  const html = fs.readFileSync(file, "utf8");
  const robots = (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [])[1] || "";
  if (!/noindex/i.test(robots)) indexable.add(route);
}

const sitemap = fs.readFileSync(path.join(OUTDIR, "sitemap.xml"), "utf8");
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, "") || "/");

const missing = [...indexable].filter((r) => !listed.includes(r)).sort();
const stale = listed.filter((r) => !indexable.has(r));
const dupes = listed.filter((r, i) => listed.indexOf(r) !== i);

if (missing.length || stale.length || dupes.length) {
  console.error("Sitemap check failed — sitemap.xml is out of step with the built pages:");
  missing.forEach((r) => console.error(`  indexable but not in sitemap.xml: ${r}`));
  stale.forEach((r) => console.error(`  in sitemap.xml but ${all.has(r) ? "noindex or private" : "no such page"}: ${r}`));
  dupes.forEach((r) => console.error(`  listed twice: ${r}`));
  process.exit(1);
}
console.log(`Sitemap check: ${listed.length} URLs, all indexable; every indexable page is listed.`);
