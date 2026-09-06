'use strict';

/* ───────────────────────────────────────────────────────────
   forside.js — scroll-animasjoner for forsiden (og undersidene som
   deler gruppelista). Elementene merkes automatisk her, så markupen
   holdes ren.

   Fire deler:
   1. Reveal: grupper som toner inn med forskyvning mellom barna.
   2. Hero: staggered inngang ved lasting.
   3. Hero-lag: rulling → --sp, peker → scene-tipp og magnetisk knapp.
   4. Bunken: --cover på seksjonene i .stack mens neste sklir over.

   Alle rulle-lyttere er passive og samler arbeidet i én rAF per
   ramme. Det som skrives er utelukkende CSS-variabler og transformer —
   ingenting som utløser layout.
   ─────────────────────────────────────────────────────────── */

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = window.matchMedia('(pointer: fine)').matches;

  /* ═══ 1. Reveal ═══ */

  /* Grupper som skal animeres inn, med forskyvning mellom barna */
  var GROUPS = [
    '.platform-top',
    '.pf-cards',
    '.s2-grid',
    '.cv3d',
    '.sv-grid',
    '.mg-band',
    '.nk-panel',
    '.bl-grid',
    '.fq-left',
    '.fq-list',
    '.dm-inner',
    /* webdesign.html */
    '.wy-grid',
    '.in-groups',
    '.in-price',
    '.st-track',
    /* drift.html */
    '.bento',
    '.dp-grid',
    '.dr-safe-grid',
    /* chatbots.html */
    '.lv-grid',
    '.qa-list',
    '.bd-steps',
    '.bd-price',
    /* systemutvikling.html */
    '.bk-grid',
    '.st-strip',
    '.sp-grid',
    /* api-integrasjoner.html */
    '.vs-grid',
    '.wr-list',
    '.pr-cols',
    /* booking-systemer.html */
    '.fl-grid',
    '.sk-list',
    /* priser.html */
    '.sp-grid',
    '.pk-grid',
    '.hw-track',
    /* om-meg.html */
    '.ph-grid',
    '.ci-grid',
    /* kontakt.html */
    '.rc-cards',
    '.kf-list',
    /* bloggartiklene */
    '.bg-next-grid',
  ];

  var STEP = 70;   // ms mellom hvert element i en gruppe
  var items = [];

  GROUPS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (group) {
      var kids;

      if (group.classList.contains('platform-top')) {
        /* Overskriften: eyebrow → tittel → sidetekst */
        kids = [
          group.querySelector('.pf-eyebrow'),
          group.querySelector('.pf-head'),
          group.querySelector('.pf-aside')
        ].filter(Boolean);
      } else if (group.classList.contains('mg-band')) {
        /* Bare portrettet og teksten. Punktrasteret og ringene ligger
           absolutt plassert som dekor — de skal stå i ro, ellers sklir
           hele bakgrunnen 26px når båndet kommer inn i bildet. */
        kids = [
          group.querySelector('.mg-media'),
          group.querySelector('.mg-text')
        ].filter(Boolean);
      } else {
        kids = Array.prototype.slice.call(group.children);
      }

      kids.forEach(function (el, i) {
        el.classList.add('rv');
        el.style.setProperty('--d', (i * STEP) + 'ms');
        items.push(el);
      });
    });
  });

  if (reduce) {
    items.forEach(function (el) { el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ═══ 2. Hero: staggered inngang ved lasting ═══
     h1 hoppes over: den er LCP-elementet og glir inn i ren CSS uten
     fade (se forside.css). Resten toner inn rundt den. */
  var heroKids = document.querySelectorAll('.hero-inner > :not(h1)');
  heroKids.forEach(function (el, i) {
    el.classList.add('rv');
    el.style.setProperty('--d', (80 + i * 75) + 'ms');
  });
  /* Med introen (html.splash-on) venter inngangen til flaten er på vei
     opp — samme 0,7 s som h1 og portrettet får i CSS-en. Overlegget
     fjernes fra DOM-en når det er ferdig, så ingen fixed-flate blir
     liggende over siden. Klassen på <html> beholdes: h1 sin
     animation-delay ligger under den, og å endre delay på en
     animasjon som går, starter den på nytt. */
  var splashOn = document.documentElement.classList.contains('splash-on');
  var splash = document.getElementById('splash');
  if (splash && splashOn) {
    splash.addEventListener('animationend', function (e) { if (e.target === splash) splash.remove(); });
  } else if (splash) {
    splash.remove();
  }
  setTimeout(function () {
    requestAnimationFrame(function () {
      heroKids.forEach(function (el) { el.classList.add('on'); });
    });
  }, splashOn ? 750 : 0);

  /* ═══ 3. Hero-lag: rulling og peker ═══ */
  (function () {
    var hero = document.querySelector('.hero');
    if (!hero || reduce) return;

    var btn = hero.querySelector('[data-magnet]');

    /* ── Rulling → --sp (0 øverst, 1 når heroen er rullet forbi) ──
       CSS-en gjør resten: teksten synker og tones ut, scenen og feltet
       går hver sin vei. Skrives bare når verdien faktisk endrer seg,
       så under heroen koster lytteren ingenting. */
    var high = 1, vh = 1, pinStart = 0, span = 1, sp = -1, ticking = false;
    /* Heroen festes alltid. Før ble den bare festet når hele den fikk
       plass i vinduet — og på en iPhone med adresselinja framme, eller
       en PC med zoom, manglet det noen piksler, så overgangen kom «ikke
       alltid». Er den høyere enn vinduet, festes den nå med bunnen mot
       skjermbunnen (negativ top i CSS via --vh/--hh), og overgangen
       (--sp) løper fra der den blir stående til arket har dekket den.
       Måles på nytt ved hver størrelsesendring: på iOS kommer det en
       når adresselinja klapper sammen, og da skal bunnen følge med. */
    function measure() {
      high = hero.offsetHeight || 1;
      vh = window.innerHeight || 1;
      pinStart = Math.max(0, high + 20 - vh);
      span = Math.max(1, high + 20 - pinStart);
      hero.style.setProperty('--hh', high + 'px');
      hero.style.setProperty('--vh', vh + 'px');
      hero.classList.add('is-pinnable');
    }
    function onResize() {
      measure();
      sp = -1;
      onScroll();
    }
    function frame() {
      ticking = false;
      var p = (window.scrollY - pinStart) / span;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (p === sp) return;
      sp = p;
      hero.style.setProperty('--sp', p.toFixed(4));
      /* Heroen er festet bak hele siden. Når arket har dekket den helt,
         skjules den (visibility) — ellers titter den fram i luften
         rundt footeren og CTA-båndet — og glasset slutter å tegne. */
      hero.classList.toggle('is-past', p >= 1);
      /* Mens heroen glir bort (0 < --sp < 1) fryser glasset — hele
         flaten roterer og krymper uansett, så ingen ser at bølgene
         står stille, og telefonen slipper å tegne shaderen oppå
         rotasjonen. forside-3d.js leser klassen. */
      hero.classList.toggle('is-receding', p > 0.002 && p < 1);
      if (fine) measureBtn();
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }
    measure();
    frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', function () { measure(); sp = -1; onScroll(); });

    if (!fine) return;

    /* ── Peker → knappen trekkes mot pekeren ──
       (Glassets pekerparallakse ligger i forside-3d.js.) Knappens
       senter måles ved inngang og ved rulling, ikke per bevegelse. */
    var bx = 0, by = 0, bw = 0, bh = 0;
    function measureBtn() {
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      bx = r.left + r.width / 2;
      by = r.top + r.height / 2;
      bw = r.width;
      bh = r.height;
    }
    hero.addEventListener('pointerenter', measureBtn);
    hero.addEventListener('pointermove', function (e) {
      if (btn) {
        var dx = e.clientX - bx, dy = e.clientY - by;
        var near = Math.abs(dx) < bw / 2 + 56 && Math.abs(dy) < bh / 2 + 44;
        btn.style.transform = near
          ? 'translate(' + (dx * 0.2).toFixed(1) + 'px,' + (dy * 0.24).toFixed(1) + 'px) scale(var(--press, 1))'
          : '';
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      if (btn) btn.style.transform = '';
    });
  })();

  /* ═══ 3b. Kort som tipper etter pekeren ═══
     [data-tilt="grader"]: kortet vipper i perspektiv mot pekeren og
     får et lysskjær (--gx/--gy, tegnes av ::before i forside.css)
     som følger den. Rektangelet måles ved inngang og glemmes ved
     rulling, så det aldri leses per bevegelse. Inline-transformen
     slår hover- og reveal-transformene mens pekeren er over, og
     fjernes igjen ved utgang — da tar CSS-en over. Bare for
     presise pekere: på touch ville det bare rykket ved trykk. */
  if (fine && !reduce) {
    var tilters = document.querySelectorAll('[data-tilt]');
    var rekt = new WeakMap();
    tilters.forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      el.addEventListener('pointerenter', function (e) {
        var r = el.getBoundingClientRect();
        rekt.set(el, r);
        /* Skjæret starter der pekeren faktisk er — ikke midt på kortet,
           som det ellers ville gjort når kortet ruller inn under en
           peker som står stille. */
        el.style.setProperty('--gx', ((e.clientX - r.left) / (r.width || 1) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((e.clientY - r.top) / (r.height || 1) * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointermove', function (e) {
        var r = rekt.get(el);
        if (!r) { r = el.getBoundingClientRect(); rekt.set(el, r); }
        var px = (e.clientX - r.left) / (r.width || 1);
        var py = (e.clientY - r.top) / (r.height || 1);
        var ry = (px - 0.5) * 2 * max;
        var rx = (0.5 - py) * 2 * max;
        el.style.transform =
          'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        rekt.delete(el);
        el.classList.remove('is-tilting');
        el.style.transform = '';
      });
    });
    if (tilters.length) {
      window.addEventListener('scroll', function () { rekt = new WeakMap(); }, { passive: true });
    }

    /* ── Utvikler-båndet: lagene glir hver sin vei etter pekeren ──
       --mx/--my (−1 … 1) leses av portrett, tekst, raster og ringer i
       forside.css. Portrettet får i tillegg en liten 3D-vipp. */
    var band = document.querySelector('.mg-band');
    if (band) {
      var br = null;
      band.addEventListener('pointerenter', function () { br = band.getBoundingClientRect(); });
      band.addEventListener('pointermove', function (e) {
        if (!br) br = band.getBoundingClientRect();
        band.style.setProperty('--mx', (((e.clientX - br.left) / (br.width || 1)) * 2 - 1).toFixed(3));
        band.style.setProperty('--my', (((e.clientY - br.top) / (br.height || 1)) * 2 - 1).toFixed(3));
      }, { passive: true });
      band.addEventListener('pointerleave', function () {
        br = null;
        band.style.removeProperty('--mx');
        band.style.removeProperty('--my');
      });
      window.addEventListener('scroll', function () { br = null; }, { passive: true });
    }
  }

  /* ── Berøringsskjermer: utvikler-båndets lag drives av rullingen i
     stedet for pekeren. --my går fra 1 (båndet nederst i vinduet)
     til −1 (øverst), så portrett og raster glir forbi hverandre mens
     man ruller gjennom det. ── */
  if (!fine && !reduce) {
    var bandS = document.querySelector('.mg-band');
    if (bandS) {
      var bIn = false, bTick = false;
      function bandFrame() {
        bTick = false;
        if (!bIn) return;
        var r = bandS.getBoundingClientRect();
        var vh = window.innerHeight || 1;
        var c = (r.top + r.height / 2 - vh / 2) / vh * 1.6;
        c = c < -1 ? -1 : c > 1 ? 1 : c;
        bandS.style.setProperty('--my', c.toFixed(3));
        bandS.style.setProperty('--mx', (c * 0.5).toFixed(3));
      }
      new IntersectionObserver(function (en) { bIn = en[0].isIntersecting; if (bIn) bandFrame(); }, { rootMargin: '10% 0px' }).observe(bandS);
      window.addEventListener('scroll', function () {
        if (bIn && !bTick) { bTick = true; requestAnimationFrame(bandFrame); }
      }, { passive: true });
    }
  }

  /* ═══ 3d. Konvertering: 01 → 02 på samme sted ═══
     Panelet festes i .cv-wrap, som gjøres så høy at det er en
     rullelengde (ca. 70 % av vinduet) igjen etter at panelet er
     festet. --cp (0 → 1) driver overgangen i forside.css. */
  (function () {
    var panel = document.querySelector('.cv-wrap > .cv3d');
    if (!panel || reduce) return;
    var wrap = panel.parentElement;
    var canvas = panel.querySelector('canvas[data-striper]');

    /* To moduser, samme --cp.
       PC (presis peker, bred skjerm): panelet festes og kort 01 byttes
       til 02 på samme sted — «is-live».
       Telefon: NN/g fant at kapret rulling desorienterer mest der, så
       kortene står under hverandre og --cp driver bare skinna mellom
       dem og 01——02 oppe i hjørnet. Ingen rulling blir stjålet. */
    var live = false, travel = 0, start = 0, inView = false, ticking = false;
    var cp = -1, lastW = 0, lastH = 0;
    var TOP = 100;

    function measure() {
      lastW = window.innerWidth; lastH = window.innerHeight;
      var want = fine && window.innerWidth > 900;
      if (want !== live) {
        live = want;
        panel.classList.toggle('is-live', live);
      }
      if (live) {
        /* Var 0,45 skjermhøyder — byttet fra 01 til 02 gikk unna på ett
           hjulsveip og leste som et hopp. Nå litt over én skjermhøyde,
           så vippen og ordskyggen får tid til å skje. */
        travel = Math.round(Math.max(640, Math.min(1100, window.innerHeight * 1.1)));
        wrap.style.height = (panel.offsetHeight + travel) + 'px';
        start = wrap.getBoundingClientRect().top + window.scrollY - TOP;
      } else {
        /* Fri høyde igjen, og en strekning som løper mens panelet er
           på vei gjennom skjermen — ingen festing, ingen ekstra høyde. */
        wrap.style.height = '';
        travel = Math.round(panel.offsetHeight * 0.72);
        start = wrap.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.72;
      }
      cp = -1;
      frame();
    }

    function frame() {
      ticking = false;
      var p = travel ? (window.scrollY - start) / travel : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (p === cp) return;
      cp = p;
      panel.style.setProperty('--cp', p.toFixed(4));
      panel.classList.toggle('is-2', p >= 0.5);
      /* Lyset i glasset vandrer med rullingen mens panelet er festet.
         På telefon lar vi det være: der vandrer glasset av seg selv
         (drift i forside-3d.js), og to kilder som drar i samme punkt
         gir bare rykk. */
      if (live && canvas) canvas.dispatchEvent(new CustomEvent('striper:point', { detail: { x: 0.18 + p * 0.64, y: 0.5, on: true } }));
    }

    function onScroll() {
      if (inView && !ticking) { ticking = true; requestAnimationFrame(frame); }
    }
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView) onScroll();
      else if (live && canvas) canvas.dispatchEvent(new CustomEvent('striper:point', { detail: { x: 0.5, y: 0.5, on: false } }));
    }, { rootMargin: '20% 0px' }).observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 150) measure();
    });
    window.addEventListener('load', measure);
    measure();
  })();

  /* ═══ 3e. Kunden sier: ordene skarpnes ett for ett ═══
     Sitatet deles i ord (--i), og --qp går 0 → 1 mens seksjonen ruller
     fra 85 % til 35 % av vinduet. Ingen rulling stjeles. */
  (function () {
    var sec = document.querySelector('.quote2');
    var wrap = sec && sec.querySelector('[data-quote]');
    var para = wrap && wrap.querySelector('.qt-p');
    if (!sec || !para || reduce) return;
    var words = para.textContent.trim().split(/\s+/);
    para.textContent = '';
    words.forEach(function (w, i) {
      var sp = document.createElement('span');
      sp.className = 'qt-w';
      sp.style.setProperty('--i', i);
      sp.textContent = w;
      para.appendChild(sp);
      if (i < words.length - 1) para.appendChild(document.createTextNode(' '));
    });
    para.style.setProperty('--n', words.length);
    sec.classList.add('is-live');

    var start = 0, travel = 1, inView = false, ticking = false, qp = -1;
    /* Strekningen regnes ut av faktisk geometri, ikke av et fast tall:
       den starter mens sitatet er på vei opp, og er ferdig i det
       .qt-wrap slutter å stå fast (eller, uten sticky, når seksjonen er
       på vei ut). Da varer den så lenge seksjonen er høy. */
    function measure() {
      var vh = window.innerHeight || 1;
      var secTop = sec.getBoundingClientRect().top + window.scrollY;
      var stickyTop = parseFloat(getComputedStyle(wrap).top) || 0;
      var slutt = secTop + sec.offsetHeight - wrap.offsetHeight - stickyTop;
      start = secTop - vh * 0.55;
      travel = Math.max(vh * 0.5, slutt - start);
      qp = -1; frame();
    }
    function frame() {
      ticking = false;
      var p = (window.scrollY - start) / travel;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (p === qp) return;
      qp = p;
      wrap.style.setProperty('--qp', p.toFixed(4));
    }
    function onScroll() { if (inView && !ticking) { ticking = true; requestAnimationFrame(frame); } }
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) onScroll(); }, { rootMargin: '30% 0px' }).observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  })();

  /* ═══ 4. Bunker: --cover på laget som dekkes ═══
     To slags bunker, samme mekanikk:
     - [data-stack]: barna er sticky kort (Tjenester). Kort i dekkes
       av kort i+1 fra sin egen bunnkant og opp til forskyvningen
       (data-stack-offset) — --cover går 0 → 1 over den strekningen.
     - .stack > section: sticky seksjoner som fester i toppen. Neste
       seksjon dekker fra folden og opp — --cover = hvor langt den har
       kommet gjennom vinduet.
     CSS-en krymper og mørkner laget som dekkes. Regnes bare mens
     bunken er i bildet og faktisk er sticky — på mobil og lave
     vinduer ruller alt vanlig. */
  (function () {
    if (reduce) return;
    var stacks = [];

    document.querySelectorAll('[data-stack]').forEach(function (el) {
      var kids = Array.prototype.slice.call(el.children);
      if (kids.length < 2) return;
      stacks.push({
        el: el, kids: kids, inView: false, sticky: false,
        step: parseFloat(el.getAttribute('data-stack-offset')) || 0,
        cover: function (a, b) {
          var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.bottom - rb.top) / ((ra.height - this.step) || 1);
        }
      });
    });

    var secs = document.querySelectorAll('.stack > section');
    if (secs.length >= 2) {
      stacks.push({
        el: secs[0].parentElement, kids: Array.prototype.slice.call(secs),
        inView: false, sticky: false, step: 0,
        cover: function (a, b) {
          return 1 - b.getBoundingClientRect().top / (window.innerHeight || 1);
        }
      });
    }
    if (!stacks.length) return;

    var ticking = false;

    function check() {
      stacks.forEach(function (s) {
        /* Seksjonsbunken: en festet seksjon som er høyere enn vinduet
           får aldri vist bunnen sin. Da rulles hele bunken vanlig. */
        if (s.step === 0 && s.el.classList.contains('stack')) {
          var vh = window.innerHeight || 1, tall = false;
          s.el.classList.remove('no-pin');
          s.kids.forEach(function (k) { if (k.offsetHeight > vh) tall = true; });
          s.el.classList.toggle('no-pin', tall);
        }
        s.sticky = getComputedStyle(s.kids[0]).position === 'sticky';
        if (!s.sticky) s.kids.forEach(function (k) { k.style.removeProperty('--cover'); });
      });
    }
    function frame() {
      ticking = false;
      stacks.forEach(function (s) {
        if (!s.inView || !s.sticky) return;
        for (var i = 0; i < s.kids.length - 1; i++) {
          var c = s.cover(s.kids[i], s.kids[i + 1]);
          c = c < 0 ? 0 : c > 1 ? 1 : c;
          s.kids[i].style.setProperty('--cover', c.toFixed(3));
        }
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }

    stacks.forEach(function (s) {
      new IntersectionObserver(function (entries) {
        s.inView = entries[0].isIntersecting;
        if (s.inView) onScroll();
      }, { rootMargin: '10% 0px' }).observe(s.el);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { check(); onScroll(); });
    check();
  })();
})();
