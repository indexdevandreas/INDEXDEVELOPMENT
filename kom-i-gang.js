'use strict';

/* ───────────────────────────────────────────────────────────
   kom-i-gang.js — trinnvis veiviser.

   Ett spørsmål av gangen. Enkeltvalg går videre av seg selv etter
   en kort pause, så kunden slipper å lete etter en «neste»-knapp;
   flervalg trenger den. Spørsmål hoppes over når svarene foran
   gjør dem irrelevante — se «vis» på hvert trinn.
   ─────────────────────────────────────────────────────────── */

(function () {

  var stage = document.getElementById('wz-stage');
  if (!stage) return;

  var fill    = document.getElementById('wz-fill');
  var counter = document.getElementById('wz-count');
  var backBtn = document.getElementById('wz-back');

  /* Svarene samles her. Nøklene går rett inn i e-posten. */
  var svar = {};

  function har(felt, verdi) {
    var v = svar[felt];
    return Array.isArray(v) ? v.indexOf(verdi) !== -1 : v === verdi;
  }
  function harNoen(felt, liste) {
    for (var i = 0; i < liste.length; i++) if (har(felt, liste[i])) return true;
    return false;
  }

  /* ─── Spørsmålene ─── */
  var TRINN = [
    {
      id: 'behov',
      type: 'multi',
      q: 'Hei! Hva trenger du hjelp med?',
      hjelp: 'Jeg er Andreas, og jeg leser svarene selv — ingenting forsvinner inn i et system. Kryss av alt som passer, og det er helt lov å ikke vite.',
      valg: [
        { v: 'Nettside',            d: 'Ny side, eller erstatte den du har i dag' },
        { v: 'AI-agent eller chatbot', d: 'Svarer kunder på nettsiden, eller jobber i bakgrunnen' },
        { v: 'Systemutvikling',     d: 'Database, innlogging eller et adminpanel' },
        { v: 'API-integrasjon',     d: 'Koble sammen systemene du allerede bruker' },
        { v: 'Booking-system',      d: 'Kunder bestiller time selv' },
        { v: 'Google Bedriftsprofil', d: 'Vises i lokalt søk og på Google Maps' },
        { v: 'Drift, vedlikehold og support', d: 'Hosting, sikkerhet og oppdateringer — løpende' },
        { v: 'Jeg vet ikke helt',   d: 'Helt greit — da finner vi ut av det sammen' }
      ]
    },
    {
      id: 'nettside_idag',
      type: 'single',
      q: 'Har du en nettside i dag?',
      vis: function () { return harNoen('behov', ['Nettside', 'Drift, vedlikehold og support', 'Jeg vet ikke helt']); },
      valg: [
        { v: 'Nei, ingen ennå',              d: 'Vi starter med blanke ark' },
        { v: 'Ja, men den skaffer ingen kunder', d: 'Den finnes, men telefonen ringer ikke' },
        { v: 'Ja, men den er utdatert',      d: 'Gammel, treg eller vanskelig på mobil' },
        { v: 'Ja, og den fungerer fint',     d: 'Jeg trenger noe annet enn en ny side' }
      ]
    },
    {
      id: 'nettside_omfang',
      type: 'single',
      q: 'Hvor stor ser du for deg at siden blir?',
      hjelp: 'Bare et grovt anslag. Vi justerer når vi har snakket sammen.',
      vis: function () { return har('behov', 'Nettside'); },
      valg: [
        { v: 'Én landingsside',   d: 'Én god side som gjør én jobb' },
        { v: 'Noen få undersider', d: 'Forside, tjenester, om oss, kontakt' },
        { v: 'Et helt nettsted',  d: 'Mange sider, kanskje blogg og mer' },
        { v: 'Aner ikke',         d: 'Foreslå det du mener er riktig' }
      ]
    },
    {
      id: 'ai_oppgave',
      type: 'multi',
      q: 'Hva skal AI-en gjøre for deg?',
      vis: function () { return har('behov', 'AI-agent eller chatbot'); },
      valg: [
        { v: 'Svare kunder på nettsiden',    d: 'Åpningstider, priser, hva du tilbyr — en chatbot' },
        { v: 'Fange opp henvendelser',       d: 'Samle navn og nummer mens du sover' },
        { v: 'Utføre oppgaver automatisk',   d: 'Lese data, ta valg, gjøre jobben selv' },
        { v: 'Vet ikke ennå',                d: 'Vis meg hva som er mulig' }
      ]
    },
    {
      id: 'systemer',
      type: 'multi',
      q: 'Hva bruker du i dag som burde snakke sammen?',
      hjelp: 'Det er dette vi kobler sammen, så data slutter å bli tastet inn to ganger.',
      vis: function () { return harNoen('behov', ['Systemutvikling', 'API-integrasjon', 'Booking-system']); },
      valg: [
        { v: 'Regneark og e-post',   d: 'Det meste ligger i Excel og innboksen' },
        { v: 'Et CRM',               d: 'Kunderegister eller salgssystem' },
        { v: 'Et fagsystem',         d: 'Bransjesystem, regnskap eller noe annet med API' },
        { v: 'Kalender eller booking', d: 'Timeavtaler og reservasjoner' },
        { v: 'Betaling',             d: 'Stripe, Vipps eller kortterminal' },
        { v: 'Vet ikke / noe annet', d: 'Vi går gjennom det i samtalen' }
      ]
    },
    {
      id: 'mal',
      type: 'single',
      q: 'Hva er viktigst for deg akkurat nå?',
      valg: [
        { v: 'Få inn flere kunder',        d: 'Telefonen skal ringe oftere' },
        { v: 'Spare tid på manuelt arbeid', d: 'Slippe å gjøre det samme om igjen' },
        { v: 'Se profesjonell ut',         d: 'Bli tatt seriøst av dem som sjekker deg opp' },
        { v: 'Vet ikke helt ennå',         d: 'Jeg vil høre hva du foreslår' }
      ]
    },
    {
      id: 'nar',
      type: 'single',
      q: 'Når trenger du det?',
      valg: [
        { v: 'Så fort som mulig',      d: 'Helst i gang denne uken' },
        { v: 'I løpet av en måned',    d: 'Ikke akutt, men det haster litt' },
        { v: 'I løpet av noen måneder', d: 'Vi planlegger fremover' },
        { v: 'Jeg orienterer meg bare', d: 'Vil vite hva det innebærer først' }
      ]
    },
    {
      id: 'budsjett',
      type: 'single',
      q: 'Har du en sum i bakhodet?',
      hjelp: 'Ikke en felle, og ikke en høy terskel — nettsidene våre starter på 2 900,-. Dette hjelper meg bare å treffe riktig med forslaget.',
      valg: [
        { v: 'Under 5 000',        d: 'Nettside, chatbot eller en enkel integrasjon' },
        { v: '5 000 – 15 000',     d: 'Større nettsted, AI-chatbot eller booking' },
        { v: '15 000 – 40 000',    d: 'System, integrasjoner eller AI som henger sammen' },
        { v: 'Over 40 000',        d: 'Større utvikling, gjerne i flere etapper' },
        { v: 'Vet ikke — si hva det koster', d: 'Du får fastpris skriftlig før noe avgjøres' }
      ]
    }
  ];

  /* ─── Hvilke trinn er aktuelle akkurat nå ─── */
  function aktive() {
    return TRINN.filter(function (t) { return !t.vis || t.vis(); });
  }

  var pos = 0;          // indeks i aktive()
  var forste = true;    // ikke ta fokus ved sidelasting
  var visKontakt = false;
  var sendt = false;
  var siste = null;   // kontaktinfo fra forrige innsending, så ettersending går fort

  /* ─── Tegning ─── */

  function tegn(retning) {
    var liste = aktive();

    if (visKontakt) return tegnKontakt(liste, retning);

    if (pos >= liste.length) { visKontakt = true; return tegnKontakt(liste, retning); }

    var t = liste[pos];
    var totalt = liste.length + 1;             // + kontaktsteget
    oppdaterTopp(pos, totalt, pos > 0);

    var valgt = svar[t.id] || (t.type === 'multi' ? [] : null);

    var html = '<div class="wz-step">'
      + '<h2 class="wz-q">' + t.q + '</h2>'
      + (t.hjelp ? '<p class="wz-help">' + t.hjelp + '</p>' : '')
      + '<div class="wz-options' + (t.type === 'multi' ? ' is-multi' : '') + '" role="group" aria-label="' + t.q + '">';

    t.valg.forEach(function (o, i) {
      var av = t.type === 'multi' ? valgt.indexOf(o.v) !== -1 : valgt === o.v;
      html += '<button type="button" class="wz-opt' + (av ? ' is-on' : '') + '"'
           +  ' data-v="' + esc(o.v) + '" aria-pressed="' + av + '" style="--i:' + i + '">'
           +  '<span class="wz-mark" aria-hidden="true"></span>'
           +  '<span class="wz-opt-txt">'
           +    '<span class="wz-opt-t">' + o.v + '</span>'
           +    '<span class="wz-opt-d">' + o.d + '</span>'
           +  '</span>'
           +  '</button>';
    });

    html += '</div>';

    if (t.type === 'multi') {
      html += '<button type="button" class="btn-circle wz-next" id="wz-next"' + (valgt.length ? '' : ' disabled') + '>'
           +  '<span>NESTE</span>'
           +  '<span class="bc-circle"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span>'
           +  '</button>';
    }
    html += '</div>';

    bytt(html, retning);

    var opts = stage.querySelectorAll('.wz-opt');
    Array.prototype.forEach.call(opts, function (b) {
      b.addEventListener('click', function () { velg(t, b, opts); });
    });

    var next = document.getElementById('wz-next');
    if (next) next.addEventListener('click', function () { fram(); });
  }

  function velg(t, btn, alle) {
    var v = btn.getAttribute('data-v');

    if (t.type === 'multi') {
      var arr = svar[t.id] || [];
      var i = arr.indexOf(v);
      if (i === -1) arr.push(v); else arr.splice(i, 1);
      svar[t.id] = arr;
      btn.classList.toggle('is-on');
      btn.setAttribute('aria-pressed', btn.classList.contains('is-on'));
      var next = document.getElementById('wz-next');
      if (next) next.disabled = arr.length === 0;
      return;
    }

    /* Enkeltvalg: marker, og gå videre av seg selv. Pausen er der
       for at valget skal rekke å registrere seg visuelt — uten den
       føles det som om klikket ble ignorert. */
    Array.prototype.forEach.call(alle, function (b) {
      b.classList.remove('is-on');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-on');
    btn.setAttribute('aria-pressed', 'true');
    svar[t.id] = v;

    stage.classList.add('is-locked');
    setTimeout(function () {
      stage.classList.remove('is-locked');
      fram();
    }, 340);
  }

  function fram() { pos++; tegn('fram'); }

  function tilbake() {
    if (visKontakt) { visKontakt = false; pos = aktive().length - 1; }
    else if (pos > 0) pos--;
    tegn('tilbake');
  }

  /* ─── Siste steg: kontaktinfo + oppsummering ─── */

  function tegnKontakt(liste, retning) {
    oppdaterTopp(liste.length, liste.length + 1, true);

    var rader = liste.map(function (t) {
      var v = svar[t.id];
      if (!v || (Array.isArray(v) && !v.length)) return '';
      return '<div class="wz-sum-row"><span>' + t.q + '</span><strong>'
           + (Array.isArray(v) ? v.join(', ') : v) + '</strong></div>';
    }).join('');

    var html = '<div class="wz-step">'
      + '<h2 class="wz-q">Hvor skal jeg svare?</h2>'
      + '<p class="wz-help">Svarene over blir sendt som en samlet beskrivelse. Du får forslag og pris tilbake skriftlig — som regel samme dag.</p>'
      + '<form class="wz-form" id="wz-form" novalidate>'
      +   '<div class="wz-fields">'
      +     felt('navn', 'Navn', 'text', 'Ola Nordmann', true, 'name')
      +     felt('bedrift', 'Bedrift', 'text', 'Bedriften din AS', true, 'organization')
      +     felt('epost', 'E-post', 'email', 'post@bedrift.no', true, 'email')
      +     felt('telefon', 'Telefon', 'tel', '+47 000 00 000', false, 'tel')
      +   '</div>'
      +   '<div class="wz-field wz-field-wide">'
      +     '<label for="wz-melding">Noe mer jeg bør vite? <span class="wz-opt-lbl">(valgfritt)</span></label>'
      +     '<textarea id="wz-melding" rows="3" placeholder="Skriv gjerne et par ord om bedriften din…"></textarea>'
      +   '</div>'
      +   '<button type="submit" class="btn-circle wz-send" id="wz-send">'
      +     '<span>SEND TIL ANDREAS</span>'
      +     '<span class="bc-circle"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span>'
      +   '</button>'
      +   '<p class="wz-err" id="wz-err" hidden></p>'
      + '</form>'
      + (rader ? '<div class="wz-sum"><p class="wz-sum-label">Dette sender du</p>' + rader + '</div>' : '')
      + '</div>';

    bytt(html, retning);
    document.getElementById('wz-form').addEventListener('submit', send);

    /* Kommer man tilbake etter å ha sendt, står kontaktinfoen klar —
       bare meldingsfeltet er tomt, så det er raskt å ettersende noe. */
    if (siste) {
      document.getElementById('wz-navn').value = siste.navn;
      document.getElementById('wz-bedrift').value = siste.bedrift;
      document.getElementById('wz-epost').value = siste.epost;
      document.getElementById('wz-telefon').value = siste.telefon;
    }
  }

  function felt(id, label, type, ph, pakrevd, ac) {
    return '<div class="wz-field">'
      + '<label for="wz-' + id + '">' + label
      + (pakrevd ? '' : ' <span class="wz-opt-lbl">(valgfritt)</span>') + '</label>'
      + '<input type="' + type + '" id="wz-' + id + '" placeholder="' + ph + '"'
      + (pakrevd ? ' required' : '') + ' autocomplete="' + ac + '">'
      + '</div>';
  }

  /* ─── Sending ─── */

  function send(e) {
    e.preventDefault();
    if (sendt) return;

    var navn    = val('wz-navn');
    var bedrift = val('wz-bedrift');
    var epost   = val('wz-epost');
    var telefon = val('wz-telefon');
    var melding = val('wz-melding');
    var err     = document.getElementById('wz-err');

    if (!navn || !bedrift || !epost || epost.indexOf('@') === -1) {
      err.textContent = 'Fyll inn navn, bedrift og en gyldig e-postadresse.';
      err.hidden = false;
      return;
    }
    err.hidden = true;

    var btn = document.getElementById('wz-send');
    var lbl = btn.querySelector('span');
    lbl.textContent = 'SENDER …';
    btn.disabled = true;

    /* Svarene settes sammen til en lesbar e-post, ikke et rot av felt. */
    var linjer = aktive().map(function (t) {
      var v = svar[t.id];
      if (!v || (Array.isArray(v) && !v.length)) return null;
      return t.q + '\n   → ' + (Array.isArray(v) ? v.join(', ') : v);
    }).filter(Boolean);

    var tekst = 'NY HENVENDELSE FRA VEIVISEREN\n'
      + '================================\n\n'
      + 'Navn:     ' + navn + '\n'
      + 'Bedrift:  ' + bedrift + '\n'
      + 'E-post:   ' + epost + '\n'
      + 'Telefon:  ' + (telefon || '(ikke oppgitt)') + '\n\n'
      + 'SVAR\n----\n' + linjer.join('\n\n') + '\n\n'
      + 'MELDING\n-------\n' + (melding || '(ingen)') + '\n';

    /* FormSubmit: gratis og uten konto — adressen er base64 for å slippe
       scraper-spam, og AJAX-endepunktet svarer med success som STRENG. */
    var fd = new FormData();
    fd.append('_subject', 'Veiviser — ' + bedrift + ' (' + navn + ')');
    fd.append('_template', 'box');
    fd.append('_captcha', 'false');
    fd.append('name', navn + ' — ' + bedrift);
    fd.append('email', epost);
    fd.append('message', tekst);

    fetch('https://formsubmit.co/ajax/' + atob('aW5kZXhkZXZhbmRyZWFzQGdtYWlsLmNvbQ=='), {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: fd
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (String(d.success) !== 'true') throw new Error('formsubmit');
        sendt = true;
        siste = { navn: navn, bedrift: bedrift, epost: epost, telefon: telefon };
        kvittering(navn);
      })
      .catch(function () {
        lbl.textContent = 'PRØV IGJEN';
        btn.disabled = false;
        err.textContent = 'Noe gikk galt underveis. Prøv igjen, eller ring +47 484 59 686 — det går like fint.';
        err.hidden = false;
      });
  }

  function kvittering(navn) {
    oppdaterTopp(1, 1, false);
    if (backBtn) backBtn.hidden = true;
    if (counter) counter.textContent = 'Ferdig';

    bytt(
      '<div class="wz-step wz-done">'
      + '<span class="wz-done-mark" aria-hidden="true">'
      +   '<svg viewBox="0 0 32 32"><path d="M8 16.5l5.5 5.5L24 11"/></svg>'
      + '</span>'
      + '<h2 class="wz-done-h">Andreas har fått beskjed.</h2>'
      + '<p class="wz-done-p">Takk, ' + esc(navn.split(' ')[0]) + '. Svarene dine ligger i innboksen hans nå. '
      +   'Han leser gjennom og sender deg forslag og pris skriftlig — som regel samme dag.</p>'
      + '<div class="wz-done-cards">'
      +   '<a class="wz-done-card" href="tel:+4748459686">'
      +     '<span class="wz-done-label">Haster det?</span>'
      +     '<span class="wz-done-val">+47 484 59 686</span>'
      +   '</a>'
      +   '<a class="wz-done-card" href="index.html">'
      +     '<span class="wz-done-label">I mellomtiden</span>'
      +     '<span class="wz-done-val">Se hva vi bygger →</span>'
      +   '</a>'
      + '</div>'
      + '<button type="button" class="wz-again" id="wz-again">Kom du på noe mer? Send en melding til</button>'
      + '</div>', 'fram');

    if (fill) fill.style.width = '100%';

    /* Veien tilbake: åpner kontaktsteget igjen, så det er lett å
       ettersende noe man glemte. */
    var again = document.getElementById('wz-again');
    if (again) again.addEventListener('click', function () {
      sendt = false;
      tegn('tilbake');
    });
  }

  /* ─── Småting ─── */

  function bytt(html, retning) {
    stage.innerHTML = html;
    var el = stage.firstElementChild;
    if (!el) return;
    el.classList.add(retning === 'tilbake' ? 'inn-bak' : 'inn-fram');
    /* Første fokuserbare element får fokus, så tastaturbrukere
       ikke sendes tilbake til toppen for hvert trinn. */
    if (forste) { forste = false; return; }
    var f = el.querySelector('.wz-opt, input, textarea');
    if (f && window.matchMedia('(min-width: 900px)').matches) {
      try { f.focus({ preventScroll: true }); } catch (e) { }
    }
  }

  function oppdaterTopp(i, totalt, kanTilbake) {
    /* Aldri helt tom: en synlig stripe fra start gjør at linja leses
     som fremdrift og ikke som noe ødelagt. */
  if (fill) fill.style.width = Math.max(5, Math.round((i / totalt) * 100)) + '%';
    /* «Steg», ikke «Spørsmål»: det første leser som en reise du er på
       sammen med noen, det andre som et skjema du blir avhørt med. */
    if (counter) counter.textContent = 'Steg ' + (i + 1) + ' av ' + totalt;
    if (backBtn) backBtn.hidden = !kanTilbake;
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  if (backBtn) backBtn.addEventListener('click', tilbake);

  tegn('fram');
})();
