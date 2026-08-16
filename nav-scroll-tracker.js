/* ───────────────────────────────────────────────────────────
   nav-scroll-tracker.js — markerer hvor du er i nav-baren.

   To jobber:
   1) Undersider: lenken som peker på siden du står på får
      .nav-active. På en tjenesteside markeres «Tjenester»-
      triggeren pluss riktig rad i dropdownen, på en bloggartikkel
      markeres «Blogg».
   2) Forsiden: seksjonene #tjenester, #meg, #blogg og #kontakt
      markeres i nav-en mens de passerer øvre del av skjermen.

   Lastes på alle sider — finner den ingen nav eller ingen
   seksjoner å spore, gjør den ingenting.
   ─────────────────────────────────────────────────────────── */
(function () {
  function init() {
    var nav = document.querySelector('.hero-nav');
    if (!nav) return;

    var topLinks = nav.querySelectorAll('.hero-nav-links > ul > li > a');
    var trigger = nav.querySelector('.nav-dropdown-trigger');
    var panelLinks = nav.querySelectorAll('.nav-dropdown-panel a');
    var kontaktLink = nav.querySelector('.hero-nav-actions .nav-text-link, .hero-nav-actions .nav-btn-ghost');

    var side = location.pathname.split('/').pop() || 'index.html';

    // Ankerlenker (index.html#blogg) hører til rulle-sporingen, ikke
    // sidematchingen — ellers ville «Blogg» stått grønn permanent på
    // forsiden.
    function lenkeSide(a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('#') !== -1) return null;
      return href.split('/').pop();
    }
    function finnToppLenke(del) {
      for (var i = 0; i < topLinks.length; i++) {
        if ((topLinks[i].getAttribute('href') || '').indexOf(del) !== -1) return topLinks[i];
      }
      return null;
    }

    /* ── 1) Marker siden man står på ── */
    var sideMarkert = false;
    topLinks.forEach(function (a) {
      if (lenkeSide(a) === side) { a.classList.add('nav-active'); sideMarkert = true; }
    });
    panelLinks.forEach(function (a) {
      if (lenkeSide(a) === side) {
        a.classList.add('nav-active');
        if (trigger) trigger.classList.add('nav-active');
        sideMarkert = true;
      }
    });
    if (kontaktLink && lenkeSide(kontaktLink) === side) {
      kontaktLink.classList.add('nav-active');
      sideMarkert = true;
    }
    // Bloggartiklene heter blogg-*.html — de hører hjemme under «Blogg»
    // selv om selve lenken peker på forsideseksjonen.
    if (!sideMarkert && side.indexOf('blogg-') === 0) {
      var bloggLenke = finnToppLenke('#blogg');
      if (bloggLenke) { bloggLenke.classList.add('nav-active'); sideMarkert = true; }
    }
    if (sideMarkert) return;

    /* ── 2) Rulle-sporing (i praksis bare forsiden) ── */
    var kart = [
      { el: document.getElementById('tjenester'), lenke: trigger },
      { el: document.getElementById('meg'),       lenke: finnToppLenke('om-meg') },
      { el: document.getElementById('blogg'),     lenke: finnToppLenke('#blogg') },
      { el: document.getElementById('kontakt'),   lenke: kontaktLink }
    ].filter(function (p) { return p.el && p.lenke; });
    if (!kart.length) return;

    var naa = null;
    var venter = false;
    function oppdater() {
      venter = false;
      // Målelinja ligger 35 % ned i vinduet — omtrent der blikket lander.
      var linje = window.innerHeight * 0.35;
      var aktiv = null;
      // getBoundingClientRect per seksjon, ikke offsetTop: seksjonene i
      // .stack er sticky og flytter seg. Siste treff vinner — den som
      // ligger øverst i stabelen står sist i DOM-en.
      kart.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        if (r.top <= linje && r.bottom > linje) aktiv = p.lenke;
      });
      if (aktiv !== naa) {
        kart.forEach(function (p) { p.lenke.classList.remove('nav-active'); });
        if (aktiv) aktiv.classList.add('nav-active');
        naa = aktiv;
      }
    }
    window.addEventListener('scroll', function () {
      if (!venter) { venter = true; requestAnimationFrame(oppdater); }
    }, { passive: true });
    window.addEventListener('resize', oppdater);
    oppdater();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
