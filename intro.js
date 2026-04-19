(function () {
  'use strict';

  if (sessionStorage.getItem('idx_intro')) return;
  sessionStorage.setItem('idx_intro', '1');

  /* ── Overlay ── */
  var ov = document.createElement('div');
  ov.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#000;' +
    'display:flex;align-items:center;justify-content:center;overflow:hidden;';
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  /* ── Canvas ── */
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  ov.appendChild(cv);

  /* ── Logo ── */
  var logoWrap = document.createElement('div');
  logoWrap.style.cssText =
    'position:absolute;display:flex;align-items:center;gap:0.6rem;' +
    'opacity:0;pointer-events:none;user-select:none;z-index:2;';
  var dot = document.createElement('div');
  dot.style.cssText =
    'width:0.85rem;height:0.85rem;border-radius:50%;background:#2563eb;' +
    'box-shadow:0 0 14px 4px rgba(37,99,235,0.75);flex-shrink:0;';
  var txt = document.createElement('span');
  txt.textContent = 'index dev.';
  txt.style.cssText =
    'font-family:"Space Grotesk",Arial,sans-serif;' +
    'font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;' +
    'letter-spacing:-0.03em;color:#fff;' +
    'text-shadow:0 0 28px rgba(37,99,235,0.7),0 0 60px rgba(37,99,235,0.35);';
  logoWrap.appendChild(dot);
  logoWrap.appendChild(txt);
  ov.appendChild(logoWrap);

  /* ── Fallback ── */
  var giveUp = setTimeout(triggerSplit, 2500);

  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.async = true;
  s.onload  = function () { clearTimeout(giveUp); startScene(); };
  s.onerror = function () { clearTimeout(giveUp); triggerSplit(); };
  document.head.appendChild(s);

  /* ──────────────────────────────────────── */
  function startScene() {
    var T  = window.THREE;
    var W  = window.innerWidth;
    var H  = window.innerHeight;

    var renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    var scene  = new T.Scene();
    var camera = new T.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 5.5;

    var icoGeo = new T.IcosahedronGeometry(1.5, 1);
    var icoMat = new T.MeshBasicMaterial({
      color: 0x2563eb, wireframe: true, transparent: true, opacity: 0
    });
    var ico = new T.Mesh(icoGeo, icoMat);
    scene.add(ico);

    var rings = [];
    [[2.1, 0x2563eb, new T.Euler(Math.PI/2, 0, 0)],
     [2.7, 0x3b82f6, new T.Euler(Math.PI/4, Math.PI/5, 0)],
     [3.4, 0x60a5fa, new T.Euler(0, Math.PI/3, Math.PI/6)]
    ].forEach(function (cfg) {
      var mat  = new T.MeshBasicMaterial({ color: cfg[1], transparent: true, opacity: 0 });
      var ring = new T.Mesh(new T.TorusGeometry(cfg[0], 0.013, 8, 90), mat);
      ring.rotation.copy(cfg[2]);
      scene.add(ring);
      rings.push(ring);
    });

    var pGeo = new T.BufferGeometry();
    var pPos = new Float32Array(300 * 3);
    for (var i = 0; i < 300; i++) {
      pPos[i*3]   = (Math.random()-0.5)*16;
      pPos[i*3+1] = (Math.random()-0.5)*16;
      pPos[i*3+2] = (Math.random()-0.5)*16;
    }
    pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3));
    var pMat = new T.PointsMaterial({ color: 0x93c5fd, size: 0.035, transparent: true, opacity: 0 });
    scene.add(new T.Points(pGeo, pMat));

    var t0, rafId, done = false;

    function clamp(v,lo,hi) { return v<lo?lo:v>hi?hi:v; }
    function ease(n)        { var c=clamp(n,0,1); return c<0.5?2*c*c:-1+(4-2*c)*c; }
    function prog(t,s,d)    { return ease(clamp((t-s)/d,0,1)); }

    function tick(now) {
      if (done) return;
      rafId = requestAnimationFrame(tick);
      var t = (now - t0) / 1000;

      var obj = prog(t, 0, 0.7);
      icoMat.opacity            = obj * 0.82;
      rings[0].material.opacity = obj * 0.55;
      rings[1].material.opacity = obj * 0.40;
      rings[2].material.opacity = obj * 0.28;
      pMat.opacity              = obj * 0.55;

      logoWrap.style.opacity = prog(t, 0.5, 0.6);

      ico.rotation.x      += 0.007;
      ico.rotation.y      += 0.010;
      rings[0].rotation.z += 0.005;
      rings[1].rotation.z -= 0.004;
      rings[2].rotation.x += 0.003;
      rings[2].rotation.y += 0.005;

      camera.position.z = 5.5 - prog(t, 1.2, 1.0) * 3.0;

      renderer.render(scene, camera);

      if (t >= 2.2) {
        done = true;
        cancelAnimationFrame(rafId);
        renderer.dispose();
        triggerSplit();
      }
    }

    setTimeout(function () {
      t0 = performance.now();
      requestAnimationFrame(tick);
    }, 150);
  }

  /* ── Split: two fresh divs on body — no stacking context conflicts ── */
  function triggerSplit() {
    /* Hide the 3D overlay instantly — split panels take over */
    ov.style.display = 'none';

    var top = document.createElement('div');
    var bot = document.createElement('div');
    top.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:50%;' +
      'background:#000;z-index:100000;';
    bot.style.cssText =
      'position:fixed;bottom:0;left:0;width:100%;height:50%;' +
      'background:#000;z-index:100000;';
    document.body.appendChild(top);
    document.body.appendChild(bot);

    /* Force reflow — commits panels at their start position */
    top.getBoundingClientRect();

    /* Apply transition + end state */
    var TR = 'transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)';
    top.style.transition = TR;
    bot.style.transition = TR;
    top.style.transform  = 'translateY(-100%)';
    bot.style.transform  = 'translateY(100%)';

    document.body.style.overflow = '';

    setTimeout(function () {
      if (top.parentNode) top.parentNode.removeChild(top);
      if (bot.parentNode) bot.parentNode.removeChild(bot);
      if (ov.parentNode)  ov.parentNode.removeChild(ov);
    }, 700);
  }

}());
