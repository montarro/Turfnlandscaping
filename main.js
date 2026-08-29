/* =====================================================================
   Turf and Landscaping — site behaviour
   Plain JS, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  /* Marks the page as JS-active so CSS can safely hide .reveal content for
     animation — set here (not in an inline <head> script) so that if this
     file fails to load or run for any reason, the class never gets added
     and .reveal content just stays visible (see .js .reveal in style.css). */
  document.documentElement.classList.add("js");

  /* -------------------------------------------------------------------
     QUOTE FORM WEBHOOK
     Paste the webhook URL supplied by the client between the quotes.
     While this is empty the form validates and shows a friendly message
     telling the visitor to call — it never silently fails.

     Payload format:
       • no photos attached → JSON body
       • photos attached    → multipart/form-data (so the files come through)
     ------------------------------------------------------------------- */
  var WEBHOOK_URL = "";

  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo

  /* ---------- Subtle entrance animation ---------- */
  var revealEls = document.querySelectorAll(".reveal:not(.is-visible)");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------------------------------------------------------------------
     BEFORE / AFTER TRANSFORMATIONS
     Populate with REAL project pairs only — matching before and after
     photos of the same job. The section stays hidden until at least one
     entry exists here, so nothing fabricated ever renders.

     Drop photo pairs into assets/photos/ (they pass through the build to
     /assets/images/<name>.webp) and add entries like:
       { before: "/assets/images/job1-before.webp",
         after:  "/assets/images/job1-after.webp",
         title:  "Backyard turf & paving",
         suburb: "Werribee",
         services: "Natural turf · Paving · Garden beds" }
     ------------------------------------------------------------------- */
  var TRANSFORMATIONS = [];

  (function initTransformations() {
    var section = document.getElementById("transformations");
    if (!section || !TRANSFORMATIONS.length) return;
    section.hidden = false;

    var track = document.getElementById("tf-track");
    var dots = document.getElementById("tf-dots");
    var current = 0;

    TRANSFORMATIONS.forEach(function (t, i) {
      var slide = document.createElement("div");
      slide.className = "tf__slide";
      slide.innerHTML =
        '<div class="ba">' +
        '<img class="ba__before" src="' + t.before + '" alt="Before: ' + t.title + '" loading="lazy" />' +
        '<img class="ba__after" src="' + t.after + '" alt="After: ' + t.title + '" loading="lazy" />' +
        '<span class="ba__label ba__label--after">After</span>' +
        '<span class="ba__label ba__label--before">Before</span>' +
        '<div class="ba__divider"></div>' +
        '<div class="ba__handle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6l-4 6 4 6M16 6l4 6-4 6"/></svg></div>' +
        "</div>" +
        '<div class="tf__meta"><h3>' + t.title + "</h3><p>" + t.suburb + " · " + t.services + "</p></div>";
      track.appendChild(slide);

      var dot = document.createElement("button");
      dot.className = "tf__dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to project " + (i + 1));
      dot.addEventListener("click", function () { go(i); });
      dots.appendChild(dot);

      initBASlider(slide.querySelector(".ba"));
    });

    function go(i) {
      current = (i + TRANSFORMATIONS.length) % TRANSFORMATIONS.length;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      Array.prototype.forEach.call(dots.children, function (d, j) {
        if (j === current) { d.setAttribute("aria-current", "true"); }
        else { d.removeAttribute("aria-current"); }
      });
    }

    var prev = section.querySelector("[data-tf-prev]");
    var next = section.querySelector("[data-tf-next]");
    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    if (next) next.addEventListener("click", function () { go(current + 1); });

    // Horizontal swipe between projects (ignores drags that start on the slider itself)
    var startX = null;
    track.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".ba")) return;
      startX = e.clientX;
    });
    track.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (dx > 48) go(current - 1);
      else if (dx < -48) go(current + 1);
    });

    go(0);
  })();

  /* Draggable before/after divider: pointer position sets the clip on the
     "after" image, so dragging right reveals more of the finished job. */
  function initBASlider(el) {
    if (!el) return;
    var after = el.querySelector(".ba__after");
    var divider = el.querySelector(".ba__divider");
    var handle = el.querySelector(".ba__handle");
    var dragging = false;

    function setPos(clientX) {
      var rect = el.getBoundingClientRect();
      var pct = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
      after.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      divider.style.left = pct + "%";
      handle.style.left = pct + "%";
    }

    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      setPos(e.clientX);
    });
    el.addEventListener("pointermove", function (e) { if (dragging) setPos(e.clientX); });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("pointercancel", function () { dragging = false; });
  }

  /* ---------- Hero background video ----------
     The <video> layers over the hero photo. Remove it (leaving the photo)
     when the visitor prefers reduced motion or has data-saver on, and if
     autoplay is blocked let the poster/photo show instead. */
  var heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    var saveData = navigator.connection && navigator.connection.saveData;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) {
      heroVideo.remove();
    } else {
      /* Low Power Mode / autoplay policies can reject the first play();
         keep the video (poster shows) and retry on the first interaction. */
      var tryPlay = function () {
        var p = heroVideo.play();
        if (p && p.catch) { p.catch(function () {}); }
      };
      tryPlay();
      ["pointerdown", "touchstart", "scroll", "keydown"].forEach(function (evt) {
        window.addEventListener(evt, tryPlay, { once: true, passive: true });
      });
      /* The loop attribute handles looping, but Safari and Low Power Mode
         can stall at the final frame — restart explicitly if that happens. */
      heroVideo.addEventListener("ended", function () {
        heroVideo.currentTime = 0;
        tryPlay();
      });
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && heroVideo.paused && !heroVideo.ended) tryPlay();
      });
    }
  }

  /* ---------- Compact header on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.getAttribute("data-open") === "true";
      mobileNav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
    // Close the drawer after tapping a link
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        mobileNav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Quote form ---------- */
  var form = document.getElementById("quote-form");
  if (!form) return;

  var statusEl = form.querySelector(".form__status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var photos = form.querySelector("#photos");
  var photoList = form.querySelector("#photo-list");

  function setStatus(msg, state) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.setAttribute("data-state", state || "");
  }

  function readableSize(bytes) {
    return bytes < 1024 * 1024
      ? Math.round(bytes / 1024) + " KB"
      : (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* ---------- Photo picker: validate and list the chosen files ---------- */
  function validatePhotos() {
    if (!photos || !photos.files.length) {
      if (photoList) { photoList.innerHTML = ""; }
      photos && photos.setCustomValidity("");
      return true;
    }

    var files = Array.prototype.slice.call(photos.files);
    var problem = "";

    if (files.length > MAX_FILES) {
      problem = "Please choose no more than " + MAX_FILES + " photos.";
    } else {
      for (var i = 0; i < files.length; i++) {
        if (files[i].type && files[i].type.indexOf("image/") !== 0) {
          problem = '"' + files[i].name + '" isn\'t an image file.';
          break;
        }
        if (files[i].size > MAX_BYTES) {
          problem = '"' + files[i].name + '" is ' + readableSize(files[i].size) +
                    " — please keep photos under 10MB.";
          break;
        }
      }
    }

    if (photoList) {
      photoList.innerHTML = "";
      files.forEach(function (f) {
        var li = document.createElement("li");
        li.textContent = f.name + " · " + readableSize(f.size);
        photoList.appendChild(li);
      });
    }

    photos.setCustomValidity(problem);
    if (problem) { setStatus(problem, "error"); } else { setStatus("", ""); }
    return !problem;
  }

  if (photos) { photos.addEventListener("change", validatePhotos); }

  /* ---------- Two-step flow ----------
     Step 1 takes contact details, so an abandoned form still leaves a usable
     lead. Step 2 takes the job itself. Both live in one <form>, so submission
     and the multipart photo handling are unchanged. */
  var stepEls = form.querySelectorAll(".form__step");
  var barItems = form.querySelectorAll(".steps-bar__item");
  var nextBtn = form.querySelector("[data-next]");
  var backBtn = form.querySelector("[data-back]");

  function showStep(n) {
    stepEls.forEach(function (el) {
      el.hidden = el.getAttribute("data-step") !== String(n);
    });
    barItems.forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-for") === String(n));
      el.classList.toggle("is-done", Number(el.getAttribute("data-for")) < n);
    });
    // keep the top of the form in view when switching
    var card = form.getBoundingClientRect();
    if (card.top < 0) { form.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      var stepOne = form.querySelector('.form__step[data-step="1"]');
      var fields = stepOne.querySelectorAll("input, select, textarea");
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].checkValidity()) { fields[i].reportValidity(); return; }
      }
      setStatus("", "");
      showStep(2);
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () { showStep(1); });
  }


  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: real people leave this empty. Bots fill it.
    var hp = form.querySelector('input[name="company"]');
    if (hp && hp.value.trim() !== "") { return; }

    if (!validatePhotos()) { return; }

    // Native validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var hasPhotos = photos && photos.files.length > 0;
    var body, headers;

    if (hasPhotos) {
      // multipart so the image files actually reach the webhook
      body = new FormData(form);
      body.delete("company");
      body.append("source_page", window.location.pathname);
      body.append("submitted_at", new Date().toISOString());
      headers = undefined; // let the browser set the multipart boundary
    } else {
      var data = Object.fromEntries(new FormData(form).entries());
      delete data.company;
      delete data.photos;
      data.source_page = window.location.pathname;
      data.submitted_at = new Date().toISOString();
      body = JSON.stringify(data);
      headers = { "Content-Type": "application/json" };
    }

    if (!WEBHOOK_URL) {
      // No endpoint wired up yet — guide the visitor to the phone, don't pretend it sent.
      setStatus(
        "Thanks! Our online form isn't connected yet — please call us on " +
        "0457 357 085 and we'll book your free on-site quote straight away.",
        "error"
      );
      return;
    }

    setStatus(hasPhotos ? "Uploading your photos…" : "Sending your request…", "");
    if (submitBtn) { submitBtn.disabled = true; }

    fetch(WEBHOOK_URL, { method: "POST", headers: headers, body: body })
      .then(function (res) {
        if (!res.ok) { throw new Error("Bad response " + res.status); }
        form.reset();
        if (photoList) { photoList.innerHTML = ""; }
        setStatus(
          "Thanks — we've got your details and will call you shortly to arrange your free on-site quote.",
          "ok"
        );
      })
      .catch(function () {
        setStatus(
          "Sorry, something went wrong sending your request. Please call us on 0457 357 085.",
          "error"
        );
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; }
      });
  });
})();

/* ---------- Desktop services dropdown ---------- */
(function () {
  "use strict";
  document.querySelectorAll("[data-navdrop]").forEach(function (drop) {
    var toggle = drop.querySelector(".nav-drop__toggle");
    var menu = drop.querySelector(".nav-drop__menu");
    if (!toggle || !menu) return;
    var hoverTimer;
    function setOpen(open) {
      clearTimeout(hoverTimer);
      drop.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    toggle.addEventListener("click", function () {
      setOpen(!drop.classList.contains("is-open"));
    });
    drop.addEventListener("mouseenter", function () {
      clearTimeout(hoverTimer);
      setOpen(true);
    });
    drop.addEventListener("mouseleave", function () {
      hoverTimer = setTimeout(function () { setOpen(false); }, 160);
    });
    drop.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drop.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!drop.contains(e.target)) setOpen(false);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
  });
})();
