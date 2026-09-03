/* ───────────────────────────────────────────────────────────
   anrop.js — automatisk SMS når kunden ikke rekker telefonen.

   Slik henger det sammen:

   1. Kunden setter betinget viderekobling på mobilen sin, til et
      virtuelt nummer vi eier hos 46elks. «Betinget» betyr at bare
      ubesvarte anrop viderekobles — tar han telefonen, skjer
      ingenting her.
   2. Anropet lander på det virtuelle nummeret. 46elks kaller denne
      funksjonen med hvem som ringte (from) og hvilket av våre
      numre de traff (to).
   3. Vi svarer 46elks med hva som skal skje i samtalen, og sender
      en SMS til innringeren.

   Kunden trenger altså ingen app, og det virker på både iPhone og
   Android fordi viderekoblingen skjer i mobilnettet, ikke på
   telefonen.
   ─────────────────────────────────────────────────────────── */

/* Kundene. Ligger i kode nå fordi det er én tabell med to rader —
   flytt til D1 eller Supabase når det blir mange nok til at du
   ikke vil deploye for å legge til en kunde. */
const KUNDER = {
  // nøkkel = det virtuelle nummeret hos 46elks som kunden
  // viderekobler til
  '+4759446000': {
    navn: 'Renrask Bilvask',
    // %s byttes ut med ingenting — hold meldingen kort, én SMS er
    // 160 tegn og to SMS koster dobbelt
    melding: 'Hei! Vi så at du ringte Renrask Bilvask. Vi sitter opptatt akkurat nå, men ringer deg tilbake i dag. Du kan også svare på denne meldingen.',
    // utenfor disse timene sendes en annen melding (norsk tid)
    apner: 8,
    stenger: 17,
    utenom: 'Hei! Vi så at du ringte Renrask Bilvask. Vi har stengt nå, men ringer deg tilbake første virkedag. Du kan også svare på denne meldingen.',
  },
};

/* Samme person ringer ofte to-tre ganger på rappen. Da skal de ha
   én melding, ikke tre. Nummeret legges i KV med en times levetid. */
const SPERRE_SEKUNDER = 3600;

export async function onRequestPost(context) {
  const { request, env } = context;

  /* 46elks sender skjemadata, ikke JSON. */
  const form = await request.formData();
  const fra = form.get('from');     // den som ringte
  const til = form.get('to');       // vårt virtuelle nummer
  const kallid = form.get('callid');

  const kunde = KUNDER[til];
  if (!kunde) {
    /* Ukjent nummer. Legg på i stedet for å la det ringe i evighet. */
    return svar({ hangup: 'reject' });
  }

  /* Har vi allerede skrevet til denne personen den siste timen? */
  const nokkel = `sms:${til}:${fra}`;
  const sendt_nylig = env.ANROP ? await env.ANROP.get(nokkel) : null;

  if (!sendt_nylig) {
    const tekst = innenfor_apningstid(kunde) ? kunde.melding : kunde.utenom;
    /* Vent på utsendingen. Cloudflare avliver funksjonen når svaret
       er sendt, så en SMS vi ikke venter på kan forsvinne. */
    await send_sms(env, til, fra, tekst);
    if (env.ANROP) {
      await env.ANROP.put(nokkel, String(Date.now()), {
        expirationTtl: SPERRE_SEKUNDER,
      });
    }
  }

  /* Innringeren skal høre hvorfor det ikke ble noe svar, ellers
     virker det som telefonen bare la på. Kort beskjed, så legges
     det på — vi skal ikke betale for et anrop som står og ringer. */
  return svar({
    play: env.BESKJED_URL || undefined,
    hangup: env.BESKJED_URL ? undefined : 'busy',
  });
}

/* ── SMS-utsending via 46elks ────────────────────────────────
   Avsender settes til vårt eget nummer og ikke til bedriftsnavnet,
   nettopp fordi innringeren skal kunne svare på meldingen. Svaret
   havner da i kundens innboks hos 46elks, som kan videresendes til
   e-post eller mobil. */
async function send_sms(env, fra, til, melding) {
  const auth = btoa(`${env.ELKS_BRUKER}:${env.ELKS_PASSORD}`);

  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ from: fra, to: til, message: melding }),
  });

  if (!res.ok) {
    /* Logges i Cloudflare-dashbordet under Workers → Logs. Feiler
       en SMS, skal det være mulig å se hvorfor uten å gjette. */
    console.error('SMS feilet', res.status, await res.text());
  }
  return res.ok;
}

/* Norsk klokkeslett uten bibliotek. Cloudflare kjører i UTC, og
   Intl kan tidssonene — inkludert sommertid, som vi ellers måtte
   regnet ut selv. */
function innenfor_apningstid(kunde) {
  const na = new Date();
  const time = Number(
    new Intl.DateTimeFormat('no-NO', {
      timeZone: 'Europe/Oslo',
      hour: 'numeric',
      hour12: false,
    }).format(na)
  );
  const ukedag = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Oslo',
    weekday: 'short',
  }).format(na);

  if (ukedag === 'Sat' || ukedag === 'Sun') return false;
  return time >= kunde.apner && time < kunde.stenger;
}

function svar(objekt) {
  /* 46elks vil ha JSON tilbake med hva som skal skje i samtalen. */
  const rent = Object.fromEntries(
    Object.entries(objekt).filter(([, v]) => v !== undefined)
  );
  return new Response(JSON.stringify(rent), {
    headers: { 'Content-Type': 'application/json' },
  });
}
