import { requireSupabase } from './supabase.js';

const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const dateFmt = new Intl.DateTimeFormat('it-IT', { dateStyle:'medium', timeStyle:'short' });
let records = [];

export async function renderAdmin(app) {
  document.title = 'Area riservata — Andrea 50';
  document.body.className = 'admin-page';
  let client;
  try { client = requireSupabase(); }
  catch (error) { renderLogin(app, null, error.message); return; }
  app.innerHTML = '<div class="loading">Controllo accesso…</div>';
  const { data: { session } } = await client.auth.getSession();
  if (!session) { renderLogin(app, client); return; }
  if (session.user?.app_metadata?.role !== 'admin') {
    await client.auth.signOut();
    renderLogin(app, client, 'Questo account non ha i permessi di amministratore.');
    return;
  }
  await renderDashboard(app, client);
}

function adminNav(withLogout = false) {
  return `<nav class="admin-nav"><a href="../"><span class="mark"><span class="star">★</span><span>ANDREA 50</span></span></a><div class="admin-nav-actions"><span class="admin-kicker">Area riservata</span>${withLogout ? '<button class="icon-btn" data-logout>Esci</button>' : ''}</div></nav>`;
}

function renderLogin(app, client, initialError = '') {
  app.innerHTML = `<main class="admin-shell">${adminNav()}<div class="login-wrap"><section class="login-card"><p class="eyebrow">ACCESSO ORGANIZZATORI</p><h1>Dietro<br>le quinte.</h1><p>Accedi con l’email e la password dell’amministratore per vedere le conferme registrate su Supabase.</p><form novalidate><label class="field"><span class="field-label">Utente (email)</span><input name="email" type="email" autocomplete="username" required></label><label class="field"><span class="field-label">Password</span><input name="password" type="password" autocomplete="current-password" required></label><p class="form-error" role="alert">${esc(initialError)}</p><button class="btn btn-primary submit" type="submit">Accedi</button></form></section></div></main>`;
  const form = app.querySelector('form');
  if (!client) { form.querySelector('button').disabled = true; return; }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const errorBox = form.querySelector('.form-error');
    const button = form.querySelector('button');
    if (!email || !password) { errorBox.textContent = 'Inserisci email e password.'; return; }
    button.disabled = true; button.textContent = 'Accesso…'; errorBox.textContent = '';
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) { errorBox.textContent = 'Credenziali non valide.'; button.disabled = false; button.textContent = 'Accedi'; return; }
    if (data.user?.app_metadata?.role !== 'admin') {
      await client.auth.signOut(); errorBox.textContent = 'Questo account non ha i permessi di amministratore.'; button.disabled = false; button.textContent = 'Accedi'; return;
    }
    await renderDashboard(app, client);
  });
}

async function renderDashboard(app, client) {
  app.innerHTML = `<main class="admin-shell">${adminNav(true)}<section class="admin-header"><div><p class="eyebrow">CONFERME ALLA FESTA</p><h1>La formazione.</h1></div><label class="search"><span class="field-label" style="position:absolute;clip:rect(0 0 0 0)">Cerca per nome</span><input type="search" placeholder="Cerca per nome…" autocomplete="off"></label></section><div data-content><div class="loading">Carico le risposte…</div></div></main>`;
  app.querySelector('[data-logout]').addEventListener('click', async () => { await client.auth.signOut(); renderLogin(app, client); });
  const { data, error } = await client.from('rsvp').select('id,name,attending,guests,notes,created_at').order('created_at', { ascending:false });
  const content = app.querySelector('[data-content]');
  if (error) { content.innerHTML = `<div class="admin-error">Impossibile leggere le RSVP. Verifica policy RLS e ruolo admin.</div>`; return; }
  records = data || [];
  drawRows(content, records);
  app.querySelector('[type="search"]').addEventListener('input', e => {
    const query = e.target.value.trim().toLocaleLowerCase('it');
    drawRows(content, records.filter(row => row.name.toLocaleLowerCase('it').includes(query)));
  });
}

function drawRows(content, filtered) {
  const confirmed = records.filter(row => row.attending).length;
  const totalGuests = records.reduce((sum, row) => sum + (row.attending ? row.guests : 0), 0);
  const declined = records.filter(row => !row.attending).length;
  const rows = filtered.map(row => `<li class="rsvp-item"><div><div class="rsvp-name">${esc(row.name)}</div><div class="rsvp-meta">${row.attending ? `${row.guests} ${row.guests === 1 ? 'partecipante' : 'partecipanti'}` : 'Nessun partecipante'} · ${dateFmt.format(new Date(row.created_at))}</div></div>${row.notes ? `<div class="rsvp-notes">${esc(row.notes)}</div>` : '<div></div>'}<span class="badge ${row.attending ? 'yes' : 'no'}">${row.attending ? 'Ci sarà' : 'Assente'}</span></li>`).join('');
  content.innerHTML = `<section class="metrics"><article class="metric"><span>Confermati</span><strong>${confirmed}</strong></article><article class="metric"><span>Totale partecipanti</span><strong>${totalGuests}</strong></article><article class="metric"><span>Assenti</span><strong>${declined}</strong></article></section><section class="list-panel"><header class="list-head"><h2>Elenco RSVP</h2><small>${filtered.length} ${filtered.length === 1 ? 'risposta' : 'risposte'}</small></header>${filtered.length ? `<ul class="rsvp-list">${rows}</ul>` : '<div class="empty">Nessuna risposta trovata.</div>'}</section>`;
}
