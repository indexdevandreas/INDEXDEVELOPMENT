'use strict';

/* Subpages have no intro overlay — show nav/promo immediately */
document.body.classList.add('no-intro');
document.body.classList.add('nav-ready');

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

/* ─── Scroll reveal ─── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  const sibs = Array.from(el.parentElement?.querySelectorAll(':scope > .reveal') || []);
  const idx  = sibs.indexOf(el);
  if (idx > 0) el.style.setProperty('--reveal-delay', (idx * 80) + 'ms');
  revealObs.observe(el);
});
