(function () {
  'use strict';

  if (sessionStorage.getItem('idx_intro')) return;
  sessionStorage.setItem('idx_intro', '1');

  document.body.style.overflow = 'hidden';

  /* ── Overlay ── */
  var ov = document.createElement('div');
  ov.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#000;' +
    'display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(ov);

  /* ── Logo ── */
  var dot = document.createElement('div');
  dot.style.cssText =
    'width:0.75rem;height:0.75rem;border-radius:50%;background:#2563eb;' +
    'flex-shrink:0;margin-right:0.55rem;';

  var txt = document.createElement('span');
  txt.textContent = 'index dev.';
  txt.style.cssText =
    'font-family:"Space Grotesk",Arial,sans-serif;' +
    'font-size:clamp(1.8rem,4vw,2.6rem);font-weight:700;' +
    'letter-spacing:-0.03em;color:#fff;';

  var logo = document.createElement('div');
  logo.style.cssText = 'display:flex;align-items:center;';
  logo.appendChild(dot);
  logo.appendChild(txt);
  ov.appendChild(logo);

  /* ── Split open after short hold ── */
  setTimeout(triggerSplit, 900);

  function triggerSplit() {
    ov.style.display = 'none';

    var top = document.createElement('div');
    var bot = document.createElement('div');
    top.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:50%;' +
      'background:#000;z-index:100000;will-change:transform;';
    bot.style.cssText =
      'position:fixed;bottom:0;left:0;width:100%;height:50%;' +
      'background:#000;z-index:100000;will-change:transform;';
    document.body.appendChild(top);
    document.body.appendChild(bot);

    /* Force reflow so panels start at resting position before transition */
    top.getBoundingClientRect();

    var TR = 'transform 0.85s cubic-bezier(0.83, 0, 0.17, 1)';
    top.style.transition = TR;
    bot.style.transition = TR;
    top.style.transform  = 'translateY(-100%)';
    bot.style.transform  = 'translateY(100%)';

    document.body.style.overflow = '';
    document.documentElement.style.background = '';
    document.documentElement.style.overflow   = '';

    setTimeout(function () {
      if (top.parentNode) top.parentNode.removeChild(top);
      if (bot.parentNode) bot.parentNode.removeChild(bot);
      if (ov.parentNode)  ov.parentNode.removeChild(ov);
    }, 900);
  }

}());
