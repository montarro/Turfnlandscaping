/* =====================================================================
   bastiano-quote-api — receives the /quote wizard submission and pushes
   it into GoHighLevel: upsert contact → custom fields → tag → file
   uploads → note → opportunity → workflow.

   Env (dashboard-managed, never in this repo):
     GHL_PRIVATE_TOKEN     secret — HighLevel private integration token
     GHL_LOCATION_ID       sub-account/location id
     GHL_PIPELINE_ID       optional — falls back to looking up the
                           "Website Quote Requests" pipeline by name
     GHL_PIPELINE_STAGE_ID optional — falls back to the pipeline's first stage
     GHL_WORKFLOW_ID       optional — workflow step is skipped (and
                           reported in logs) when absent
     TURNSTILE_SECRET_KEY  optional — Turnstile verification runs only
                           when this is set
     ALLOWED_ORIGINS       optional comma-separated override of the
                           browser origins allowed to submit

   Lead source: the site sends an "attribution" field (recorded by
   main.js when the visitor arrived). It becomes a lead-source-* tag
   (e.g. lead-source-instagram), a "Lead source:" line at the top of the
   note and a suffix on the opportunity name. Optional contact custom
   fields "Lead Source", "First Lead Source" and "Lead Source Details"
   fill automatically if they exist in GHL. /health reports
   features.leadSource so a deploy can be confirmed.
   ===================================================================== */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

