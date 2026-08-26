/* =====================================================================
   Central project / case-study data. One source of truth shared by the
   /projects hub, individual project pages and /before-and-after.
   RULES: real photographs only; omit any field that isn't verified
   (no invented suburbs, sizes, prices or customer names); a
   before/after pair must be two photographs of the SAME project.
   Dates come from the photo timestamps.
   ===================================================================== */

module.exports = [
  {
    slug: "front-garden-planter-transformation",
    title: "Front Garden Transformation — Raised Planter & New Lawn",
    categories: ["Retaining Walls", "Turf", "Garden Transformations"],
    summary: "A weed-covered mound on a new build turned into a raised sleeper planter with fresh turf, pebble borders and seasonal colour — finished in under two weeks.",
    challenge: "The front garden of this new build had been left as a bare, weed-covered mound — patchy soil, exposed irrigation line and no defined edge between the garden, driveway and footpath.",
    scope: [
      "Site clearing and weed removal",
      "Treated-pine sleeper planter wall with galvanised steel posts",
      "Quality topsoil supply, spread and levelling",
      "Instant turf supply and laying",
      "White pebble border and seasonal flower planting",
      "Existing magnolia retained and built around",
    ],
    approach: "The sleeper wall went in first to give the garden a clean, level frame, with galvanised posts set for long-term strength. Fresh topsoil brought the bed up to level before the turf was laid and rolled, and a white pebble border with seasonal flowers finished the front edge. The owner's established magnolia was kept and worked into the new lawn.",
    outcome: "A sharp, level front garden that lifts the whole street presence of the home — with a lawn the owners can actually use and a planter edge that will hold its line for years.",
    completed: "July 2026",
    hero: "proj-planter-after-1",
    gallery: [
      { img: "proj-planter-before-1", alt: "Before: weed-covered mound and patchy soil in the front garden of a new build" },
      { img: "proj-planter-before-2", alt: "Before: neglected garden bed with exposed irrigation line beside the driveway" },
      { img: "proj-planter-progress-1", alt: "During construction: treated-pine sleeper planter wall with fresh topsoil, ready for turf" },
      { img: "proj-planter-progress-2", alt: "During construction: sleeper wall built around the retained magnolia tree" },
      { img: "proj-planter-after-1", alt: "After: finished raised planter with fresh instant turf, white pebble border and seasonal flowers" },
      { img: "proj-planter-after-night", alt: "After at night: the finished planter bed with turf, pebbles and flowers beside the entry" },
    ],
    before: { img: "proj-planter-before-1", alt: "Before: weed-covered mound in front of the house" },
    after: { img: "proj-planter-after-1", alt: "After: raised sleeper planter with fresh turf, pebbles and flowers" },
    relatedServices: [
      ["/services/retaining-walls", "Retaining Walls"],
      ["/services/turf-installation", "Turf Installation"],
      ["/services/garden-planting", "Garden Planting"],
    ],
  },
  {
    slug: "garden-lighting-turf-planter",
    title: "Instant Turf & Feature Planter with Garden Lighting",
    categories: ["Turf", "Hard Landscaping", "Garden Transformations"],
    summary: "Fresh instant turf framed by a stained sleeper planter, pebble beds, feature tree planting and low-voltage garden lighting that brings the yard to life after dark.",
    challenge: "A new front yard that needed everything: lawn, defined garden edges, planting and a finish that would look as good at night as it does during the day.",
    scope: [
      "Instant turf supply and laying",
      "Stained timber sleeper planter walls",
      "Pebble beds with contrasting red mulch",
      "Feature tree and seasonal flower planting",
      "Low-voltage garden lighting along paths and beds",
    ],
    approach: "The beds were framed with stained sleeper walls, then layered with contrasting pebbles and red mulch around new feature planting. Warm low-voltage lights were set into the pebble borders so the paths and beds stay defined after sunset.",
    outcome: "A finished front yard with real presence — crisp lawn and defined beds by day, and a warm, welcoming glow along the paths by night.",
    completed: "August 2026",
    hero: "proj-litpath-1",
    gallery: [
      { img: "proj-litpath-1", alt: "Lit pebble path with exposed-aggregate stepping pads and garden lighting at dusk" },
      { img: "proj-litpath-2", alt: "Fresh instant turf and stained sleeper planter with garden lighting in the evening" },
    ],
    relatedServices: [
      ["/services/turf-installation", "Turf Installation"],
      ["/services/hard-landscaping", "Hard Landscaping"],
      ["/services/garden-planting", "Garden Planting"],
    ],
  },
  {
    slug: "synthetic-turf-front-lawn",
    title: "Synthetic Turf Front Lawn",
    categories: ["Turf"],
    summary: "A dense, always-green synthetic lawn installed with clean timber edging and pebble borders — zero mowing, full kerb appeal.",
    challenge: "The owners wanted a lawn that stays green year-round without watering or weekend mowing, finished neatly against the existing established garden.",
    scope: [
      "Old surface removal and base preparation",
      "Compacted base with proper drainage",
      "Quality synthetic turf supply and installation",
      "Timber edging and river-pebble border",
      "Power brushing and final grooming",
    ],
    approach: "The finish of a synthetic lawn is decided by the base, so the ground was excavated, compacted and levelled before the turf went down. Clean timber edging separates the lawn from the pebble border, and a final power brush lifts the pile for a dense, natural look.",
    outcome: "A lush, perfectly even lawn that looks freshly mown every day of the year — with no watering, no mowing and no brown patches.",
    completed: "June 2026",
    hero: "proj-synthetic-1",
    gallery: [
      { img: "proj-synthetic-1", alt: "Dense synthetic turf lawn with timber edging and river-pebble border beside an established garden" },
      { img: "proj-synthetic-2", alt: "Close view of the finished synthetic lawn showing an even, natural-looking pile" },
    ],
    relatedServices: [
      ["/services/synthetic-turf-installation", "Synthetic Turf Installation"],
      ["/services/turf-installation", "Turf Installation"],
      ["/services/garden-care", "Garden Care"],
    ],
  },
  {
    slug: "stained-sleeper-raised-garden",
    title: "Stained Sleeper Raised Garden & Instant Turf",
    categories: ["Retaining Walls", "Turf"],
    summary: "A dark-stained sleeper retaining wall carving a level lawn out of a corner block, finished with pebble borders and flowering colour.",
    challenge: "A sloping corner frontage that needed to be levelled and framed so the new lawn would hold its shape — and look sharp from both streets.",
    scope: [
      "Stained timber sleeper retaining wall with galvanised posts",
      "Soil supply and levelling behind the wall",
      "Instant turf supply and laying",
      "Pebble border and seasonal flower planting",
    ],
    approach: "The retaining wall was built to follow the corner block's two street frontages, stained dark to match the home's palette, then backfilled and levelled for turf. A pebble strip along the wall top keeps the lawn edge crisp and the flowers visible from the street.",
    outcome: "A level, defined front lawn with real street presence from every angle — and a wall built to keep it that way.",
    completed: "August 2026",
    hero: "proj-sleeperbed-1",
    gallery: [
      { img: "proj-sleeperbed-1", alt: "Dark-stained sleeper retaining wall with fresh instant turf and flowering border on a corner block" },
      { img: "proj-sleeperbed-2", alt: "Finished raised garden showing the stained sleeper wall, pebble strip and new lawn" },
    ],
    relatedServices: [
      ["/services/retaining-walls", "Retaining Walls"],
      ["/services/turf-installation", "Turf Installation"],
      ["/services/mulching", "Mulching"],
    ],
  },
];
