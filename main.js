/* =====================================================================
   Bastiano Landscaping — site behaviour
   Plain JS, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  /* Marks the page as JS-active so CSS can safely hide .reveal content for
     animation — set here (not in an inline <head> script) so that if this
     file fails to load or run for any reason, the class never gets added
     and .reveal content just stays visible (see .js .reveal in style.css). */
  document.documentElement.classList.add("js");

  /* ---------- Lead source ----------
     Remembers how this visitor reached the site — campaign tags (utm_*),
     an ad click ID (Google gclid, Meta fbclid, Microsoft msclkid), the
     referring site, or Instagram/Facebook's in-app browser — so the quote
     form can tell GoHighLevel where the lead came from (quote.js sends it,
     the quote worker turns it into a channel such as "Instagram").
     Kept in this browser only (localStorage, 90 days): the first arrival
     and the latest one that wasn't direct. No personal details. */
  (function () {
    var KEY = "bl_lead_source_v1";
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var own = window.location.hostname.replace(/^www\./, "").toLowerCase();
    var ref = "";
    try { if (document.referrer) ref = new URL(document.referrer).hostname.toLowerCase(); } catch (e) {}
    var refBase = ref.replace(/^www\./, "");
    /* Our own pages and subdomains (e.g. the staff app) are not sources. */
    var internal = !!ref && (refBase === own || refBase.slice(-own.length - 1) === "." + own);

    var touch = { at: new Date().toISOString(), landing: window.location.pathname.slice(0, 150) };
    var tagged = false;
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid", "msclkid"].forEach(function (k) {
      var v = params.get(k);
      if (v) { touch[k] = v.slice(0, 150); tagged = true; }
    });
    /* An ordinary click between our own pages is not a new arrival. */
    if (internal && !tagged) return;
    if (ref && !internal) touch.referrer = ref.slice(0, 100);
    var ua = navigator.userAgent || "";
    if (/Instagram/i.test(ua)) touch.app = "instagram";
    else if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) touch.app = "facebook";
    var external = tagged || !!touch.referrer || !!touch.app;

    var store = {};
    try { store = JSON.parse(window.localStorage.getItem(KEY) || "{}") || {}; } catch (e) { store = {}; }
    var fresh = function (t) { return !!t && Date.now() - Date.parse(t.at) < 90 * 864e5; };
    /* After 90 days the first visit is forgotten; a recent outside visit
       (if any) becomes the new first one. */
    if (!fresh(store.first)) {
      store = fresh(store.last) ? { first: store.last, last: store.last }
        : { first: external ? touch : { at: touch.at, landing: touch.landing, direct: true } };
    }
    if (external) store.last = touch;
    try { window.localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  })();

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
     "before" image (left of the divider), so dragging left reveals more of
     the finished job on the right. */
  function initBASlider(el) {
    if (!el) return;
    var before = el.querySelector(".ba__before");
    var divider = el.querySelector(".ba__divider");
    var handle = el.querySelector(".ba__handle");
    var dragging = false;

    function setPos(clientX) {
      var rect = el.getBoundingClientRect();
      var pct = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
      before.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
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

  /* ---------- Compact header on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  /* ---------- Mobile navigation ----------
     The panel's slide, the staggered rows and the burger-to-X are CSS
     transitions keyed off data-open / aria-expanded (style.css); this only
     keeps state, focus and scrolling right. */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  if (toggle && mobileNav) {
    var root = document.documentElement;
    var headerEl = document.querySelector(".site-header");
    var groups = Array.prototype.slice.call(mobileNav.querySelectorAll("[data-mnav-group]"));
    var desktopMq = window.matchMedia("(min-width: 1280px)");
    var collapseTimer = null;
    var savedY = 0;
    var isOpen = function () { return mobileNav.getAttribute("data-open") === "true"; };

    var setGroup = function (group, open) {
      group.classList.toggle("is-open", open);
      group.querySelector(".mnav__toggle").setAttribute("aria-expanded", String(open));
    };

    // Tab order while open: the capsule (logo, call, X) plus whatever in the
    // panel is actually visible — collapsed dropdown links are skipped.
    var focusables = function () {
      return Array.prototype.slice.call(headerEl.querySelectorAll("a[href], button")).filter(function (el) {
        if (el.disabled || !el.getClientRects().length) return false;
        return getComputedStyle(el).visibility === "visible";
      });
    };

    var setMenu = function (open, opts) {
      opts = opts || {};
      if (open === isOpen()) return; // a repeated tap or duplicate event changes nothing
      clearTimeout(collapseTimer);
      mobileNav.setAttribute("data-open", String(open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
      if (open) {
        // lock the page behind; pad for a disappearing desktop scrollbar so nothing shifts
        savedY = window.scrollY;
        var gap = window.innerWidth - root.clientWidth;
        root.style.paddingRight = gap > 0 ? gap + "px" : "";
        root.classList.add("nav-lock");
        mobileNav.scrollTop = 0;
        var first = mobileNav.querySelector(".mnav__link");
        if (first) first.focus({ preventScroll: true });
      } else {
        root.classList.remove("nav-lock");
        root.style.paddingRight = "";
        // a locked page can still be moved by focus scrolling; put it back where it was
        if (Math.abs(window.scrollY - savedY) > 1) window.scrollTo({ top: savedY, left: 0, behavior: "instant" });
        if (opts.returnFocus) toggle.focus({ preventScroll: true });
        // fold any open dropdown once the panel has slid away, not while it is visible
        collapseTimer = setTimeout(function () {
          if (!isOpen()) groups.forEach(function (g) { setGroup(g, false); });
        }, 520);
      }
    };

    toggle.addEventListener("click", function () { setMenu(!isOpen()); });

    groups.forEach(function (group) {
      group.querySelector(".mnav__toggle").addEventListener("click", function () {
        setGroup(group, !group.classList.contains("is-open"));
      });
    });

    // Tapping a link closes the menu first, so the lock is gone before the
    // browser follows it (homepage # links then scroll normally).
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        setMenu(false, { returnFocus: true });
      } else if (e.key === "Tab") {
        // Every Tab is handled here while open: it keeps focus in the menu
        // and the capsule, and preventScroll stops the browser scrolling the
        // locked page behind to "reveal" the sticky header's links.
        var items = focusables();
        if (!items.length) return;
        e.preventDefault();
        var at = items.indexOf(document.activeElement);
        var next = at === -1 ? (e.shiftKey ? items.length - 1 : 0) : (at + (e.shiftKey ? -1 : 1) + items.length) % items.length;
        items[next].focus({ preventScroll: true });
      }
    });

    // Widening past the hamburger breakpoint (rotation, resize) closes it cleanly.
    var onDesktop = function (e) { if (e.matches) setMenu(false); };
    if (desktopMq.addEventListener) desktopMq.addEventListener("change", onDesktop);
    else if (desktopMq.addListener) desktopMq.addListener(onDesktop);
  }
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drop.classList.contains("is-open")) {
        setOpen(false);
        if (drop.contains(document.activeElement)) toggle.focus();
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

/* ---------- Google reviews strip ----------
   Static data, no API. Native scroll-snap handles swiping; this only renders
   the cards and wires the desktop prev/next arrows. Add a `photo` (URL) to an
   entry to give that card an image slot. */
(function () {
  var REVIEWS = [
    { name: "Elly B.", quote: "Buffalo turf is looking amazing. My boxer loves it and he also loved Seb. Nice friendly guy and very reasonably priced. Highly recommend!" },
    { name: "Elizabeth", quote: "Messaged Sebastian Monday and the turf was ordered and installed on Wednesday! Looks great and couldn't be happier." },
    { name: "Anthony S.", quote: "Very happy with the result, the turf looks great! Great communication and recommendations for after care. 10/10 thanks Sebi." },
    { name: "Elyse T.", quote: "Looks amazing, brilliant job! My dogs are very happy with their new grass to run around!" },
    { name: "Damon B.", quote: "Highly recommended for fast efficient turf laying \u2014 on time, prompt and reliable in the whole process." },
    { name: "Joseph A.", quote: "Bastiano did an amazing job from start to finish. The grass looks absolutely fantastic. Highly recommend if you're after great quality turf." },
    { name: "Globe Atlas", quote: "Extremely happy with the job. Reliable, honest and most importantly trustworthy. I'll have them attending all my landscaping work from now on." },
    { name: "Burhaan T.", quote: "Really happy with the work. The turf has taken well and the job looks professional at a great price." },
    { name: "Stephen-Octav F.", quote: "Sebi and his team did a great job. Easy to deal with, on time, and left the site clean. Would recommend." }
  ];
  var root = document.querySelector("[data-reviews]");
  if (!root) return;
  var track = root.querySelector("[data-reviews-track]");
  var scroller = root.querySelector(".reviews__scroller");
  var pauseBtn = root.querySelector("[data-reviews-pause]");
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.6 7.2.6-5.4 4.8 1.6 7-6.4-3.8L5.2 21l1.6-7L1.4 9.2l7.2-.6z"/></svg>';
  var G = '<svg class="review__g" viewBox="0 0 24 24" role="img" aria-label="Google review"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#e2dcc9"/><text x="12" y="16.6" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="13" font-weight="700" fill="#4285f4">G</text></svg>';
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  track.innerHTML = REVIEWS.map(function (r) {
    return '<li class="review' + (r.photo ? " review--photo" : "") + '">' +
      (r.photo ? '<figure class="review__photo"><img src="' + esc(r.photo) + '" alt="" loading="lazy" /></figure>' : "") +
      '<div class="review__top"><span class="review__stars" role="img" aria-label="Rated 5 out of 5 stars">' + STAR + STAR + STAR + STAR + STAR + '</span>' + G + '</div>' +
      '<blockquote class="review__text">' + esc(r.quote) + '</blockquote>' +
      '<footer class="review__who"><strong>' + esc(r.name) + '</strong><span>Google review</span></footer>' +
      '</li>';
  }).join("");

  /* Continuous marquee: the card set is cloned once (clones aria-hidden)
     and the track slides by exactly one set width on a linear loop.
     Hover/focus pauses it, the proof-row button toggles it, and users
     with reduced motion keep the plain swipeable strip instead. */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) {
    if (pauseBtn) pauseBtn.hidden = true;
    return;
  }
  scroller.classList.add("reviews__scroller--marquee");
  track.classList.add("reviews__track--marquee");
  Array.prototype.slice.call(track.children).forEach(function (li) {
    var clone = li.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var measure = function () {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 12;
    var shift = (track.scrollWidth + gap) / 2;   /* one set + the seam gap */
    track.style.setProperty("--marquee-shift", -shift + "px");
    track.style.setProperty("--marquee-time", Math.round(shift / 42) + "s");
  };
  measure();
  window.addEventListener("resize", measure);
  if (pauseBtn) pauseBtn.addEventListener("click", function () {
    var paused = track.classList.toggle("is-paused");
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.setAttribute("aria-label", paused ? "Play reviews" : "Pause reviews");
    pauseBtn.innerHTML = paused ? PLAY : PAUSE;
  });
})();
