'use strict';

/* ───────────────────────────────────────────────────────────
   liv.js — små tegn på at det står et menneske bak siden.

   Alt her bygger på ekte data: faktisk klokkeslett i Drammen og
   faktisk årstall. Ingenting oppdiktet — ingen «14 personer ser
   på denne siden nå». Slikt gjennomskues, og da mister resten av
   siden troverdighet også.
   ─────────────────────────────────────────────────────────── */

(function () {

  /* ─── Årstallet i footeren ───
     Sto hardkodet som «© 2026» på hver eneste side. En side som
     fortsatt sier 2026 i januar 2027 ser forlatt ut. */
  document.querySelectorAll('[data-ar]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });


  /* ─── Klokke og status ───
     Viser hva klokka faktisk er der Andreas sitter. Statusen sier
     bare noe om når svar er å vente — den påstår ikke at han sitter
     klar ved skjermen. */
  var klokke = document.querySelectorAll('[data-klokke]');
  var status = document.querySelectorAll('[data-status]');
  if (!klokke.length && !status.length) return;

  function noIOslo() {
    /* Leser tiden i norsk sone uansett hvor den besøkende sitter */
    try {
      var d = new Intl.DateTimeFormat('nb-NO', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var t = {};
      d.forEach(function (p) { t[p.type] = p.value; });
      return { tekst: t.hour + ':' + t.minute, time: parseInt(t.hour, 10) };
    } catch (e) {
      var n = new Date();
      var hh = ('0' + n.getHours()).slice(-2), mm = ('0' + n.getMinutes()).slice(-2);
      return { tekst: hh + ':' + mm, time: n.getHours() };
    }
  }

  function tegn() {
    var n = noIOslo();

    klokke.forEach(function (el) { el.textContent = n.tekst; });

    var sen = n.time < 7 || n.time >= 22;
    status.forEach(function (el) {
      el.textContent = sen ? 'Svarer i morgen tidlig' : 'Svarer som regel samme dag';
      el.classList.toggle('is-sen', sen);
    });
  }

  tegn();
  /* Ett minutt er rikelig — klokka viser ikke sekunder */
  setInterval(tegn, 60000);
})();
