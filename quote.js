/* =====================================================================
   /quote — three-step quote wizard
   Step 1: residential/commercial + service · Step 2: pathway-specific
   project details + optional add-ons · Step 3: contact details +
   summary + submit.
   Residential keeps questions to an absolute minimum; the detailed
   technical questions only appear on the commercial pathway.
   All answers live in `answers` so moving back/forward never loses
   anything. Plain JS, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  var stepsEl = document.getElementById("qsteps");
  var progressEl = document.getElementById("qprogress");
  if (!stepsEl || !progressEl) return;

  /* Submissions go to the bastiano-quote-api Cloudflare Worker, which
     validates server-side and forwards into GoHighLevel. */
  var WEBHOOK_URL = "https://bastiano-quote-api.turfnlandscaping.workers.dev/quote";
  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024;
  var PHONE_DISPLAY = "0457 357 085";

  /* ---------------- Config ---------------- */
  var ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
    commercial: '<path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M8 8h1.5M8 12h1.5M8 16h1.5M12 8h.5M12 12h.5M12 16h.5"/>',
    turf: '<path d="M4 20c1-5 2-9 2-14M9 20c1.5-4 2.5-8 2.5-12M15 20c1-3.5 1.8-7 1.8-10M20 20c.7-2.5 1.2-5 1.2-7"/>',
    synthetic: '<path d="M4 20h16M6 20V9M10 20V6M14 20V9M18 20V6"/><path d="M4 4l2 2M20 4l-2 2"/>',
    pavers: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    walls: '<path d="M3 21h18M4 21V10l4-3v14M8 21V7l5-3v17M13 21V9h7v12M16 12h1M16 15h1M16 18h1"/>',
    hard: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
    soft: '<path d="M12 21c-5 0-8-3-8-8 0-4 3-8 8-10 5 2 8 6 8 10 0 5-3 8-8 8zM12 21V9"/><path d="M12 13c-1.5-1-3-1.2-4.5-1M12 16c1.5-1 3-1.2 4.5-1"/>',
    transform: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/>',
    help: '<path d="M4 5h16v11H8l-4 4z"/><path d="M10 9.5a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1.1M12 14.6h.01"/>'
  };

  var CUSTOMER_TYPES = [
    { id: "residential", name: "Residential", icon: "home", desc: "Residential turf, landscaping and garden projects." },
    { id: "commercial", name: "Commercial", icon: "commercial", desc: "For businesses, builders, developers, property managers and body corporates." }
  ];

  var SERVICES = [
    { id: "natural-turf", name: "Natural Turf Installation", icon: "turf", desc: "New natural lawns supplied and laid on properly prepared ground." },
    { id: "synthetic-turf", name: "Synthetic Turf Installation", icon: "synthetic", desc: "Low-maintenance synthetic lawns installed to last." },
    { id: "pavers", name: "Pavers & Stepping Stones", icon: "pavers", desc: "Paths, patios and stepping stones laid level on a proper base." },
    { id: "retaining-walls", name: "Retaining Walls", icon: "walls", desc: "Structural walls that level slopes and hold back ground properly." },
    { id: "hard-landscaping", name: "Hard Landscaping", icon: "hard", desc: "Paving, pathways, edging and structural landscape work." },
    { id: "soft-landscaping", name: "Soft Landscaping, Plants & Mulch", icon: "soft", desc: "Garden beds, planting, mulch and soil that finish a yard." },
    { id: "transformation", name: "Complete Landscape Transformation", icon: "transform", desc: "A full outdoor makeover combining several services." },
    { id: "help", name: "Help Me Choose", icon: "help", desc: "Not sure where to start? Tell us what you want to achieve." }
  ];

  /* Field definition helpers */
  function num(id, label, opts) { return Object.assign({ type: "number", id: id, label: label }, opts || {}); }
  function txt(id, label, opts) { return Object.assign({ type: "text", id: id, label: label }, opts || {}); }
  function area(id, label, opts) { return Object.assign({ type: "textarea", id: id, label: label }, opts || {}); }
  function sel(id, label, options, opts) { return Object.assign({ type: "select", id: id, label: label, options: options }, opts || {}); }
  function radio(id, label, options, opts) { return Object.assign({ type: "radio", id: id, label: label, options: options }, opts || {}); }
  function chips(id, label, options, opts) { return Object.assign({ type: "chips", id: id, label: label, options: options }, opts || {}); }
  function file(id, label, opts) { return Object.assign({ type: "file", id: id, label: label }, opts || {}); }

  /* ---------------- Residential pathway ---------------- */
  var RES_CORE = [
    txt("suburb", "Project suburb or postcode", { required: true, placeholder: "e.g. Werribee or 3030", autocomplete: "address-level2" }),
    txt("approx_size", "Approximate size, if known", { placeholder: "e.g. about 50 m², or 'small courtyard' — optional" }),
    area("description", "What would you like us to do?", { placeholder: "e.g. replace the old lawn out the back and tidy up the garden beds." }),
    sel("timing", "Desired timing (optional)", ["As soon as possible", "Within one month", "Within three months", "Just planning"]),
    file("photos", "Photos of the area (optional)")
  ];
  /* Helpful-but-optional extras, collapsed by default and never required */
  var RES_MORE = [
    radio("surface", "Current surface", ["Soil", "Existing lawn", "Concrete", "Gravel", "Garden bed", "Other"]),
    radio("access", "Site access", ["Easy", "Limited", "Stairs / narrow access", "Unsure"]),
    txt("material", "Any material or style preferences?", { placeholder: "e.g. bluestone, native plants — or leave blank" })
  ];

  var RES_ADDONS = {
    "natural-turf": ["Irrigation System Repairs", "Lawn Mowing", "Turf Repair & Patching", "Weed Control & Spraying"],
    "synthetic-turf": ["Irrigation System Repairs", "Lawn Mowing", "Turf Repair & Patching", "Weed Control & Spraying"],
    "retaining-walls": ["Natural or Synthetic Turf", "Plants & Mulch", "Paving"],
    "pavers": ["Natural or Synthetic Turf", "Garden Beds", "Plants & Mulch"],
    "hard-landscaping": ["Natural or Synthetic Turf", "Garden Beds", "Plants & Mulch"],
    "soft-landscaping": ["Garden Care", "Irrigation System Repairs", "Hedge Trimming & Pruning"],
    "transformation": ["Ongoing Property Maintenance", "Lawn Mowing", "Garden Care"],
    "help": ["Ongoing Property Maintenance", "Lawn Mowing", "Garden Care"]
  };

  /* ---------------- Commercial pathway ---------------- */
  var COM_FIELDS = [
    txt("business_name", "Business or organisation name", { required: true }),
    txt("suburb", "Project suburb or postcode", { required: true, placeholder: "e.g. Werribee or 3030", autocomplete: "address-level2" }),
    sel("org_type", "Type of organisation", ["Business", "Builder", "Developer", "Property Manager", "Body Corporate", "School or Childcare", "Council or Government", "Other"]),
    radio("engagement", "One-off project or ongoing contract?", ["One-off project", "Ongoing contract", "Unsure"]),
    chips("required_services", "Required services", ["Natural turf", "Synthetic turf", "Pavers & stepping stones", "Retaining walls", "Hard landscaping", "Soft landscaping & planting", "Garden design", "Other"], { required: true }),
    txt("approx_size", "Estimated project area or relevant dimensions", { placeholder: "e.g. 400 m\u00b2, or 60m of walls" }),
    area("description", "Project scope or description", { placeholder: "Outline the scope, deliverables and any constraints." }),
    txt("timing", "Required completion date or project timeline", { placeholder: "e.g. by end of November, or Q1 next year" }),
    file("photos", "Supporting files (optional)", { accept: "image/*,.pdf,.doc,.docx", note: "Site photos, plans or scope documents \u2014 up to " + MAX_FILES + " files, 10MB each." })
  ];

  /* Map the step-1 primary service to a default required-services selection */
  var SERVICE_TO_REQ = {
    "natural-turf": "Natural turf", "synthetic-turf": "Synthetic turf",
    "pavers": "Pavers & stepping stones", "retaining-walls": "Retaining walls",
    "hard-landscaping": "Hard landscaping", "soft-landscaping": "Soft landscaping & planting"
  };

  var COM_ADDONS = ["Scheduled Lawn Mowing", "Property Maintenance", "Garden Care", "Irrigation System Repairs", "Weed Control and Spraying", "Hedge Trimming and Pruning", "Turf Repair and Patching"];

  /* ---------------- State ---------------- */
  var answers = { addons: [] };
  var photoFiles = [];
  var currentStep = 1;
  var submitting = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function serviceById(id) { return SERVICES.filter(function (s) { return s.id === id; })[0]; }
  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }
  function isRes() { return answers.customer_type === "residential"; }

  /* ---------------- Progress ---------------- */
  function renderProgress() {
    Array.prototype.forEach.call(progressEl.children, function (li) {
      var n = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-active", n === currentStep);
      li.classList.toggle("is-done", n < currentStep);
      var dot = li.querySelector(".qprogress__dot");
      dot.innerHTML = n < currentStep
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
        : String(n);
    });
  }

  function goTo(step) {
    currentStep = step;
    renderProgress();
    if (step === 1) renderStep1();
    else if (step === 2) renderStep2();
    else renderStep3();
    var top = stepsEl.getBoundingClientRect().top;
    if (top < 90) stepsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setError(msg) {
    var el = stepsEl.querySelector(".qerror");
    if (el) { el.textContent = msg || ""; el.hidden = !msg; }
    if (msg) {
      var bad = stepsEl.querySelector(".is-invalid");
      if (bad) bad.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function cardHtml(groupName, item, checked) {
    return '<label class="qcard">' +
      '<input type="radio" name="' + groupName + '" value="' + item.id + '"' + (checked ? " checked" : "") + ' />' +
      '<span class="qcard__icon">' + svgIcon(item.icon) + "</span>" +
      '<span class="qcard__name">' + esc(item.name) + "</span>" +
      '<span class="qcard__desc">' + esc(item.desc) + "</span>" +
      '<span class="qcard__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg></span>' +
      "</label>";
  }

  /* ---------------- Step 1: customer type, then service ---------------- */
  function renderStep1() {
    var html = '<h2 class="qstep__title">Is this for your home or a commercial property?</h2>' +
      '<div class="qcards qcards--type" role="radiogroup" aria-label="Project type">';
    CUSTOMER_TYPES.forEach(function (t) { html += cardHtml("ctype", t, answers.customer_type === t.id); });
    html += "</div>" +
      '<div class="qservices" id="q-services"' + (answers.customer_type ? "" : " hidden") + ">" +
      '<h2 class="qstep__title">What can we help you with?</h2>' +
      '<p class="qstep__sub">Choose the service that best matches your project. Not sure? Select ‘Help Me Choose’ and tell us what you want to achieve.</p>' +
      '<div class="qcards" role="radiogroup" aria-label="Service">';
    SERVICES.forEach(function (s) { html += cardHtml("service", s, answers.service === s.id); });
    html += "</div></div>" +
      '<p class="qerror" role="alert" hidden></p>' +
      '<div class="qnav"><span></span><button class="btn btn--primary btn--lg" type="button" data-next>Next: Project Details <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></button></div>';
    stepsEl.innerHTML = html;

    var servicesBox = document.getElementById("q-services");
    stepsEl.querySelectorAll('input[name="ctype"]').forEach(function (input) {
      input.addEventListener("change", function () {
        answers.customer_type = input.value;
        if (servicesBox.hidden) {
          servicesBox.hidden = false;
          servicesBox.classList.add("qreveal");
        }
        setError("");
      });
    });
    stepsEl.querySelectorAll('input[name="service"]').forEach(function (input) {
      input.addEventListener("change", function () { answers.service = input.value; setError(""); });
    });
    stepsEl.querySelector("[data-next]").addEventListener("click", function () {
      if (!answers.customer_type) { setError("Please tell us whether this is for your home or a commercial property."); return; }
      if (!answers.service) { setError("Please choose a service to continue."); return; }
      /* Commercial: make sure the primary service is pre-selected in required services */
      if (!isRes()) {
        var req = SERVICE_TO_REQ[answers.service];
        answers.required_services = answers.required_services || [];
        if (req && answers.required_services.indexOf(req) === -1) answers.required_services.push(req);
      }
      goTo(2);
    });
  }

  /* ---------------- Field rendering ---------------- */
  function fieldHtml(f) {
    var req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : "";
    var val = answers[f.id];
    var h = '<div class="qfield" data-field="' + f.id + '"' + (f.showIf ? ' data-showif="1"' : "") + ">";
    h += '<span class="qfield__label" id="lbl-' + f.id + '">' + esc(f.label) + req + "</span>";

    if (f.type === "number" || f.type === "text") {
      h += '<input type="' + (f.type === "number" ? "number" : "text") + '" id="qf-' + f.id + '" aria-labelledby="lbl-' + f.id + '"' +
        (f.type === "number" ? ' min="0" inputmode="decimal" step="' + (f.step || "1") + '"' : "") +
        (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : "") +
        ' placeholder="' + esc(f.placeholder || "") + '" value="' + esc(val || "") + '" />';
    } else if (f.type === "textarea") {
      h += '<textarea id="qf-' + f.id + '" aria-labelledby="lbl-' + f.id + '" placeholder="' + esc(f.placeholder || "") + '">' + esc(val || "") + "</textarea>";
    } else if (f.type === "select") {
      h += '<select id="qf-' + f.id + '" aria-labelledby="lbl-' + f.id + '"><option value=""' + (!val ? " selected" : "") + ' disabled>Select…</option>';
      f.options.forEach(function (o) { h += "<option" + (val === o ? " selected" : "") + ">" + esc(o) + "</option>"; });
      h += "</select>";
    } else if (f.type === "radio") {
      h += '<div class="qpills" role="radiogroup" aria-labelledby="lbl-' + f.id + '">';
      f.options.forEach(function (o) {
        h += '<label class="qpill"><input type="radio" name="qf-' + f.id + '" value="' + esc(o) + '"' + (val === o ? " checked" : "") + ' /><span>' + esc(o) + "</span></label>";
      });
      h += "</div>";
    } else if (f.type === "chips") {
      var arr = val || [];
      h += '<div class="qpills" role="group" aria-labelledby="lbl-' + f.id + '">';
      f.options.forEach(function (o) {
        h += '<label class="qpill"><input type="checkbox" name="qf-' + f.id + '" value="' + esc(o) + '"' + (arr.indexOf(o) !== -1 ? " checked" : "") + ' /><span>' + esc(o) + "</span></label>";
      });
      h += "</div>";
    } else if (f.type === "file") {
      h += '<input class="field__file" type="file" id="qf-photos" accept="' + (f.accept || "image/*") + '" multiple aria-labelledby="lbl-' + f.id + '" />' +
        '<p class="field__note">' + esc(f.note || ("Up to " + MAX_FILES + " photos, 10MB each. A couple of quick snaps helps us quote accurately.")) + "</p>" +
        '<ul class="filelist" id="q-photo-list"></ul>';
    }
    h += "</div>";
    return h;
  }

  function collectField(f) {
    if (f.type === "radio") {
      var r = stepsEl.querySelector('input[name="qf-' + f.id + '"]:checked');
      if (r) answers[f.id] = r.value;
    } else if (f.type === "chips") {
      var vals = [];
      stepsEl.querySelectorAll('input[name="qf-' + f.id + '"]:checked').forEach(function (c) { vals.push(c.value); });
      answers[f.id] = vals;
    } else if (f.type === "file") {
      /* photoFiles maintained by change handler */
    } else {
      var el = document.getElementById("qf-" + f.id);
      if (el) answers[f.id] = el.value.trim();
    }
  }

  function fieldVisible(f) {
    if (!f.showIf) return true;
    var key = Object.keys(f.showIf)[0];
    return answers[key] === f.showIf[key];
  }

  function refreshConditionals(fields) {
    fields.forEach(function (f) {
      if (!f.showIf) return;
      var el = stepsEl.querySelector('[data-field="' + f.id + '"]');
      if (el) el.hidden = !fieldVisible(f);
    });
  }

  function renderPhotoList() {
    var list = document.getElementById("q-photo-list");
    if (!list) return;
    list.innerHTML = "";
    photoFiles.forEach(function (fl) {
      var li = document.createElement("li");
      var size = fl.size < 1024 * 1024 ? Math.round(fl.size / 1024) + " KB" : (fl.size / (1024 * 1024)).toFixed(1) + " MB";
      li.textContent = fl.name + " · " + size;
      list.appendChild(li);
    });
  }

  function bindPhotoInput() {
    var photoInput = document.getElementById("qf-photos");
    if (!photoInput) return;
    photoInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(photoInput.files);
      var problem = "";
      if (files.length > MAX_FILES) problem = "Please choose no more than " + MAX_FILES + " files.";
      files.forEach(function (fl) {
        if (fl.size > MAX_BYTES) problem = '"' + fl.name + '" is too large — please keep files under 10MB.';
      });
      if (problem) { setError(problem); photoInput.value = ""; return; }
      setError("");
      photoFiles = files;
      renderPhotoList();
    });
    renderPhotoList();
  }

  /* ---------------- Step 2 ---------------- */
  function step2Fields() {
    if (isRes()) return RES_CORE.concat(RES_MORE);
    return COM_FIELDS.slice();
  }

  function renderStep2() {
    var svc = serviceById(answers.service);
    var html;

    if (isRes()) {
      html = '<h2 class="qstep__title">Tell us a little about your project</h2>' +
        '<p class="qstep__sub">A rough idea is all we need — no exact measurements or technical details required.</p>' +
        '<div class="qgroup">';
      RES_CORE.forEach(function (f) { html += fieldHtml(f); });
      html += "</div>";
      html += '<details class="qmore"><summary>Know a few more details? <span>Optional</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="qgroup qmore__body">';
      RES_MORE.forEach(function (f) { html += fieldHtml(f); });
      html += "</div></details>";
      html += '<p class="qreassure">Not sure about the details? That’s completely fine — Sebastian can confirm everything with you.</p>';

      var addons = RES_ADDONS[answers.service] || [];
      if (addons.length) {
        html += '<h3 class="qgroup__title">Would you like help with anything else?</h3>' +
          '<p class="qstep__sub">Add any ongoing care or related work you would like included in the conversation.</p>' +
          '<div class="qpills qpills--addons" role="group" aria-label="Optional add-ons">';
        addons.forEach(function (o) {
          html += '<label class="qpill"><input type="checkbox" name="qf-addons" value="' + esc(o) + '"' + (answers.addons.indexOf(o) !== -1 ? " checked" : "") + ' /><span>' + esc(o) + "</span></label>";
        });
        html += "</div>";
      }
    } else {
      html = '<h2 class="qstep__title">Tell us about the commercial project</h2>' +
        '<p class="qstep__sub">Provide the available scope and site information so we can assess the project accurately.</p>' +
        '<div class="qgroup" id="q-com-fields">';
      COM_FIELDS.forEach(function (f) { html += fieldHtml(f); });
      html += "</div>";

      html += '<h3 class="qgroup__title">Additional services required</h3>' +
        '<div class="qpills qpills--addons" role="group" aria-label="Additional services">';
      COM_ADDONS.forEach(function (o) {
        html += '<label class="qpill"><input type="checkbox" name="qf-addons" value="' + esc(o) + '"' + (answers.addons.indexOf(o) !== -1 ? " checked" : "") + ' /><span>' + esc(o) + "</span></label>";
      });
      html += "</div>";
      html += fieldHtml(radio("maintenance_program", "Would you like to discuss an ongoing maintenance program?", ["Yes", "No", "Unsure"]));
    }

    html += '<p class="qerror" role="alert" hidden></p>' +
      '<div class="qnav">' +
      '<button class="btn btn--ghost" type="button" data-back>Back</button>' +
      '<button class="btn btn--primary btn--lg" type="button" data-next>Next: Your Details <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></button>' +
      "</div>";
    stepsEl.innerHTML = html;

    var all = currentFields();
    refreshConditionals(all);

    stepsEl.addEventListener("change", onStep2Change);
    bindPhotoInput();

    stepsEl.querySelector("[data-back]").addEventListener("click", function () { saveStep2(); goTo(1); });
    stepsEl.querySelector("[data-next]").addEventListener("click", function () {
      saveStep2();
      var missing = validateStep2();
      if (missing) { setError(missing); return; }
      goTo(3);
    });
  }

  function currentFields() {
    var fields = step2Fields();
    if (!isRes()) fields = fields.concat([radio("maintenance_program", "Would you like to discuss an ongoing maintenance program?", ["Yes", "No", "Unsure"])]);
    return fields;
  }


  function onStep2Change(e) {
    var t = e.target;
    var all = currentFields();
    all.forEach(function (f) {
      if ("qf-" + f.id === t.name || "qf-" + f.id === t.id) collectField(f);
    });
    refreshConditionals(all);
  }

  function saveStep2() {
    currentFields().forEach(collectField);
    var picked = [];
    stepsEl.querySelectorAll('input[name="qf-addons"]:checked').forEach(function (c) { picked.push(c.value); });
    answers.addons = picked;
    stepsEl.removeEventListener("change", onStep2Change);
  }

  function validateStep2() {
    var firstBad = null, label = null;
    stepsEl.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
    currentFields().forEach(function (f) {
      if (firstBad || !f.required || !fieldVisible(f)) return;
      var v = answers[f.id];
      var empty = f.type === "chips" ? !(v && v.length) : !v;
      if (empty) {
        firstBad = stepsEl.querySelector('[data-field="' + f.id + '"]');
        label = f.label;
      }
    });
    if (firstBad) {
      firstBad.classList.add("is-invalid");
      return 'Please fill in "' + label + '" to continue.';
    }
    return "";
  }

  /* ---------------- Step 3 ---------------- */
  function contactFields() {
    if (isRes()) {
      return [
        txt("name", "Full name", { required: true, autocomplete: "name" }),
        txt("mobile", "Mobile number", { required: true, autocomplete: "tel" }),
        txt("email", "Email address", { required: true, autocomplete: "email" }),
        radio("contact_method", "Preferred contact method", ["Phone", "SMS", "Email"], { required: true }),
        sel("contact_time", "Best time to contact", ["Morning", "Afternoon", "Evening", "Any time"]),
        area("notes", "Anything else? (optional)", { placeholder: "A final note if there's anything we've missed." })
      ];
    }
    return [
      txt("name", "Contact name", { required: true, autocomplete: "name" }),
      txt("position", "Position or role", { placeholder: "e.g. Facilities Manager" }),
      txt("business_name", "Business name", { required: true }),
      txt("mobile", "Mobile number", { required: true, autocomplete: "tel" }),
      txt("email", "Business email", { required: true, autocomplete: "email" }),
      radio("contact_method", "Preferred contact method", ["Phone", "SMS", "Email"], { required: true }),
      sel("contact_time", "Best time to contact", ["Morning", "Afternoon", "Evening", "Any time"]),
      area("notes", "Anything else? (optional)", { placeholder: "A final note if there's anything we've missed." })
    ];
  }

  function summaryRows() {
    var svc = serviceById(answers.service);
    var rows = [
      ["Enquiry type", isRes() ? "Residential" : "Commercial", 1],
      ["Primary service", svc ? svc.name : "—", 1]
    ];
    if (!isRes() && answers.required_services && answers.required_services.length) {
      rows.push(["Required services", answers.required_services.join(", "), 2]);
    }
    if (answers.addons.length) rows.push(["Additional services", answers.addons.join(", "), 2]);
    if (answers.suburb) rows.push(["Location", answers.suburb, 2]);
    if (answers.timing) rows.push(["Timing", answers.timing, 2]);
    if (photoFiles.length) rows.push(["Files", photoFiles.length + " attached", 2]);
    return rows;
  }

  function renderStep3() {
    var html = '<h2 class="qstep__title">Your details</h2>' +
      '<p class="qstep__sub">We’ll use these to confirm your free quote — nothing else.</p>' +
      '<div class="qgroup qgroup--contact">';
    contactFields().forEach(function (f) { html += fieldHtml(f); });
    html += "</div>";

    html += '<h3 class="qgroup__title">Your request</h3><div class="qsummary">';
    summaryRows().forEach(function (r) {
      html += '<div class="qsummary__row"><span>' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span>" +
        '<button type="button" class="qsummary__edit" data-goto="' + r[2] + '">Edit</button></div>';
    });
    html += "</div>";

    html += '<label class="qconsent"><input type="checkbox" id="qf-consent"' + (answers.consent ? " checked" : "") + ' /> <span>I’m happy for Bastiano Landscaping to contact me about this quote. <span class="req" aria-hidden="true">*</span></span></label>';

    /* Spam honeypot — offscreen, never shown, must stay empty. */
    html += '<div style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true"><label>Leave this field empty<input type="text" id="qf-hp" name="company_website" tabindex="-1" autocomplete="off" /></label></div>';

    html += '<p class="qerror" role="alert" hidden></p>' +
      '<div class="qnav">' +
      '<button class="btn btn--ghost" type="button" data-back>Back</button>' +
      '<button class="btn btn--primary btn--lg" type="button" data-submit>Request My Free Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></button>' +
      "</div>";
    stepsEl.innerHTML = html;

    stepsEl.querySelectorAll(".qsummary__edit").forEach(function (b) {
      b.addEventListener("click", function () { saveStep3(); goTo(Number(b.getAttribute("data-goto"))); });
    });
    stepsEl.querySelector("[data-back]").addEventListener("click", function () { saveStep3(); goTo(2); });
    stepsEl.querySelector("[data-submit]").addEventListener("click", submit);
  }

  function saveStep3() {
    contactFields().forEach(collectField);
    var c = document.getElementById("qf-consent");
    if (c) answers.consent = c.checked;
  }

  function validateStep3() {
    stepsEl.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
    var required = [["name", isRes() ? "Full name" : "Contact name"], ["mobile", "Mobile number"], ["email", isRes() ? "Email address" : "Business email"], ["contact_method", "Preferred contact method"]];
    if (!isRes()) required.splice(1, 0, ["business_name", "Business name"]);
    for (var i = 0; i < required.length; i++) {
      if (!answers[required[i][0]]) {
        var el = stepsEl.querySelector('[data-field="' + required[i][0] + '"]');
        if (el) el.classList.add("is-invalid");
        return 'Please fill in "' + required[i][1] + '" to continue.';
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(answers.email)) {
      stepsEl.querySelector('[data-field="email"]').classList.add("is-invalid");
      return "That email address doesn't look right — please check it.";
    }
    if (!answers.consent) return "Please tick the consent box so we're allowed to contact you.";
    return "";
  }

  /* ---------------- Submit ---------------- */
  function submit() {
    if (submitting) return;
    saveStep3();
    var bad = validateStep3();
    if (bad) { setError(bad); return; }

    if (!WEBHOOK_URL) {
      setError("Thanks! Our online form isn't connected yet — please call us on " + PHONE_DISPLAY + " and we'll book your free on-site quote straight away. Your answers are kept on this page.");
      return;
    }

    submitting = true;
    var btn = stepsEl.querySelector("[data-submit]");
    btn.disabled = true;
    btn.textContent = "Sending your request…";

    var body = new FormData();
    body.append("payload", JSON.stringify(answers));
    Object.keys(answers).forEach(function (k) {
      var v = answers[k];
      body.append(k, Array.isArray(v) ? v.join(", ") : String(v == null ? "" : v));
    });
    photoFiles.forEach(function (fl) { body.append("photos", fl, fl.name); });
    body.append("source_page", window.location.pathname);
    body.append("submitted_at", new Date().toISOString());
    var hp = document.getElementById("qf-hp");
    body.append("company_website", hp ? hp.value : "");

    fetch(WEBHOOK_URL, { method: "POST", body: body })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok && data.ok) { renderConfirmation(); return; }
          /* The worker returns short customer-safe messages for
             validation problems; anything else gets the generic copy. */
          throw new Error(res.status >= 400 && res.status < 500 && data.error ? data.error : "");
        });
      })
      .catch(function (err) {
        submitting = false;
        btn.disabled = false;
        btn.innerHTML = 'Request My Free Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';
        setError((err && err.message) || ("Sorry, something went wrong sending your request — your answers are still here. Please try again, or call us on " + PHONE_DISPLAY + "."));
      });
  }

  function renderConfirmation() {
    progressEl.hidden = true;
    stepsEl.innerHTML =
      '<div class="qdone">' +
      '<span class="qdone__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg></span>' +
      "<h2>Thanks — your quote request has been received.</h2>" +
      "<p>Sebastian will review your project details and get in touch.</p>" +
      '<div class="qdone__actions">' +
      '<a class="btn btn--primary" href="/">Return Home</a>' +
      '<a class="btn btn--ghost" href="tel:+61457357085">Call 0457 357 085</a>' +
      "</div></div>";
    stepsEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  goTo(1);
})();
