(function () {
  'use strict';

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';

  var ctx = canvas.getContext('2d');
  var stars = [];
  var running = false;
  var animId = null;
  var lastTime = 0;
  var FRAME_MS = 1000 / 30;
  var COUNT = 55;

  function resize() {
    var hero = canvas.parentElement;
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  function Star(initial) {
    this.x     = Math.random() * canvas.width;
    this.y     = initial ? Math.random() * canvas.height : -8;
    this.speed = 0.5 + Math.random() * 1.2;
    this.size  = 0.6 + Math.random() * 1.2;
    this.alpha = 0.25 + Math.random() * 0.55;
  }

  Star.prototype.update = function () {
    this.y += this.speed;
    if (this.y > canvas.height + 10) {
      this.x     = Math.random() * canvas.width;
      this.y     = -8;
      this.speed = 0.5 + Math.random() * 1.2;
      this.alpha = 0.25 + Math.random() * 0.55;
    }
  };

  function init() {
    resize();
    stars = [];
    for (var i = 0; i < COUNT; i++) stars.push(new Star(true));
  }

  function loop(ts) {
    if (!running) return;
    animId = requestAnimationFrame(loop);
    if (ts - lastTime < FRAME_MS) return;
    lastTime = ts;

    /* Fade trail — cheaper than clearRect + per-star gradients */
    ctx.fillStyle = 'rgba(8,8,8,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.update();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fill();
    }
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { running = true; lastTime = 0; loop(0); }
        else { running = false; if (animId) cancelAnimationFrame(animId); }
      });
    }, { threshold: 0.05 });
    io.observe(canvas.parentElement);
  } else {
    running = true;
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  }, { passive: true });

  init();
  if (running) loop(0);
}());
