import './styles.css';
import { EVENT } from './config.js';
import { saveRsvp } from './supabase.js';

const app = document.querySelector('#app');
const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

app.innerHTML = `<header class="sitebar"><span>UN CALCIO AI 50 ANNI</span><a class="admin-link" href="./admin/">Area riservata</a></header>
  <main class="hero"><img class="hero-image" src="${esc(EVENT.heroImage)}" alt="Invito ai 50 anni di Andrea"></main>
  <section class="map-section" aria-labelledby="map-title"><div class="map-shell">
    <div class="map-copy"><p class="eyebrow">DOVE SI GIOCA</p><h2 id="map-title">Ci vediamo al Barrio.</h2><p>${esc(EVENT.locationName)}<br><span>${esc(EVENT.locationAddress)}</span></p><a class="map-link" href="${esc(EVENT.mapsUrl)}" target="_blank" rel="noopener">Apri in Google Maps ↗</a></div>
    <div class="map-frame"><iframe src="${esc(EVENT.mapsEmbedUrl)}" title="Google Maps — ${esc(EVENT.locationName)}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
  </div></section>
  <section class="rsvp-section" id="rsvp"><div class="rsvp-card">
    <p class="eyebrow">CONFERMA LA TUA PRESENZA</p><h2>Entra nella formazione.</h2><p class="rsvp-intro">Dicci se ci sarai. La risposta viene registrata solo dopo la conferma.</p>
    <form class="rsvp-form" novalidate>
      <fieldset class="attendance"><legend>Ci sarai? *</legend><div class="attendance-options"><button type="button" class="attendance-btn active" data-choice="true">Sì, ci sono 🥂</button><button type="button" class="attendance-btn" data-choice="false">No, non posso 😢</button></div></fieldset>
      <label class="field"><span class="field-label">Nome e cognome *</span><input name="name" autocomplete="name" maxlength="100" required placeholder="Es. Mario Rossi"></label>
      <div class="field guests-field"><span class="field-label">Numero partecipanti *</span><div class="counter"><button type="button" data-count="minus" aria-label="Diminuisci">−</button><output aria-live="polite">1</output><button type="button" data-count="plus" aria-label="Aumenta">+</button></div></div>
      <label class="field"><span class="field-label">Note <i>(facoltative)</i></span><textarea name="notes" maxlength="500" placeholder="Aggiungi un messaggio…"></textarea></label>
      <p class="form-error" role="alert"></p><button class="btn btn-primary submit" type="submit">Conferma RSVP</button>
    </form>
  </div></section>`

const form = document.querySelector('.rsvp-form');
const guestsField = form.querySelector('.guests-field');
const output = form.querySelector('output');
let attending = true;
let guests = 1;

function setAttendance(value) {
  attending = value;
  form.querySelectorAll('[data-choice]').forEach(btn => btn.classList.toggle('active', btn.dataset.choice === String(value)));
  guestsField.hidden = !value;
  guests = value ? Math.max(1, guests) : 0;
  output.textContent = value ? guests : 0;
}

form.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => setAttendance(button.dataset.choice === 'true')));
form.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
  guests = Math.max(1, Math.min(20, guests + (button.dataset.count === 'plus' ? 1 : -1)));
  output.textContent = guests;
}));

form.addEventListener('submit', async e => {
  e.preventDefault();
  const errorBox = form.querySelector('.form-error');
  const submit = form.querySelector('.submit');
  const name = form.elements.name.value.trim().replace(/\s+/g, ' ');
  const notes = form.elements.notes.value.trim();
  errorBox.textContent = '';
  if (name.length < 3 || !name.includes(' ')) { errorBox.textContent = 'Inserisci nome e cognome.'; form.elements.name.focus(); return; }
  submit.disabled = true; submit.textContent = 'Invio in corso…';
  try {
    await saveRsvp({ name, attending, guests: attending ? guests : 0, notes: notes || null });
    showConfirmation(name, attending);
  } catch (error) {
    errorBox.textContent = error.message || 'Non è stato possibile salvare. Riprova.';
    submit.disabled = false; submit.textContent = 'Conferma RSVP';
  }
});

function showConfirmation(name, isAttending) {
  const firstName = name.split(' ')[0];
  document.querySelector('.rsvp-card').innerHTML = `<div class="confirm"><div class="confirm-icon">${isAttending ? '🥂' : '✓'}</div><p class="eyebrow">RISPOSTA REGISTRATA</p><h2>${isAttending ? `Perfetto ${esc(firstName)}, sei della partita!` : `Grazie, ${esc(firstName)}.`}</h2><p>${isAttending ? 'La tua presenza è al sicuro. Adesso pensa solo a festeggiare.' : 'Ci dispiace che tu non possa esserci. Brinderemo anche per te.'}</p><div class="event-card"><strong>${esc(EVENT.dateLabel)} · ${esc(EVENT.timeLabel)}</strong><span>${esc(EVENT.locationName)} — ${esc(EVENT.locationAddress)}</span></div>${isAttending ? `<div class="confirm-actions"><a class="text-link" href="${esc(EVENT.mapsUrl)}" target="_blank" rel="noopener">Apri Maps ↗</a><button class="btn btn-primary" data-calendar>Aggiungi al calendario</button></div>` : ''}</div>`;
  document.querySelector('[data-calendar]')?.addEventListener('click', downloadCalendar);
}

function downloadCalendar() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const format = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const slash = String.fromCharCode(92);
  const clean = value => value.replaceAll(',', slash + ',').replaceAll(';', slash + ';').split(String.fromCharCode(10)).join(slash + 'n');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Andrea50//RSVP//IT','BEGIN:VEVENT',`UID:andrea50-${stamp}`,`DTSTAMP:${stamp}`,`DTSTART:${format(EVENT.isoStart)}`,`DTEND:${format(EVENT.isoEnd)}`,`SUMMARY:${clean(EVENT.title)}`,`LOCATION:${clean(`${EVENT.locationName}, ${EVENT.locationAddress}`)}`,`DESCRIPTION:${clean(EVENT.tagline)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([ics], { type:'text/calendar;charset=utf-8' })); link.download = EVENT.calendarFilename; link.click(); URL.revokeObjectURL(link.href);
}
