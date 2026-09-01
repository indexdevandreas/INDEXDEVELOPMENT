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
      /* Første spørsmål er gjenkjenning, ikke produktvalg. En håndverker
         vet ikke om han trenger en API-integrasjon; han vet at telefonen
         ikke ringer. Svaret her styrer hvilke tjenester som i det hele
         tatt vises på neste trinn. */
      id: 'gjenkjenning',
      type: 'single',
      intro: true,
      introLines: [
        'Fire spørsmål.',
        'Rundt to minutter.',
        'Du får forslag og pris skriftlig, som regel samme dag.'
      ],
      q: 'Hva kjenner du deg igjen i?',
      hjelp: 'Jeg er Andreas, og jeg leser svarene selv. Ingenting forsvinner inn i et system. Velg det som ligner mest. Det trenger ikke treffe helt.',
      valg: [
        { v: 'Folk finner meg ikke',    d: 'Du dukker ikke opp når noen søker etter det du gjør' },
        { v: 'Jeg mister henvendelser', d: 'De tar kontakt, men noe glipper før de blir kunder' },
        { v: 'For mye manuelt arbeid',  d: 'Du taster det samme flere ganger, uke etter uke' }
      ]
    },
    {
      id: 'behov',
      type: 'multi',
      q: 'Hva tror du selv du trenger?',
      hjelp: 'Kryss av alt som passer, og det er helt lov å ikke vite. Drift trenger du ikke velge, for alt vi bygger driftes av oss.',
      /* Listen følger svaret over, så man slipper å ta stilling til
         tjenester som ikke løser problemet man akkurat beskrev. */
      valg: function () {
        var pakker = {
          'Folk finner meg ikke': [
            { v: 'Nettside',              d: 'Ny side, eller erstatte den du har i dag' },
            { v: 'Google Bedriftsprofil', d: 'Vises i lokalt søk og på Google Maps' }
          ],
          'Jeg mister henvendelser': [
            { v: 'Ubesvarte anrop',        d: 'Rekker du ikke telefonen, tas anropet imot for deg' },
            { v: 'AI-chatbot', d: 'Ekte AI som svarer kundene dine, døgnet rundt' },
            { v: 'Booking-system',         d: 'Kunder bestiller time selv' },
            { v: 'Kontaktskjema',          d: 'Kort skjema som lander rett i innboksen din' }
          ],
          'For mye manuelt arbeid': [
            { v: 'Systemutvikling', d: 'Database, innlogging eller et adminpanel' },
            { v: 'API-integrasjon', d: 'Koble sammen systemene du allerede bruker' }
          ]
        };
        var liste = (pakker[svar.gjenkjenning] || []).slice();
        liste.push({ v: 'Jeg vet ikke helt', d: 'Helt greit — da finner vi ut av det sammen' });
        return liste;
      }
    },
    {
      id: 'nettside_idag',
      type: 'single',
      q: 'Har du en nettside i dag?',
      /* Spørsmålet stilles bare når svaret faktisk trengs: en chatbot,
         booking eller et skjema må stå på en nettside — en telefonsvarer
         må ikke. Valgte man kun ubesvarte anrop, hoppes dette over. */
      vis: function () {
        return harNoen('behov', ['Nettside', 'Jeg vet ikke helt',
                                 'AI-chatbot', 'Booking-system', 'Kontaktskjema']);
      },
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
      vis: function () { return har('behov', 'AI-chatbot'); },
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
      /* Avslutningen åpner døra i stedet for å smøre tjenester opp i
         trynet underveis: de to områdene man IKKE valgte, pluss et
         ærlig nei. Svaret følger med i e-posten som alt annet. */
      id: 'mer',
      type: 'single',
      q: 'Noe mer vi bør se på samtidig?',
      valg: function () {
        var andre = {
          'Folk finner meg ikke': [
            { v: 'Ta imot henvendelser bedre', d: 'Chatbot, booking eller telefonsvarer' },
            { v: 'Mindre manuelt arbeid',      d: 'Systemer og integrasjoner' }
          ],
          'Jeg mister henvendelser': [
            { v: 'Bli mer synlig i søk',   d: 'Nettside eller Google Bedriftsprofil' },
            { v: 'Mindre manuelt arbeid',  d: 'Systemer og integrasjoner' }
          ],
          'For mye manuelt arbeid': [
            { v: 'Bli mer synlig i søk',        d: 'Nettside eller Google Bedriftsprofil' },
            { v: 'Ta imot henvendelser bedre',  d: 'Chatbot, booking eller telefonsvarer' }
          ]
        };
        var liste = (andre[svar.gjenkjenning] || []).slice();
        liste.push({ v: 'Nei, det var det viktigste', d: 'Vi holder oss til det du har beskrevet' });
        return liste;
      }
    },
    {
      id: 'budsjett',
      type: 'single',
      q: 'Har du en sum i bakhodet?',
      /* Beskrivelsene følger sporet man er på. Sto tidligere med
         nettsider i alle fem, så den som spurte om en AI-agent fikk
         «Nettside eller en enkel integrasjon» tilbake.
         Ingen priser her: veiviseren skal spørre hva kunden har å
         rutte med, ikke antyde hva det kommer til å koste. Tallene
         står på prissiden, og fastprisen kommer skriftlig etterpå. */
      hjelp: 'Ikke en felle, og ikke en høy terskel. Dette hjelper meg bare å treffe riktig med forslaget, og du får fastpris skriftlig uansett hva du svarer.',
      valg: function () {
        var nivaa = {
          'Jeg mister henvendelser': [
            'En enkel løsning som tar imot henvendelsene',
            'Booking eller chatbot satt opp på din bedrift',
            'Flere ting som spiller sammen, for eksempel booking og AI'
          ],
          'For mye manuelt arbeid': [
            'Én enkel kobling mellom to systemer',
            'Flere integrasjoner, eller et lite system',
            'Skreddersydd system med database og innlogging'
          ]
        }[svar.gjenkjenning] || [
          'En enkel nettside som gjør én jobb',
          'Større nettsted med flere sider',
          'Nettsted, profil og innhold som henger sammen'
        ];
        return [
          { v: 'Under 5 000',    d: nivaa[0] },
          { v: '5 000 – 15 000', d: nivaa[1] },
          { v: '15 000 – 40 000', d: nivaa[2] },
          { v: 'Over 40 000',    d: 'Større utvikling, gjerne i flere etapper' },
          { v: 'Vet ikke — si hva det koster', d: 'Du får fastpris skriftlig før noe avgjøres' }
        ];
      }
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

    var html = '<div class="wz-step">';

    if (t.intro && t.introLines) {
      html += '<div class="wz-intro">'
        + t.introLines.map(function (line) { return '<p class="wz-intro-line">' + line + '</p>'; }).join('')
        + '</div>';
    }

    html += '<h2 class="wz-q">' + t.q + '</h2>'
      + (t.hjelp ? '<p class="wz-help">' + t.hjelp + '</p>' : '')
      + '<div class="wz-options' + (t.type === 'multi' ? ' is-multi' : '') + '" role="group" aria-label="' + t.q + '">';

    /* «valg» kan være en funksjon når alternativene avhenger av et
       tidligere svar — se «behov». */
    var alternativer = typeof t.valg === 'function' ? t.valg() : t.valg;

    alternativer.forEach(function (o, i) {
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

    /* Går man tilbake og velger en annen kategori, hører ikke tjenestene
       man alt har krysset av hjemme lenger. Uten dette ble de liggende i
       svar-objektet og fulgte med i e-posten. */
    if (t.id === 'gjenkjenning' && svar[t.id] && svar[t.id] !== v) delete svar.behov;
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
        /* Aldri en blindvei: glipper innsendingen får man hele
           beskrivelsen ferdig utfylt i sin egen e-postapp med ett
           trykk. En død feilmelding er stedet folk gir opp. */
        var mailto = 'mailto:' + atob('aW5kZXhkZXZhbmRyZWFzQGdtYWlsLmNvbQ==')
          + '?subject=' + encodeURIComponent('Veiviser — ' + bedrift + ' (' + navn + ')')
          + '&body=' + encodeURIComponent(tekst);
        err.innerHTML = 'Innsendingen glapp, sikkert nettet. Prøv igjen om et øyeblikk, '
          + '<a href="' + mailto + '">eller trykk her for å sende svarene ferdig utfylt på e-post</a>. '
          + 'Ringe går også fint: <a href="tel:+4748459686">+47 484 59 686</a>.';
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
      + '<h2 class="wz-done-h">Takk.</h2>'
      + '<p class="wz-done-p">Jeg går gjennom svarene dine og sender forslag og pris på e-post, som regel samme dag.</p>'
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
    if (forste) { forste = false; return; }

    /* Hvert trinnbytte starter ved fremdriftslinja igjen. Uten dette
       ble man stående der forrige trinn sluttet — på mobil gjerne nede
       mot footeren, så det opplevdes som at siden «blar seg ned». */
    var topp = document.querySelector('.wz-top');
    if (topp) {
      /* rAF: vent til nettleseren har klippet scrollposisjonen etter at
         dokumentet krympet (langt trinn → kort trinn). Klippingen
         kansellerer en myk rulling som alt er i gang — derfor tas store
         hopp direkte, og bare små justeringer rulles mykt. */
      requestAnimationFrame(function () {
        var y = Math.max(0, topp.getBoundingClientRect().top + window.scrollY - 96);
        var stort = Math.abs(window.scrollY - y) > window.innerHeight * 0.9;
        var mykt = !stort && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if ('scrollBehavior' in document.documentElement.style) {
          window.scrollTo({ top: y, behavior: mykt ? 'smooth' : 'instant' });
        } else {
          window.scrollTo(0, y);
        }
      });
    }

    /* Første fokuserbare element får fokus, så tastaturbrukere
       ikke sendes tilbake til toppen for hvert trinn. */
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
