'use strict';

/* ─── Intro overlay ─── */
(function () {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  if (sessionStorage.getItem('intro-seen')) {
    overlay.style.display = 'none';
    return;
  }

  const dot  = overlay.querySelector('.intro-dot');
  const text = overlay.querySelector('.intro-text');

  // Dot scales in immediately
  dot.classList.add('animate');

  // Text slides in after dot finishes (400 ms)
  setTimeout(() => text.classList.add('animate'), 400);

  // Fade out: dot (400ms) + text (500ms) + hold (1000ms) = 1900ms
  setTimeout(() => {
    overlay.classList.add('fade-out');
    overlay.addEventListener('animationend', () => {
      overlay.style.display = 'none';
      sessionStorage.setItem('intro-seen', '1');
    }, { once: true });
  }, 1900);
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
