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
    summary: "A weed-covered mound on a new build turned into a raised sleeper planter with fresh turf, pebble borders and seasonal colour — finished in one week.",
    challenge: "The front garden of this new build had been left as a bare, weed-covered mound — patchy soil, exposed irrigation line and no defined edge between the garden, driveway and footpath.",
    work: "We started by clearing the weeds and the builder's leftovers from the site. Next we built the planter's retaining walls from 75mm treated-pine sleepers on galvanised steel posts set in concrete footings, working them around the owners' established magnolia. We then brought in sandy loam, levelled it and laid instant turf, and finished with new edging, a white pebble border, seasonal flowers and a letterbox set in concrete.",
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
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/plants-garden-beds-mulch", "Plants, Garden Beds & Mulch"],
    ],
  },
  {
    slug: "garden-lighting-turf-planter",
    title: "Instant Turf & Feature Planter with Garden Lighting",
    categories: ["Turf", "Hard Landscaping", "Garden Transformations"],
    summary: "Fresh instant turf framed by a stained sleeper planter, shaped red-mulch beds, a white-pebble stepping-stone path and low-voltage garden lighting that brings the yard to life after dark.",
    metaDescription: "Fresh instant turf framed by a stained sleeper planter, red-mulch beds, a white-pebble stepping-stone path and low-voltage lighting for the garden after dark.",
    challenge: "A tired front yard: patchy lawn, scattered pavers, an ageing river-pebble strip and declining shrubs. The established roses and the rock feature were worth keeping; the rest needed a new lawn, defined garden edges, planting and a finish that would look as good at night as it does during the day.",
    work: "We began by lifting the old lawn, the loose pavers and the ageing river pebbles. Next we framed the beds with stained timber sleeper planter walls, shaping them around the roses and rock feature the owners wanted to keep, and laid fresh instant turf. We then filled the beds with red mulch edged in white pebbles, planted a feature tree and seasonal flowers, and set a stepping-stone path through the pebbles to the front door. To finish, we set warm low-voltage lights into the pebble borders so the path and beds stay lit after sunset.",
    outcome: "A finished front yard with real presence — crisp lawn, a clear path to the door and defined beds by day, and a warm, welcoming glow along the path by night.",
    completed: "August 2026",
    hero: "proj-litpath-1",
    gallery: [
      { img: "proj-litpath-1", alt: "Lit pebble path with exposed-aggregate stepping pads and garden lighting at dusk" },
      { img: "proj-litpath-2", alt: "Fresh instant turf and stained sleeper planter with garden lighting in the evening" },
    ],
    /* Two angles of the same frontage, each with its own comparison. The
       first pair doubles as the project's before/after on the hub and
       /before-and-after pages. */
    comparisons: [
      {
        label: "Overall front garden",
        before: { img: "proj-litpath-before-1", alt: "Before: patchy front lawn with scattered pavers and established rose bushes in front of the house" },
        after: { img: "proj-litpath-after-1", alt: "After: fresh turf, shaped red-mulch beds, new planting, a white-pebble stepping-stone path and the existing rock feature" },
      },
      {
        label: "Entrance path",
        before: { img: "proj-litpath-before-2", alt: "Before: side view of the frontage with tired lawn, an ageing river-pebble strip and declining shrubs" },
        after: { img: "proj-litpath-after-wide", alt: "After: the full entrance path at dusk, stepping stones set in pebbles with low path lighting, white-pebble borders and red mulch" },
      },
    ],
    before: { img: "proj-litpath-before-1", alt: "Before: patchy front lawn with scattered pavers and established rose bushes" },
    after: { img: "proj-litpath-after-1", alt: "After: fresh turf, red-mulch beds, a white-pebble stepping-stone path and the rock feature" },
    relatedServices: [
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/hard-landscaping", "Hard Landscaping"],
      ["/services/plants-garden-beds-mulch", "Plants, Garden Beds & Mulch"],
    ],
  },
  {
    slug: "front-garden-bed-refresh",
    title: "Front Garden Bed Refresh — Pebbles, Mulch & Planting",
    categories: ["Garden Transformations"],
    summary: "A tired pebble bed beside the front entrance reshaped with curved edging, contrasting mulch and stone, and compact new planting around the existing tree.",
    challenge: "The small garden bed beside the driveway had become untidy, with ageing pebbles, sparse plants and no clear shape. The owners wanted a cleaner entrance while keeping the established tree and access to the existing services.",
    work: "We cleared the ageing pebbles and untidy growth, then reshaped the bed with curved garden edging that follows its original outline. Next we laid a white-pebble feature through the centre, filled the planting areas with fresh dark mulch, and planted compact shrubs and seasonal flowers around the existing tree, keeping the service points easy to reach.",
    outcome: "A clean, defined entrance garden with stronger contrast, fresh planting and a layout that works around the existing property.",
    completed: "July 2026",
    hero: "proj-bedrefresh-after-1",
    gallery: [
      { img: "proj-bedrefresh-before-1", alt: "Before: narrow front garden bed with ageing mixed pebbles and sparse planting beside the driveway" },
      { img: "proj-bedrefresh-after-1", alt: "After: reshaped bed with curved edging, a central white-pebble feature, dark mulch, compact shrubs and flowering plants around the existing tree" },
    ],
    before: { img: "proj-bedrefresh-before-1", alt: "Before: narrow front garden bed with ageing mixed pebbles, sparse planting and no clear structure" },
    after: { img: "proj-bedrefresh-after-1", alt: "After: reshaped bed with curved edging, a central white-pebble feature, dark mulch, compact shrubs and flowering plants" },
    relatedServices: [
      ["/services/plants-garden-beds-mulch", "Plants, Garden Beds & Mulch"],
      ["/services/garden-improvements", "Garden Improvements"],
    ],
  },
  {
    slug: "courtyard-garden-turf-refresh",
    title: "Courtyard Garden Refresh — Turf, Pebbles & Planting",
    categories: ["Turf", "Garden Transformations"],
    summary: "An overgrown courtyard bed around an established tree cleared and re-laid as a neat square of natural turf, edged in white pebbles and flowers, with the timber sleeper path kept.",
    metaDescription: "An overgrown courtyard bed around an established tree, cleared and re-laid as a neat square of natural turf edged in white pebbles, with the sleeper path kept.",
    challenge: "The bed beside the house had grown wild: weeds and self-sown growth had taken over the soil around the tree, and the timber sleeper path running past it had all but disappeared into the mess.",
    work: "We cleared the overgrowth and weeds back to bare soil, then prepared and levelled the ground around the established tree. Next we laid natural turf as a crisp square under the tree and bordered it with a white-pebble strip. We finished by planting marigolds, lavender and mixed flowering plants along the edges, and tidied the existing timber sleeper path rather than replacing it.",
    outcome: "A small courtyard that reads as one finished garden: fresh lawn under the tree, a bright pebble edge, colour along the borders and a clear path through it.",
    hero: "proj-courtyard-after-1",
    gallery: [
      { img: "proj-courtyard-before-1", alt: "Before: overgrown, weedy bed around an established tree beside a timber sleeper path" },
      { img: "proj-courtyard-after-1", alt: "After: a square of fresh natural turf under the tree, bordered with white pebbles and flowering plants, with the timber path retained" },
    ],
    before: { img: "proj-courtyard-before-1", alt: "Before: overgrown, weedy bed around an established tree beside a timber sleeper path" },
    after: { img: "proj-courtyard-after-1", alt: "After: a square of fresh natural turf under the tree, bordered with white pebbles and flowering plants" },
    relatedServices: [
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/plants-garden-beds-mulch", "Plants, Garden Beds & Mulch"],
      ["/services/garden-improvements", "Garden Improvements"],
    ],
  },
  {
    slug: "synthetic-turf-front-lawn",
    title: "Synthetic Turf Front Lawn",
    categories: ["Turf"],
    summary: "A dense, always-green synthetic lawn installed with clean timber edging and pebble borders — zero mowing, full kerb appeal.",
    challenge: "The owners wanted a lawn that stays green year-round without watering or weekend mowing, finished neatly against the existing established garden.",
    work: "We removed the old surface, then excavated and built a compacted base, levelled so the lawn would sit perfectly flat. Next we laid the synthetic turf and set clean timber edging between the lawn and a river-pebble border. We finished with a power brush to lift the pile for a dense, natural look.",
    outcome: "A lush, perfectly even lawn that looks freshly mown every day of the year — with no watering, no mowing and no brown patches.",
    completed: "June 2026",
    hero: "proj-synthetic-1",
    gallery: [
      { img: "proj-synthetic-1", alt: "Dense synthetic turf lawn with timber edging and river-pebble border beside an established garden" },
      { img: "proj-synthetic-2", alt: "Close view of the finished synthetic lawn showing an even, natural-looking pile" },
    ],
    relatedServices: [
      ["/services/synthetic-turf-installation", "Synthetic Turf Installation"],
      ["/services/garden-care", "Garden Care"],
    ],
  },
  {
    slug: "stained-sleeper-raised-garden",
    title: "Stained Sleeper Raised Garden & Instant Turf",
    categories: ["Retaining Walls", "Turf"],
    summary: "A dark-stained sleeper retaining wall carving a level lawn out of a corner block, finished with pebble borders and flowering colour.",
    challenge: "A sloping corner frontage that needed to be levelled and framed so the new lawn would hold its shape — and look sharp from both streets.",
    work: "We built a timber sleeper retaining wall on galvanised posts, following the corner block's two street frontages, and stained it dark to match the home. Next we backfilled behind the wall with soil, levelled it and laid instant turf. We finished with a white-pebble strip along the top of the wall and seasonal flowers, so the lawn edge stays crisp and the colour shows from the street.",
    outcome: "A level, defined front lawn with real street presence from every angle — and a wall built to keep it that way.",
    completed: "August 2026",
    hero: "proj-sleeperbed-1",
    gallery: [
      { img: "proj-sleeperbed-1", alt: "Dark-stained sleeper retaining wall with fresh instant turf and flowering border on a corner block" },
      { img: "proj-sleeperbed-front", alt: "Front-on view of the finished stained sleeper wall running the full width of the lawn" },
    ],
    before: { img: "proj-sleeperbed-before-1", alt: "Before: sloping corner frontage with ageing lawn, pebble beds and tired shrubs" },
    after: { img: "proj-sleeperbed-after-1", alt: "After: level lawn held by a dark-stained timber sleeper retaining wall with galvanised posts, white-pebble trim, flowers and red mulch" },
    relatedServices: [
      ["/services/retaining-walls", "Retaining Walls"],
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/plants-garden-beds-mulch", "Plants, Garden Beds & Mulch"],
    ],
  },
  {
    slug: "natural-turf-installation",
    title: "Front Yard Natural Turf Installation",
    categories: ["Turf", "Garden Transformations"],
    summary: "A bare, debris-strewn front yard cleared back to soil, levelled and laid with natural turf — an even, clean lawn running the full width of the street frontage.",
    challenge: "The whole front garden had been stripped back to bare ground: an open stretch of uneven dirt with timber offcuts and broken pavers left across it, between the house, the paling fence and the painted picket fence along the street.",
    work: "We cleared the debris, timber offcuts and broken pavers from the front yard, then raked and levelled the soil so the turf would sit evenly. Next we laid the natural turf slabs tight against each other and cut them neatly around the picket and paling fences and the path edges. We finished by watering the new lawn in thoroughly.",
    outcome: "An even, clean lawn across the whole frontage, running right up to the fence lines with no gaps or bare edges. Once installed, the lawn needs consistent watering and limited foot traffic while it settles — the sprinkler was already running the next morning.",
    completed: "June 2026",
    hero: "proj-naturalturf-after",
    gallery: [
      { img: "proj-naturalturf-before", alt: "Before: the front garden stripped back to bare, uneven soil with timber offcuts left across it" },
      { img: "proj-naturalturf-progress-1", alt: "During installation: natural turf slabs laid up to the edge of the raked and levelled soil" },
      { img: "proj-naturalturf-progress-2", alt: "During installation: turf slabs butted tightly together across the prepared front garden" },
      { img: "proj-naturalturf-after", alt: "After: an even natural turf lawn covering the full front garden up to the picket fence" },
    ],
    before: { img: "proj-naturalturf-before", alt: "Before: bare, uneven soil across the front garden" },
    after: { img: "proj-naturalturf-after", alt: "After: an even natural turf lawn across the full front garden" },
    relatedServices: [
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/turf-preparation-levelling-drainage", "Turf Preparation & Levelling"],
    ],
  },
  {
    slug: "backyard-natural-turf-installation",
    title: "Backyard Natural Turf Installation",
    categories: ["Turf", "Garden Transformations"],
    summary: "A bare, weed-covered backyard prepared and finished with a broad natural lawn, creating a cleaner and more usable space for the family.",
    challenge: "The backyard was mostly uneven soil and scattered weeds, leaving very little comfortable space for playing or spending time outside. The owners wanted a simple, practical lawn that made proper use of the available area.",
    work: "We cleared the weeds and unwanted growth from the backyard, then prepared and levelled the ground. Next we laid natural turf in straight, tight runs and cut it neatly around the boundaries and the play equipment. We finished by watering the lawn in and giving the owners simple advice for its first few weeks.",
    outcome: "A wide, even backyard lawn that gives the family a clean and useful outdoor space.",
    completed: "September 2026",
    hero: "proj-backyardturf-after-1",
    gallery: [
      { img: "proj-backyardturf-before-1", alt: "Before: large backyard of bare, uneven soil and weeds between a brick wall and the rear fence" },
      { img: "proj-backyardturf-after-1", alt: "After: broad natural lawn fitted around the backyard boundaries and the play equipment" },
    ],
    before: { img: "proj-backyardturf-before-1", alt: "Before: bare, uneven soil and weeds across the backyard" },
    after: { img: "proj-backyardturf-after-1", alt: "After: broad natural lawn fitted around the existing boundaries and play equipment" },
    relatedServices: [
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/turf-preparation-levelling-drainage", "Turf Preparation & Levelling"],
    ],
  },
];
