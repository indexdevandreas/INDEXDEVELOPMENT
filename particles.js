(function () {
  'use strict';

  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  /* No mouse on touch devices — animation has no effect and causes jank */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    canvas.style.display = 'none';
    return;
  }

  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouse = { x: -9999, y: -9999 };
  var animId = null;
  var running = false;
  var lastTime = 0;
  var FRAME_MS = 1000 / 30; /* 30 fps — shares GPU budget with Three.js shader */

  var CFG = {
    count: 35,
    rgb: '99,130,255',
    minR: 1.4,
    maxR: 2.4,
    speed: 0.3,
    connectDist: 130,
    lineAlpha: 0.22,
    repelRadius: 140,
    repelPower: 0.20,
    maxSpeed: 2.5
  };

  /* ── resize ── */
  function resize() {
    var hero = canvas.parentElement;
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  /* ── Particle ── */
  function Particle() {
    this.x  = Math.random() * canvas.width;
    this.y  = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * CFG.speed * 2;
    this.vy = (Math.random() - 0.5) * CFG.speed * 2;
    this.r  = CFG.minR + Math.random() * (CFG.maxR - CFG.minR);
  }

  Particle.prototype.update = function () {
    var dx  = this.x - mouse.x;
    var dy  = this.y - mouse.y;
    var d2  = dx * dx + dy * dy;
    var rr  = CFG.repelRadius * CFG.repelRadius;

    if (d2 < rr && d2 > 1) {           /* cheap squared check first */
      var dist  = Math.sqrt(d2);        /* sqrt only when needed     */
      var force = (1 - dist / CFG.repelRadius);
      this.vx += (dx / dist) * force * CFG.repelPower;
      this.vy += (dy / dist) * force * CFG.repelPower;
    }

    this.vx *= 0.96;
    this.vy *= 0.96;

    var spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > CFG.maxSpeed) {
      this.vx = (this.vx / spd) * CFG.maxSpeed;
      this.vy = (this.vy / spd) * CFG.maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -15) this.x = canvas.width  + 15;
    if (this.x > canvas.width  + 15) this.x = -15;
    if (this.y < -15) this.y = canvas.height + 15;
    if (this.y > canvas.height + 15) this.y = -15;
  };

  /* ── draw connections — single stroke() call ── */
  function drawLines() {
    var cd2 = CFG.connectDist * CFG.connectDist;
    ctx.beginPath();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(' + CFG.rgb + ',' + CFG.lineAlpha + ')';
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        if (dx * dx + dy * dy < cd2) {
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
        }
      }
    }
    ctx.stroke();
  }

  /* ── draw dots ── */
  function drawDots() {
    ctx.fillStyle = 'rgba(' + CFG.rgb + ',0.65)';
    for (var i = 0; i < particles.length; i++) {
      ctx.beginPath();
      ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── init ── */
  function init() {
    resize();
    particles = [];
    for (var i = 0; i < CFG.count; i++) {
      particles.push(new Particle());
    }
  }

  /* ── loop: capped at 30 fps ── */
  function loop(ts) {
    if (!running) return;
    animId = requestAnimationFrame(loop);
    if (ts - lastTime < FRAME_MS) return; /* skip frame */
    lastTime = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLines();
    for (var i = 0; i < particles.length; i++) particles[i].update();
    drawDots();
  }

  /* ── pause when hero scrolls off-screen ── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          running = true;
          lastTime = 0;
          loop(0);
        } else {
          running = false;
          if (animId) cancelAnimationFrame(animId);
        }
      });
    }, { threshold: 0.05 });
    io.observe(canvas.parentElement);
  } else {
    running = true;
  }

  /* ── mouse — rect cached, never recalculated inside the event ── */
  var cachedRect = canvas.getBoundingClientRect();

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX - cachedRect.left;
    mouse.y = e.clientY - cachedRect.top;
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  }, { passive: true });

  /* ── resize (debounced) — also refreshes cached rect ── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      init();
      cachedRect = canvas.getBoundingClientRect();
    }, 200);
  }, { passive: true });

  window.addEventListener('scroll', function () {
    cachedRect = canvas.getBoundingClientRect();
  }, { passive: true });

  /* ── start ── */
  init();
  if (running) loop(0);
}());
