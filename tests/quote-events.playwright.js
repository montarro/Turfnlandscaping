/* =====================================================================
   Quote-form enquiry events (Vercel Web Analytics custom events) and
   lead-source attribution, tested against a LOCAL build. Nothing is sent
   anywhere: the quote worker URL is mocked, the analytics script, Turnstile
   and the Meta pixel are blocked.

     node scripts/build-site.js
     node <a static server with clean URLs> dist 8799
     NODE_PATH="$(npm root -g)" node tests/quote-events.playwright.js http://localhost:8799

   Needs Playwright with Chromium (a global install is fine). Checks:
   - quote_start once, quote_step_complete once per step, generate_lead
     exactly once on a successful submission, never on failure;
   - validation, rejected (4xx), server (5xx) and network errors produce a
     quote_error with a category only;
   - a double click on Submit sends one request and one lead event;
   - the form works with analytics absent or throwing;
   - the first-visit attribution (utm/gclid) survives navigation to /quote
     and is posted as the "attribution" field;
   - click_to_call fires with a location label.
   ===================================================================== */
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8799").replace(/\/$/, "");
const WORKER = "https://bastiano-quote-api.turfnlandscaping.workers.dev/quote";
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log("  ok   " + msg); else { failures++; console.log("  FAIL " + msg); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, { analytics = "stub", worker = { status: 200, body: { ok: true }, delay: 0, abort: false } } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const state = { posts: [], worker };
  page.on("pageerror", (e) => { failures++; console.log("  FAIL page error: " + e.message); });
  await context.addInitScript((mode) => {
    window.__events = [];
    if (mode === "stub") {
      window.va = function () { var a = Array.prototype.slice.call(arguments); if (a[0] === "event") window.__events.push(a[1]); };
    } else if (mode === "throws") {
      window.va = function () { throw new Error("analytics exploded"); };
    } else if (mode === "none") {
      Object.defineProperty(window, "va", { get() { return undefined; }, set() {}, configurable: true });
    }
  }, analytics);
  await context.route(/_vercel\/insights|challenges\.cloudflare\.com|connect\.facebook\.net|facebook\.com\/tr/, (r) => r.abort());
  await context.route(WORKER, async (r) => {
    state.posts.push(r.request().postDataBuffer() ? r.request().postDataBuffer().toString("utf8") : "");
    const w = state.worker;
    if (w.delay) await sleep(w.delay);
    if (w.abort) return r.abort("failed");
    r.fulfill({ status: w.status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(w.body) });
  });
  return { context, page, state };
}
const events = (page) => page.evaluate(() => window.__events || []);
const count = (list, name) => list.filter((e) => e && e.name === name).length;
const click = (page, sel) => page.$eval(sel, (el) => el.click());

async function toStep3(page, { customer = "residential", service = "natural-turf" } = {}) {
  await page.goto(BASE + "/quote");
  await page.waitForSelector('input[name="ctype"]');
  await click(page, `input[name="ctype"][value="${customer}"]`);
  await click(page, `input[name="service"][value="${service}"]`);
  await click(page, "[data-next]");
  await page.waitForSelector("#qf-suburb");
  await page.fill("#qf-suburb", "Werribee");
  await click(page, "[data-next]");
  await page.waitForSelector('[data-field="name"]');
}
async function fillContact(page, { consent = true } = {}) {
  await page.fill('[data-field="name"] input', "Test Person");
  await page.fill('[data-field="mobile"] input', "0400000000");
  await page.fill('[data-field="email"] input', "test@example.com");
  const sel = await page.$('[data-field="contact_method"] select');
  if (sel) await sel.selectOption({ index: 1 });
  else await click(page, '[data-field="contact_method"] input');
  if (consent) await click(page, "#qf-consent");
}

