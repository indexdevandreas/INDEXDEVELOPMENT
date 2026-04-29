/* Hans Haugerud AS — main.js */

const nav = document.getElementById('nav');
const hamburger = document.querySelector('.nav__hamburger');
const mobileMenu = document.querySelector('.nav__mobile');

// Sticky nav
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 60);
}, { passive: true });

// Parallax hero bg
const heroBg = document.querySelector('.hero__bg');
if (heroBg) {
  setTimeout(() => heroBg.classList.add('loaded'), 80);
  window.addEventListener('scroll', () => {
    heroBg.style.transform = `scale(1.05) translateY(${window.scrollY * 0.28}px)`;
  }, { passive: true });
}

// Hamburger toggle
if (hamburger && mobileMenu) {
  const spans = hamburger.querySelectorAll('span');
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
    spans[1].style.opacity  = open ? '0' : '';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }));
}

// Active nav link
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__link').forEach(l => {
  if (l.getAttribute('href') === page) l.classList.add('active');
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => observer.observe(el));

// Counter animation
function countUp(el) {
  const target = +el.dataset.target;
  const suffix = el.dataset.suffix || '';
  const dur = 1800;
  const start = Date.now();
  (function tick() {
    const p = Math.min((Date.now() - start) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })();
}
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.done) {
      e.target.dataset.done = '1';
      countUp(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

// Contact form feedback
const form = document.querySelector('.contact-form form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = '✓ Meldingen er sendt!';
    btn.style.background = '#2a7a4a';
    setTimeout(() => { btn.textContent = 'Send melding'; btn.style.background = ''; form.reset(); }, 3500);
  });
}
