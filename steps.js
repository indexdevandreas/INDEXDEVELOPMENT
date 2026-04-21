(function () {
  'use strict';

  var container    = document.getElementById('stepsScroll');
  var slides       = document.querySelectorAll('.step-slide');
  var progressFill = document.getElementById('stepsProgressFill');

  if (!container || !slides.length) return;

  var N = slides.length;

  /* ── IntersectionObserver: text reveal per slide ── */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');

        /* Update blue progress bar */
        var idx = Array.prototype.indexOf.call(slides, entry.target);
        if (progressFill) {
          progressFill.style.height = ((idx + 1) / N * 100) + '%';
        }
      }
    });
  }, {
    root: container,      /* observe within the scroll container */
    threshold: 0.55       /* trigger when slide is >55% visible */
  });

  slides.forEach(function (slide) {
    revealObserver.observe(slide);
  });

}());
