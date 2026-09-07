'use strict';

/* ───────────────────────────────────────────────────────────
   fps.js — måleverktøy for rulling. Lastes av forside.js BARE når
   adressen har «?fps», og er ellers ikke med i siden.

   Viser bilder per sekund mens du ruller, teller lange bilder (over
   34 ms = merkbart hakk) per seksjon, og har brytere som skrur av én
   ting om gangen — slik at den som holder telefonen kan kjenne hva
   som gjør det treigt, i stedet for at noen gjetter fra en PC.
   «Kopier» legger tallene på utklippstavla som tekst.
   ─────────────────────────────────────────────────────────── */

(function () {
  var LANG = 34;           // ms — over dette er bildet merkbart sent
  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'fps.css';
  document.head.appendChild(css);

  /* ── Seksjonene som telles ── */
  var deler = [];
  function finnDeler() {
    deler = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (!/^(SECTION|FOOTER|DIV)$/.test(el.tagName)) return;
      var h = el.offsetHeight;
      if (h < 120 || el.id === 'fps') return;
      var navn = el.id || (el.className || el.tagName).toString().split(' ')[0];
      deler.push({ el: el, navn: navn.slice(0, 14), top: el.getBoundingClientRect().top + window.scrollY, h: h, bilder: 0, lange: 0, verste: 0, sum: 0 });
    });
  }
  function delVed(y) {
    var midt = y + window.innerHeight / 2;
    for (var i = deler.length - 1; i >= 0; i--) if (midt >= deler[i].top) return deler[i];
    return deler[0];
  }

  /* ── Boksen ── */
  var boks = document.createElement('div');
  boks.id = 'fps';
  boks.innerHTML =
    '<div class="fps-topp"><b class="fps-tall">–</b><span class="fps-lab">fps</span>' +
    '<span class="fps-verst">verste <b>–</b> ms</span><button type="button" class="fps-kopi">Kopier</button></div>' +
    '<div class="fps-info"></div>' +
    '<table class="fps-tab"><thead><tr><th>seksjon</th><th>bilder</th><th>lange</th><th>verste</th></tr></thead><tbody></tbody></table>' +
    '<div class="fps-br"></div>';
  document.body.appendChild(boks);
  var tall = boks.querySelector('.fps-tall');
  var verst = boks.querySelector('.fps-verst b');
  var info = boks.querySelector('.fps-info');
  var tbody = boks.querySelector('tbody');

  /* ── Brytere: hver legger inn en CSS-bit som nøytraliserer én ting ── */
  var BRYTERE = [
    ['Glass (WebGL)', 'canvas[data-striper]{display:none!important}'],
    ['Hero-3D', '.hero.is-pinnable{position:relative!important;transform:none!important}.hero-inner,.hero-field,.hero-photo{transform:none!important;opacity:1!important}.hero::after{display:none!important}'],
    ['Kort-stabel', '.sv-slot{position:static!important;transform:none!important;will-change:auto!important}.sv-slot::after{display:none!important}'],
    ['Sitat-uskarphet', '.qt-w{filter:none!important;opacity:1!important;transform:none!important}'],
    ['Nav-blur', '.hero-nav::before,.hero-nav::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'],
    ['Chat-knapp', '#cw-bubble{display:none!important}'],
    ['Skygger', '.services2,.sv-card,.cv3d,.smt{box-shadow:none!important}'],
    ['Portrett', '.hero-photo{display:none!important}']
  ];
  var brHolder = boks.querySelector('.fps-br');
  var av = {};
  BRYTERE.forEach(function (b, i) {
    var lab = document.createElement('label');
    lab.innerHTML = '<input type="checkbox"> ' + b[0] + ' av';
    var inp = lab.querySelector('input');
    inp.addEventListener('change', function () {
      var id = 'fps-av-' + i;
      var st = document.getElementById(id);
      if (inp.checked) {
        if (!st) { st = document.createElement('style'); st.id = id; st.textContent = b[1]; document.head.appendChild(st); }
        av[b[0]] = true;
      } else {
        if (st) st.remove();
        delete av[b[0]];
      }
      nullstill();
    });
    brHolder.appendChild(lab);
  });

  /* ── Målingen ── */
  var sist = 0, ruller = false, rullT = 0, nylige = [], verste = 0;
  function nullstill() {
    deler.forEach(function (d) { d.bilder = 0; d.lange = 0; d.verste = 0; d.sum = 0; });
    verste = 0; nylige = [];
    tegn();
  }
  window.addEventListener('scroll', function () {
    ruller = true;
    clearTimeout(rullT);
    rullT = setTimeout(function () { ruller = false; }, 250);
  }, { passive: true });

  function loop(now) {
    if (sist && ruller) {
      var dt = now - sist;
      nylige.push(dt); if (nylige.length > 40) nylige.shift();
      var d = delVed(window.scrollY);
      if (d) {
        d.bilder++; d.sum += dt;
        if (dt > LANG) d.lange++;
        if (dt > d.verste) d.verste = dt;
      }
      if (dt > verste) verste = dt;
    }
    sist = now;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function tegn() {
    if (nylige.length) {
      var snitt = nylige.reduce(function (a, b) { return a + b; }, 0) / nylige.length;
      tall.textContent = Math.round(1000 / snitt);
      boks.classList.toggle('is-daarlig', snitt > 28);
    }
    verst.textContent = Math.round(verste);
    tbody.innerHTML = deler.map(function (d) {
      if (!d.bilder) return '';
      var s = d.sum / d.bilder;
      return '<tr class="' + (d.lange / d.bilder > 0.15 ? 'hakker' : '') + '"><td>' + d.navn + '</td><td>' + d.bilder + '</td><td>' + d.lange + '</td><td>' + Math.round(d.verste) + '</td></tr>';
    }).join('');
  }
  setInterval(tegn, 400);

  /* ── Fakta om enheten og tilstanden ── */
  function fakta() {
    var hero = document.querySelector('.hero');
    var c = document.querySelector('.hero-field');
    return {
      skjerm: window.innerWidth + '×' + window.innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x',
      ua: navigator.userAgent.replace(/.*\((.*?)\).*/, '$1').slice(0, 40),
      heroFestet: hero ? hero.classList.contains('is-pinnable') : null,
      heroHoyde: hero ? hero.offsetHeight : null,
      glass: c ? (c.classList.contains('is-on') ? c.width + '×' + c.height : 'av') : 'mangler',
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touch: window.matchMedia('(pointer: coarse)').matches,
      av: Object.keys(av)
    };
  }
  function visFakta() {
    var f = fakta();
    info.textContent = f.skjerm + ' · ' + f.ua + ' · hero ' + (f.heroFestet ? 'festet' : 'løs') + ' ' + f.heroHoyde + 'px · glass ' + f.glass + (f.reduce ? ' · reduced-motion' : '');
  }

  boks.querySelector('.fps-kopi').addEventListener('click', function () {
    var f = fakta();
    var linjer = ['FPS-måling ' + new Date().toISOString().slice(0, 16), JSON.stringify(f), 'verste bilde: ' + Math.round(verste) + ' ms', ''];
    deler.forEach(function (d) {
      if (d.bilder) linjer.push(d.navn + ': ' + d.bilder + ' bilder, ' + d.lange + ' lange, verste ' + Math.round(d.verste) + ' ms, snitt ' + Math.round(d.sum / d.bilder) + ' ms');
    });
    var tekst = linjer.join('\n');
    var knapp = this;
    function ok() { knapp.textContent = 'Kopiert ✓'; setTimeout(function () { knapp.textContent = 'Kopier'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tekst).then(ok, function () { window.prompt('Kopier teksten:', tekst); });
    else window.prompt('Kopier teksten:', tekst);
  });

  function start() { finnDeler(); visFakta(); }
  start();
  window.addEventListener('load', function () { setTimeout(start, 500); });
  window.addEventListener('resize', start);
})();
