'use strict';

/* ───────────────────────────────────────────────────────────
   chatbots.js — samtalen som spiller seg selv i heroen.
   Vinduet er dekorasjon (aria-hidden); innholdet finnes som
   vanlig tekst lenger ned. Ved «reduced motion» legges hele
   samtalen ut med én gang.
   ─────────────────────────────────────────────────────────── */
(function () {
  var log = document.getElementById('js-cb-log');
  if (!log) return;

  var SCRIPT = [
    { from: 'bot',  text: 'Hei! 👋 Hva lurer du på?' },
    { from: 'user', text: 'Har dere ledig time denne uka?' },
    { from: 'bot',  text: 'Ja — torsdag og fredag er ledig. Skal jeg sette deg opp?' },
    { from: 'user', text: 'Torsdag passer bra' },
    { from: 'bot',  text: 'Supert. Legg igjen navn og nummer, så bekrefter Andreas.' }
  ];

  function bubble(m) {
    var el = document.createElement('p');
    el.className = 'cb-msg cb-msg-' + m.from;
    el.textContent = m.text;
    return el;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    SCRIPT.forEach(function (m) { log.appendChild(bubble(m)); });
    return;
  }

  var typing = null, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTyping() { if (typing) { typing.remove(); typing = null; } }

  function step(i) {
    if (i >= SCRIPT.length) {
      later(function () { log.innerHTML = ''; step(0); }, 4200);
      return;
    }
    var m = SCRIPT[i];
    if (m.from === 'bot') {
      typing = document.createElement('div');
      typing.className = 'cb-typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(typing);
      later(function () {
        clearTyping();
        log.appendChild(bubble(m));
        later(function () { step(i + 1); }, 1150);
      }, 1000);
    } else {
      log.appendChild(bubble(m));
      later(function () { step(i + 1); }, 900);
    }
  }

  /* Starter først når heroen er synlig */
  var io = new IntersectionObserver(function (e) {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    later(function () { step(0); }, 500);
  }, { threshold: 0.25 });
  io.observe(log);

  /* Ligger fanen i bakgrunnen er det ingen vits i å spille */
  var paused = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      timers.forEach(clearTimeout); timers = [];
      clearTyping(); log.innerHTML = ''; paused = true;
    } else if (paused) {
      paused = false;
      later(function () { step(0); }, 400);
    }
  });
})();
