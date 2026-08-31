'use strict';

/* ─── Intro overlay ───
   Logomerket tegnes bjelke for bjelke, så kommer navnet og slagordet.
   Vises én gang per fane — sessionStorage hindrer at den spilles på
   hvert eneste sidebytte. */
(function () {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  if (sessionStorage.getItem('intro-seen')) {
    overlay.remove();
    document.documentElement.classList.add('intro-ferdig');
    return;
  }

  /* Låser rullingen mens introen står — ellers kan man scrolle bak den */
  document.documentElement.classList.add('intro-kjorer');
  overlay.classList.add('intro-overlay-go');

  const stille = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vent   = stille ? 700 : 2050;

  setTimeout(() => {
    overlay.classList.add('fade-out');
    const ferdig = () => {
      overlay.remove();
      document.documentElement.classList.remove('intro-kjorer');
      document.documentElement.classList.add('intro-ferdig');
      sessionStorage.setItem('intro-seen', '1');
    };
    overlay.addEventListener('animationend', ferdig, { once: true });
    /* Sikkerhetsnett: kommer aldri animationend, skal introen uansett vekk */
    setTimeout(ferdig, 800);
  }, vent);
})();

/* ─── Mobile menu ─── */
const menuBtn    = document.getElementById('js-menu-btn');
const mobileMenu = document.getElementById('js-mobile-menu');

function openMenu() {
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.querySelector('.menu-label').textContent = 'Lukk';
  document.body.classList.add('menu-open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.querySelector('.menu-label').textContent = 'Meny';
  document.body.classList.remove('menu-open');
  document.body.style.overflow = '';
}

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () =>
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu()
  );
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}


/* ─── Count-up animation ─── */
document.querySelectorAll('.count-up').forEach(el => {
  const target = parseInt(el.dataset.to, 10);
  let fired = false;

  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || fired) return;
    fired = true;
    io.disconnect();
    const dur = 1200;
    const start = performance.now();
    (function step(now) {
      const t   = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(step);
    })(performance.now());
  }, { threshold: 0.5 });

  io.observe(el);
});


/* ─── Scroll reveal: .reveal → .in-view ─── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  const sibs = el.parentElement
    ? Array.from(el.parentElement.querySelectorAll(':scope > .reveal'))
    : [];
  const idx = Math.max(0, sibs.indexOf(el));
  if (idx > 0) el.style.setProperty('--reveal-delay', (idx * 80) + 'ms');
  revealObs.observe(el);
});


/* ─── Nav: fest i toppen når heroen er passert ───
   Baren bytter fra å flyte inne i heroen til å være en hvit bar i
   full bredde. .is-dark er den samme varianten som brukes på den
   lyse heroen, så fargelogikken finnes bare ett sted. */
(function () {
  var nav = document.querySelector('.hero-nav');
  if (!nav) return;

  var lysHero = nav.classList.contains('is-dark');   /* lyse heroer setter .is-dark selv */
  var fest = false;

  function sjekk() {
    /* Festes med én gang man begynner å rulle. Sto tidligere på
       heroens høyde, altså først når heroen var passert — da lå
       baren ute av syne i mellomtiden. */
    var skalFeste = window.scrollY > 8;
    if (skalFeste === fest) return;
    fest = skalFeste;
    nav.classList.toggle('is-stuck', fest);
    if (!lysHero) nav.classList.toggle('is-dark', fest);
  }

  var venter = false;
  window.addEventListener('scroll', function () {
    if (venter) return;
    venter = true;
    requestAnimationFrame(function () { venter = false; sjekk(); });
  }, { passive: true });
  window.addEventListener('resize', sjekk);
  sjekk();
})();
