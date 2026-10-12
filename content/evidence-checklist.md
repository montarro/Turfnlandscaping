# Evidence checklist for Sebastian

Prepared 12 October 2026. Everything on this list is a fact only you can supply. Nothing on the website has been invented to fill a gap: where a fact is missing, the draft article shows an amber "Editorial note" box instead, and the build will not publish the article until that box is replaced with your answer. Khaled will put your answers into the drafts; you do not need to edit anything yourself.

Please answer in your own words. "I don't know" or "not something we do" are useful answers too.

## A. Pricing evidence (unblocks the two cost articles)

- **A1. Natural turf jobs.** Two or three recent natural turf jobs or quotes, anonymised: date, suburb or area of Melbourne, lawn size in square metres, variety, what preparation was done (removal, soil, levelling, drainage), access (machine or wheelbarrow), the total price, and whether that total included GST.
- **A2. Landscaping scopes.** Agreed publishable costs or cost bands for three genuinely different completed jobs, ideally the front garden bed refresh, the courtyard turf refresh and the front garden planter transformation: completion date, what was included, what was excluded, and which parts (if any) were done by other trades.
- **A3. Supply-only turf.** Do you sell turf supply-only (delivered, not laid)? If not, the cost article will say so.
- **A4. GST on quotes.** Do your quotes show prices including GST?
- **A5. Synthetic turf quotes (optional, article 10).** Only if you want a synthetic cost article: two anonymised recent synthetic installations with area, access, specification, preparation, total, date and GST, plus the supplier's warranty terms.

## B. Project facts (unblocks examples in the drafts and the area pages)

- **B1. Planter new build.** For the front garden planter transformation: what else had the builder left on the block at handover, what did you do about the compacted ground and leftover material, and what is one avoidable problem you keep seeing on new builds? May we name the suburb or estate?
- **B2. Brick-wall backyard.** The backyard turf beside the tall brick wall: which variety, roughly how many hours of sun the shaded half gets, and how it has established since.
- **B3. Side yard with the raised bed.** The narrow side yard with turf between a timber sleeper bed and the house: how wide it was, what had to pass through it (bins, mower, dog), how materials were brought in, and the turf variety.
- **B4. Stepping-stone front yard.** The new-build front yard with exposed-aggregate stepping stones in pale pebbles and red mulch beds (there is a before photo too): what the job involved, so it can become a project page.
- **B5. Suburbs for projects.** For each of the eight projects on /projects, the suburb, if the client is happy for it to be named. This is what the Werribee and Point Cook pages need before they can go live: at least one project each, confirmed.
- **B6. Concrete sleepers.** Do you build concrete sleeper retaining walls? If yes, which supplier and finishes, and is there a completed one with photos?
- **B7. Pet households.** Any completed job for a household with dogs that the client is happy to describe, with photos.
- **B8. Project details for the eight project pages.** Where you can: duration, materials and brands, access constraints, and anything the growth plan calls "the client problem".

## C. Products and suppliers

- **C1. Turf varieties.** Exactly which varieties and growers you supply (the site currently says soft-leaf buffalo, couch, kikuyu and tall fescue; the photo library holds Sir Walter buffalo, Santa Ana couch and kikuyu). A current specification sheet for each, so the shade article can name products accurately.
- **C2. Synthetic product.** The synthetic turf product or products you install, with the manufacturer's cleaning, infill, drainage and warranty documents.

## D. Existing claims on the site to confirm or correct

- **D1.** Synthetic turf FAQ: "Is synthetic turf safe for dogs? Yes, we install pet-suitable turf with drainage that lets you hose it clean." Confirm, soften, or remove.
- **D2.** The synthetic turf gallery photo captioned "Synthetic turf strip between a covered deck and a sleeper garden bed" appears to be natural turf (roll joins and real blades are visible). Which is it?
- **D3.** The "Spring Sale: call-out fee normally $150, currently FREE" panel on every service page, alongside "free quote" wording elsewhere. Is the offer genuine, and should there be one quote policy?
- **D4.** Point Cook: it was removed from the service area in August 2026 and has been put back in this preview on Khaled's confirmation. Please confirm you take Point Cook jobs.
- **D5.** Which mailbox exists: info@bastianolandscaping.com.au (used on the site) or the old info@turfandlandscaping.com.au?

## E. Review and process

- **E1.** Read the eight new drafts at /review (Khaled has the link) and use Approve or Changes requested on each. Rounds 2 and 3 are still waiting for your verdict as well.
- **E2.** For the optional quote checklist article: your quote template, standard exclusions, terms and how you handle changes.
- **E3.** A realistic response standard for enquiries (for example, same business day) and how missed calls are handled, so the site can describe it truthfully.

## For Khaled: account work outside the repository

- **Search Console.** Compare the last three months with the previous three; separate branded from service searches; review queries containing any of the 38 register suburbs with landscaping, landscaper, turf, instant lawn or artificial grass; note impressions, clicks, CTR, position and landing page. This decides which area pages are worth building first.
- **Google Business Profile.** Confirm the business name, main category, services, hours, phone, website and service areas; get the current review link to replace the homepage "Read them on Google" link, which still points at the old "Turf And Landscaping" listing URL.
- **Vercel Web Analytics.** After the release, check the Events panel shows quote_start, quote_step_complete, generate_lead, quote_error and click_to_call. The project is on the Pro plan, which allows two properties per custom event; each event stays within that.
- **GoHighLevel.** Confirm the lead-source tag and note arrive on new leads, and add qualified, quoted and won stages tied to the source if the pipeline allows it.
- **Meta.** Decide whether a Lead standard event should fire on a successful quote submission (not implemented; easy to add once decided).
- **PageSpeed Insights.** The keyless API quota was exhausted again on 12 October; run the four pages (home, a service, an article, /quote) from the PSI website and record the field data before any image or font loading changes.
