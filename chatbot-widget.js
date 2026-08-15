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
      message: 'Hei! 👋 Hva lurer du på?',
      buttons: [
        { label: 'Hva koster det?', action: 'pricing' },
        { label: 'Hvor lang tid tar det?', action: 'timeline' },
        { label: 'Hva kan dere bygge?', action: 'services' },
        { label: 'Jeg vet ikke helt hva jeg trenger', action: 'usikker' },
        { label: 'Jeg vil bare ta kontakt', action: 'contact', style: 'secondary' },
      ],
    },
    pricing: {
      message:
        'Nettsider har fastpris — fra <strong>2 900 kr</strong>, og tallene står på prissiden.<br><br>' +
        'AI-agenter, systemer og integrasjoner prises etter at du har beskrevet hva du trenger. ' +
        'Du får alltid fastpris skriftlig før noe bygges.',
      buttons: [
        { label: 'Se prisene →', action: 'link:priser.html' },
        { label: 'Beskriv hva jeg trenger →', action: 'link:kom-i-gang.html' },
        { label: 'Tilbake', action: 'start', style: 'secondary' },
      ],
    },
    timeline: {
      message:
        '<strong>Fem dager</strong> fra du tar kontakt til du ser din egen løsning live.<br><br>' +
        'For nettsider er det et ferdig utkast. For større systemer en fungerende demo — ' +
        'selve byggetiden avtaler vi etterpå, med skriftlig tidsplan.',
      buttons: [
        { label: 'Sett i gang →', action: 'link:kom-i-gang.html' },
        { label: 'Tilbake', action: 'start', style: 'secondary' },
      ],
    },
    services: {
      message:
        'Seks ting, alt håndkodet fra bunnen:<br><br>' +
        '• Nettsider, SEO og utvikling<br>' +
        '• AI-agenter og chatbots<br>' +
        '• Systemutvikling<br>' +
        '• API-integrasjoner<br>' +
        '• Booking-systemer<br>' +
        '• Drift og vedlikehold',
      buttons: [
        { label: 'Se alle tjenester →', action: 'link:tjenester.html' },
        { label: 'Tilbake', action: 'start', style: 'secondary' },
      ],
    },
    usikker: {
      message:
        'Det er de fleste som ikke gjør — og det er helt greit.<br><br>' +
        'Veiviseren stiller spørsmålene for deg, så slipper du å formulere det selv. ' +
        'Svarene blir til en beskrivelse Andreas får rett i innboksen, og du får forslag ' +
        'og pris tilbake skriftlig. Tar under to minutter.',
      buttons: [
        { label: 'Ta veiviseren →', action: 'link:kom-i-gang.html' },
        { label: 'Tilbake', action: 'start', style: 'secondary' },
      ],
    },
    contact: {
      message:
        'Raskeste vei er å beskrive hva du trenger — da har Andreas alt han trenger for å svare skikkelig.<br><br>' +
        'Vil du heller skrive fritt:<br>' +
        '📧 <a href="mailto:andreas@indexdevelopment.no">andreas@indexdevelopment.no</a><br>' +
        '📞 <a href="tel:+4748459686">484 59 686</a>',
      buttons: [
        { label: 'Beskriv hva jeg trenger →', action: 'link:kom-i-gang.html' },
        { label: 'Gå til kontaktsiden', action: 'link:kontakt.html', style: 'secondary' },
        { label: 'Tilbake', action: 'start', style: 'secondary' },
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
        closeIcon.style.stroke = '#0a0a0a';   /* boblen er limegrønn */
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
