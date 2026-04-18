/**
 * lang.js — Index Development language switcher
 * Reads data-no / data-en attributes, swaps text on click.
 * Also supports data-no-placeholder / data-en-placeholder for inputs.
 * Language preference is persisted in localStorage.
 */
(function () {
  'use strict';

  var KEY = 'ix-lang';

  function getLang() {
    return localStorage.getItem(KEY) || 'no';
  }

  function applyLang(lang) {
    // Plain text elements
    document.querySelectorAll('[data-no][data-en]').forEach(function (el) {
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.no;
    });
    // Rich HTML elements
    document.querySelectorAll('[data-no-html][data-en-html]').forEach(function (el) {
      el.innerHTML = lang === 'en' ? el.dataset.enHtml : el.dataset.noHtml;
    });
    // Placeholder attributes
    document.querySelectorAll('[data-no-placeholder][data-en-placeholder]').forEach(function (el) {
      el.placeholder = lang === 'en' ? el.dataset.enPlaceholder : el.dataset.noPlaceholder;
    });
    // <html lang> attribute
    document.documentElement.lang = lang === 'en' ? 'en' : 'no';
  }

  function init() {
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;

    var lang = getLang();
    btn.textContent = lang.toUpperCase();
    applyLang(lang);

    btn.addEventListener('click', function () {
      var next = getLang() === 'no' ? 'en' : 'no';
      localStorage.setItem(KEY, next);
      btn.textContent = next.toUpperCase();
      applyLang(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
