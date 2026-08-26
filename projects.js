/* Scoped behaviour for the projects pages: category filtering and the
   accessible before/after comparison sliders. Plain JS, no deps. */
(function () {
  "use strict";

  /* ---------- category filters ---------- */
  var filters = document.querySelectorAll(".pj-filter");
  var cards = document.querySelectorAll(".pj-card[data-categories]");
  var empty = document.getElementById("pj-empty");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var f = btn.dataset.filter;
      var visible = 0;
      cards.forEach(function (card) {
        var show = f === "all" || card.dataset.categories.split("|").indexOf(f) !== -1;
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
  });

  /* ---------- before/after sliders (pointer + touch + keyboard) ---------- */
  document.querySelectorAll("[data-ba]").forEach(function (el) {
    var after = el.querySelector(".ba__after");
    var divider = el.querySelector(".ba__divider");
    var handle = el.querySelector(".ba__handle");
    if (!after || !divider || !handle) return;
    var pct = 50;
    var dragging = false;

    function apply() {
      after.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      divider.style.left = pct + "%";
      handle.style.left = pct + "%";
      el.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
    function setFromX(clientX) {
      var rect = el.getBoundingClientRect();
      pct = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
      apply();
    }
    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    el.addEventListener("pointermove", function (e) { if (dragging) setFromX(e.clientX); });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("pointercancel", function () { dragging = false; });
    el.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 10 : 4;
      if (e.key === "ArrowLeft") { pct = Math.max(4, pct - step); apply(); e.preventDefault(); }
      if (e.key === "ArrowRight") { pct = Math.min(96, pct + step); apply(); e.preventDefault(); }
      if (e.key === "Home") { pct = 4; apply(); e.preventDefault(); }
      if (e.key === "End") { pct = 96; apply(); e.preventDefault(); }
    });
    apply();
  });
})();
