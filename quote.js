/* =====================================================================
   /quote — three-step quote wizard
   Step 1: pick a service · Step 2: conditional project details +
   optional add-ons · Step 3: contact details + summary + submit.
   All answers live in `answers` so moving back/forward never loses
   anything. Plain JS, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  var stepsEl = document.getElementById("qsteps");
  var progressEl = document.getElementById("qprogress");
  if (!stepsEl || !progressEl) return;

  /* Same destination as the homepage form (see main.js). While empty the
     form validates and shows a clear call-us message instead of pretending
     to send. */
  var WEBHOOK_URL = "";
  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024;
  var PHONE_DISPLAY = "0457 357 085";

  /* ---------------- Config ---------------- */
  var ICONS = {
    turf: '<path d="M4 20c1-5 2-9 2-14M9 20c1.5-4 2.5-8 2.5-12M15 20c1-3.5 1.8-7 1.8-10M20 20c.7-2.5 1.2-5 1.2-7"/>',
    synthetic: '<path d="M4 20h16M6 20V9M10 20V6M14 20V9M18 20V6"/><path d="M4 4l2 2M20 4l-2 2"/>',
    pavers: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    walls: '<path d="M3 21h18M4 21V10l4-3v14M8 21V7l5-3v17M13 21V9h7v12M16 12h1M16 15h1M16 18h1"/>',
    hard: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
    soft: '<path d="M12 21c-5 0-8-3-8-8 0-4 3-8 8-10 5 2 8 6 8 10 0 5-3 8-8 8zM12 21V9"/><path d="M12 13c-1.5-1-3-1.2-4.5-1M12 16c1.5-1 3-1.2 4.5-1"/>',
    transform: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/>',
    help: '<path d="M4 5h16v11H8l-4 4z"/><path d="M10 9.5a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1.1M12 14.6h.01"/>'
  };

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

  var TURF_FIELDS = [
    num("area_m2", "Approximate area (m²)", { placeholder: "e.g. 45" }),
    radio("shape", "Lawn shape (optional — helps us calculate)", ["Rectangle / Square", "L-Shape", "Circle", "Irregular"]),
    num("length_m", "Length (metres)", { showIf: { shape: "Rectangle / Square" }, placeholder: "e.g. 9" }),
    num("width_m", "Width (metres)", { showIf: { shape: "Rectangle / Square" }, placeholder: "e.g. 5" }),
    radio("surface", "Current surface", ["Soil", "Existing lawn", "Concrete", "Gravel", "Garden bed", "Other"]),
    radio("install_type", "What do you need?", ["Supply and install", "Installation only", "Unsure — please advise"]),
    chips("prep", "Site preparation", ["Ground preparation required", "Old turf or surface removal required"])
  ];

  var STEP2 = {
    "natural-turf": TURF_FIELDS,
    "synthetic-turf": TURF_FIELDS,
    "pavers": [
      num("area_m2", "Approximate area (m²)", { placeholder: "e.g. 20" }),
      radio("pv_type", "What are you after?", ["Pavers", "Stepping stones", "Both"]),
      radio("surface", "Current ground surface", ["Soil", "Existing lawn", "Concrete", "Gravel", "Garden bed", "Other"]),
      txt("material", "Preferred material or style", { placeholder: "e.g. bluestone, concrete pavers — or 'Unsure'" }),
      radio("job_type", "Type of job", ["New installation", "Replacement", "Repair"]),
      chips("extras", "Anything else we should know?", ["Ground preparation required", "Drainage concerns"])
    ],
    "retaining-walls": [
      num("wall_length_m", "Approximate wall length (metres)", { placeholder: "e.g. 12" }),
      num("wall_height_m", "Approximate maximum height (metres)", { placeholder: "e.g. 0.8", step: "0.1" }),
      radio("job_type", "Type of job", ["New wall", "Replacement", "Repair"]),
      txt("material", "Preferred material", { placeholder: "e.g. timber sleepers, concrete sleepers, block — or 'Unsure'" }),
      radio("drainage", "Existing drainage concerns?", ["Yes", "No", "Unsure"]),
      radio("machinery", "Machinery access", ["Easy access", "Restricted access"])
    ],
    "hard-landscaping": [
      chips("hl_services", "Services required", ["Paving", "Pathways", "Edging", "Retaining walls", "Garden structures", "Other"], { required: true }),
      num("area_m2", "Approximate project area (m²)", { placeholder: "e.g. 60" }),
      radio("surface", "Existing surface", ["Soil", "Existing lawn", "Concrete", "Gravel", "Garden bed", "Other"]),
      radio("drainage", "Drainage requirements?", ["Yes", "No", "Unsure"]),
      radio("demolition", "Demolition or removal required?", ["Yes", "No", "Unsure"]),
      txt("material", "Material preferences", { placeholder: "e.g. bluestone, exposed aggregate — or 'Unsure'" })
    ],
    "soft-landscaping": [
      num("area_m2", "Approximate garden area (m²)", { placeholder: "e.g. 30" }),
      chips("sl_services", "Services required", ["Planting", "Garden beds", "Mulch", "Soil improvement", "Edging", "Garden redesign"], { required: true }),
      radio("garden_state", "Existing garden or new garden?", ["Existing garden", "New garden"]),
      radio("sun", "Sun conditions", ["Full sun", "Part shade", "Mostly shade", "Unsure"]),
      txt("style", "Preferred style or colours", { placeholder: "e.g. native, low-maintenance, cottage" }),
      radio("irrigation", "Irrigation currently installed?", ["Yes", "No", "Unsure"])
    ],
    "transformation": [
      chips("components", "What should the project include?", ["Natural turf", "Synthetic turf", "Pavers", "Stepping stones", "Retaining walls", "Garden beds", "Plants", "Mulch", "Irrigation", "Garden maintenance", "Other"], { required: true }),
      num("area_m2", "Approximate total project area (m²)", { placeholder: "e.g. 120" }),
      area("outcome", "What's the main outcome you want?", { placeholder: "e.g. a low-maintenance backyard the kids can use all year" }),
      radio("condition", "Existing property condition", ["Bare / new build", "Tired but usable", "Overgrown", "Partly finished", "Other"]),
      radio("demolition", "Demolition or removal needed?", ["Yes", "No", "Unsure"]),
      sel("budget", "Indicative budget (optional)", ["Under $5,000", "$5,000 – $15,000", "$15,000 – $30,000", "$30,000+", "Prefer to discuss"])
    ],
    "help": [
      area("improve", "What would you like to improve about your outdoor space?", { required: true, placeholder: "Tell us what's bothering you about the space, or what you'd love it to become." }),
      num("area_m2", "Approximate area (m²)", { placeholder: "A rough guess is fine" }),
      radio("condition", "Current condition", ["Bare / new build", "Tired but usable", "Overgrown", "Partly finished", "Other"]),
      area("outcome", "Desired outcome", { placeholder: "e.g. somewhere to entertain, easier upkeep, better street appeal" }),
      sel("call_time", "Preferred time for Sebastian to discuss the project", ["Weekday mornings", "Weekday afternoons", "Saturday", "Any time"])
    ]
  };

  var COMMON_FIELDS = [
    txt("suburb", "Project suburb or postcode", { required: true, placeholder: "e.g. Werribee or 3030", autocomplete: "address-level2" }),
    radio("property_type", "Property type", ["Residential", "Commercial", "Body corporate", "Other"], { required: true }),
    sel("timing", "Desired project timing", ["As soon as possible", "Within 1–3 months", "3–6 months", "Just planning for now"], { required: true }),
    radio("access", "Site access", ["Easy", "Limited", "Stairs / narrow access", "Unsure"], { required: true }),
    area("description", "Short project description", { placeholder: "Anything else that helps us understand the job." }),
    { type: "file", id: "photos", label: "Photos of the area (optional)" }
  ];

  var ADDONS = {
    turf: ["Irrigation System Repairs", "Turf Repair & Patching", "Lawn Mowing", "Weed Control & Spraying", "Ongoing Property Maintenance"],
    hard: ["Natural or Synthetic Turf", "Plants & Mulch", "Garden Bed Installation", "Irrigation System Repairs", "Ongoing Property Maintenance"],
    soft: ["Irrigation System Repairs", "Garden Care", "Hedge Trimming & Pruning", "Weed Control & Spraying", "Lawn Mowing"],
    transform: ["Lawn Mowing", "Garden Care", "Hedge Trimming & Pruning", "Weed Control & Spraying", "Irrigation Maintenance", "Ongoing Property Maintenance"]
  };
  function addonsFor(serviceId) {
    if (serviceId === "natural-turf" || serviceId === "synthetic-turf") return ADDONS.turf;
    if (serviceId === "pavers" || serviceId === "retaining-walls" || serviceId === "hard-landscaping") return ADDONS.hard;
    if (serviceId === "soft-landscaping") return ADDONS.soft;
    if (serviceId === "transformation" || serviceId === "help") return ADDONS.transform;
    return [];
  }

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

  /* ---------------- Step 1 ---------------- */
  function renderStep1() {
    var html = '<h2 class="qstep__title">What can we help you with?</h2>' +
      '<p class="qstep__sub">Choose the service that best matches your project. Not sure? Select ‘Help Me Choose’ and tell us what you want to achieve.</p>' +
      '<div class="qcards" role="radiogroup" aria-label="Service">';
    SERVICES.forEach(function (s) {
      html += '<label class="qcard">' +
        '<input type="radio" name="service" value="' + s.id + '"' + (answers.service === s.id ? " checked" : "") + ' />' +
        '<span class="qcard__icon">' + svgIcon(s.icon) + "</span>" +
        '<span class="qcard__name">' + esc(s.name) + "</span>" +
        '<span class="qcard__desc">' + esc(s.desc) + "</span>" +
        '<span class="qcard__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg></span>' +
        "</label>";
    });
    html += "</div>" +
      '<p class="qerror" role="alert" hidden></p>' +
      '<div class="qnav"><span></span><button class="btn btn--primary btn--lg" type="button" data-next>Next: Project Details <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></button></div>';
    stepsEl.innerHTML = html;

    stepsEl.querySelectorAll('input[name="service"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (answers.service !== input.value) {
          /* new service — clear old service-specific answers but keep common ones */
          var keep = ["suburb", "property_type", "timing", "access", "description"];
          var next = { addons: [] };
          keep.forEach(function (k) { if (answers[k]) next[k] = answers[k]; });
          next.service = input.value;
          answers = next;
        }
        setError("");
      });
    });
    stepsEl.querySelector("[data-next]").addEventListener("click", function () {
      var chosen = stepsEl.querySelector('input[name="service"]:checked');
      if (!chosen) { setError("Please choose a service to continue."); return; }
      answers.service = chosen.value;
      goTo(2);
    });
  }

  /* ---------------- Field rendering ---------------- */
  function fieldHtml(f) {
    var req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : "";
    var val = answers[f.id];
    var h = '<div class="qfield" data-field="' + f.id + '"' + (f.showIf ? ' data-showif="' + esc(JSON.stringify(f.showIf)) + '"' : "") + ">";
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
      h += '<input class="field__file" type="file" id="qf-photos" accept="image/*" multiple aria-labelledby="lbl-' + f.id + '" />' +
        '<p class="field__note">Up to ' + MAX_FILES + " photos, 10MB each. A couple of quick snaps helps us quote accurately.</p>" +
        '<ul class="filelist" id="q-photo-list"></ul>';
    }
    h += "</div>";
    return h;
  }

  function collectField(f) {
    if (f.type === "radio") {
      var r = stepsEl.querySelector('input[name="qf-' + f.id + '"]:checked');
      answers[f.id] = r ? r.value : undefined;
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

  /* ---------------- Step 2 ---------------- */
  function renderStep2() {
    var svc = serviceById(answers.service);
    var fields = STEP2[answers.service] || [];
    var addons = addonsFor(answers.service);

    var html = '<h2 class="qstep__title">Tell us about your ' + esc(svc ? svc.name.toLowerCase().replace(" installation", "") : "project") + " project</h2>" +
      '<p class="qstep__sub">A rough idea is fine — we confirm everything on-site.</p>' +
      '<div class="qgroup">';
    fields.forEach(function (f) { html += fieldHtml(f); });
    html += "</div>" +
      '<h3 class="qgroup__title">About the site</h3><div class="qgroup">';
    COMMON_FIELDS.forEach(function (f) { html += fieldHtml(f); });
    html += "</div>";

    if (addons.length) {
      html += '<h3 class="qgroup__title">Would you like help with anything else?</h3>' +
        '<p class="qstep__sub">Add any ongoing care or related work you would like included in the conversation.</p>' +
        '<div class="qpills qpills--addons" role="group" aria-label="Optional add-ons">';
      addons.forEach(function (o) {
        html += '<label class="qpill"><input type="checkbox" name="qf-addons" value="' + esc(o) + '"' + (answers.addons.indexOf(o) !== -1 ? " checked" : "") + ' /><span>' + esc(o) + "</span></label>";
      });
      html += "</div>";
    }

    html += '<p class="qerror" role="alert" hidden></p>' +
      '<div class="qnav">' +
      '<button class="btn btn--ghost" type="button" data-back>Back</button>' +
      '<button class="btn btn--primary btn--lg" type="button" data-next>Next: Your Details <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></button>' +
      "</div>";
    stepsEl.innerHTML = html;

    var all = fields.concat(COMMON_FIELDS);
    refreshConditionals(all);

    /* live conditional + auto-area behaviour */
    stepsEl.addEventListener("change", function (e) {
      var t = e.target;
      all.forEach(function (f) {
        if ("qf-" + f.id === t.name || "qf-" + f.id === t.id) collectField(f);
      });
      refreshConditionals(all);
      /* rectangle calculator: auto-fill the area from length x width (+10%) */
      if (t.id === "qf-length_m" || t.id === "qf-width_m" || t.name === "qf-shape") {
        var l = parseFloat((document.getElementById("qf-length_m") || {}).value);
        var w = parseFloat((document.getElementById("qf-width_m") || {}).value);
        var areaEl = document.getElementById("qf-area_m2");
        if (areaEl && l > 0 && w > 0 && answers.shape === "Rectangle / Square") {
          areaEl.value = Math.round(l * w * 1.1);
        }
      }
    });

    var photoInput = document.getElementById("qf-photos");
    if (photoInput) {
      photoInput.addEventListener("change", function () {
        var files = Array.prototype.slice.call(photoInput.files);
        var problem = "";
        if (files.length + 0 > MAX_FILES) problem = "Please choose no more than " + MAX_FILES + " photos.";
        files.forEach(function (fl) {
          if (fl.type && fl.type.indexOf("image/") !== 0) problem = '"' + fl.name + "\" isn't an image file.";
          if (fl.size > MAX_BYTES) problem = '"' + fl.name + '" is too large — please keep photos under 10MB.';
        });
        if (problem) { setError(problem); photoInput.value = ""; return; }
        setError("");
        photoFiles = files;
        renderPhotoList();
      });
      renderPhotoList();
    }

    stepsEl.querySelector("[data-back]").addEventListener("click", function () { saveStep2(all); goTo(1); });
    stepsEl.querySelector("[data-next]").addEventListener("click", function () {
      saveStep2(all);
      var missing = validateStep2(all);
      if (missing) { setError(missing); return; }
      goTo(3);
    });
  }

  function saveStep2(all) {
    all.forEach(collectField);
    var picked = [];
    stepsEl.querySelectorAll('input[name="qf-addons"]:checked').forEach(function (c) { picked.push(c.value); });
    answers.addons = picked;
  }

  function validateStep2(all) {
    var firstBad = null, label = null;
    stepsEl.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
    all.forEach(function (f) {
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
  var CONTACT_FIELDS = [
    txt("name", "Full name", { required: true, autocomplete: "name" }),
    txt("mobile", "Mobile number", { required: true, autocomplete: "tel" }),
    txt("email", "Email address", { required: true, autocomplete: "email" }),
    txt("address", "Street address", { autocomplete: "street-address" }),
    txt("contact_suburb", "Suburb", { autocomplete: "address-level2" }),
    txt("postcode", "Postcode", { autocomplete: "postal-code" }),
    radio("contact_method", "Preferred contact method", ["Phone", "SMS", "Email"], { required: true }),
    sel("contact_time", "Best time to contact", ["Morning", "Afternoon", "Evening", "Any time"]),
    area("notes", "Additional notes", { placeholder: "Anything else you'd like us to know." })
  ];

  function summaryRows() {
    var rows = [];
    var svc = serviceById(answers.service);
    rows.push(["Service", svc ? svc.name : "—", 1]);
    var skip = { service: 1, addons: 1, name: 1, mobile: 1, email: 1, address: 1, contact_suburb: 1, postcode: 1, contact_method: 1, contact_time: 1, notes: 1, consent: 1 };
    var labels = {};
    (STEP2[answers.service] || []).concat(COMMON_FIELDS).forEach(function (f) { labels[f.id] = f.label; });
    Object.keys(answers).forEach(function (k) {
      if (skip[k]) return;
      var v = answers[k];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
      rows.push([labels[k] || k, Array.isArray(v) ? v.join(", ") : v, 2]);
    });
    if (answers.addons.length) rows.push(["Also interested in", answers.addons.join(", "), 2]);
    if (photoFiles.length) rows.push(["Photos", photoFiles.length + " attached", 2]);
    return rows;
  }

  function renderStep3() {
    var html = '<h2 class="qstep__title">Your details</h2>' +
      '<p class="qstep__sub">We’ll use these to confirm your free quote — nothing else.</p>' +
      '<div class="qgroup qgroup--contact">';
    CONTACT_FIELDS.forEach(function (f) { html += fieldHtml(f); });
    html += "</div>";

    html += '<h3 class="qgroup__title">Your request</h3><div class="qsummary">';
    summaryRows().forEach(function (r) {
      html += '<div class="qsummary__row"><span>' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span>" +
        '<button type="button" class="qsummary__edit" data-goto="' + r[2] + '">Edit</button></div>';
    });
    html += "</div>";

    html += '<label class="qconsent"><input type="checkbox" id="qf-consent"' + (answers.consent ? " checked" : "") + ' /> <span>I’m happy for Turf and Landscaping to contact me about this quote. <span class="req" aria-hidden="true">*</span></span></label>';

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
    CONTACT_FIELDS.forEach(collectField);
    var c = document.getElementById("qf-consent");
    if (c) answers.consent = c.checked;
  }

  function validateStep3() {
    stepsEl.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
    var required = [["name", "Full name"], ["mobile", "Mobile number"], ["email", "Email address"], ["contact_method", "Preferred contact method"]];
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

    fetch(WEBHOOK_URL, { method: "POST", body: body })
      .then(function (res) {
        if (!res.ok) throw new Error("Bad response " + res.status);
        renderConfirmation();
      })
      .catch(function () {
        submitting = false;
        btn.disabled = false;
        btn.innerHTML = 'Request My Free Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';
        setError("Sorry, something went wrong sending your request — your answers are still here. Please try again, or call us on " + PHONE_DISPLAY + ".");
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