(async () => {
  const browser = await chromium.launch();
  try {
    // ---- 1. the happy path: one of each event, one request, confirmation shown
    {
      console.log("1. successful submission");
      const { context, page, state } = await open(browser);
      await page.goto(BASE + "/quote");
      await page.waitForSelector('input[name="ctype"]');
      ok(count(await events(page), "quote_start") === 0, "no quote_start before any interaction");
      await toStep3(page);
      await fillContact(page);
      await click(page, "[data-submit]");
      await page.waitForSelector(".qdone", { timeout: 10000 });
      const ev = await events(page);
      ok(count(ev, "quote_start") === 1, "quote_start fired once");
      ok(count(ev, "quote_step_complete") === 3, "quote_step_complete fired for all three steps");
      ok(ev.filter((e) => e.name === "quote_step_complete").map((e) => e.data.step).join(",") === "1,2,3", "step numbers are 1, 2, then 3");
      ok(count(ev, "generate_lead") === 1, "generate_lead fired exactly once");
      ok(count(ev, "quote_error") === 0, "no quote_error on the happy path");
      ok(state.posts.length === 1, "exactly one request reached the worker");
      const lead = ev.find((e) => e.name === "generate_lead");
      ok(JSON.stringify(Object.keys(lead.data).sort()) === JSON.stringify(["customer_type", "service"]), "generate_lead carries only customer_type and service");
      const blob = JSON.stringify(ev);
      ok(!/Test Person|0400000000|example\.com|Werribee/.test(blob), "no personal data in any event");
      await context.close();
    }
    // ---- 2. validation failures never produce a lead or a request
    {
      console.log("2. validation failures");
      const { context, page, state } = await open(browser);
      await page.goto(BASE + "/quote");
      await page.waitForSelector("[data-next]");
      await click(page, "[data-next]");
      let ev = await events(page);
      ok(count(ev, "quote_error") === 1 && ev[0].data.category === "validation" && ev[0].data.step === 1, "step 1 validation error recorded as {validation, 1}");
      ok(count(ev, "quote_step_complete") === 0, "no step completion on a failed validation");
      await toStep3(page);
      await fillContact(page, { consent: false });
      await click(page, "[data-submit]");
      await sleep(300);
      ev = await events(page);
      ok(ev.some((e) => e.name === "quote_error" && e.data.category === "validation" && e.data.step === 3), "step 3 validation error recorded as {validation, 3}");
      ok(!ev.some((e) => e.name === "quote_step_complete" && e.data.step === 3), "no step 3 completion without consent");
      ok(count(ev, "generate_lead") === 0 && state.posts.length === 0, "no lead event and no request without consent");
      await click(page, "#qf-consent");
      await click(page, "[data-submit]");
      await page.waitForSelector(".qdone", { timeout: 10000 });
      ev = await events(page);
      ok(ev.filter((e) => e.name === "quote_step_complete" && e.data.step === 3).length === 1, "correcting consent records step 3 once");
      await context.close();
    }
    // ---- 3. a rejected submission (4xx), then a successful retry
    {
      console.log("3. rejected by the worker, then retry");
      const { context, page, state } = await open(browser, { worker: { status: 400, body: { ok: false, error: "Please check the mobile number." } } });
      await toStep3(page);
      await fillContact(page);
      await click(page, "[data-submit]");
      await page.waitForFunction(() => { const e = document.querySelector(".qerror"); return e && !e.hidden && e.textContent.length > 0; }, null, { timeout: 10000 });
      let ev = await events(page);
      ok(ev.some((e) => e.name === "quote_error" && e.data.category === "rejected" && e.data.step === 3), "4xx recorded as {rejected, 3}");
      ok(count(ev, "generate_lead") === 0, "no lead on a rejected submission");
      ok(ev.filter((e) => e.name === "quote_step_complete" && e.data.step === 3).length === 1, "step 3 validation recorded even when the server rejects the request");
      ok(await page.$eval(".qerror", (e) => e.textContent.includes("mobile number")), "worker message shown to the visitor");
      state.worker = { status: 200, body: { ok: true } };
      await click(page, "[data-submit]");
      await page.waitForSelector(".qdone", { timeout: 10000 });
      ev = await events(page);
      ok(count(ev, "generate_lead") === 1, "retry produces exactly one lead");
      ok(ev.filter((e) => e.name === "quote_step_complete" && e.data.step === 3).length === 1, "retry does not repeat step 3 completion");
      ok(state.posts.length === 2, "two requests in total (one rejected, one accepted)");
      await context.close();
    }
    // ---- 4. server error and network failure
    for (const [label, worker, category] of [["5xx", { status: 500, body: {} }, "server"], ["network", { status: 200, body: {}, abort: true }, "network"]]) {
      console.log("4. " + label + " failure");
      const { context, page } = await open(browser, { worker });
      await toStep3(page);
      await fillContact(page);
      await click(page, "[data-submit]");
      await page.waitForFunction(() => { const e = document.querySelector(".qerror"); return e && !e.hidden && e.textContent.length > 0; }, null, { timeout: 10000 });
      const ev = await events(page);
      ok(ev.some((e) => e.name === "quote_error" && e.data.category === category), label + " recorded as {" + category + "}");
      ok(count(ev, "generate_lead") === 0, "no lead on " + label + " failure");
      ok(ev.filter((e) => e.name === "quote_step_complete" && e.data.step === 3).length === 1, "step 3 validation recorded before " + label + " failure");
      ok(await page.$eval("[data-submit]", (b) => !b.disabled), "submit button re-enabled for a retry");
      await context.close();
    }
    // ---- 5. double click sends one request and one lead
    {
      console.log("5. double click on submit");
      const { context, page, state } = await open(browser, { worker: { status: 200, body: { ok: true }, delay: 400 } });
      await toStep3(page);
      await fillContact(page);
      await page.$eval("[data-submit]", (b) => { b.click(); b.click(); b.click(); });
      await page.waitForSelector(".qdone", { timeout: 10000 });
      await sleep(600);
      const ev = await events(page);
      ok(state.posts.length === 1, "three clicks, one request");
      ok(count(ev, "generate_lead") === 1, "three clicks, one lead event");
      ok(ev.filter((e) => e.name === "quote_step_complete" && e.data.step === 3).length === 1, "three clicks, one step 3 completion");
      await context.close();
    }
    // ---- 6. analytics absent or broken: the form still works
    for (const mode of ["none", "throws"]) {
      console.log("6. analytics " + mode);
      const { context, page, state } = await open(browser, { analytics: mode });
      await toStep3(page);
      await fillContact(page);
      await click(page, "[data-submit]");
      await page.waitForSelector(".qdone", { timeout: 10000 });
      ok(state.posts.length === 1, "submission completes with analytics " + mode);
      await context.close();
    }
    // ---- 7. attribution survives navigation and is posted
    {
      console.log("7. lead-source attribution");
      const { context, page, state } = await open(browser);
      await page.goto(BASE + "/?utm_source=google&utm_medium=cpc&gclid=TESTCLICK123");
      await page.waitForSelector("a[href='/quote']", { state: "attached" });
      await page.$eval("a[href='/quote']", (a) => a.click()); // an ordinary internal click: must not count as a new arrival
      await page.waitForURL(/\/quote/);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("bl_lead_source_v1") || "null"));
      ok(stored && stored.first && stored.first.gclid === "TESTCLICK123" && stored.first.utm_source === "google", "first touch keeps the click id and utm source");
      ok(stored && stored.first.landing === "/", "first touch keeps the landing page");
      await page.waitForSelector('input[name="ctype"]');
      await click(page, 'input[name="ctype"][value="residential"]');
      await click(page, 'input[name="service"][value="transformation"]');
      await click(page, "[data-next]");
      await page.waitForSelector("#qf-suburb");
      await page.fill("#qf-suburb", "Point Cook");
      await click(page, "[data-next]");
      await page.waitForSelector('[data-field="name"]');
      await fillContact(page);
      await click(page, "[data-submit]");
      await page.waitForSelector(".qdone", { timeout: 10000 });
      ok(state.posts.length === 1 && /name="attribution"/.test(state.posts[0]) && /TESTCLICK123/.test(state.posts[0]), "attribution field posted with the click id");
      await context.close();
    }
    // ---- 8. click_to_call
    {
      console.log("8. click_to_call");
      const { context, page } = await open(browser);
      await page.goto(BASE + "/");
      await page.waitForSelector('.site-header a[href^="tel:"]');
      await page.evaluate(() => { document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest('a[href^="tel:"]')) e.preventDefault(); }, true); });
      await page.$eval('.site-header .header-phone', (a) => a.click());
      await page.$eval('.site-footer a[href^="tel:"]', (a) => a.click());
      const ev = await events(page);
      const calls = ev.filter((e) => e.name === "click_to_call").map((e) => e.data.location);
      ok(calls.join(",") === "header,footer", "call clicks labelled header then footer (got: " + calls.join(",") + ")");
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
