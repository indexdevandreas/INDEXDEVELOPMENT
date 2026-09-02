'use strict';

/* ───────────────────────────────────────────────────────────
   forside-3d.js — sebrastripe-shaderen i konverteringsseksjonen.

   Rå WebGL, ingen biblioteker. Stripene er merkevaren (samme mønster
   som dekoren og logoen), her tegnet som et bølgende felt med falsk
   dybdebelysning så flaten leses som 3D. Hensyn som er tatt:

   - Tegner kun mens panelet er i viewport (IntersectionObserver).
   - prefers-reduced-motion: ett stillbilde, ingen animasjon.
   - DPR er begrenset til 1.75 så 4K-skjermer ikke koker GPU-en.
   - Feiler WebGL, får panelet en CSS-klasse med statisk fallback.
   ─────────────────────────────────────────────────────────── */

(function () {
  var canvas = document.getElementById('cv3d-canvas');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { antialias: true, alpha: false })
        || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.parentElement.classList.add('cv3d-fallback'); return; }

  var VERT =
    'attribute vec2 p;' +
    'void main(){gl_Position=vec4(p,0.,1.);}';

  /* Verdi-støy + tre oktaver fbm gir det organiske i stripene.
     «Høyden» på stripefeltet belyses via sin cosinus-derivert —
     det er det som gjør at ryggene ser runde og tredimensjonale ut. */
  var FRAG =
    'precision mediump float;' +
    'uniform vec2 uR;uniform float uT;uniform vec2 uM;' +
    'float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}' +
    'float noi(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);' +
      'return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}' +
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noi(p);p*=2.03;a*=.5;}return v;}' +
    'void main(){' +
      'vec2 uv=(gl_FragCoord.xy-.5*uR)/uR.y;' +
      'float t=uT*.05;' +
      /* skrå stripeakse, som dekoren */
      'float an=-.42;mat2 R=mat2(cos(an),-sin(an),sin(an),cos(an));' +
      'vec2 q=R*uv;' +
      /* moderat vridning: bølger, ikke tåke */
      'float w=fbm(q*vec2(1.1,2.2)+vec2(t,-t*.7))-.5;' +
      'float phase=q.y*10.5+w*3.4+fbm(q*3.1+t*.5)*1.1+uM.x*.5;' +
      'float band=sin(phase);' +
      'float stripe=smoothstep(-.16,.16,band);' +
      'vec3 dark=vec3(.045,.045,.05);' +
      'vec3 ivory=vec3(.94,.94,.90);' +
      'vec3 col=mix(dark,ivory,stripe);' +
      /* rund rygg: lys følger stripen med litt forsinket fase */
      'float ridge=pow(.5+.5*cos(phase-.7),2.2);' +
      'col*=.38+.78*ridge;' +
      'float glow=smoothstep(1.3,.1,length(uv-vec2(.78,-.4)));' +
      'col=mix(col,vec3(.83,1.,.24),glow*stripe*.42);' +
      'float vig=smoothstep(1.6,.6,length(uv*vec2(.75,1.1)));' +
      'col*=.62+.38*vig;' +
      'gl_FragColor=vec4(col,1.);}';

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  var vs = shader(gl.VERTEX_SHADER, VERT);
  var fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.parentElement.classList.add('cv3d-fallback'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uR = gl.getUniformLocation(prog, 'uR');
  var uT = gl.getUniformLocation(prog, 'uT');
  var uM = gl.getUniformLocation(prog, 'uM');

  var mx = 0, my = 0, tmx = 0, tmy = 0;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== (w * dpr | 0) || canvas.height !== (h * dpr | 0)) {
      canvas.width = w * dpr | 0;
      canvas.height = h * dpr | 0;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  function draw(t) {
    size();
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, t);
    gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* Førstebilde med en gang, uavhengig av observeren under: panelet
     skal aldri kunne stå tomt selv om IO aldri rekker å fyre. */
  requestAnimationFrame(function () { draw(7.0); });
  window.addEventListener('resize', size);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; /* stillbildet over er alt som tegnes */
  }

  /* Bare desktop-pekere styrer parallaksen; på touch ville det kranglet
     med rulling. */
  if (window.matchMedia('(pointer: fine)').matches) {
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tmy = ((e.clientY - r.top) / r.height - 0.5) * -2;
    });
  }

  var raf = 0, start = performance.now();
  function loop(now) {
    draw((now - start) / 1000);
    raf = requestAnimationFrame(loop);
  }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      if (!raf) raf = requestAnimationFrame(loop);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }, { rootMargin: '80px' }).observe(canvas);
})();
