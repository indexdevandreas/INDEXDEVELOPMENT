/* BOSKA RØR OG VENTILASJON */

// === SPLASH (index only) ===
(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;

  // Measure each path so stroke-dasharray animation knows its length
  splash.querySelectorAll('.logo-svg path').forEach(p => {
    p.style.setProperty('--len', p.getTotalLength());
  });

  if (sessionStorage.getItem('boska_seen')) {
    splash.classList.add('skip');
  } else {
    sessionStorage.setItem('boska_seen', '1');
  }
})();

// === SCROLL REVEAL ===
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Hero reveals immediately
setTimeout(() => {
  document.querySelectorAll('.hero .reveal, .page-hero .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), i * 90);
  });
}, 60);

// === STICKY HERO FADE ===
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const h = hero.offsetHeight;
    const progress = Math.min(Math.max(window.scrollY / (h * 0.65), 0), 1);
    hero.style.opacity = 1 - progress * 0.55;
  }, { passive: true });
})();

// === HERO CANVAS PARTICLES ===
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  hero.insertBefore(canvas, hero.querySelector('.hero-meta-bar'));
  const ctx = canvas.getContext('2d');

  const resize = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const dots = Array.from({ length: 16 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.0003,
    vy: (Math.random() - 0.5) * 0.0003,
    a: Math.random() * 0.1 + 0.05
  }));

  let raf, running = true;

  const tick = () => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    dots.forEach(d => {
      d.x = (d.x + d.vx + 1) % 1;
      d.y = (d.y + d.vy + 1) % 1;
      ctx.beginPath();
      ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.a})`;
      ctx.fill();
    });
    if (running) raf = requestAnimationFrame(tick);
  };

  const obs = new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) tick(); else cancelAnimationFrame(raf);
  }, { threshold: 0 });
  obs.observe(hero);
  tick();
})();

// === STICKY NAV ===
const nav = document.querySelector('.nav-header');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// === MOBILE MENU ===
const burger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');

burger?.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  if (open) {
    mobileNav.style.display = 'flex';
    requestAnimationFrame(() => mobileNav.classList.add('open'));
  } else {
    mobileNav.classList.remove('open');
  }
  document.body.style.overflow = open ? 'hidden' : '';
});

mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger?.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// === SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
    }
  });
});

// === ACTIVE NAV LINK ===
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
  if (link.getAttribute('href') === page) {
    link.style.color = 'var(--c-ink)';
    link.style.fontWeight = '700';
  }
});

// === CONTACT FORMS ===
[
  { formId: 'contact-form', successSel: '.form-success' },
  { formId: 'homepage-contact-form', successSel: '.hc-success' }
].forEach(({ formId, successSel }) => {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.style.display = 'none';
    const ok = form.closest('.hc-form-wrap, .contact-form-box')?.querySelector(successSel)
             || document.querySelector(successSel);
    if (ok) ok.style.display = 'block';
  });
});
