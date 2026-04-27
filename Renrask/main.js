const BOOKING = 'https://letsreg.com/no/booking/renraskbilvask_1776290984?fbclid=IwVERDUARNi1FleHRuA2FlbQIxMABzcnRjBmFwcF9pZAo2NjI4NTY4Mzc5AAEeqcWsTAEEoi4UyXNzXB5_GWNMwjAnvMEHvbSZW3QG-hsxELMEXe79eXASG80_aem_x8RXm0NWGyAAyNhDku9wLQ';

/* ─── Booking links ─── */
function setBookingLinks() {
  document.querySelectorAll('[data-book]').forEach(el => {
    el.href   = BOOKING;
    el.target = '_blank';
    el.rel    = 'noopener noreferrer';
  });
}

/* ─── Intro animation (once per session) ─── */
function initIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;

  if (sessionStorage.getItem('rr_intro_done')) {
    intro.remove();
    return;
  }

  document.body.classList.add('noscroll');
  const logo = intro.querySelector('.intro-logo');

  setTimeout(() => logo?.classList.add('on'), 200);
  setTimeout(() => {
    intro.classList.add('out');
    document.body.classList.remove('noscroll');
    sessionStorage.setItem('rr_intro_done', '1');
  }, 1600);
  setTimeout(() => intro.remove(), 2250);
}

/* ─── Nav ─── */
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const mNav      = document.getElementById('m-nav');
  const mClose    = document.getElementById('m-close');

  if (!hamburger || !mNav) return;

  const close  = () => mNav.classList.remove('open');
  const toggle = () => mNav.classList.toggle('open');

  let didMove = false;
  hamburger.addEventListener('touchstart', () => { didMove = false; }, { passive: true });
  hamburger.addEventListener('touchmove',  () => { didMove = true;  }, { passive: true });
  hamburger.addEventListener('touchend', e => {
    if (didMove) return;
    e.preventDefault();
    toggle();
  });
  hamburger.addEventListener('click', toggle);

  mClose?.addEventListener('click', close);
  mNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

/* ─── Services slider ─── */
function initSlider() {
  const track = document.getElementById('slider-track');
  if (!track) return;

  const cards = track.querySelectorAll('.svc-card');
  let pos = 0;

  function visible() { return window.innerWidth >= 768 ? 3 : 1; }
  function max()     { return Math.max(0, cards.length - visible()); }
  function step()    { const c = cards[0]; return c ? c.offsetWidth + 20 : 0; }

  function update() {
    track.style.transform = `translateX(-${pos * step()}px)`;
  }

  document.getElementById('arr-prev')?.addEventListener('click', () => { pos = Math.max(0, pos - 1);    update(); });
  document.getElementById('arr-next')?.addEventListener('click', () => { pos = Math.min(max(), pos + 1); update(); });
  window.addEventListener('resize', () => { pos = Math.min(pos, max()); update(); }, { passive: true });

  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { pos = Math.min(max(), pos + 1); update(); }
    else         { pos = Math.max(0, pos - 1);    update(); }
  }, { passive: true });
}

/* ─── Scroll reveal ─── */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.sr').forEach(el => obs.observe(el));
}

/* ─── Counter animation ─── */
function initCounters() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur    = 1500;
      let start;
      const tick = (ts) => {
        if (!start) start = ts;
        const p  = Math.min((ts - start) / dur, 1);
        const ep = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ep * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

/* ─── Reviews carousel (infinite loop) ─── */
function initReviews() {
  const track = document.getElementById('rv-track');
  if (!track) return;

  const orig = Array.from(track.querySelectorAll('.rv'));
  const N    = orig.length;
  const BUF  = 3; // buffer = max visible cards on desktop

  // Prepend clones of the last BUF originals
  for (let i = N - BUF; i < N; i++) {
    track.insertBefore(orig[i].cloneNode(true), track.firstChild);
  }
  // Append clones of the first BUF originals
  for (let i = 0; i < BUF; i++) {
    track.appendChild(orig[i].cloneNode(true));
  }

  let pos    = BUF; // start at first original
  let locked = false;

  function moveTo(p, animate) {
    if (!animate) {
      track.style.transition = 'none';
      track.getBoundingClientRect(); // force reflow
    } else {
      track.style.transition = '';
    }
    pos = p;
    const c = track.querySelector('.rv');
    const step = c ? c.offsetWidth + 18 : 0;
    track.style.transform = `translateX(-${pos * step}px)`;
  }

  moveTo(BUF, false);

  function snapIfNeeded() {
    if      (pos < BUF)       moveTo(pos + N, false);
    else if (pos >= BUF + N)  moveTo(pos - N, false);
  }

  function step(dir) {
    if (locked) return;
    locked = true;
    moveTo(pos + dir, true);
    track.addEventListener('transitionend', function cb() {
      track.removeEventListener('transitionend', cb);
      snapIfNeeded();
      locked = false;
    }, { once: true });
  }

  document.getElementById('rv-prev')?.addEventListener('click', () => step(-1));
  document.getElementById('rv-next')?.addEventListener('click', () => step(1));
  window.addEventListener('resize', () => { moveTo(pos, false); }, { passive: true });

  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 40) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ─── Ambient cursor glow ─── */
function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function lerp() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    glow.style.left = cx + 'px'; glow.style.top = cy + 'px';
    requestAnimationFrame(lerp);
  })();
}

/* ─── Custom cursor ─── */
function initCustomCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.createElement('div'); dot.id  = 'custom-cursor';
  const ring = document.createElement('div'); ring.id = 'custom-cursor-ring';
  document.body.append(dot, ring);
  document.body.style.cursor = 'none';

  let tx = -100, ty = -100, rx = -100, ry = -100;

  window.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = tx + 'px'; dot.style.top = ty + 'px';
  }, { passive: true });

  (function lerpRing() {
    rx += (tx - rx) * 0.13; ry += (ty - ry) * 0.13;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  document.querySelectorAll('a, button, [data-book], .svc-card, .adv-item, .rv').forEach(el => {
    el.style.cursor = 'none';
    el.addEventListener('mouseenter', () => { dot.classList.add('hovered'); ring.classList.add('hovered'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hovered'); ring.classList.remove('hovered'); });
  });
}

/* ─── Hero parallax (scroll + mouse) ─── */
function initHeroParallax() {
  const hero   = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg');
  if (!hero || !heroBg) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `translateY(${y * 0.35}px)`;
    }
  }, { passive: true });

}

/* ─── 3D card tilt ─── */
function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const tiltTargets = '.adv-item, .rv, .about-card';

  document.querySelectorAll(tiltTargets).forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) scale(1.03)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── Service card tilt (lighter) ─── */
function initSvcTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.svc-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg) scale(1.02)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── Button ripple ─── */
function initRipple() {
  document.querySelectorAll('.btn-fill').forEach(btn => {
    btn.addEventListener('click', e => {
      const r    = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const el   = document.createElement('span');
      el.className = 'ripple';
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${e.clientX - r.left - size / 2}px;
        top: ${e.clientY - r.top  - size / 2}px;
      `;
      btn.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    });
  });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  setBookingLinks();
  initIntro();
  initNav();
  initSlider();
  initReviews();
  initReveal();
  initCounters();
  initCustomCursor();
  initCursorGlow();
  initHeroParallax();
  initTilt();
  initSvcTilt();
  initRipple();
});
