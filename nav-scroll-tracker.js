/* ───────────────────────────────────────────────────────────
   nav-scroll-tracker.js — to små scroll-jobber, én fil.
   (Én fil fordi den lastes på alle sider — færre forespørsler.)

   1) NAV-MARKERING
      Undersider: lenken som peker på siden du står på får
      .nav-active. På en tjenesteside markeres «Tjenester»-
      triggeren pluss riktig rad i dropdownen, på en blogg-
      artikkel markeres «Blogg».
      Forsiden: seksjonene #tjenester, #meg, #blogg og #kontakt
      markeres mens de passerer øvre del av skjermen.

   2) ZEBRA-VEKST
      Dekor-stripene (::after på utvalgte seksjoner og footeren)
      leser CSS-variabelen --zs og vokser fra 0.8 til 1.2 mens
      flaten ruller gjennom skjermen.
   ─────────────────────────────────────────────────────────── */
(function () {

  /* ── 1) Nav-markering ── */
  function nav() {
    var bar = document.querySelector('.hero-nav');
    if (!bar) return;

    var topLinks = bar.querySelectorAll('.hero-nav-links > ul > li > a');
    var trigger = bar.querySelector('.nav-dropdown-trigger');
    var panelLinks = bar.querySelectorAll('.nav-dropdown-panel a');
    var kontaktLink = bar.querySelector('.hero-nav-actions .nav-text-link');

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

    /* Marker siden man står på */
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

    /* Rulle-sporing (i praksis bare forsiden) */
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

  /* ── 2) Zebra-vekst ── */
  function zebra() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var flater = document.querySelectorAll('.platform, .services2, .meg, .faq2, footer');
    if (!flater.length) return;

    var venter = false;
    function oppdater() {
      venter = false;
      var vh = window.innerHeight;
      flater.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return; // utenfor skjermen
        // 0 når toppen så vidt er under skjermkanten, 1 når bunnen
        // forlater den — mønsteret gror sakte hele veien gjennom.
        var p = (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, p));
        el.style.setProperty('--zs', (0.8 + p * 0.4).toFixed(3));
      });
    }
    window.addEventListener('scroll', function () {
      if (!venter) { venter = true; requestAnimationFrame(oppdater); }
    }, { passive: true });
    window.addEventListener('resize', oppdater);
    oppdater();
  }

  function init() { nav(); zebra(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
