/* =====================================================================
   Service-area register and the local area pages (/areas/<slug>).

   REGIONS is the one list of suburbs the site says it serves. The chips in
   index.html (#areas) and its areaServed schema must carry exactly these
   suburbs — build-area-pages.js fails the build when they drift.

   AREAS are the local landing pages. Every entry is generated so it can be
   previewed, but a page is public (indexable, in the sitemap, linked from
   the service-area section) only once `published` is true, and the build
   refuses to publish a page that has no confirmed local project or that
   still carries an [[EDITORIAL: ...]] note. The rules are the same as for
   the rest of the site: nothing invented — no local addresses, soil or
   council claims, job counts, or projects whose suburb the client has not
   confirmed. A suburb without a page is still served and still quoted.

   History: per-suburb stub pages were retired in August 2026 because they
   carried no suburb-specific content. This pattern replaces them only for
   suburbs that can show real local work.
   ===================================================================== */

const REGIONS = [
  {
    name: "Melbourne's West",
    /* Point Cook re-added 12 Oct 2026 on Khaled's confirmation (it had been
       dropped with Craigieburn, Mickleham, Sunbury and Melton in August);
       Sebastian's sign-off is still to be recorded before production. */
    suburbs: ["Hoppers Crossing", "Werribee", "Point Cook", "Altona Meadows", "Altona", "Newport", "Williamstown", "Yarraville", "Seddon", "Sunshine", "Caroline Springs", "Footscray", "Kingsville", "Maribyrnong", "Maidstone", "Spotswood", "Brooklyn"],
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
    name: "Inner East, South & Bayside",
    suburbs: ["Richmond", "Cremorne", "South Yarra", "Toorak", "Prahran", "Kew", "Brighton"],
  },
];

/* Fields:
   slug, name, region   — the suburb; `name` must appear in REGIONS[region].
   published            — false keeps the page noindex, unlinked and out of
                          the sitemap. Flip it only when the guards below pass.
   localProjects        — [{ slug, note }] projects on /projects whose suburb
                          Sebastian has confirmed, with a one-line note in
                          his words about the job. Required to publish.
   siteNotes            — verified, suburb-specific sentences about access,
                          typical blocks, estate guidelines or soil, written
                          from actual jobs. Until then an [[EDITORIAL: ...]]
                          note saying what is needed (drafts only).
   guides               — published article slugs worth showing here. */
const AREAS = [
  {
    slug: "werribee",
    name: "Werribee",
    region: "Melbourne's West",
    published: false,
    localProjects: [],
    siteNotes: "[[EDITORIAL: Sebastian to describe, from actual Werribee jobs, what is typical there: block sizes, new-estate handovers, side access, soil. Nothing is assumed in the meantime.]]",
    evidenceNote: "[[EDITORIAL: This page stays a noindex draft until (1) at least one completed Werribee project, with photos and Sebastian's confirmation of the suburb, is on /projects and listed in localProjects, and (2) Search Console shows Werribee landscaping or turf queries worth a page. See content/evidence-checklist.md.]]",
    guides: ["natural-turf-installation-cost-melbourne", "landscaping-cost-melbourne", "new-build-landscaping-checklist-melbourne", "how-to-plan-complete-landscaping-project", "best-time-to-lay-turf-melbourne", "natural-vs-synthetic-turf-melbourne"],
  },
  {
    slug: "point-cook",
    name: "Point Cook",
    region: "Melbourne's West",
    published: false,
    localProjects: [],
    siteNotes: "[[EDITORIAL: Sebastian to describe, from actual Point Cook jobs, what is typical there: estate design guidelines, handover state of new builds, access, soil. Nothing is assumed in the meantime.]]",
    evidenceNote: "[[EDITORIAL: Point Cook was dropped from the service area in August 2026 and re-added on 12 October 2026 on Khaled's confirmation; Sebastian's sign-off is still needed. This page also stays a noindex draft until at least one completed Point Cook project is on /projects and listed in localProjects, and Search Console shows demand. See content/evidence-checklist.md.]]",
    guides: ["natural-turf-installation-cost-melbourne", "landscaping-cost-melbourne", "new-build-landscaping-checklist-melbourne", "how-to-plan-complete-landscaping-project", "best-time-to-lay-turf-melbourne", "natural-vs-synthetic-turf-melbourne"],
  },
];

module.exports = { REGIONS, AREAS };
