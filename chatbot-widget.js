(function () {
  'use strict';

  /* ── Conversation tree ─────────────────────────────────────
     Each node: { message, buttons: [{ label, action, style? }] }
     action: string key → navigate to that node
             'link:<url>' → open url
             'start' → go back to root
  ────────────────────────────────────────────────────────── */
  const FLOW = {
    start: {
      message: 'Hei! 👋 Hva kan jeg hjelpe deg med?',
      buttons: [
        { label: 'Hva koster en nettside?', action: 'pricing' },
        { label: 'Hvor lang tid tar det?', action: 'timeline' },
        { label: 'Hva er inkludert?', action: 'included' },
        { label: 'Jeg vil ta kontakt', action: 'contact' },
      ],
    },
    pricing: {
      message:
        'Prisen avhenger av hva du trenger. Vi har pakker fra <strong>1 999 kr</strong> — og du betaler ikke én krone før du er 100% fornøyd med resultatet.',
      buttons: [
        { label: 'Se priser →', action: 'link:priser.html' },
        { label: 'Tilbake til start', action: 'start', style: 'secondary' },
      ],
    },
    timeline: {
      message:
        'En standard nettside er klar på <strong>3–5 dager</strong>. Vi starter med et utkast du kan gi tilbakemelding på — ingen lang og dyr prosess.',
      buttons: [
        { label: 'Tilbake til start', action: 'start', style: 'secondary' },
      ],
    },
    included: {
      message:
        'Alt er inkludert: design, utvikling, tekst, mobiloptimalisering og Google-synlighet (SEO). Du betaler ikke før du er fornøyd — ingen skjulte kostnader.',
      buttons: [
        { label: 'Tilbake til start', action: 'start', style: 'secondary' },
      ],
    },
    contact: {
      message:
        'Ta gjerne kontakt — vi svarer raskt!<br><br>' +
        '📧 <a href="mailto:andreas@indexdevelopment.no">andreas@indexdevelopment.no</a><br>' +
        '📞 <a href="tel:+4748459686">484 59 686</a>',
      buttons: [
        { label: 'Gå til kontaktside', action: 'link:kontakt.html' },
        { label: 'Tilbake til start', action: 'start', style: 'secondary' },
      ],
    },
  };

  /* ── Build DOM ──────────────────────────────────────────── */
  function buildWidget() {
    /* Inject CSS link if not already present */
    if (!document.querySelector('link[href*="chatbot-widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('chatbot-widget.css', document.currentScript
        ? document.currentScript.src
        : window.location.href).href;
      document.head.appendChild(link);
    }

    /* Bubble button */
    const bubble = document.createElement('button');
    bubble.id = 'cw-bubble';
    bubble.setAttribute('aria-label', 'Åpne chat');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML = `
      <svg class="cw-icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
      </svg>
      <svg class="cw-icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
      <span id="cw-badge" aria-hidden="true"></span>`;

    /* Fix close icon to use stroke instead of fill */
    setTimeout(() => {
      const closeIcon = bubble.querySelector('.cw-icon-close');
      if (closeIcon) {
        closeIcon.style.fill = 'none';
        closeIcon.style.stroke = '#fff';
        closeIcon.style.strokeWidth = '2.5';
        closeIcon.style.strokeLinecap = 'round';
      }
    }, 0);

    /* Chat window */
    const win = document.createElement('div');
    win.id = 'cw-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Chat med Index Development');
    win.setAttribute('aria-modal', 'false');
    win.innerHTML = `
      <div id="cw-header">
        <div class="cw-avatar">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
          </svg>
        </div>
        <div class="cw-header-info">
          <span class="cw-header-name">Index Development</span>
          <span class="cw-header-status">
            <span class="cw-status-dot"></span>
            Tilgjengelig nå
          </span>
        </div>
      </div>
      <div id="cw-messages"></div>
      <div id="cw-buttons"></div>`;

    document.body.appendChild(win);
    document.body.appendChild(bubble);

    return { bubble, win };
  }

  /* ── Render a conversation node ─────────────────────────── */
  function renderNode(key, messagesEl, buttonsEl) {
    const node = FLOW[key];
    if (!node) return;

    /* Add message bubble */
    const msg = document.createElement('div');
    msg.className = 'cw-msg';
    const bub = document.createElement('div');
    bub.className = 'cw-bubble-msg';
    bub.innerHTML = node.message;
    msg.appendChild(bub);
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Render buttons */
    buttonsEl.innerHTML = '';
    node.buttons.forEach(({ label, action, style }) => {
      const btn = document.createElement('button');
      btn.className = 'cw-btn' + (style ? ` ${style}` : '');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        if (action.startsWith('link:')) {
          window.location.href = action.slice(5);
        } else {
          renderNode(action, messagesEl, buttonsEl);
        }
      });
      buttonsEl.appendChild(btn);
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    const { bubble, win } = buildWidget();
    const messagesEl = win.querySelector('#cw-messages');
    const buttonsEl = win.querySelector('#cw-buttons');
    const badge = bubble.querySelector('#cw-badge');
    let opened = false;

    function open() {
      win.classList.add('open');
      bubble.classList.add('open');
      bubble.setAttribute('aria-expanded', 'true');
      badge.classList.add('hidden');
      if (!opened) {
        opened = true;
        renderNode('start', messagesEl, buttonsEl);
      }
    }

    function close() {
      win.classList.remove('open');
      bubble.classList.remove('open');
      bubble.setAttribute('aria-expanded', 'false');
    }

    bubble.addEventListener('click', () => {
      win.classList.contains('open') ? close() : open();
    });

    /* Close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && win.classList.contains('open')) close();
    });

    /* Auto-show badge after 3s to attract attention */
    setTimeout(() => {
      if (!opened) badge.classList.remove('hidden');
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
