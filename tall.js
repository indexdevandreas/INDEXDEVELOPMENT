'use strict';

/* ───────────────────────────────────────────────────────────
   tall.js — tallene teller seg opp når de kommer i syne.

   Verdiene står som vanlig tekst i markupen, så de er riktige
   selv uten JavaScript og for søkemotorer. Skriptet leser tallet
   ut av det første tekstnoden, teller opp til det, og legger
   tilbake nøyaktig samme formatering — enheten i <span> røres ikke.
   ─────────────────────────────────────────────────────────── */

(function () {

  var SELEKTORER = [
    '.pf-val',           // forsiden: 0 maler, 100/100, 24/7
    '.s2-num',           // forsiden: 0 kr, 5 dager, 0 mnd
    '.nk-stat',          // forsiden: <1 sek
    '.in-price-amount',  // webdesign: 1 999
    '.pk-price',         // priser: pakkeprisene
    '.pk-drift-num',     // priser: 199
    '.sp-amount'         // priser: fra 1 999
  ].join(', ');

  var el = document.querySelectorAll(SELEKTORER);
  if (!el.length) return;

  var stille = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Finner tekstnoden med selve tallet — enheten ligger i et <span>
     og skal stå urørt. */
  function tallnode(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3 && /\d/.test(n.nodeValue)) return n;
    }
    return null;
  }

  var mål = [];

  Array.prototype.forEach.call(el, function (node) {
    var tn = tallnode(node);
    if (!tn) return;

    var tekst = tn.nodeValue;
    /* Deler opp i: det som står foran (f.eks. «fra » eller «<»),
       selve tallet (kan ha mellomrom som tusenskille), og resten. */
    var m = tekst.match(/^(\D*?)(\d[\d\s ]*)(.*)$/);
    if (!m) return;

    var foran = m[1], rå = m[2], bak = m[3];
    var verdi = parseInt(rå.replace(/[\s ]/g, ''), 10);
    if (isNaN(verdi)) return;

    var mellomrom = /[\s ]/.test(rå.trim());

    /* Startpunkt: score-aktige tall (100) skal ikke krype fra null —
       det leser som at siden er ødelagt. De starter høyt og lander.
       Nuller teller nedover, ellers ville de ikke bevege seg i det
       hele tatt. */
    var fra;
    if (verdi === 0)        fra = 12;
    else if (verdi >= 100)  fra = Math.round(verdi * 0.65);
    else                    fra = 0;

    mål.push({
      node: tn, foran: foran, bak: bak,
      fra: fra, til: verdi, mellomrom: mellomrom,
      ferdig: false
    });

    /* Startverdien skrives IKKE her. Gjorde den det, ville siden vist
       «65/100» og «12 kr» som ekte tall hvis animasjonen aldri kom i
       gang — feil pris er verre enn ingen animasjon. */
  });

  if (!mål.length) return;

  function format(n, mellomrom) {
    var s = String(n);
    return mellomrom ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  }

  function skriv(m, n) {
    m.node.nodeValue = m.foran + format(n, m.mellomrom) + m.bak;
  }

  function tell(m) {
    if (m.ferdig) return;
    m.ferdig = true;

    skriv(m, m.fra);

    /* Blir fanen lagt i bakgrunnen eller stopper rAF av andre grunner,
       snapper vi til riktig verdi. Timere fortsetter å gå der rAF ikke gjør. */
    var nett = setTimeout(function () { skriv(m, m.til); }, 2200);

    var start = null;
    var varighet = 1100;
    var spenn = m.til - m.fra;

    function steg(tid) {
      if (start === null) start = tid;
      var p = Math.min((tid - start) / varighet, 1);
      /* easeOutExpo: fart i starten, mykt anslag på slutten */
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      skriv(m, Math.round(m.fra + spenn * e));
      if (p < 1) { requestAnimationFrame(steg); }
      else { clearTimeout(nett); skriv(m, m.til); }
    }
    requestAnimationFrame(steg);
  }

  if (stille) return;   /* verdiene står allerede riktig i markupen */

  /* Utløser på rullposisjon i stedet for IntersectionObserver. IO er
     riktig verktøy for mange elementer, men for et titalls tall er
     forskjellen ingenting — og en ren geometrisjekk kan verifiseres,
     som gjør at feil her fanges før de havner i produksjon. */
  function synlig(node) {
    var r = node.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    /* Må ha passert 88 % av skjermhøyden og ikke være rullet forbi */
    return r.top < h * 0.88 && r.bottom > 0;
  }

  function sjekk() {
    var igjen = false;
    for (var i = 0; i < mål.length; i++) {
      var m = mål[i];
      if (m.ferdig) continue;
      if (synlig(m.node.parentNode)) tell(m);
      else igjen = true;
    }
    if (!igjen) {
      window.removeEventListener('scroll', planlegg);
      window.removeEventListener('resize', planlegg);
    }
  }

  var venter = false;
  function planlegg() {
    if (venter) return;
    venter = true;
    requestAnimationFrame(function () { venter = false; sjekk(); });
  }

  window.addEventListener('scroll', planlegg, { passive: true });
  window.addEventListener('resize', planlegg);
  sjekk();
})();
