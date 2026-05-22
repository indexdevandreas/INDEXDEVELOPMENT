'use strict';

const hasHover = window.matchMedia('(hover: hover)').matches;

/* ─── Cursor ─────────────────────────────────────────── */
const cursor    = document.getElementById('js-cursor');
const cursorDot = document.getElementById('js-cursor-dot');

if (cursor && cursorDot && hasHover) {
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px';
    cursorDot.style.top  = my + 'px';
  });
  (function tick() {
    cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
    cursor.style.left = cx.toFixed(1) + 'px';
    cursor.style.top  = cy.toFixed(1) + 'px';
    requestAnimationFrame(tick);
  })();
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hov'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hov'));
  });
}


/* ─── Nav: vises når topbar er scrollet forbi ────────── */
const nav     = document.getElementById('js-nav');
const topbar  = document.getElementById('js-topbar');
const heroSub = document.getElementById('hero-sub');

if (nav && topbar) {
  const check = () => {
    const past = topbar.getBoundingClientRect().bottom <= 0;
    nav.classList.toggle('visible', past);
    if (heroSub) heroSub.classList.toggle('fade-in', past);
  };
  window.addEventListener('scroll', check, { passive: true });
  check();
}


/* ─── Mobile menu ────────────────────────────────────── */
const menyBtn = document.getElementById('js-meny');
const menu    = document.getElementById('js-menu');

function openMenu()  { menu.classList.add('open'); menu.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; menyBtn.setAttribute('aria-expanded','true'); }
function closeMenu() { menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); document.body.style.overflow=''; menyBtn.setAttribute('aria-expanded','false'); }

if (menyBtn && menu) {
  menyBtn.addEventListener('click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}


/* ─── Visste du at: IntersectionObserver ────────────── */
const vdaObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    vdaObs.unobserve(e.target);
  });
}, { threshold: 0.15 });

document.querySelectorAll('.js-vda').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.12) + 's';
  vdaObs.observe(el);
});


/* ─── Count-up ───────────────────────────────────────── */
document.querySelectorAll('.vda-count').forEach(el => {
  const target = parseInt(el.dataset.to, 10);
  let done = false;

  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || done) return;
    done = true; io.disconnect();
    const start = performance.now();
    const dur   = 1400;
    (function step(now) {
      const t   = Math.min((now - start) / dur, 1);
      const val = Math.round((1 - Math.pow(1 - t, 3)) * target);
      el.textContent = val;
      if (t < 1) requestAnimationFrame(step);
    })(performance.now());
  }, { threshold: 0.5 });

  io.observe(el);
});


/* ─── Intro logo animation ───────────────────────────── */
(function () {
  const overlay = document.getElementById('js-intro');
  if (!overlay) return;

  const root = document.documentElement;
  document.body.style.overflow = 'hidden';

  function setP(v) { root.style.setProperty('--p', v.toFixed(4)); }

  function tween(from, to, dur, ease, done) {
    const t0 = performance.now();
    (function step(now) {
      const t = Math.min((now - t0) / dur, 1);
      setP(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else done();
    })(performance.now());
  }

  const easeInOut = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
  const easeIn    = t => t * t;

  /* draw in → hold → draw out → reveal */
  tween(0, 0.5, 800, easeInOut, () => {
    setTimeout(() => {
      tween(0.5, 1.0, 550, easeIn, () => {
        document.body.style.overflow = '';
        overlay.classList.add('done');
        overlay.addEventListener('transitionend', () => {
          overlay.style.display = 'none';
        }, { once: true });
      });
    }, 250);
  });
})();


/* ─── Card hover tilt ────────────────────────────────── */
if (hasHover) {
  document.querySelectorAll('.js-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${(nx*8).toFixed(1)}deg) rotateX(${(-ny*6).toFixed(1)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .6s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 600);
    });
  });
}