const DEFAULT_ORIGINS = [
  "https://bastianolandscaping.com.au",
  "https://www.bastianolandscaping.com.au",
];

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BODY_BYTES = 56 * 1024 * 1024; // 5 files + form fields, with slack
const FILE_TYPES = {
  jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"],
  webp: ["image/webp"], heic: ["image/heic", "image/heif"], heif: ["image/heic", "image/heif"],
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

/* Every field the wizard can legitimately send (quote.js). Anything else
   in the body is rejected. */
const KNOWN_KEYS = new Set([
  "payload", "photos", "source_page", "submitted_at", "company_website",
  "cf-turnstile-response", "attribution",
  "customer_type", "service", "addons", "required_services", "suburb",
  "approx_size", "description", "timing", "surface", "access", "material",
  "business_name", "org_type", "engagement", "maintenance_program",
  "position", "name", "mobile", "email", "contact_method", "contact_time",
  "notes", "consent",
]);

const SERVICE_NAMES = {
  "natural-turf": "Natural Turf Installation",
  "synthetic-turf": "Synthetic Turf Installation",
  "pavers": "Pavers & Stepping Stones",
  "retaining-walls": "Retaining Walls",
  "hard-landscaping": "Hard Landscaping",
  "soft-landscaping": "Soft Landscaping, Plants & Mulch",
  "transformation": "Complete Landscape Transformation",
  "help": "Help Me Choose",
};

/* answers key → candidate GHL custom-field names, matched after
   lowercasing and stripping non-alphanumerics, against both the field
   name and its fieldKey. `res`/`com` restrict a mapping to one pathway
   (the wizard reuses answer keys across pathways but they land in
   pathway-specific GHL fields). Contact name/mobile/email/company use
   GHL's standard contact fields, not custom fields. */
const FIELD_MAP = [
  { key: "customer_type", names: ["Enquiry Type"] },
  { key: "service", names: ["Primary Service"] },
  { key: "addons", names: ["Additional Services"] },
  { key: "contact_method", names: ["Preferred Contact Method"] },
  { key: "contact_time", names: ["Best Time to Contact"] },
  { key: "notes", names: ["Additional Notes"] },
  { key: "consent", names: ["Consent"] },
  { key: "source_page", names: ["Submission Source"] },
  { key: "suburb", names: ["Project Suburb or Postcode", "Project Suburb"] },
  { key: "approx_size", res: true, names: ["Approximate Size"] },
  { key: "approx_size", com: true, names: ["Estimated Project Area or Dimensions"] },
  { key: "description", res: true, names: ["Residential Project Description"] },
  { key: "description", com: true, names: ["Commercial Project Scope"] },
  { key: "timing", res: true, names: ["Desired Timing"] },
  { key: "timing", com: true, names: ["Required Completion Timeline"] },
  { key: "surface", res: true, names: ["Current Surface"] },
  { key: "access", res: true, names: ["Site Access"] },
  { key: "material", res: true, names: ["Material Preferences"] },
  { key: "position", com: true, names: ["Position or Role"] },
  { key: "org_type", com: true, names: ["Organisation Type"] },
  { key: "engagement", com: true, names: ["Engagement Type"] },
  { key: "required_services", com: true, names: ["Required Services"] },
  { key: "maintenance_program", com: true, names: ["Maintenance Interest"] },
];
const FILE_FIELD_CANDIDATES = {
  residential: ["Project Photos", "project_photos"],
  commercial: ["Supporting Files", "supporting_files", "Project Photos", "project_photos"],
};

/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = allowedOrigins(env);

    if (url.pathname === "/health" && request.method === "GET") {
      return json(200, {
        ok: true,
        config: {
          GHL_PRIVATE_TOKEN: !!env.GHL_PRIVATE_TOKEN,
          GHL_LOCATION_ID: !!env.GHL_LOCATION_ID,
          GHL_PIPELINE_ID: !!env.GHL_PIPELINE_ID,
          GHL_PIPELINE_STAGE_ID: !!env.GHL_PIPELINE_STAGE_ID,
          GHL_WORKFLOW_ID: !!env.GHL_WORKFLOW_ID,
          TURNSTILE: !!env.TURNSTILE_SECRET_KEY,
        },
        /* feature flag, so a deploy can be confirmed from outside */
        features: { leadSource: true },
      });
    }

    if (url.pathname !== "/quote") return json(404, { ok: false, error: "Not found" });

    if (request.method === "OPTIONS") {
      if (!allowed.includes(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
    }
    if (!allowed.includes(origin)) {
      log("reject", { reason: "origin", origin: origin.slice(0, 80) });
      return json(403, { ok: false, error: "This form can only be submitted from the website." });
    }

    try {
      return await handleQuote(request, env, origin, ctx);
    } catch (e) {
      log("error", { reason: "unhandled", message: String(e && e.message).slice(0, 300) });
      return json(500, { ok: false, error: "Sorry, something went wrong on our side. Please try again or call us." }, corsHeaders(origin));
    }
  },
};

/* ------------------------- request handling ------------------------ */

const rateBucket = new Map(); // ip -> [timestamps]  (best-effort, per isolate)
const recentSubmissions = new Map(); // dedupe hash -> expiry ms

async function handleQuote(request, env, origin, ctx) {
  const cors = corsHeaders(origin);
  const fail = (status, msg) => json(status, { ok: false, error: msg }, cors);

  const missingCore = ["GHL_PRIVATE_TOKEN", "GHL_LOCATION_ID"].filter((k) => !env[k]);
  if (missingCore.length) {
    log("error", { reason: "missing_config", vars: missingCore });
    return fail(503, "The quote service is not fully configured yet. Please call us and we'll take your details.");
  }

  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BODY_BYTES) return fail(413, "That submission is too large — please keep files under 10MB each.");

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!checkRate(ip)) {
    log("reject", { reason: "rate_limited" });
    return fail(429, "Too many requests — please wait a few minutes and try again.");
  }

  let form;
  try { form = await request.formData(); }
  catch (e) { return fail(400, "We couldn't read that submission. Please try again."); }

  /* Honeypot: real visitors never fill this. Pretend success. */
  if (String(form.get("company_website") || "").trim() !== "") {
    log("reject", { reason: "honeypot" });
    return json(200, { ok: true }, cors);
  }

  for (const key of form.keys()) {
    if (!KNOWN_KEYS.has(key)) return fail(400, "That submission contained unexpected data. Please reload the page and try again.");
  }

  /* Optional Turnstile — the token must verify AND belong to this form
     (action "quote") on the page that is actually submitting (its hostname
     must match the request Origin, which has already passed the allowlist). */
  if (env.TURNSTILE_SECRET_KEY) {
    const token = String(form.get("cf-turnstile-response") || "");
    const okTs = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip, origin);
    if (!okTs) return fail(400, "We couldn't verify that you're human. Please refresh the page and try again.");
  }

  /* Canonical answers come from the JSON payload the wizard sends. */
  let a;
  try { a = JSON.parse(String(form.get("payload") || "{}")); }
  catch (e) { return fail(400, "We couldn't read that submission. Please try again."); }
  if (typeof a !== "object" || a === null || Array.isArray(a)) return fail(400, "We couldn't read that submission. Please try again.");
  for (const key of Object.keys(a)) {
    if (!KNOWN_KEYS.has(key)) return fail(400, "That submission contained unexpected data. Please reload the page and try again.");
  }

  /* source_page travels as its own form field, not inside the JSON
     payload, so copy it in — otherwise the Submission Source custom
     field never maps. */
  if (!a.source_page) a.source_page = String(form.get("source_page") || "").slice(0, 200);

  /* Where the lead came from (Google, Instagram, an ad…), from what the
     site recorded on the visitor's arrival. Never blocks a submission:
     anything missing or malformed just reads as "Direct / unknown". */
  const leadSource = readAttribution(form.get("attribution"), request.headers.get("User-Agent"));

  /* ---- server-side validation, mirroring the wizard's rules ---- */
  const type = a.customer_type;
  if (type !== "residential" && type !== "commercial") return fail(400, "Please choose residential or commercial.");
  if (!SERVICE_NAMES[a.service]) return fail(400, "Please choose a service.");
  const isRes = type === "residential";

  for (const [key, label] of [["name", "your name"], ["mobile", "your mobile number"], ["email", "your email address"], ["suburb", "the project suburb"]]) {
    if (!String(a[key] || "").trim()) return fail(400, `Please fill in ${label}.`);
  }
  if (!isRes && !String(a.business_name || "").trim()) return fail(400, "Please fill in the business name.");
  if (!isRes && !(Array.isArray(a.required_services) && a.required_services.length)) return fail(400, "Please choose at least one required service.");
  if (!["Phone", "SMS", "Email"].includes(a.contact_method)) return fail(400, "Please choose a preferred contact method.");
  if (a.consent !== true) return fail(400, "Please tick the consent box so we're allowed to contact you.");

  const email = String(a.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return fail(400, "That email address doesn't look right — please check it.");
  }
  const phone = normaliseAuPhone(a.mobile);
  if (!phone) return fail(400, "That phone number doesn't look like an Australian number — please check it.");

  /* ---- files ---- */
  const files = form.getAll("photos").filter((f) => typeof f === "object" && f && typeof f.arrayBuffer === "function");
  if (files.length > MAX_FILES) return fail(400, `Please attach no more than ${MAX_FILES} files.`);
  for (const f of files) {
    const problem = checkFile(f);
    if (problem) return fail(400, problem);
  }

  /* ---- duplicate suppression (double-click / retry) ---- */
  const dedupeKey = await sha256([email, phone, type, a.service, String(a.description || "")].join("|"));
  const now = Date.now();
  const seen = recentSubmissions.get(dedupeKey);
  if (seen && seen > now) {
    log("info", { event: "duplicate_suppressed" });
    return json(200, { ok: true }, cors);
  }
  recentSubmissions.set(dedupeKey, now + 10 * 60 * 1000);
  for (const [k, exp] of recentSubmissions) if (exp < now) recentSubmissions.delete(k);

  /* ------------------------- GHL pipeline ------------------------- */
  const ghl = ghlClient(env);
  const report = []; // redacted diagnostics for logs

  /* 1. resolve custom fields (cached per isolate — they rarely change) */
  let fieldIndex = null;
  if (fieldIndexCache && fieldIndexCache.at > Date.now() - 10 * 60 * 1000) {
    fieldIndex = fieldIndexCache.value;
  } else {
    try {
      fieldIndex = await resolveCustomFields(ghl, env.GHL_LOCATION_ID);
      fieldIndexCache = { at: Date.now(), value: fieldIndex };
    } catch (e) { report.push("custom-field lookup failed: " + trim(e)); }
  }

  const { customFields, unmappedAnswers, missingFields } = mapCustomFields(a, fieldIndex, isRes);
  if (missingFields.length) report.push("missing GHL custom fields: " + missingFields.join(", "));
  customFields.push(...leadSourceFields(leadSource, fieldIndex));

  /* 2. upsert contact (dedupes on email/phone inside GHL) */
  const nameParts = String(a.name).trim().split(/\s+/);
  let contactId;
  try {
    const up = await ghl.post("/contacts/upsert", {
      locationId: env.GHL_LOCATION_ID,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" ") || undefined,
      name: String(a.name).trim(),
      email,
      phone,
      source: "Website quote form",
      tags: [isRes ? "quote-residential" : "quote-commercial", leadSource.tag],
      companyName: !isRes ? String(a.business_name).trim() : undefined,
      customFields,
    });
    contactId = up && up.contact && up.contact.id;
    if (!contactId) throw new Error("upsert returned no contact id");
  } catch (e) {
    /* The submission did NOT go through — clear the dedupe entry so the
       customer's retry is processed rather than swallowed. */
    recentSubmissions.delete(dedupeKey);
    log("error", { reason: "ghl_contact", detail: trim(e), report });
    return fail(502, "Sorry, we couldn't submit your request just now. Please try again in a minute or call us.");
  }

  /* Steps 3-7 don't affect the customer-facing outcome (each is caught
     and reported individually), so they run AFTER the response is sent —
     five sequential GHL round-trips were making submissions feel stuck
     for ~10 seconds. ctx.waitUntil keeps the worker alive to finish. */
  const finishSync = (async () => {
  /* 3. upload files into the matching file custom field */
  let uploadedCount = 0;
  if (files.length) {
    const fileFieldId = findFileField(fieldIndex, isRes);
    if (!fileFieldId) {
      report.push("no file-upload custom field found for " + type + " — files skipped");
    } else {
      try {
        const fd = new FormData();
        fd.append("id", fileFieldId);
        fd.append("maxFiles", String(MAX_FILES));
        for (const f of files) fd.append(fileFieldId, f, safeName(f.name));
        await ghl.postForm(`/forms/upload-custom-files?contactId=${contactId}&locationId=${env.GHL_LOCATION_ID}`, fd);
        uploadedCount = files.length;
      } catch (e) { report.push("file upload failed: " + trim(e)); }
    }
  }

  /* 4. note with the full quote summary (nothing is silently dropped) */
  try {
    await ghl.post(`/contacts/${contactId}/notes`, { body: buildSummary(a, isRes, files, unmappedAnswers, leadSource) });
  } catch (e) { report.push("note failed: " + trim(e)); }

  /* 5. opportunity — every genuine request gets its own */
  let opportunityOk = false;
  try {
    const pipe = await resolvePipeline(ghl, env);
    if (!pipe) {
      report.push("opportunity skipped: pipeline/stage not configured and 'Website Quote Requests' pipeline not found");
    } else {
      await ghl.post("/opportunities/", {
        locationId: env.GHL_LOCATION_ID,
        pipelineId: pipe.pipelineId,
        pipelineStageId: pipe.stageId,
        contactId,
        name: `Website Quote — ${isRes ? "Residential" : "Commercial"} — ${String(a.name).trim()}${a.suburb ? " (" + String(a.suburb).trim() + ")" : ""} · ${leadSource.channel}`,
        status: "open",
        source: "Website quote form",
      });
      opportunityOk = true;
    }
  } catch (e) { report.push("opportunity failed: " + trim(e)); }

  /* 6. workflow — only after contact + opportunity succeeded */
  if (env.GHL_WORKFLOW_ID) {
    if (opportunityOk) {
      /* GHL rejects the "Z" suffix with 422 — it wants an explicit
         numeric offset (ex: 2021-06-23T03:30:00+01:00) and no millis. */
      const eventStartTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
      try { await ghl.post(`/contacts/${contactId}/workflow/${env.GHL_WORKFLOW_ID}`, { eventStartTime }); }
      catch (e) { report.push("workflow failed: " + trim(e)); }
    } else {
      report.push("workflow skipped: opportunity was not created");
    }
  } else {
    report.push("workflow skipped: GHL_WORKFLOW_ID not set");
  }

  /* 7. Steps 3-6 are caught individually so a partial failure still
     captures the lead — but that means they fail silently behind a 200.
     Surface any real degradation inside GHL, where it gets seen, rather
     than only in Cloudflare logs. Informational notes (unmapped answers,
     missing custom fields) are deliberately excluded so the tag stays
     meaningful. */
  const failures = report.filter((r) => /failed|skipped/i.test(r));
  if (failures.length) {
    try { await ghl.post(`/contacts/${contactId}/tags`, { tags: ["sync-incomplete"] }); }
    catch (e) { report.push("sync-incomplete tag failed: " + trim(e)); }
    try {
      await ghl.post(`/contacts/${contactId}/notes`, {
        body: "AUTOMATED DELIVERY REPORT\n\nThis enquiry reached GHL but some steps did not "
          + "complete. The contact details above are correct; what follows may be missing:\n\n"
          + failures.map((f) => "- " + f).join("\n"),
      });
    } catch (e) { report.push("delivery-report note failed: " + trim(e)); }
  }

  log("info", {
    event: "quote_submitted", type, service: a.service, contactId, leadSource: leadSource.channel,
    files: files.length, uploaded: uploadedCount,
    opportunity: opportunityOk, degraded: failures.length > 0, report,
  });
  })().catch((e) => log("error", { reason: "background_sync", detail: trim(e) }));

  if (ctx && ctx.waitUntil) ctx.waitUntil(finishSync);
  else await finishSync;

  return json(200, { ok: true }, cors);
}

