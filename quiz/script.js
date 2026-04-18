/**
 * Index Development — Quiz Logic
 * Vanilla JS · No dependencies
 */

(function () {
    'use strict';

    // ---- CONFIG ---- //
    const TOTAL_STEPS = 7;

    // Score map: [lokal, bedrift, total] per answer
    const scoreMap = {
        q2: {
            handverk:   [2, 0, 0],
            restaurant: [0, 2, 0],
            konsulent:  [0, 2, 1],
            annet:      [1, 1, 0]
        },
        q3: {
            ingen:  [2, 0, 0],
            darlig: [1, 1, 0],
            ok:     [0, 1, 1]
        },
        q4: {
            leads:     [2, 1, 0],
            salg:      [0, 1, 2],
            info:      [1, 2, 0],
            merkevare: [0, 1, 2]
        },
        q5: {
            '1':   [3, 0, 0],
            '2-3': [1, 2, 0],
            '4-5': [0, 3, 0],
            '6+':  [0, 1, 3]
        },
        q6: {
            nei:    [2, 0, 0],
            delvis: [0, 2, 1],
            ja:     [0, 0, 3]
        },
        q7: {
            lav:     [3, 0, 0],
            middels: [0, 3, 0],
            hoy:     [0, 0, 3],
            usikker: [1, 1, 1]
        }
    };

    // Package definitions
    const packages = [
        {
            id: 'lokal',
            name: 'Lokal Ekspert',
            price: '1.999,-',
            desc: 'Den perfekte starten for enkeltmannsforetak og håndverkere som trenger en solid nettside som skaffer oppdrag — uten unødvendige kostnader.',
            features: [
                'Én kompromissløs landingsside',
                'Håndkodet for maksimal hastighet',
                'Perfekt på alle mobiler og nettbrett',
                'Kontaktskjema som sender leads direkte til deg',
                'Grunnleggende teknisk SEO inkludert'
            ],
            cta: 'Bygg Lokal Ekspert gratis for meg →',
            whyTemplate: (name) =>
                `${name}, basert på svarene dine trenger du en effektiv, presis nettside som fokuserer på å skaffe deg lokale henvendelser. Du trenger ikke masse undersider eller avansert innhold akkurat nå — én skarpt fokusert landingsside gjør jobben bedre og rimeligere enn noe mer komplekst.`
        },
        {
            id: 'bedrift',
            name: 'Bedrift Pluss',
            price: '6.999,-',
            desc: 'For bedrifter som vil dominere lokalt med full nettstedpakke — skreddersydd design, kraftig SEO og en bonus-analyse av konkurrentene dine.',
            features: [
                'Opptil 5 skreddersydde undersider',
                'Skreddersydd design for din bransje',
                'Ekstrem hastighetsoptimalisering',
                'Kraftig SEO-struktur for Google',
                'Analytics og besøksstatistikk',
                'BONUS: Konkurrentanalyse inkludert'
            ],
            cta: 'Bygg Bedrift Pluss gratis for meg →',
            whyTemplate: (name) =>
                `${name}, svarene dine viser at du har behov for en komplett nettside med flere sider og et gjennomtenkt design. Bedrift Pluss gir deg alt du trenger for å slå konkurrentene på Google og konvertere besøkende til betalende kunder — uten å betale for ting du ikke trenger.`
        },
        {
            id: 'total',
            name: 'Totalpakken',
            price: '14.999,-',
            desc: 'Vi designer, koder og skriver alle tekstene dine — en komplett salgsmaskin satt opp til å jobbe for deg døgnet rundt.',
            features: [
                'Ubegrenset antall undersider',
                'Vi skriver alle salgstekster for deg',
                'Konkurransestrategi og dyp analyse',
                'Tolkning av besøkstall inkludert',
                'Prioritert supportkanal',
                'BONUS: Full konkurrentanalyse'
            ],
            cta: 'Bygg Totalpakken gratis for meg →',
            whyTemplate: (name) =>
                `${name}, du har ambisiøse mål og vet at nettsiden skal være en sentral del av veksten din. Totalpakken gir deg alt — inkludert profesjonelle salgstekster, ubegrenset antall sider og en helhetlig strategi for å dominere ditt marked.`
        }
    ];

    // ---- STATE ---- //
    let currentStep = 0;
    let userName = 'deg';
    const answers = {}; // { q2: 'handverk', q3: 'ingen', ... }

    // ---- DOM REFS ---- //
    const heroSection    = document.getElementById('hero-section');
    const quizSection    = document.getElementById('quiz-section');
    const resultSection  = document.getElementById('result-section');
    const startBtn       = document.getElementById('start-btn');
    const progressFill   = document.getElementById('progress-fill');
    const progressLabel  = document.getElementById('progress-label');
    const progressPct    = document.getElementById('progress-pct');

    // ---- UTILS ---- //
    function svgCheck() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/></svg>`;
    }
    function svgArrow() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clip-rule="evenodd"/></svg>`;
    }
    function svgBack() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H3.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L3.56 7.25H13.25A.75.75 0 0 1 14 8Z" clip-rule="evenodd"/></svg>`;
    }
    function svgChevron() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>`;
    }
    function svgTrophy() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clip-rule="evenodd"/></svg>`;
    }
    function svgCircleCheck() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/></svg>`;
    }

    function scrollTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- PROGRESS ---- //
    function updateProgress(step) {
        const pct = Math.round((step / TOTAL_STEPS) * 100);
        progressFill.style.width = pct + '%';
        progressLabel.textContent = 'Spørsmål ' + step + ' av ' + TOTAL_STEPS;
        progressPct.textContent = pct + '%';
    }

    // ---- SHOW STEP ---- //
    function showStep(n) {
        document.querySelectorAll('.q-step').forEach(el => el.classList.remove('active'));
        const el = document.getElementById('step-' + n);
        if (el) {
            el.classList.add('active');
            // Restore previous answer if exists
            const key = 'q' + n;
            if (answers[key] && n > 1) {
                const radio = el.querySelector('input[value="' + answers[key] + '"]');
                if (radio) radio.checked = true;
            }
            // Update next button state for option steps
            if (n > 1) {
                const nextBtn = el.querySelector('.q-btn-next');
                const hasAnswer = !!answers['q' + n];
                if (nextBtn) {
                    nextBtn.disabled = !hasAnswer;
                }
            }
            // Focus first focusable element
            setTimeout(() => {
                const focusable = el.querySelector('input, button:not(:disabled)');
                if (focusable) focusable.focus();
            }, 50);
        }
        currentStep = n;
        updateProgress(n);
        scrollTop();
    }

    // ---- START ---- //
    startBtn.addEventListener('click', function () {
        heroSection.style.display = 'none';
        quizSection.classList.add('visible');
        currentStep = 1;
        showStep(1);
    });

    // ---- RADIO CHANGE ---- //
    document.querySelectorAll('#quiz-section input[type="radio"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            const nextBtn = this.closest('.q-step').querySelector('.q-btn-next');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        });
    });

    // ---- KEYBOARD ON OPTION LABELS ---- //
    document.querySelectorAll('.q-option').forEach(function (label) {
        label.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const radio = label.previousElementSibling;
                if (radio && radio.type === 'radio') {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
        label.setAttribute('tabindex', '0');
        const radio = label.previousElementSibling;
        if (radio) {
            radio.addEventListener('focus', function () { label.classList.add('focused'); });
            radio.addEventListener('blur',  function () { label.classList.remove('focused'); });
        }
    });

    // ---- NEXT BUTTONS ---- //
    document.querySelectorAll('.q-btn-next').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (this.disabled) return;
            const step = parseInt(this.closest('.q-step').id.replace('step-', ''));

            if (step === 1) {
                // Name step
                const val = document.getElementById('name-input').value.trim();
                userName = val ? val.split(' ')[0] : 'deg';
                showStep(2);
                return;
            }

            // Radio step — save answer
            const key = 'q' + step;
            const radio = document.querySelector('#step-' + step + ' input[type="radio"]:checked');
            if (!radio) return;
            answers[key] = radio.value;

            if (step < TOTAL_STEPS) {
                showStep(step + 1);
            } else {
                renderResult();
            }
        });
    });

    // ---- BACK BUTTONS ---- //
    document.querySelectorAll('.q-btn-back').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const step = parseInt(this.closest('.q-step').id.replace('step-', ''));
            if (step > 1) showStep(step - 1);
        });
    });

    // ---- NAME INPUT ENTER KEY ---- //
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                document.querySelector('#step-1 .q-btn-next').click();
            }
        });
    }

    // ---- CALCULATE SCORES ---- //
    function calcScores() {
        let lokal = 0, bedrift = 0, total = 0;
        for (let qKey in scoreMap) {
            const val = answers[qKey];
            if (val && scoreMap[qKey][val]) {
                const [l, b, t] = scoreMap[qKey][val];
                lokal += l; bedrift += b; total += t;
            }
        }
        return { lokal, bedrift, total };
    }

    // ---- RENDER RESULT ---- //
    function renderResult() {
        quizSection.classList.remove('visible');
        resultSection.classList.add('visible');
        scrollTop();

        const s = calcScores();

        // Find winner (highest score; tie → bedrift)
        let winner = packages[1];
        let max = -1;
        packages.forEach(function (p) {
            const score = p.id === 'lokal' ? s.lokal : p.id === 'bedrift' ? s.bedrift : s.total;
            if (score > max) { max = score; winner = p; }
        });

        // Result title
        document.getElementById('result-name').textContent = userName.charAt(0).toUpperCase() + userName.slice(1);

        // Winner card
        document.getElementById('winner-name').textContent   = winner.name;
        document.getElementById('winner-price').textContent  = winner.price;
        document.getElementById('winner-desc').textContent   = winner.desc;
        document.getElementById('winner-why').textContent    = winner.whyTemplate(
            userName.charAt(0).toUpperCase() + userName.slice(1)
        );
        document.getElementById('winner-cta').textContent    = winner.cta;
        document.getElementById('winner-cta').setAttribute('href', '../kontakt.html');

        const featList = document.getElementById('winner-features');
        featList.innerHTML = '';
        winner.features.forEach(function (f) {
            const li = document.createElement('li');
            li.innerHTML = svgCheck() + f;
            featList.appendChild(li);
        });

        // Other packages
        const othersEl = document.getElementById('other-cards');
        othersEl.innerHTML = '';
        packages.filter(p => p.id !== winner.id).forEach(function (p) {
            const card = document.createElement('div');
            card.className = 'other-card';
            card.innerHTML =
                '<div class="other-card-name">' + p.name + '</div>' +
                '<div class="other-card-price">' + p.price + '</div>' +
                '<div class="other-card-note">engangsbeløp + 199,-/mnd drift</div>' +
                '<p class="other-card-desc">' + p.desc + '</p>' +
                '<a href="../kontakt.html" class="other-card-cta">Bygg ' + p.name + ' for meg →</a>';
            othersEl.appendChild(card);
        });
    }

    // ---- PRELOADER ---- //
    window.addEventListener('load', function () {
        const pre = document.getElementById('preloader');
        if (pre) {
            setTimeout(function () { pre.classList.add('preloader-hidden'); }, 400);
        }
    });

}());
