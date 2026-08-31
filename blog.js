/* Topic filtering for the /blog index. Progressive enhancement only — every
   article is in the HTML and crawlable before this runs, and filtering never
   changes the URL, so no duplicate indexable pages are created. */
(function () {
  "use strict";
  var filters = document.querySelectorAll(".bl-filter");
  var cards = document.querySelectorAll(".bl-card[data-topics]");
  var empty = document.getElementById("bl-empty");
  if (!filters.length || !cards.length) return;

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var f = btn.dataset.filter;
      var visible = 0;
      cards.forEach(function (card) {
        var show = f === "all" || card.dataset.topics.split("|").indexOf(f) !== -1;
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
  });
})();
