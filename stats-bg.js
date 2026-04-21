(function () {
  'use strict';

  var section = document.getElementById('stats-scrub');
  if (!section) return;

  /* No animation on touch / low-end devices */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  function boot(THREE) {
    var W = section.offsetWidth;
    var H = section.offsetHeight;

    /* ── Renderer ── */
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    var cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    section.insertBefore(cv, section.firstChild);

    /* ── Scene / Camera ── */
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0, 22);

    /* ── Glow sprite texture ── */
    var gc  = document.createElement('canvas');
    gc.width = gc.height = 64;
    var gx  = gc.getContext('2d');
    var gr  = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0,    'rgba(180,220,255,1)');
    gr.addColorStop(0.2,  'rgba(80,140,255,0.9)');
    gr.addColorStop(0.55, 'rgba(37,99,235,0.3)');
    gr.addColorStop(1,    'rgba(0,0,0,0)');
    gx.fillStyle = gr;
    gx.fillRect(0, 0, 64, 64);
    var glowTex = new THREE.CanvasTexture(gc);

    /* ── Nodes ── */
    var N    = 75;
    var BX   = 22, BY = 13, BZ = 12;
    var DIST = 8;
    var pos  = new Float32Array(N * 3);
    var vel  = new Float32Array(N * 3);

    for (var i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * BX * 2;
      pos[i*3+1] = (Math.random() - 0.5) * BY * 2;
      pos[i*3+2] = (Math.random() - 0.5) * BZ * 2;
      vel[i*3]   = (Math.random() - 0.5) * 0.007;
      vel[i*3+1] = (Math.random() - 0.5) * 0.007;
      vel[i*3+2] = (Math.random() - 0.5) * 0.004;
    }

    var nodeGeo  = new THREE.BufferGeometry();
    var nodeBuf  = new THREE.BufferAttribute(pos.slice(), 3);
    nodeBuf.setUsage(THREE.DynamicDrawUsage);
    nodeGeo.setAttribute('position', nodeBuf);
    var nodeMat  = new THREE.PointsMaterial({
      size: 0.55, map: glowTex, opacity: 0.65,
      blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, color: 0x5599ff
    });
    scene.add(new THREE.Points(nodeGeo, nodeMat));

    /* ── Connections (pre-allocated buffer) ── */
    var MAX   = N * (N - 1) / 2;
    var lBuf  = new Float32Array(MAX * 6);

    function makeLine(color, opacity) {
      var geo  = new THREE.BufferGeometry();
      var attr = new THREE.BufferAttribute(lBuf.slice(), 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', attr);
      var mat  = new THREE.LineBasicMaterial({
        color: color, transparent: true, opacity: opacity,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      var seg  = new THREE.LineSegments(geo, mat);
      scene.add(seg);
      return { geo: geo, attr: attr };
    }

    var lineCore = makeLine(0x3b82f6, 0.50);
    var lineGlow = makeLine(0x1d4ed8, 0.13);

    /* ── Data packets (particles travelling along edges) ── */
    var PKT  = 20;
    var pkts = [];
    var pBuf = new Float32Array(PKT * 3);

    for (var p = 0; p < PKT; p++) {
      pkts.push({ a: Math.floor(Math.random()*N), b: Math.floor(Math.random()*N),
                  t: Math.random(), spd: 0.008 + Math.random() * 0.012 });
    }

    var pktGeo = new THREE.BufferGeometry();
    var pktAttr= new THREE.BufferAttribute(pBuf, 3);
    pktAttr.setUsage(THREE.DynamicDrawUsage);
    pktGeo.setAttribute('position', pktAttr);
    var pktMat = new THREE.PointsMaterial({
      size: 0.28, map: glowTex, opacity: 0.65,
      blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, color: 0xaaddff
    });
    scene.add(new THREE.Points(pktGeo, pktMat));

    /* ── Animation loop ── */
    var camAngle = 0;
    var animId, running = false, lastTs = 0;
    var FRAME = 1000 / 30;

    function tick(ts) {
      if (!running) return;
      animId = requestAnimationFrame(tick);
      if (ts - lastTs < FRAME) return;
      lastTs = ts;

      /* Move nodes */
      for (var i = 0; i < N; i++) {
        pos[i*3]   += vel[i*3];
        pos[i*3+1] += vel[i*3+1];
        pos[i*3+2] += vel[i*3+2];
        if (Math.abs(pos[i*3])   > BX) vel[i*3]   *= -1;
        if (Math.abs(pos[i*3+1]) > BY) vel[i*3+1] *= -1;
        if (Math.abs(pos[i*3+2]) > BZ) vel[i*3+2] *= -1;
      }
      nodeBuf.set(pos); nodeBuf.needsUpdate = true;

      /* Update connections */
      var idx = 0, d2 = DIST * DIST;
      for (var i = 0; i < N; i++) {
        for (var j = i+1; j < N; j++) {
          var dx = pos[i*3]-pos[j*3], dy = pos[i*3+1]-pos[j*3+1], dz = pos[i*3+2]-pos[j*3+2];
          if (dx*dx + dy*dy + dz*dz < d2) {
            lBuf[idx++]=pos[i*3]; lBuf[idx++]=pos[i*3+1]; lBuf[idx++]=pos[i*3+2];
            lBuf[idx++]=pos[j*3]; lBuf[idx++]=pos[j*3+1]; lBuf[idx++]=pos[j*3+2];
          }
        }
      }
      var verts = idx / 3;
      lineCore.attr.set(lBuf); lineCore.attr.needsUpdate = true; lineCore.geo.setDrawRange(0, verts);
      lineGlow.attr.set(lBuf); lineGlow.attr.needsUpdate = true; lineGlow.geo.setDrawRange(0, verts);

      /* Move packets */
      for (var p = 0; p < PKT; p++) {
        var pk = pkts[p];
        pk.t += pk.spd;
        if (pk.t > 1) {
          pk.t = 0;
          pk.a = Math.floor(Math.random()*N);
          pk.b = Math.floor(Math.random()*N);
        }
        var t = pk.t;
        pBuf[p*3]   = pos[pk.a*3]   + (pos[pk.b*3]   - pos[pk.a*3])   * t;
        pBuf[p*3+1] = pos[pk.a*3+1] + (pos[pk.b*3+1] - pos[pk.a*3+1]) * t;
        pBuf[p*3+2] = pos[pk.a*3+2] + (pos[pk.b*3+2] - pos[pk.a*3+2]) * t;
      }
      pktAttr.set(pBuf); pktAttr.needsUpdate = true;

      /* Slowly orbit camera */
      camAngle += 0.0008;
      camera.position.x = Math.sin(camAngle) * 22;
      camera.position.z = Math.cos(camAngle) * 22;
      camera.position.y = Math.sin(camAngle * 0.4) * 4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    /* ── Pause when off-screen ── */
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!running) { running = true; lastTs = 0; requestAnimationFrame(tick); }
      } else {
        running = false;
        cancelAnimationFrame(animId);
      }
    }, { threshold: 0.01 });
    io.observe(section);

    /* ── Resize ── */
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        W = section.offsetWidth; H = section.offsetHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }, 200);
    }, { passive: true });
  }

  /* ── Load Three.js if not already present ── */
  if (window.THREE) {
    boot(window.THREE);
  } else {
    var s  = document.createElement('script');
    s.src  = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.async = true;
    s.onload = function () { boot(window.THREE); };
    document.head.appendChild(s);
  }

}());
