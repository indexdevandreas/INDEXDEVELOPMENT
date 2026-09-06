'use strict';

/* ───────────────────────────────────────────────────────────
   forside-3d.js — WebGL-flatene på forsiden, som komponent.

   Rå WebGL, ingen biblioteker. Ett fragment-program med to modus,
   montert på hvert <canvas data-striper="…"> med en forhåndsinnstilling
   per navn:

     hero   — «riflet glass» (mode 1): shaderen tegner selve den
              lyseblå gradienten fra forside.css, legger langsomme
              bølger over den, og ser alt gjennom loddrette glassriller
              som klemmer bølgene og har søm, høylys og skygge. Driver
              sakte, lener seg etter pekeren, og roer seg bak teksten.
              Full oppløsning (rillekantene skal være skarpe), og den
              pauser når arket har dekket heroen (klassen is-past).
     panel  — sebrastriper (mode 0): konverteringspanelet, skarpe
              elfenbenstriper som et bølgende felt med falsk dybde-
              belysning og lime-glød.

   Hensyn som er tatt, for hvert lerret:
   - Tegner kun mens det er i viewport (IntersectionObserver).
   - Tiden akkumuleres bare mens det tegnes, så ingenting hopper når
     lerretet kommer tilbake i bildet.
   - Toner inn (klassen is-on) når første bilde er tegnet.
   - prefers-reduced-motion: ett stillbilde, ingen animasjon.
   - DPR er begrenset, og på berøringsskjermer holder 30 bilder i
     sekundet for den langsomme drivingen.
   - Feiler WebGL, får forelderen klassen «striper-fallback» — for
     heroen betyr det at CSS-gradienten står alene.
   ─────────────────────────────────────────────────────────── */