/* ----------------------------- helpers ----------------------------- */

function allowedOrigins(env) {
  const extra = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return extra.length ? extra : DEFAULT_ORIGINS;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(status, body, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, extra || {}),
  });
}

function log(level, data) {
  console.log(JSON.stringify(Object.assign({ level }, data)));
}

function trim(e) { return String(e && e.message ? e.message : e).slice(0, 200); }

function checkRate(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (rateBucket.get(ip) || []).filter((t) => t > now - windowMs);
  if (list.length >= 5) return false;
  list.push(now);
  rateBucket.set(ip, list);
  if (rateBucket.size > 5000) rateBucket.clear();
  return true;
}

function normaliseAuPhone(raw) {
  const d = String(raw || "").replace(/[^\d+]/g, "");
  if (/^\+61[2-478]\d{8}$/.test(d)) return d;
  if (/^61[2-478]\d{8}$/.test(d)) return "+" + d;
  if (/^0[2-478]\d{8}$/.test(d)) return "+61" + d.slice(1);
  return null;
}

function checkFile(f) {
  if (f.size === 0) return `"${f.name}" appears to be empty — please re-attach it.`;
  if (f.size > MAX_FILE_BYTES) return `"${f.name}" is too large — please keep files under 10MB.`;
  const ext = (f.name.match(/\.([A-Za-z0-9]+)$/) || [])[1];
  const allowedMimes = ext && FILE_TYPES[ext.toLowerCase()];
  if (!allowedMimes) return `"${f.name}" isn't a supported file type — please attach photos (JPG/PNG), PDFs or Word documents.`;
  const declared = String(f.type || "").toLowerCase();
  if (declared && !allowedMimes.includes(declared) && declared !== "application/octet-stream") {
    return `"${f.name}" doesn't look like a valid ${ext.toUpperCase()} file — please re-attach it.`;
  }
  return "";
}

