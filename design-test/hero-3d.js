'use strict';

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => canvas.offsetWidth;
  const H = () => canvas.offsetHeight;

  /* ─── Renderer ────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);

  /* ─── Scene + Camera ──────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ─── Particle field ──────────────────────────────── */
  const COUNT = 700;
  const pos   = new Float32Array(COUNT * 3);
  const col   = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 4 + Math.random() * 7;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);

    /* white to blue gradient */
    const t    = Math.random();
    col[i*3]   = 0.14 + t * 0.7;
    col[i*3+1] = 0.32 + t * 0.35;
    col[i*3+2] = 0.91;
  }

  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeom.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  const pMat = new THREE.PointsMaterial({
    size:         0.048,
    vertexColors: true,
    transparent:  true,
    opacity:      0.6,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(pGeom, pMat);
  scene.add(particles);

  /* ─── Main icosahedron (large, blue wireframe) ────── */
  const icoA = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 1),
    new THREE.MeshBasicMaterial({
      color:       0x2553e8,
      wireframe:   true,
      transparent: true,
      opacity:     0.18
    })
  );
  icoA.position.set(4.5, 0.8, -1.5);
  scene.add(icoA);

  /* ─── Secondary icosahedron (small, white) ────────── */
  const icoB = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 0),
    new THREE.MeshBasicMaterial({
      color:       0xffffff,
      wireframe:   true,
      transparent: true,
      opacity:     0.07
    })
  );
  icoB.position.set(-4.8, -2, -3.5);
  scene.add(icoB);

  /* ─── Octahedron floating top-left ───────────────── */
  const oct = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.1, 0),
    new THREE.MeshBasicMaterial({
      color:       0x2553e8,
      wireframe:   true,
      transparent: true,
      opacity:     0.12
    })
  );
  oct.position.set(-2.0, 3.2, -5);
  scene.add(oct);

  /* ─── Torus on the right ─────────────────────────── */
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.45, 6, 12),
    new THREE.MeshBasicMaterial({
      color:       0x2553e8,
      wireframe:   true,
      transparent: true,
      opacity:     0.09
    })
  );
  torus.position.set(6.5, -3, -4);
  scene.add(torus);

  /* ─── Mouse parallax ──────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let camX   = 0, camY   = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ─── Scroll offset ───────────────────────────────── */
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  /* ─── Resize ──────────────────────────────────────── */
  const ro = new ResizeObserver(() => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
  ro.observe(canvas);

  /* ─── Animate ─────────────────────────────────────── */
  const clock   = new THREE.Clock();
  let visible   = !document.hidden;

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const t      = clock.getElapsedTime();
    const scrollP = Math.min(scrollY / window.innerHeight, 1);
    const fadeOut = 1 - scrollP * 0.95;

    /* Rotations */
    icoA.rotation.y = t * 0.12;
    icoA.rotation.x = t * 0.06;
    icoB.rotation.y = -t * 0.22;
    icoB.rotation.z = t * 0.11;
    oct.rotation.y  = t * 0.28;
    oct.rotation.x  = t * 0.18;
    torus.rotation.y = t * 0.09;
    torus.rotation.x = t * 0.15;
    particles.rotation.y = t * 0.018;
    particles.rotation.x = Math.sin(t * 0.04) * 0.04;

    /* Scroll-based fade */
    icoA.material.opacity  = 0.18 * fadeOut;
    icoB.material.opacity  = 0.07 * fadeOut;
    oct.material.opacity   = 0.12 * fadeOut;
    torus.material.opacity = 0.09 * fadeOut;
    pMat.opacity           = 0.6  * fadeOut;

    /* Gentle vertical drift on scroll */
    icoA.position.y = 0.8  + scrollY * 0.003;
    icoB.position.y = -2.0 - scrollY * 0.002;

    /* Camera parallax */
    camX += (mouseX * 0.45 - camX) * 0.028;
    camY += (-mouseY * 0.32 - camY) * 0.028;
    camera.position.x = camX;
    camera.position.y = camY;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();
})();
