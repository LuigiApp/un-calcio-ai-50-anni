# Andrea 50 — RSVP

Invito digitale mobile-first con RSVP, conferma calendario, area admin protetta e deploy automatico su GitHub Pages.

## 1. Personalizza l'evento

Modifica `src/config.js`:
- data e orari (etichette e valori ISO);
- nome e indirizzo del luogo;
- `mapsUrl` con il link esatto della location;
- testi dell'invito.

Sostituisci `public/andrea-hero.svg` con la foto desiderata (puoi usare JPG/WEBP e aggiornare `heroImage`).

## 2. Configura Supabase

1. Crea un progetto Supabase.
2. Esegui `supabase/schema.sql` nel SQL Editor.
3. In Authentication crea manualmente l'utente amministratore con email e password.
4. Imposta il ruolo admin eseguendo `supabase/set-admin-role.sql` dopo aver sostituito l'email.
5. In Authentication disattiva le registrazioni pubbliche se non servono.

Il browser usa solo URL e **anon key**. Non usare mai la `service_role` nel frontend o nelle variabili GitHub.

## 3. Sviluppo locale

Copia `.env.example` in `.env.local`, inserisci URL e anon key, poi:

```bash
