(function () {
  'use strict';

  /* ── Ekte AI-chat ──────────────────────────────────────────
     Widgeten snakker med /api/chat (Cloudflare Pages Function)
     som proxyer til Anthropic-API-et og streamer svaret som SSE.
     API-nøkkelen finnes kun på serversiden.
     Historikken ligger i sessionStorage så samtalen overlever
     sidebytte, men nullstilles når fanen lukkes.
  ────────────────────────────────────────────────────────── */

  const API_URL = '/api/chat';
  const STORE_KEY = 'cw-history-v1';
  const WELCOME =
    'Hei! 👋 Jeg er AI-assistenten til Index Development. ' +
    'Spør meg om priser, tjenester eller hvordan du kommer i gang.';
  const STARTERS = [
    'Hva koster en nettside?',
    'Hva kan dere bygge?',
    'Hvor lang tid tar det?',
  ];
  const ERROR_MSG =
    'Beklager, jeg fikk ikke kontakt med serveren akkurat nå. ' +
    'Prøv igjen om litt, eller send en e-post til ' +
    '<a href="mailto:andreas@indexdevelopment.no">andreas@indexdevelopment.no</a>.';

  /* Samtalehistorikk i API-format: [{role, content}] */
  let history = [];
  let busy = false;

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) history = JSON.parse(raw);
    } catch { history = []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history)); } catch {}
  }

  /* ── Formatering av modellsvar ─────────────────────────────
     Alt escapes først (XSS-vern), deretter enkel markdown:
     **fet**, interne stier (/side.html) og e-post blir lenker. */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function formatMessage(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(
      /(^|[\s(])(\/[a-z0-9-]+\.html)/g,
      '$1<a href="$2">$2</a>'
    );
    html = html.replace(
      /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi,
      '<a href="mailto:$1">$1</a>'
    );
    return html.replace(/\n/g, '<br>');
  }

  /* ── Build DOM ──────────────────────────────────────────── */
  function buildWidget() {
    const logoImg = '<img src="/logo.svg" alt="" width="24" height="24">';

    const bubble = document.createElement('button');
    bubble.id = 'cw-bubble';
    bubble.setAttribute('aria-label', 'Åpne chat');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML = `
      <span class="cw-icon-chat">${logoImg}</span>
      <svg class="cw-icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
      <span id="cw-badge" aria-hidden="true"></span>`;

    const win = document.createElement('div');
    win.id = 'cw-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Chat med Index Development');
    win.setAttribute('aria-modal', 'false');
    win.innerHTML = `
      <div id="cw-header">
        <div class="cw-avatar">${logoImg}</div>
        <div class="cw-header-info">
          <span class="cw-header-name">Index Development</span>
          <span class="cw-header-status">
            <span class="cw-status-dot"></span>
            AI-assistent
          </span>
        </div>
      </div>
      <div id="cw-messages" aria-live="polite"></div>
      <div id="cw-buttons"></div>
      <form id="cw-inputrow" autocomplete="off">
        <input id="cw-input" type="text" maxlength="1000"
               placeholder="Skriv en melding …" aria-label="Skriv en melding">
        <button id="cw-send" type="submit" aria-label="Send">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 11.5 21 3l-8.5 18-2.4-7.1L3 11.5Z"/>
          </svg>
        </button>
      </form>`;

    document.body.appendChild(win);
    document.body.appendChild(bubble);
    return { bubble, win };
  }

  /* ── Meldingsbobler ────────────────────────────────────── */
  function addBubble(messagesEl, html, who) {
    const msg = document.createElement('div');
    msg.className = 'cw-msg' + (who === 'user' ? ' cw-user' : '');
    const bub = document.createElement('div');
    bub.className = 'cw-bubble-msg';
    bub.innerHTML = html;
    msg.appendChild(bub);
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bub;
  }

  function addTyping(messagesEl) {
    const bub = addBubble(
      messagesEl,
      '<span class="cw-dot"></span><span class="cw-dot"></span><span class="cw-dot"></span>',
      'bot'
    );
    bub.classList.add('cw-typing');
    return bub;
  }

  function renderStarters(buttonsEl, onPick) {
    buttonsEl.innerHTML = '';
    STARTERS.forEach((label) => {
      const btn = document.createElement('button');
      btn.className = 'cw-btn';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => onPick(label));
      buttonsEl.appendChild(btn);
    });
  }

  /* ── Send + stream ─────────────────────────────────────── */
  async function send(text, ui) {
    if (busy || !text.trim()) return;
    busy = true;
    ui.buttonsEl.innerHTML = '';
    ui.input.disabled = true;
    ui.sendBtn.disabled = true;

    addBubble(ui.messagesEl, escapeHtml(text), 'user');
    history.push({ role: 'user', content: text });
    saveHistory();

    const typing = addTyping(ui.messagesEl);
    let answer = '';
    let answerBubble = null;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); /* siste linje kan være ufullstendig */

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let ev;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
            answer += ev.delta.text;
            if (!answerBubble) {
              typing.remove();
              answerBubble = addBubble(ui.messagesEl, '', 'bot');
            }
            answerBubble.innerHTML = formatMessage(answer);
            ui.messagesEl.scrollTop = ui.messagesEl.scrollHeight;
          } else if (ev.type === 'error') {
            throw new Error(ev.error && ev.error.message);
          }
        }
      }

      if (!answer) throw new Error('Tomt svar');
      history.push({ role: 'assistant', content: answer });
      saveHistory();
    } catch (err) {
      typing.remove();
      if (answerBubble) answerBubble.remove();
      /* Rull tilbake brukermeldingen så historikken forblir gyldig */
      if (history.length && history[history.length - 1].role === 'user') {
        history.pop();
        saveHistory();
      }
      addBubble(ui.messagesEl, ERROR_MSG, 'bot');
    } finally {
      busy = false;
      ui.input.disabled = false;
      ui.sendBtn.disabled = false;
      ui.input.focus();
    }
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    const { bubble, win } = buildWidget();
    const messagesEl = win.querySelector('#cw-messages');
    const buttonsEl = win.querySelector('#cw-buttons');
    const form = win.querySelector('#cw-inputrow');
    const input = win.querySelector('#cw-input');
    const sendBtn = win.querySelector('#cw-send');
    const badge = bubble.querySelector('#cw-badge');
    const ui = { messagesEl, buttonsEl, input, sendBtn };
    let opened = false;

    loadHistory();

    function renderExisting() {
      addBubble(messagesEl, WELCOME, 'bot');
      if (history.length === 0) {
        renderStarters(buttonsEl, (label) => send(label, ui));
      } else {
        history.forEach((m) => {
          addBubble(
            messagesEl,
            m.role === 'user' ? escapeHtml(m.content) : formatMessage(m.content),
            m.role === 'user' ? 'user' : 'bot'
          );
        });
      }
    }

    function open() {
      win.classList.add('open');
      bubble.classList.add('open');
      bubble.setAttribute('aria-expanded', 'true');
      badge.classList.add('hidden');
      if (!opened) {
        opened = true;
        renderExisting();
      }
      input.focus();
    }

    function close() {
      win.classList.remove('open');
      bubble.classList.remove('open');
      bubble.setAttribute('aria-expanded', 'false');
    }

    bubble.addEventListener('click', () => {
      win.classList.contains('open') ? close() : open();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value;
      input.value = '';
      send(text, ui);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && win.classList.contains('open')) close();
    });

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
