/* Cloudflare Pages Function: /api/chat
   Proxy mot Anthropic Messages API. API-nøkkelen ligger som hemmelig
   miljøvariabel (ANTHROPIC_API_KEY) i Cloudflare Pages — aldri i klienten.
   Svaret streames rått videre som SSE; widgeten parser text_delta-events. */

const MODEL = 'claude-haiku-4-5'; // rask og billig — ca. 1 øre per svar
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 24;     // per samtale sendt inn fra klienten
const MAX_CHARS = 2000;      // per enkeltmelding

const ALLOWED_ORIGINS = [
  'https://indexdevelopment.no',
  'https://www.indexdevelopment.no',
];

/* Kunnskapsgrunnlaget. Holdes stabilt og byte-identisk mellom kall slik at
   prompt-cachen treffer (cache_control på blokken under). */
const SYSTEM_PROMPT = `Du er chatboten på nettsiden til Index Development, et norsk enkeltpersonforetak drevet av Andreas Melheim i Drammen. Du hjelper besøkende med spørsmål om tjenester, priser og hvordan man kommer i gang. Svar på norsk (bokmål) — eller på språket den besøkende skriver på.

## Tjenester
- Nettsider, SEO og utvikling (håndkodet HTML/CSS/JS, rask og mobilvennlig)
- AI-agenter og chatbots trent på bedriftens egne data
- Systemutvikling (database, innlogging, adminpanel)
- API-integrasjoner
- Booking- og bestillingssystemer bygget inn i nettsiden
- Google Bedriftsprofil og lokal SEO
- Drift, vedlikehold og support (hosting på Cloudflare, SSL, sikkerhetskopi)

## Priser (engangssum, deretter 199 kr/mnd for hosting og drift)
Nettsidepakker:
- Lokal Ekspert: 2 900 kr
- Bedrift Pluss: 5 999 kr (mest valgt)
- Totalpakken: 12 990 kr

Chatbots og AI-agenter: prises etter behov — kunden beskriver hva de trenger via veiviseren, og får fastpris skriftlig før noe bygges.

Startpriser (fastpris gis etter demo):
- Booking-system: fra 7 900 kr
- Skreddersydd system: fra 14 900 kr
- API-integrasjoner: fra 3 900 kr

Ingen bindingstid på driftsavtalen.

## Prosess
1. Kunden beskriver behovet (helst via veiviseren på /kom-i-gang.html)
2. Innen fem dager: ferdig utkast (nettsider) eller fungerende demo (systemer)
3. Fastpris gis skriftlig
4. Kunden sier ja eller nei — helt uforpliktende

## Kontakt
- E-post: andreas@indexdevelopment.no
- Telefon: 484 59 686 — hverdager etter kl. 16:00. E-post besvares fortløpende.
- Veiviser: /kom-i-gang.html (tar under to minutter)

## Nyttige sider
/priser.html (priser), /tjenester.html (tjenester), /kom-i-gang.html (veiviser), /kontakt.html (kontakt), /ai-agenter.html (chatbots), /booking-systemer.html, /systemutvikling.html, /api-integrasjoner.html, /webdesign.html, /drift.html, /ingen-bindingstid.html

## Regler
- Svar kort og konkret: 1–4 setninger. Ikke bruk overskrifter eller punktlister med mindre det trengs.
- Aldri finn på priser, rabatter, frister eller løfter som ikke står her. Er du usikker: henvis til veiviseren eller e-post.
- Ikke lov telefontilgjengelighet på dagtid — telefon er hverdager etter kl. 16:00.
- Ikke gi tekniske konsulentsvar eller generell programmeringshjelp; du er her for å hjelpe besøkende videre mot riktig tjeneste.
- Når det er naturlig, pek videre til én relevant side (skriv stien, f.eks. /kom-i-gang.html).
- Handler spørsmålet om noe helt annet enn Index Development, si vennlig at du bare kan svare på spørsmål om tjenestene, og pek til kontaktsiden.`;

export async function onRequestPost({ request, env }) {
  /* Enkel origin-sjekk så andre nettsteder ikke kan bruke endepunktet. */
  const origin = request.headers.get('Origin') || '';
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev$/.test(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    origin === ''; // same-origin uten Origin-header (eldre nettlesere)

  if (!allowed) {
    return json({ error: 'Forbidden' }, 403);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY mangler i miljøvariablene.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig JSON.' }, 400);
  }

  const messages = sanitize(body && body.messages);
  if (!messages) {
    return json({ error: 'Ugyldig meldingsformat.' }, 400);
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    console.error('Anthropic-feil', upstream.status, detail.slice(0, 500));
    return json({ error: 'Klarte ikke å hente svar akkurat nå.' }, 502);
  }

  /* Send SSE-strømmen uendret videre til widgeten. */
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/* Valider og normaliser historikken fra klienten. Returnerer null ved feil. */
function sanitize(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const trimmed = raw.slice(-MAX_MESSAGES);
  const clean = [];
  for (const m of trimmed) {
    if (!m || typeof m.content !== 'string') return null;
    if (m.role !== 'user' && m.role !== 'assistant') return null;
    const content = m.content.slice(0, MAX_CHARS).trim();
    if (!content) continue;
    clean.push({ role: m.role, content });
  }

  /* Første melding må være fra brukeren. */
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;

  return clean;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
