'use strict';

/* ───────────────────────────────────────────────────────────
   samtykke.js — samtykke til informasjonskapsler (Google Analytics).

   Norsk lov (ekomloven § 2-7b, GDPR) krever at måleverktøy som setter
   informasjonskapsler ikke kjører før besøkende har sagt ja — og at
   nei er like lett som ja. Derfor:

   - Google Analytics lastes IKKE av HTML-en. Dette skriptet laster det
     bare etter et ja, og aldri ellers.
   - Boksen har to like store knapper, «Nei takk» og «Ja, det er
     greit». Ingen kryss, ingen forhåndsvalg, ingen «ved å fortsette».
   - Valget lagres i localStorage i inntil ett år. Etterpå spør vi
     igjen. «Informasjonskapsler» i bunnen av siden åpner boksen på
     nytt, så valget kan endres når som helst.
   - Sier man nei etter å ha sagt ja, slettes _ga-kapslene.

   Måle-ID-en (G-…) står i data-ga på <script>-taggen. Mangler den,
   gjør skriptet ingenting — det finnes ingenting å samtykke til, og
   lenken i bunnen skjules.
   ─────────────────────────────────────────────────────────── */

(function () {
  var tag = document.currentScript || document.querySelector('script[data-ga]');
  var GA = (tag && tag.getAttribute('data-ga') || '').trim();
  var gyldig = /^G-[A-Z0-9]{6,}$/.test(GA);

  var NOKKEL = 'idx-samtykke';
  var GYLDIG_MS = 365 * 24 * 60 * 60 * 1000;

  var wraps = document.querySelectorAll('[data-samtykke-wrap]');
  if (!gyldig) {
    for (var i = 0; i < wraps.length; i++) wraps[i].hidden = true;
    return;
  }

  function les() {
    try {
      var v = JSON.parse(localStorage.getItem(NOKKEL));
      if (!v || !v.valg) return null;
      if (Date.now() - (v.tid || 0) > GYLDIG_MS) return null;
      return v.valg;
    } catch (e) { return null; }
  }
  function lagre(valg) {
    try { localStorage.setItem(NOKKEL, JSON.stringify({ valg: valg, tid: Date.now() })); } catch (e) {}
  }

  /* ── Google Analytics: lastes først ved ja ── */
  function lastGA() {
    if (window.__idxGA) return;
    window.__idxGA = true;
    window['ga-disable-' + GA] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    document.head.appendChild(s);
  }
  /* Nei etter ja: stopp målingen og slett kapslene GA har satt */
  function slettGA() {
    window['ga-disable-' + GA] = true;
    var navn = ['_ga', '_ga_' + GA.replace(/^G-/, ''), '_gid', '_gat'];
    var vert = location.hostname;
    var domener = [vert, '.' + vert, '.' + vert.split('.').slice(-2).join('.')];
    navn.forEach(function (n) {
      document.cookie = n + '=; Max-Age=0; path=/';
      domener.forEach(function (d) { document.cookie = n + '=; Max-Age=0; path=/; domain=' + d; });
    });
  }

  /* ── Boksen ── */
  var boks = null;
  function el(t, k, tekst) {
    var e = document.createElement(t);
    if (k) e.className = k;
    if (tekst) e.textContent = tekst;
    return e;
  }
  function vis() {
    if (boks) return;
    boks = el('div', 'smt');
    boks.setAttribute('role', 'dialog');
    boks.setAttribute('aria-labelledby', 'smt-t');
    boks.setAttribute('aria-describedby', 'smt-b');

    var t = el('p', 'smt-t', 'Informasjonskapsler'); t.id = 'smt-t';
    var b = el('p', 'smt-b'); b.id = 'smt-b';
    b.appendChild(document.createTextNode('Jeg vil gjerne se hvor mange som besøker siden og hvilke sider som leses — med Google Analytics. Det settes bare hvis du sier ja. Chatboten og skjemaene virker uansett. '));
    var lenke = el('a', null, 'Les mer'); lenke.href = 'personvern.html#kapsler';
    b.appendChild(lenke);

    var k = el('div', 'smt-k');
    var nei = el('button', 'smt-nei', 'Nei takk'); nei.type = 'button';
    var ja = el('button', 'smt-ja', 'Ja, det er greit'); ja.type = 'button';
    k.appendChild(nei); k.appendChild(ja);

    boks.appendChild(t); boks.appendChild(b); boks.appendChild(k);
    document.body.appendChild(boks);
    document.body.classList.add('smt-open');
    /* Chat-knappen flyttes opp over boksen på telefon (samtykke.css) */
    document.body.style.setProperty('--smt-h', boks.offsetHeight + 'px');

    nei.addEventListener('click', function () { velg('nei'); });
    ja.addEventListener('click', function () { velg('ja'); });
  }
  function lukk() {
    if (!boks) return;
    boks.remove();
    boks = null;
    document.body.classList.remove('smt-open');
    document.body.style.removeProperty('--smt-h');
  }
  function velg(valg) {
    lagre(valg);
    if (valg === 'ja') lastGA(); else slettGA();
    lukk();
  }

  /* ── Start ── */
  var valg = les();
  if (valg === 'ja') lastGA();
  else if (valg === 'nei') window['ga-disable-' + GA] = true;
  else vis();

  /* «Informasjonskapsler» i bunnen åpner boksen igjen */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-samtykke]');
    if (!a) return;
    e.preventDefault();
    vis();
    boks.scrollIntoView && boks.querySelector('.smt-nei').focus({ preventScroll: true });
  });

  window.idxSamtykke = { aapne: vis, valg: les };
})();
