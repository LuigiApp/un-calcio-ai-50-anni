import './styles.css';
import { EVENT } from './config.js';
import { saveRsvp } from './supabase.js';

const app = document.querySelector('#app');
const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

app.innerHTML = `<main class="hero" style="background-image:url('${esc(EVENT.heroImage)}')">
  <header class="topbar"><div class="mark"><span class="star">★</span><span>50 ANNI<br>DI STORIE</span></div><a class="admin-link" href="./admin/">Area riservata</a></header>
  <section class="hero-content"><p class="eyebrow">${esc(EVENT.eyebrow)}</p><h1>${esc(EVENT.title)}</h1><p class="tagline">${esc(EVENT.tagline)}</p>
    <div class="details" aria-label="Dettagli dell'evento"><div class="detail"><span>Quando</span><strong>${esc(EVENT.dateLabel)}</strong><small>${esc(EVENT.timeLabel)}</small></div><div class="detail"><span>Dove</span><strong>${esc(EVENT.locationName)}</strong><small>${esc(EVENT.locationAddress)}</small></div></div>
    <div class="actions"><button class="btn btn-primary" data-attending="true">Ci sono 🥂</button><button class="btn btn-secondary" data-attending="false">Non posso 😢</button></div>
  </section></main>`;

document.querySelectorAll('[data-attending]').forEach(button => button.addEventListener('click', () => openRsvp(button.dataset.attending === 'true')));

function openRsvp(attending) {
  let guests = attending ? 1 : 0;
  const shell = document.createElement('div');
  shell.className = 'modal-backdrop';
  shell.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><p class="eyebrow">RSVP · ${attending ? 'PRESENTE' : 'ASSENTE'}</p><h2 id="modal-title">${attending ? 'Sei dei nostri?' : 'Ci dispiace.'}</h2></div><button class="close" aria-label="Chiudi">×</button></div><p class="modal-intro">${attending ? 'Lascia il tuo nome nella formazione.' : 'Facci sapere chi mancherà alla festa.'}</p>
    <form novalidate><label class="field"><span class="field-label">Nome e cognome *</span><input name="name" autocomplete="name" maxlength="100" required placeholder="Es. Mario Rossi"></label>
    ${attending ? '<div class="field"><span class="field-label">Numero partecipanti *</span><div class="counter"><button type="button" data-count="minus" aria-label="Diminuisci">−</button><output aria-live="polite">1</output><button type="button" data-count="plus" aria-label="Aumenta">+</button></div></div>' : ''}
    <label class="field"><span class="field-label">Note o intolleranze <i>(facoltative)</i></span><textarea name="notes" maxlength="500" placeholder="Scrivi qui ciò che dobbiamo sapere…"></textarea></label><p class="form-error" role="alert"></p><button class="btn btn-primary submit" type="submit">Conferma</button></form></section>`;
  document.body.append(shell); document.body.style.overflow = 'hidden';
  const close = () => { shell.remove(); document.body.style.overflow = ''; };
  shell.querySelector('.close').addEventListener('click', close);
  shell.addEventListener('click', e => { if (e.target === shell) close(); });
  shell.querySelector('input').focus();
  const output = shell.querySelector('output');
  shell.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => { guests = Math.max(1, Math.min(20, guests + (button.dataset.count === 'plus' ? 1 : -1))); output.textContent = guests; }));
  shell.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault(); const form = e.currentTarget; const errorBox = form.querySelector('.form-error'); const submit = form.querySelector('.submit');
    const name = form.elements.name.value.trim().replace(/\s+/g, ' '); const notes = form.elements.notes.value.trim(); errorBox.textContent = '';
    if (name.length < 3 || !name.includes(' ')) { errorBox.textContent = 'Inserisci nome e cognome.'; form.elements.name.focus(); return; }
    submit.disabled = true; submit.textContent = 'Invio in corso…';
    try { await saveRsvp({ name, attending, guests: attending ? guests : 0, notes: notes || null }); showConfirmation(shell, name, attending); }
    catch (error) { errorBox.textContent = error.message || 'Non è stato possibile salvare. Riprova.'; submit.disabled = false; submit.textContent = 'Conferma'; }
  });
}

function showConfirmation(shell, name, attending) {
  const firstName = name.split(' ')[0];
  shell.querySelector('.modal').innerHTML = attending ? `<div class="confirm"><div class="confirm-icon">🥂</div><p class="eyebrow">RISPOSTA REGISTRATA</p><h2>Perfetto ${esc(firstName)},<br>sei della partita!</h2><p>La tua presenza è al sicuro. Adesso pensa solo a festeggiare.</p><div class="event-card"><strong>${esc(EVENT.dateLabel)} · ${esc(EVENT.timeLabel)}</strong><span>${esc(EVENT.locationName)} — ${esc(EVENT.locationAddress)}</span></div><div class="confirm-actions">${EVENT.mapsUrl ? `<a class="text-link" href="${esc(EVENT.mapsUrl)}" target="_blank" rel="noopener">Apri Maps ↗</a>` : '<span class="text-link" title="Configura mapsUrl">Maps da configurare</span>'}<button class="btn btn-primary" data-calendar>Aggiungi al calendario</button></div></div>` : `<div class="confirm"><div class="confirm-icon">✓</div><p class="eyebrow">RISPOSTA REGISTRATA</p><h2>Grazie, ${esc(firstName)}.</h2><p>Ci dispiace che tu non possa esserci. Brinderemo anche per te.</p><button class="btn btn-primary submit" data-done>Chiudi</button></div>`;
  shell.querySelector('[data-done]')?.addEventListener('click', () => { shell.remove(); document.body.style.overflow = ''; });
  shell.querySelector('[data-calendar]')?.addEventListener('click', downloadCalendar);
  if (attending) launchConfetti();
}

function downloadCalendar() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const format = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const slash = String.fromCharCode(92);
  const clean = value => value.replaceAll(',', slash + ',').replaceAll(';', slash + ';').split(String.fromCharCode(10)).join(slash + 'n');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Andrea50//RSVP//IT','BEGIN:VEVENT',`UID:andrea50-${stamp}`,`DTSTAMP:${stamp}`,`DTSTART:${format(EVENT.isoStart)}`,`DTEND:${format(EVENT.isoEnd)}`,`SUMMARY:${clean(EVENT.title)}`,`LOCATION:${clean(`${EVENT.locationName}, ${EVENT.locationAddress}`)}`,`DESCRIPTION:${clean(EVENT.tagline)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([ics], { type:'text/calendar;charset=utf-8' })); link.download = EVENT.calendarFilename; link.click(); URL.revokeObjectURL(link.href);
}

function launchConfetti() {
  const colors = ['#d1b36f','#f1eee7','#7d1919','#8c7340'];
  for (let i = 0; i < 38; i++) { const bit = document.createElement('i'); bit.className = 'confetti'; bit.style.left = `${Math.random()*100}vw`; bit.style.background = colors[i%colors.length]; bit.style.animationDelay = `${Math.random()*.45}s`; bit.style.setProperty('--drift', `${(Math.random()-.5)*150}px`); document.body.append(bit); setTimeout(() => bit.remove(), 3300); }
}