function safeName(name) {
  const cleaned = String(name || "file").replace(/[\/\\<>:"|?*\x00-\x1f]/g, "_").slice(-120);
  return cleaned || "file";
}

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(secret, token, ip, origin) {
  if (!token || token.length > 2048) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return false;
    const data = await r.json();
    if (!data.success) return false;
    if (data.action !== "quote") return false;
    /* Bind the token to the submitting page: siteverify's hostname must
       equal the request Origin's hostname (the origin allowlist has
       already vetted it, so this stops cross-host token replay). */
    return data.hostname === new URL(origin).hostname;
  } catch (e) { return false; }
}

/* --------------------------- GHL client ---------------------------- */

function ghlClient(env) {
  const headers = {
    Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`,
    Version: GHL_VERSION,
    Accept: "application/json",
  };
  async function call(path, init) {
    const res = await fetch(GHL_BASE + path, init);
    const text = await res.text();
    if (!res.ok) throw new Error(`GHL ${init.method} ${path.split("?")[0]} -> ${res.status}: ${text.slice(0, 160)}`);
    try { return text ? JSON.parse(text) : null; } catch (e) { return null; }
  }
  return {
    get: (path) => call(path, { method: "GET", headers }),
    post: (path, body) => call(path, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: JSON.stringify(body),
    }),
    postForm: (path, formData) => call(path, { method: "POST", headers, body: formData }),
  };
}

function normKey(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

async function resolveCustomFields(ghl, locationId) {
  const data = await ghl.get(`/locations/${locationId}/customFields`);
  const list = (data && data.customFields) || [];
  const index = new Map(); // normalised name/key -> {id, dataType}
  for (const f of list) {
    const entry = { id: f.id, dataType: f.dataType };
    if (f.name) index.set(normKey(f.name), entry);
    if (f.fieldKey) index.set(normKey(String(f.fieldKey).replace(/^contact\./, "")), entry);
  }
  return index;
}

function valueFor(key, a) {
  if (key === "customer_type") return a.customer_type === "residential" ? "Residential" : "Commercial";
  if (key === "service") return SERVICE_NAMES[a.service] || a.service;
  if (key === "consent") return a.consent ? "Yes" : "No";
  const v = a[key];
  if (v == null || v === "") return null;
  return Array.isArray(v) ? v.join(", ") : String(v);
}

function mapCustomFields(a, fieldIndex, isRes) {
  const customFields = [];
  const unmappedAnswers = [];
  const missingFields = [];

  for (const entry of FIELD_MAP) {
    if (entry.res && !isRes) continue;
    if (entry.com && isRes) continue;
    const value = valueFor(entry.key, a);
    if (value == null) continue;
    let hit = null;
    if (fieldIndex) {
      for (const c of entry.names) { hit = fieldIndex.get(normKey(c)); if (hit) break; }
    }
    if (hit) customFields.push({ id: hit.id, value });
    else { missingFields.push(entry.names[0]); unmappedAnswers.push([entry.names[0], value]); }
  }

  /* Answers that have no dedicated GHL field are preserved in the
     Service-Specific Details large-text field (plus the note). */
  if (unmappedAnswers.length && fieldIndex) {
    const catchAll = fieldIndex.get(normKey("Service-Specific Details"));
    if (catchAll) {
      customFields.push({ id: catchAll.id, value: unmappedAnswers.map(([l, v]) => `${l}: ${v}`).join("\n") });
    }
  }
  return { customFields, unmappedAnswers, missingFields };
}

function findFileField(fieldIndex, isRes) {
  if (!fieldIndex) return null;
  for (const c of FILE_FIELD_CANDIDATES[isRes ? "residential" : "commercial"]) {
    const hit = fieldIndex.get(normKey(c));
    if (hit && (!hit.dataType || /file/i.test(hit.dataType))) return hit.id;
  }
  return null;
}

let pipelineCache = null; // {pipelineId, stageId, at}
let fieldIndexCache = null; // {value: Map, at} — custom-field name→id lookups

async function resolvePipeline(ghl, env) {
  if (env.GHL_PIPELINE_ID && env.GHL_PIPELINE_STAGE_ID) {
    return { pipelineId: env.GHL_PIPELINE_ID, stageId: env.GHL_PIPELINE_STAGE_ID };
  }
  if (pipelineCache && pipelineCache.at > Date.now() - 10 * 60 * 1000) return pipelineCache.value;
  const data = await ghl.get(`/opportunities/pipelines?locationId=${env.GHL_LOCATION_ID}`);
  const pipelines = (data && data.pipelines) || [];
  /* Preference order: explicit env id → "Website Quote Requests" by
     name → the location's only pipeline when exactly one exists. */
  const byName = pipelines.find((p) => normKey(p.name) === normKey("Website Quote Requests"))
    || (pipelines.length === 1 ? pipelines[0] : null);
  const pipe = env.GHL_PIPELINE_ID ? pipelines.find((p) => p.id === env.GHL_PIPELINE_ID) : byName;
  if (!pipe) { pipelineCache = { at: Date.now(), value: null }; return null; }
  const stage = env.GHL_PIPELINE_STAGE_ID
    ? (pipe.stages || []).find((s) => s.id === env.GHL_PIPELINE_STAGE_ID)
    : (pipe.stages || [])[0];
  const value = stage ? { pipelineId: pipe.id, stageId: stage.id } : null;
  pipelineCache = { at: Date.now(), value };
  return value;
}

function buildSummary(a, isRes, files, unmappedAnswers, leadSource) {
  const line = (label, v) => (v == null || v === "" || (Array.isArray(v) && !v.length)) ? "" : `${label}: ${Array.isArray(v) ? v.join(", ") : v}\n`;
  let s = `WEBSITE QUOTE SUBMISSION — ${isRes ? "RESIDENTIAL" : "COMMERCIAL"}\n`;
  if (leadSource) {
    s += `Lead source: ${leadSource.channel}\n`;
    s += line("How they arrived", describeTouch(leadSource.last));
    if (leadSource.firstChannel && (leadSource.firstChannel !== leadSource.channel || leadSource.first.at !== (leadSource.last || {}).at)) {
      s += line("First found us", `${leadSource.firstChannel}${describeTouch(leadSource.first) ? " — " + describeTouch(leadSource.first) : ""}`);
    }
    s += "\n";
  }
  s += line("Submitted", new Date().toISOString());
  s += line("Name", a.name);
  s += line("Mobile", a.mobile);
  s += line("Email", a.email);
  s += line("Primary service", SERVICE_NAMES[a.service] || a.service);
  if (!isRes) {
    s += line("Business", a.business_name);
    s += line("Position", a.position);
    s += line("Organisation type", a.org_type);
    s += line("Engagement", a.engagement);
    s += line("Required services", a.required_services);
  }
  s += line("Suburb", a.suburb);
  s += line("Approx. size", a.approx_size);
  s += line("Description", a.description);
  s += line("Timing", a.timing);
  if (isRes) {
    s += line("Current surface", a.surface);
    s += line("Site access", a.access);
    s += line("Material preferences", a.material);
  } else {
    s += line("Maintenance program interest", a.maintenance_program);
  }
  s += line("Additional services", a.addons);
  s += line("Preferred contact", a.contact_method);
  s += line("Best time", a.contact_time);
  s += line("Notes", a.notes);
  s += line("Files attached", files.length ? files.map((f) => f.name).join(", ") : "");
  if (unmappedAnswers.length) {
    s += "\n[Answers without a matching GHL custom field — create these fields to capture them structurally]\n";
    for (const [label, v] of unmappedAnswers) s += `${label}: ${v}\n`;
  }
  return s.trim();
}

/* ---------------------------- lead source ---------------------------- */
/* The site (main.js) records the visitor's first arrival and their latest
   non-direct one; quote.js sends both as the "attribution" form field.
   Only these keys are kept, each short and plain text. */

const TOUCH_KEYS = ["at", "landing", "referrer", "app", "direct", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid", "msclkid"];

const CHANNELS = {
  googleAds: "Google Ads", googleSearch: "Google Search", gbp: "Google Business Profile",
  instagram: "Instagram", instagramAds: "Instagram Ads", facebook: "Facebook", facebookAds: "Facebook Ads",
  meta: "Facebook or Instagram", bing: "Bing", bingAds: "Microsoft Ads", otherSearch: "Other search engine",
  ai: "AI assistant (ChatGPT etc.)", email: "Email", direct: "Direct / unknown",
};

function cleanTouch(t) {
  if (!t || typeof t !== "object" || Array.isArray(t)) return null;
  const out = {};
  for (const k of TOUCH_KEYS) {
    const v = t[k];
    if (v == null || v === "") continue;
    if (k === "direct") { if (v === true) out.direct = true; continue; }
    const s = String(v).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 150);
    if (!s) continue;
    if (k === "referrer" && !/^[a-z0-9.-]{1,100}$/i.test(s)) continue;
    if (k === "landing" && !s.startsWith("/")) continue;
    if (k === "app" && s !== "instagram" && s !== "facebook") continue;
    if (k === "at" && isNaN(Date.parse(s))) continue;
    out[k] = s;
  }
  return Object.keys(out).length ? out : null;
}

function inAppBrowser(userAgent) {
  const ua = String(userAgent || "");
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) return "facebook";
  return "";
}

/* One arrival → one plain-English channel. Order matters: ad click IDs
   and campaign tags are deliberate, so they beat the referrer. */
function classifyTouch(t) {
  if (!t || t.direct) return CHANNELS.direct;
  const src = String(t.utm_source || "").toLowerCase();
  const tags = [src, t.utm_medium, t.utm_campaign].join(" ").toLowerCase();
  const paid = /cpc|ppc|paid|(^|[^a-z])ads?([^a-z]|$)|display|cpm|cpv|retarget/.test(String(t.utm_medium || "").toLowerCase());
  const ref = String(t.referrer || "").toLowerCase();

  if (t.gclid || t.gbraid || t.wbraid) return CHANNELS.googleAds;
  if (src) {
    /* ChatGPT and Perplexity tag their own links (utm_source=chatgpt.com). */
    if (/chatgpt|openai|perplexity|claude\.ai|gemini|copilot/.test(src)) return CHANNELS.ai;
    if (/^(ig|instagram)([^a-z]|$)/.test(src)) return paid ? CHANNELS.instagramAds : CHANNELS.instagram;
    if (/^(fb|facebook|meta|an|msg|messenger)$|^(facebook|meta)/.test(src)) return paid || src === "an" ? CHANNELS.facebookAds : CHANNELS.facebook;
    if (/google/.test(src)) {
      if (paid) return CHANNELS.googleAds;
      return /gbp|gmb|business|maps/.test(tags) ? CHANNELS.gbp : CHANNELS.googleSearch;
    }
    if (/bing|microsoft/.test(src)) return paid ? CHANNELS.bingAds : CHANNELS.bing;
    if (/mail|newsletter/.test(tags)) return CHANNELS.email;
    return "Campaign: " + String(t.utm_source).slice(0, 60);
  }
  if (t.msclkid) return CHANNELS.bingAds;
  if (t.app === "instagram" || /(^|\.)instagram\.com$|^com\.instagram\.android$/.test(ref)) return CHANNELS.instagram;
  if (t.app === "facebook" || /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$|^com\.facebook\./.test(ref)) return CHANNELS.facebook;
  if (t.fbclid) return CHANNELS.meta;
  if (ref) {
    /* Order matters: webmail and Gemini live on google.com / yahoo.com
       subdomains, so they are checked before search. */
    if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(ref)) return CHANNELS.ai;
    if (/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|outlook\.office365\.com|mail\.yahoo\.com)$|^com\.google\.android\.gm$|^com\.microsoft\.office\.outlook$/.test(ref)) return CHANNELS.email;
    /* The Google Maps app (Android) and maps/business.google.* are the
       Business Profile; google.com itself is search (a Profile visit from
       search results looks the same — hence the gbp UTM link). */
    if (/(^|\.)(maps|business)\.google\.[a-z.]+$|^com\.google\.android\.apps\.maps$/.test(ref)) return CHANNELS.gbp;
    if (/^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$|^com\.google\.android\.googlequicksearchbox$/.test(ref)) return CHANNELS.googleSearch;
    if (/(^|\.)bing\.com$/.test(ref)) return CHANNELS.bing;
    if (/(^|\.)(duckduckgo\.com|yahoo\.com|ecosia\.org|search\.brave\.com|baidu\.com)$|(^|\.)yandex\./.test(ref)) return CHANNELS.otherSearch;
    return "Website: " + ref.replace(/^www\./, "");
  }
  return CHANNELS.direct;
}

function channelTag(channel) {
  if (channel.startsWith("Campaign:")) return "lead-source-campaign";
  if (channel.startsWith("Website:")) return "lead-source-other-website";
  if (channel === CHANNELS.ai) return "lead-source-ai-assistant";
  return "lead-source-" + channel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function readAttribution(raw, userAgent) {
  let store = null;
  const text = typeof raw === "string" ? raw : "";
  if (text && text.length <= 4000) { try { store = JSON.parse(text); } catch (e) { store = null; } }
  const first = store && typeof store === "object" ? cleanTouch(store.first) : null;
  let last = store && typeof store === "object" ? cleanTouch(store.last) : null;
  /* Nothing stored (private browsing, storage blocked)? The submitting
     browser itself can still say it is Instagram's or Facebook's. */
  if (!last && (!first || first.direct)) {
    const app = inAppBrowser(userAgent);
    if (app) last = { app };
  }
  const arrival = last || first;
  const channel = classifyTouch(arrival);
  return { channel, tag: channelTag(channel), first, last: arrival, firstChannel: first ? classifyTouch(first) : null };
}

function describeTouch(t) {
  if (!t) return "";
  const bits = [];
  if (t.landing) bits.push("landed on " + t.landing);
  if (t.at) {
    try { bits.push(new Date(t.at).toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric" })); } catch (e) {}
  }
  const camp = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].filter((k) => t[k]).map((k) => k.slice(4) + "=" + t[k]);
  if (camp.length) bits.push("campaign tags " + camp.join(", "));
  if (t.gclid || t.gbraid || t.wbraid) bits.push("Google Ads click");
  if (t.msclkid) bits.push("Microsoft Ads click");
  if (t.fbclid) bits.push("Meta (Facebook/Instagram) click");
  if (t.referrer) bits.push("from " + t.referrer);
  if (t.app) bits.push("in the " + (t.app === "instagram" ? "Instagram" : "Facebook") + " app");
  return bits.join(" · ");
}

/* Optional GHL custom fields. Create any of these in GHL (Settings →
   Custom Fields, on the contact) and they fill automatically; absent ones
   are skipped quietly — the tag and the note always carry the source. */
function leadSourceFields(leadSource, fieldIndex) {
  if (!fieldIndex) return [];
  const out = [];
  const set = (names, value) => {
    if (!value) return;
    for (const n of names) { const hit = fieldIndex.get(normKey(n)); if (hit) { out.push({ id: hit.id, value }); return; } }
  };
  set(["Lead Source"], leadSource.channel);
  set(["First Lead Source", "Lead Source First Visit"], leadSource.firstChannel || "");
  set(["Lead Source Details"], [describeTouch(leadSource.last), leadSource.first && leadSource.first !== leadSource.last ? "first visit: " + (leadSource.firstChannel || "") + " " + describeTouch(leadSource.first) : ""].filter(Boolean).join("\n"));
  return out;
}

