# Photography brief — Turf and Landscaping

## Current state (read this first)

As of this update, **only one real photograph exists in the whole project** —
`assets/photos/hero.png`, a plain lawn/grass-field shot with no paving, walls
or planting in frame. It's currently used as the homepage hero image.

**Every other image slot on the site — every service card, every "recent
work" gallery photo, the founder photo — is an abstract generated graphic**
(a green gradient with faint line-art shapes), not a photograph of any real
project. This is why the site currently reads as generic and product-y
rather than like a real, capable landscaping company: there is no genuine
completed-project photography to show yet.

No further placeholder graphics should be generated to replace these — the
fix is real photographs, not better fake ones. Below is exactly what's
needed, in priority order.

## Priority 1 — hero image (blocks the strongest first impression)

| File | Size | Shot |
| --- | --- | --- |
| `hero-landscaping-northwest-melbourne.webp` (replace `assets/photos/hero.png`) | 1920×1080 | The single strongest **completed backyard transformation** you have — ideally showing several services together in one frame: turf, paving or stepping stones, a retaining wall, and planted garden beds. Wide angle, daylight, shot after clean-up. This should look like "the outcome a customer wants," not a material close-up. If nothing like this exists yet, this is the #1 photography priority — everything else can wait. |

## Priority 2 — the human/founder photography

New site sections now reference these but render nothing fake in their
place — they show an elegant "photo coming soon" placeholder panel until
real images are supplied. None of these should be AI-generated or stock.

| Need | Notes |
| --- | --- |
| Founder portrait | Clean, confident, approachable. Not a posed corporate headshot, not an anonymous labourer shot. Good daylight, on a real job site or a simple neutral background. |
| Founder speaking with a customer on-site | Candid-feeling, not staged. Communicates approachability and trust. |
| Founder inspecting/measuring a project | Communicates competence and attention to detail. |
| Team working professionally | Mid-task, tidy site, real tools/materials — communicates capability without looking like a stock photo. |
| Work-detail shots | Close-ups of clean edges, level paving joints, tidy drainage — the small things that show quality without needing a person in frame. |
| Family photograph (optional) | Only if the client explicitly approves public use. Not required. |

## Priority 3 — service cards / page heroes

Real photos, same filenames so no code changes are needed:

| File | Size | Shot |
| --- | --- | --- |
| `service-natural-turf-solutions.webp` | 1200×750 | Fresh turf being rolled out, or a finished lush lawn. |
| `service-paving-and-stepping-stones.webp` | 1200×750 | A completed patio or path, level and swept. |
| `service-retaining-walls.webp` | 1200×750 | A finished sleeper or block retaining wall — this is also the current "Landscape Construction" flagship card image, so ideally a genuinely impressive full-scale build. |
| `service-soft-landscaping.webp` | 1200×750 | Freshly planted, mulched garden beds with clean edging. |
| `service-garden-design.webp` | 1200×750 | A designed space (or a plan/drawing alongside the built result). |
| Synthetic turf (no file yet) | 1200×750 | A finished synthetic lawn — needed before the Synthetic Turf pathway can get its own page instead of pointing straight to the quote form. |

## Priority 4 — recent work gallery (9 images, 1200×900, 4:3)

Real completed local jobs. Suburb-specific claims must only use suburbs
confirmed on the current [service-area list](index.html) — see
`scripts/build-pages.js` for the authoritative regions.

| File | Shot |
| --- | --- |
| `new-turf-lawn-craigieburn-backyard.webp` | New backyard lawn — filename references an unverified area; caption is currently generic ("a Melbourne backyard"). Replace with a real photo from a confirmed suburb if possible. |
| `bluestone-paving-patio-sunbury.webp` | Bluestone (or similar) paved patio — same note as above. |
| `timber-sleeper-retaining-wall-melton.webp` | Timber sleeper wall on a slope — same note as above. |
| `native-garden-planting-point-cook.webp` | Native/water-wise garden beds — same note as above. |
| `stepping-stone-path-werribee.webp` | Stepping-stone path through lawn, Werribee (confirmed area — real photo from here is ideal). |
| `instant-turf-front-lawn-mickleham.webp` | Instant-turf front lawn — same note as above. |
| `courtyard-garden-design-craigieburn.webp` | Designed courtyard — same note as above. |
| `concrete-sleeper-retaining-wall-sunbury.webp` | Concrete sleeper wall — same note as above. |
| `mulched-garden-beds-shrubs-melton.webp` | Mulched beds with shrubs — same note as above. |

## Shooting guidelines

- **Landscape orientation**, natural daylight, shot after clean-up (no
  tools, bins or hoses in frame).
- Show **finished work**: crisp lawn edges, swept paving, level walls.
- Get **before/after pairs** where you can.
- Get written consent for identifiable house numbers, cars or people.
- **Real local jobs** beat stock every time; where a filename or caption
  names a suburb, use a job from that suburb, and only from a suburb on the
  current confirmed service-area list.
- People photography (founder/team) should feel natural, not posed like a
  corporate stock shoot.

## Logo

`assets/logo-mark.svg` is a clean vector recreation of the grass-and-tree
emblem. If you have the original brand logo as SVG or a high-res
transparent PNG, drop it in and update the `<img class="brand__logo">`
references in `index.html` and `scripts/build-pages.js` (then re-run the
generator).
