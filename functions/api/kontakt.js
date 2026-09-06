/* ───────────────────────────────────────────────────────────
   kontakt.js — mottar kontaktskjemaet.

   Nettleseren snakket før direkte med formsubmit.co. Det virket, men
   betydde at hver eneste henvendelse gikk fra kundens nettleser rett
   til en gratis tredjepart, med adressen vår base64-kodet i koden på
   siden. Nå går skjemaet til vårt eget domene, og videresendingen
   skjer her på serveren:

   - Er RESEND_API_KEY satt (Cloudflare → Pages → Settings → Variables),
     sendes e-posten via Resend. Da er ingen tredjepart involvert utover
     e-postleverandøren, og feil kommer som ekte feilmeldinger.
   - Er den ikke satt, videresendes den til FormSubmit slik som før, bare
     fra serveren i stedet for fra nettleseren. Skjemaet virker altså
     uendret helt til nøkkelen legges inn.

   Klienten har fortsatt mailto-fallback hvis dette endepunktet er nede.
   ─────────────────────────────────────────────────────────── */

const TIL = 'indexdevandreas@gmail.com';
const FRA = 'Index Development <skjema@indexdevelopment.no>';

/* Skjemaet er lite, og alt over dette er enten en feil eller noen som
   prøver seg. Kutt før noe sendes videre. */
const GRENSER = { navn: 120, bedrift: 160, epost: 160, telefon: 40, melding: 4000 };

function ren(v, maks) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maks);
}

function svar(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function onRequestPost({ request, env }) {
  let inn;
  const type = request.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) {
      inn = await request.json();
    } else {
      const fd = await request.formData();
      inn = Object.fromEntries(fd.entries());
    }
  } catch {
    return svar({ ok: false, feil: 'ugyldig' }, 400);
  }

  const f = {};
  for (const k of Object.keys(GRENSER)) f[k] = ren(inn && inn[k], GRENSER[k]);

  /* Honningkrukke: et felt ingen ekte bruker ser. Er det fylt ut, er
     det en bot — svar 200 så den tror den lyktes, og kast meldingen. */
  if (ren(inn && inn._gjerde, 100)) return svar({ ok: true });

  if (!f.navn || !f.bedrift || !f.melding || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.epost)) {
    return svar({ ok: false, feil: 'mangler' }, 400);
  }

  const emne = `Henvendelse fra ${f.bedrift} (${f.navn})`;
  const tekst =
    `Navn: ${f.navn}\n` +
    `Bedrift: ${f.bedrift}\n` +
    `E-post: ${f.epost}\n` +
    `Telefon: ${f.telefon || '(ikke oppgitt)'}\n\n` +
    `${f.melding}\n`;

  try {
    if (env && env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ from: FRA, to: [TIL], reply_to: f.epost, subject: emne, text: tekst }),
      });
      if (!r.ok) throw new Error('resend ' + r.status);
    } else {
      /* Samme tjeneste som før, men kalt herfra. _captcha av, ellers
         svarer FormSubmit med en side i stedet for JSON. */
      const r = await fetch('https://formsubmit.co/ajax/' + TIL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...f, _subject: emne, _captcha: 'false', _template: 'box' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || String(d.success) !== 'true') throw new Error('formsubmit');
    }
  } catch {
    /* Klienten viser da mailto-lenken, så henvendelsen kommer frem
       uansett. Derfor 502 og ikke 200. */
    return svar({ ok: false, feil: 'sending' }, 502);
  }

  return svar({ ok: true });
}
