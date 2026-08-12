'use strict';

/* ───────────────────────────────────────────────────────────
   forside.js — scroll-animasjoner for forsiden.
   Elementene merkes automatisk her, så markupen holdes ren.
   ─────────────────────────────────────────────────────────── */

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Grupper som skal animeres inn, med forskyvning mellom barna */
  var GROUPS = [
    '.platform-top',
    '.pf-cards',
    '.s2-grid',
    '.cv-grid',
    '.rv-grid',
    '.sv-grid',
    '.nk-grid',
    '.bl-grid',
    '.fq-left',
    '.fq-list',
    '.dm-inner',
    /* webdesign.html */
    '.wy-grid',
    '.in-groups',
    '.in-price',
    '.st-track',
    /* drift.html */
    '.bento',
    '.dp-grid',
    '.dr-safe-grid',
    /* chatbots.html */
    '.lv-grid',
    '.qa-list',
    '.bd-steps',
    '.bd-price',
    /* systemutvikling.html */
    '.bk-grid',
    '.st-strip',
    '.sp-grid',
    /* api-integrasjoner.html */
    '.vs-grid',
    '.wr-list',
    '.pr-cols',
    /* booking-systemer.html */
    '.fl-grid',
    '.sk-list',
    /* priser.html */
    '.sp-grid',
    '.pk-grid',
    '.hw-track',
    /* om-meg.html */
    '.ph-grid',
    '.ci-grid',
    /* kontakt.html */
    '.rc-cards',
    '.kf-list',
    /* kompetanse.html */
    '.kp-list',
    /* bloggartiklene */
    '.bg-next-grid',
  ];

  var STEP = 70;   // ms mellom hvert element i en gruppe
  var items = [];

  GROUPS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (group) {
      var kids;

      if (group.classList.contains('platform-top')) {
        /* Overskriften: eyebrow → tittel → sidetekst */
        kids = [
          group.querySelector('.pf-eyebrow'),
          group.querySelector('.pf-head'),
          group.querySelector('.pf-aside')
        ].filter(Boolean);
      } else {
        kids = Array.prototype.slice.call(group.children);
      }

      kids.forEach(function (el, i) {
        el.classList.add('rv');
        el.style.setProperty('--d', (i * STEP) + 'ms');
        items.push(el);
      });
    });
  });

  if (reduce) {
    items.forEach(function (el) { el.classList.add('on'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

  items.forEach(function (el) { io.observe(el); });

  /* ─── Hero: staggered inngang ved lasting ─── */
  var heroKids = document.querySelectorAll('.hero-inner > *');
  heroKids.forEach(function (el, i) {
    el.classList.add('rv');
    el.style.setProperty('--d', (120 + i * 85) + 'ms');
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      heroKids.forEach(function (el) { el.classList.add('on'); });
    });
  });
})();
