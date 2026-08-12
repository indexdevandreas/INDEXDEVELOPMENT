'use strict';

/* ───────────────────────────────────────────────────────────
   drift.js — lyskjeglen som følger pekeren over bento-kortene.
   Posisjonen skrives til CSS-variabler, så selve effekten er
   ren CSS. Kun på enheter med ekte hover, og aldri når brukeren
   har bedt om mindre bevegelse.
   ─────────────────────────────────────────────────────────── */
(function () {
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cards = document.querySelectorAll('.bn');
  if (!cards.length) return;

  cards.forEach(function (card) {
    var frame = null;

    card.addEventListener('pointermove', function (e) {
      if (frame) return;
      /* Én oppdatering per frame — pointermove fyrer langt oftere */
      frame = requestAnimationFrame(function () {
        frame = null;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    card.addEventListener('pointerleave', function () {
      if (frame) { cancelAnimationFrame(frame); frame = null; }
    });
  });
})();