(function () {
  var canvases = document.querySelectorAll('canvas[data-striper]');
  if (!canvases.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = window.matchMedia('(pointer: fine)').matches;

  var PRESETS = {
    panel: {
      mode: 0,
      /* Dempet med vilje: skarp elfenben mot sort i full fart over et
         stort panel gjorde vondt i øynene. Gråere lys, mykere kanter,
         færre og roligere bølger, halv fart, mindre lime. */
      angle: -0.42, density: 8.0, warp: 2.4, soft: 0.34,
      dark: [0.045, 0.045, 0.05], light: [0.56, 0.56, 0.54],
      glow: [0.78, -0.4], glowAmt: 0.2, vig: 1,
      rib: 0, mag: 0,
      speed: 0.5, dpr: 1.5, scale: 1, still: 7.0,
      /* Utoning av: x-terskelen ligger langt til venstre for bildet,
         y-terskelen langt over. */
      fade: function () { return [-10, -9, 9, 10]; }
    },
    /* Konverteringspanelet: samme riflede blå glass som heroen, men
       uten utoning — kortene ligger oppå med eget slør. */
    konv: {
      mode: 1,
      angle: -0.36, density: 5.6, warp: 2.4, soft: 0.3,
      dark: [0, 0, 0], light: [0, 0, 0],
      glow: [0, 0], glowAmt: 0, vig: 0,
      rib: 0.019, mag: 2.0,
      speed: 1.1, dpr: 1.5, scale: 1, still: 5.0, drift: 1.0,
      fade: function () { return [-10, -9, 9, 10]; }
    },
    hero: {
      mode: 1,
      angle: -0.36, density: 5.6, warp: 2.4, soft: 0.3,
      dark: [0, 0, 0], light: [0, 0, 0],
      glow: [0, 0], glowAmt: 0, vig: 0,
      /* Rillene: bredde som andel av lerretets CSS-bredde (min 24px), og
         hvor hardt hver rille klemmer bølgene bak seg. Full oppløsning,
         ellers blir sømmene og høylysene i rillene uskarpe. */
      rib: 0.019, mag: 2.0,
      /* Rolig i seg selv: bølgene driver sakte, et lysstreif går over
         glasset hvert åttende sekund, og gløden i flaten flytter seg.
         Det sterke skjer der pekeren er (uM/uP i shaderen). */
      speed: 1.5, dpr: 1.25, scale: 1, still: 11.0, drift: 1.0,
      /* Telefon: 1× holder. 1,25× på en 3×-skjerm er uansett uskarpt,
         og det er 36 % færre piksler å regne for hvert bilde. */
      dprTouch: 1.0,
      /* uv er normalisert på høyden: y går fra -0.5 (bunn) til 0.5
         (topp), x fra -aspekt/2 til aspekt/2.
         Landskap: teksten står til venstre → roes mot venstre og
         toppen. Portrett (mobil): teksten står øverst → bare toppen. */
      fade: function (w, h) {
        return w < h ? [-10, -9, -0.1, 0.4] : [-0.62, 0.12, 0.18, 0.62];
      }
    }
  };

  var VERT =
    'attribute vec2 p;' +
    'void main(){gl_Position=vec4(p,0.,1.);}';

  /* Verdi-støy + tre oktaver fbm gir det organiske i bølgene.
     «Høyden» på feltet belyses via sin cosinus-derivert — det er det
     som gjør at ryggene ser runde og tredimensjonale ut.
     grad() er en kopi av heroens CSS-gradient (118°, fire stopp, og
     den lyseblå gløden oppe til høyre) — må holdes lik forside.css. */
  var FRAG =
    'precision mediump float;' +
    'uniform vec2 uR;uniform float uT;uniform vec2 uM;' +
    'uniform float uAng,uDen,uWarp,uSoft,uGlowAmt,uVig,uMode,uRib,uMag,uP;' +
    'uniform vec3 uDark,uLight;uniform vec2 uGlow;uniform vec4 uFade;' +
    'float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}' +
    'float noi(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);' +
      'return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}' +
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noi(p);p*=2.03;a*=.5;}return v;}' +
    'vec3 grad(vec2 uv,float asp,float tt){' +
      'vec2 g=vec2(.883,-.469);' +
      'float t=clamp(dot(uv,g)/(.883*asp*.5+.469*.5)*.5+.5,0.,1.);' +
      'vec3 c0=vec3(.039,.29,.573),c1=vec3(.059,.373,.706),c2=vec3(.169,.51,.8),c3=vec3(.424,.69,.867);' +
      'vec3 b=t<.32?mix(c0,c1,t/.32):(t<.62?mix(c1,c2,(t-.32)/.3):mix(c2,c3,(t-.62)/.38));' +
      'vec2 d=(uv-vec2(.26*asp+.07*sin(tt*.21),.36+.05*cos(tt*.17)))/vec2(.575*asp,.425);' +
      'float gl=smoothstep(1.,0.,length(d));' +
      'return mix(b,vec3(.59,.8,.95),gl*.5);}' +
    'void main(){' +
      'vec2 uv=(gl_FragCoord.xy-.5*uR)/uR.y;' +
      'float asp=uR.x/uR.y;' +
      'float t=uT*.05;' +
      /* riflet glass: hver rille (uRib px bred) er en liten sylinder-
         linse som forskyver det den viser sidelengs — det er den
         klemmingen av bølgene bak som gjør at det leses som glass */
      /* pekeren: uM er pekerens posisjon i samme koordinater som uv,
         uP er 0–1 for om den er over heroen. near er en myk sirkel
         rundt den, ~480px i diameter. */
      'float near=smoothstep(.55,0.,length(uv-uM))*uP;' +
      'float xr=gl_FragCoord.x/uRib;' +
      'float f=fract(xr);' +
      'vec2 uvr=uv;' +
      'uvr.x+=sin((f-.5)*3.14159)*.5*(uRib/uR.y)*uMag*(1.+near*.6);' +
      /* skrå akse, som dekoren */
      'mat2 R=mat2(cos(uAng),-sin(uAng),sin(uAng),cos(uAng));' +
      'vec2 q=R*uvr;' +
      /* moderat vridning: bølger, ikke tåke */
      'float w=fbm(q*vec2(1.1,2.2)+vec2(t,-t*.7))-.5;' +
      'float phase=q.y*uDen+w*uWarp+fbm(q*3.1+t*.5)*1.1+uM.x*.4+near*1.1;' +
      'float stripe=smoothstep(-uSoft,uSoft,sin(phase));' +
      /* rund rygg: lys følger stripen med litt forsinket fase */
      'float ridge=pow(.5+.5*cos(phase-.7),2.2);' +
      /* utoning mot flaten der teksten står */
      'float fx=smoothstep(uFade.x,uFade.y,uv.x);' +
      'float fy=1.-smoothstep(uFade.z,uFade.w,uv.y);' +
      'vec3 col;' +
      'if(uMode>.5){' +
        /* glass: gradienten skyggelegges mykt av bølgene, og ryggene
           får et tynt, skarpt høylys */
        'vec3 g=grad(uvr,asp,uT)*(.84+.26*ridge);' +
        'g+=vec3(.9,.96,1.)*pow(ridge,9.)*stripe*(.2+.35*near);' +
        /* mykt lys bak glasset der pekeren er */
        'g+=vec3(.80,.90,1.)*near*.16;' +
        /* lysstreif: et mykt, skrått bånd som går over glasset fra
           venstre mot høyre, ett hvert ~8. sekund */
        'float sp=fract(uT*.12)*3.2-1.6;' +
        'float sw=exp(-pow((uvr.x*.75-uv.y*.35-sp)*2.4,2.))*.10;' +
        'g+=vec3(.85,.93,1.)*sw;' +
        /* lys i rillen: mørk søm i kantene, høylys som puster, skygge */
        'float edge=smoothstep(0.,.06,f)*smoothstep(1.,.94,f);' +
        'float hl=exp(-pow((f-.28)*6.,2.))*(.09+.06*sin(uT*.8+xr*.25))*(1.+near*1.8);' +
        'float sh=exp(-pow((f-.84)*6.5,2.))*.10*(1.+near*.7);' +
        'g=g*(1.-.14*(1.-edge)-sh)+hl;' +
        /* bak teksten: ren gradient med bare et hint av riller og streif */
        'vec3 plain=grad(uv,asp,uT);' +
        'plain=plain*(1.-.08*(1.-edge)-.5*sh)+hl*.5+vec3(.85,.93,1.)*sw*.5;' +
        'col=mix(plain,g,fx*fy);' +
      '}else{' +
        'col=mix(uDark,uLight,stripe);' +
        'col*=.38+.78*ridge;' +
        /* lime-glød på de lyse ryggene */
        'float glow=smoothstep(1.3,.1,length(uv-uGlow));' +
        'col=mix(col,vec3(.83,1.,.24),glow*stripe*uGlowAmt);' +
        'float vig=smoothstep(1.6,.6,length(uv*vec2(.75,1.1)));' +
        'col*=mix(1.,.62+.38*vig,uVig);' +
        'col=mix(uDark,col,fx*fy);' +
      '}' +
      'gl_FragColor=vec4(col,1.);}';

  function fail(canvas) {
    canvas.parentElement.classList.add('striper-fallback');
  }

  function mount(canvas, P) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
          || canvas.getContext('experimental-webgl');
    if (!gl) { fail(canvas); return; }

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT);
    var fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { fail(canvas); return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fail(canvas); return; }
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uR', 'uT', 'uM', 'uP', 'uAng', 'uDen', 'uWarp', 'uSoft', 'uGlowAmt', 'uVig', 'uMode', 'uRib', 'uMag',
     'uDark', 'uLight', 'uGlow', 'uFade'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    /* Alt som ikke endrer seg settes én gang */
    gl.uniform1f(U.uMode, P.mode);
    gl.uniform1f(U.uAng, P.angle);
    gl.uniform1f(U.uDen, P.density);
    gl.uniform1f(U.uWarp, P.warp);
    gl.uniform1f(U.uSoft, P.soft);
    gl.uniform1f(U.uGlowAmt, P.glowAmt);
    gl.uniform1f(U.uVig, P.vig);
    gl.uniform1f(U.uMag, P.mag);
    gl.uniform1f(U.uRib, 1000);
    gl.uniform3f(U.uDark, P.dark[0], P.dark[1], P.dark[2]);
    gl.uniform3f(U.uLight, P.light[0], P.light[1], P.light[2]);
    gl.uniform2f(U.uGlow, P.glow[0], P.glow[1]);

    /* Peker i uv-koordinater (x: ±aspekt/2, y: ±0.5), og pa = om den
       er over flaten (0–1). Alle tre glir mot målet sitt per bilde. */
    var mx = 0, my = 0, tmx = 0, tmy = 0, pa = 0, tpa = 0;
    /* asp settes i size(); hovering/driven sier om noen andre enn
       driften nedenfor styrer punktet akkurat nå. */
    var asp = 1, hovering = false, driven = false;

    function size() {
      var cap = (!fine && P.dprTouch) ? P.dprTouch : P.dpr;
      var dpr = Math.min(window.devicePixelRatio || 1, cap) * P.scale;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return false;
      var W = (w * dpr) | 0, H = (h * dpr) | 0;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        gl.viewport(0, 0, W, H);
        gl.uniform2f(U.uR, W, H);
        asp = w / (h || 1);
        var f = P.fade(w, h);
        gl.uniform4f(U.uFade, f[0], f[1], f[2], f[3]);
        if (P.rib) gl.uniform1f(U.uRib, Math.max(24, w * P.rib) * (W / w));
      }
      return true;
    }

    function draw(t) {
      if (!size()) return;
      mx += (tmx - mx) * 0.08;
      my += (tmy - my) * 0.08;
      pa += (tpa - pa) * 0.06;
      gl.uniform1f(U.uT, t);
      gl.uniform2f(U.uM, mx, my);
      gl.uniform1f(U.uP, pa);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* Førstebilde med en gang, uavhengig av observeren under: feltet
       skal aldri kunne stå tomt selv om IO aldri rekker å fyre. */
    requestAnimationFrame(function () {
      draw(P.still);
      canvas.classList.add('is-on');
    });

    if (reduce) {
      /* Stillbildet er alt som tegnes — men det må tegnes på nytt når
         lerretet skifter størrelse, ellers står det tomt etter en
         rotasjon av telefonen. */
      window.addEventListener('resize', function () { draw(P.still); });
      return;
    }
    window.addEventListener('resize', size);

    /* Bare desktop-pekere styrer dette; på touch ville det kranglet
       med rulling. Rektangelet måles ved inngang, ikke per bevegelse.
       Ved utgang glir lyset ned (tpa = 0) i stedet for å slukke. */
    if (fine) {
      var host = canvas.parentElement, rect = null;
      host.addEventListener('pointerenter', function () {
        rect = host.getBoundingClientRect();
        hovering = true;
        tpa = 1;
      });
      host.addEventListener('pointermove', function (e) {
        if (!rect) rect = host.getBoundingClientRect();
        var w = rect.width || 1, h = rect.height || 1;
        tmx = ((e.clientX - rect.left) / w - 0.5) * (w / h);
        tmy = 0.5 - (e.clientY - rect.top) / h;
      }, { passive: true });
      host.addEventListener('pointerleave', function () { rect = null; hovering = false; tpa = 0; });
    }

    /* Andre skript kan styre lyset: forside.js sender rulleposisjonen
       i konverteringspanelet hit (x/y i 0–1 av lerretet). */
    canvas.addEventListener('striper:point', function (e) {
      var d = e.detail || {};
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      if (typeof d.x === 'number') tmx = (d.x - 0.5) * (w / h);
      if (typeof d.y === 'number') tmy = 0.5 - d.y;
      driven = !!d.on;
      tpa = d.on ? 1 : 0;
    });

    /* ── Glasset skal leve av seg selv ──
       Det sterke punktet fulgte bare musepekeren. På telefon finnes
       ingen pointerenter, så flaten sto helt stille bortsett fra den
       langsomme bølgen bak — den leste som et stillbilde. Uten peker
       (og når pekeren er utenfor) vandrer punktet nå selv i en rolig
       figur som aldri gjentar seg helt. Ingen ekstra kostnad: samme
       tegning, bare et annet mål for uM/uP. */
    var drift = P.drift || 0;
    var raf = 0, prev = 0, acc = P.still;
    /* Full bildefrekvens også på telefon: 30 fps så hakkete ut ved
       siden av PC-versjonen, og shaderen er lett nok (dpr er alt
       tatt ned i presetene) til at det holder seg kjølig. */
    var minGap = 0;
    var parent = canvas.parentElement;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      /* Heroen står festet bak hele siden og er alltid «i viewport»
         for observeren. forside.js setter is-past når arket har dekket
         den — da er det ingenting å tegne for. */
      if (parent.classList.contains('is-past')) { prev = 0; return; }
      /* … og mens den glir bort (is-receding, forside.js) står siste
         bilde: flaten roterer og krymper, så stillstanden synes ikke,
         og telefonen slipper shaderen oppå rotasjonen. */
      if (parent.classList.contains('is-receding')) { prev = 0; return; }
      if (now - prev < minGap) return;
      if (prev) acc += (now - prev) / 1000 * P.speed;
      prev = now;
      if (drift && !hovering && !driven) {
        /* Uten peker går punktet raskere og videre enn en hånd ville
           gjort — det er hele livet i flaten på en telefon. */
        var a = acc * (fine ? 0.22 : 0.34);
        tmx = Math.sin(a) * (fine ? 0.3 : 0.38) * asp;
        tmy = Math.sin(a * 0.61 + 1.9) * (fine ? 0.26 : 0.32);
        tpa = drift;
      }
      draw(acc);
    }

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!raf) { prev = 0; raf = requestAnimationFrame(loop); }
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { rootMargin: '80px' }).observe(canvas);
  }

  canvases.forEach(function (c) {
    var P = PRESETS[c.getAttribute('data-striper')];
    if (P) mount(c, P);
  });
})();
