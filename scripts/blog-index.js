/* =====================================================================
   Shared, read-only view of the blog drafts for the OTHER generators.

   build-blog.js renders the articles; build-service-pages.js only needs
   to know which articles are live and which services they relate to, so
   a service page can point readers at the advice written about it.
   Service names -> routes live here so both generators agree.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const POSTS_DIR = path.join(__dirname, "..", "content", "blog");

/* Article relatedServices name -> live service route. */
const SERVICE_ROUTE = {
  "Natural Turf": "/services/natural-turf-installation",
  "Synthetic Turf": "/services/synthetic-turf-installation",
  "Turf Repair and Patching": "/services/turf-repair-patching",
  "Custom Landscaping": "/services/complete-landscape-transformations",
  "Garden Design": "/services/garden-design",
  "Hard Landscaping": "/services/hard-landscaping",
  "Pavers and Stepping Stones": "/services/paving",
  "Retaining Walls": "/services/retaining-walls",
  "Plants and Mulch": "/services/plants-garden-beds-mulch",
  "Soft Landscaping": "/services/soft-landscaping",
  "Property Maintenance": "/services/property-maintenance",
  "Garden Care": "/services/garden-care",
  "Lawn Mowing": "/services/lawn-mowing",
  "Commercial Landscaping": "/services/property-maintenance",
};

function frontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  const data = {};
  if (!m) return data;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    else v = v.replace(/^"|"$/g, "");
    data[kv[1]] = v;
  }
  return data;
}

/* Published articles only, in editorial (file) order. */
function publishedPosts() {
  return fs.readdirSync(POSTS_DIR)
    .filter((f) => /^\d+-.*\.md$/.test(f))
    .sort()
    .map((f) => frontmatter(fs.readFileSync(path.join(POSTS_DIR, f), "utf8")))
    .filter((d) => String(d.published).trim() === "true" && /^\d{4}-\d{2}-\d{2}$/.test(d.datePublished || ""))
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      routes: (d.relatedServices || []).map((s) => SERVICE_ROUTE[s]).filter(Boolean),
    }));
}

module.exports = { SERVICE_ROUTE, publishedPosts };
