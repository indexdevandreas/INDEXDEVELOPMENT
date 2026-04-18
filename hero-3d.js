/**
 * Index Development — Hero Shader Background
 *
 * Performance-first design:
 *  - Only 3 noise samples total (vs. 30 in the fBm version)
 *  - No loops, no matrix ops inside the shader
 *  - lowp precision — GPU processes twice as fast on mobile
 *  - antialias: false
 *  - pixelRatio capped at 2
 *  - pointer-events: none  (canvas never blocks scroll / touch)
 *
 * Visual: Smooth domain-warped value noise → aurora / flowing-silk look.
 * Palette: #0a0a2e · #1a56db · #2d004d on near-black ground.
 */
(function () {
  'use strict';

  /* ─── Vertex shader ─────────────────────────────────────────────── */
  var VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}';

  /* ─── Fragment shader ───────────────────────────────────────────── */
  /* lowp = half-float arithmetic on mobile = 2× faster than mediump  */
  var FRAG = [
    'precision lowp float;',
    'uniform float uTime;',
    'uniform vec2  uRes;',
    'varying vec2  vUv;',

    /* ── Fast value-noise hash (no trig, no sin/cos) ── */
    'float hash(vec2 p){',
    '  p=fract(p*vec2(234.34,435.345));',
    '  p+=dot(p,p+34.23);',
    '  return fract(p.x*p.y);',
    '}',

    /* ── Smooth value noise – 4 hash lookups, smoothstep interp ── */
    'float vn(vec2 p){',
    '  vec2 i=floor(p),f=fract(p);',
    '  vec2 u=f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),',
    '             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);',
    '}',

    'void main(){',
    '  float asp=uRes.x/uRes.y;',
    /* Scale < 1.5 → large sweeping blobs, not small grain */
    '  vec2 p=vUv*vec2(asp,1.0)*1.25;',
    '  float t=uTime*0.035;',   /* very slow — silk-like drift */

    /* ── Domain warp: 2 cheap noise samples drive the distortion ── */
    '  float n1=vn(p+vec2(t*.8,t*.35));',
    '  float n2=vn(p+vec2(-t*.45,t*.65)+3.7);',
    '  vec2 warp=vec2(n1-.5,n2-.5)*1.4;',

    /* ── Final color noise sampled at warped coords ── */
    '  float f=vn(p*.85+warp+vec2(t*.09,-t*.07));',

    /* ── Color palette ── */
    '  vec3 cBase =vec3(0.004,0.004,0.028);',  /* near-black        */
    '  vec3 cBlue =vec3(0.039,0.039,0.180);',  /* #0a0a2e deep blue  */
    '  vec3 cPurp =vec3(0.176,0.000,0.302);',  /* #2d004d deep purple*/
    '  vec3 cRoyal=vec3(0.102,0.337,0.859);',  /* #1a56db royal blue */

    /* ── Blend colors along the noise field ── */
    '  vec3 col=mix(cBase,cBlue,smoothstep(.08,.52,f));',
    '  col=mix(col,cPurp,smoothstep(.32,.72,n2)*.9);',
    '  col=mix(col,cRoyal,smoothstep(.5,.88,f+n1*.22)*.58);',

    /* ── Soft vignette (darken corners) ── */
    '  vec2 v=vUv*2.0-1.0;',
    '  col*=1.0-dot(v,v)*.42;',

    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  /* ─── Three.js setup ─────────────────────────────────────────────── */
  var canvas, renderer, scene, camera, material, clock, rafId;

  function init() {
    canvas = document.getElementById('hero-canvas');
    if (!canvas || !window.THREE) return;

    var THREE = window.THREE;

    renderer = new THREE.WebGLRenderer({
      canvas:    canvas,
      antialias: false,   /* user requirement */
      alpha:     false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); /* user requirement */

    scene  = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    material = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0.0 },
        uRes:  { value: new THREE.Vector2() }
      },
      depthTest:  false,
      depthWrite: false
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    clock = new THREE.Clock();

    resize();
    window.addEventListener('resize', resize, { passive: true });

    animate();
  }

  function resize() {
    if (!canvas || !renderer) return;
    var w = canvas.offsetWidth  || 1;
    var h = canvas.offsetHeight || 1;
    renderer.setSize(w, h, false);               /* false = don't touch CSS */
    material.uniforms.uRes.value.set(w, h);
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }

  /* Stop rendering while page is hidden (battery / CPU saver) */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      clock.getDelta(); /* discard the gap */
      animate();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
