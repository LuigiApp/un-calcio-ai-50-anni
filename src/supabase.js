import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = url && anonKey && !url.includes('INSERISCI_') && !anonKey.includes('INSERISCI_');

export const supabase = configured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase non è ancora configurato. Compila il file .env.');
  return supabase;
}

export async function saveRsvp(payload) {
  const client = requireSupabase();
  const clean = {
    name: payload.name.trim(),
    attending: Boolean(payload.attending),
    guests: payload.attending ? Number(payload.guests) : 0,
    notes: payload.notes?.trim() || null,
  };
  if (clean.name.length < 3 || clean.name.length > 100) throw new Error('Nome non valido.');
  if (!Number.isInteger(clean.guests) || clean.guests < 0 || clean.guests > 20) throw new Error('Numero partecipanti non valido.');
  if ((clean.notes?.length || 0) > 500) throw new Error('Le note sono troppo lunghe.');
  const { error } = await client.from('rsvp').insert(clean);
  if (error) {
    console.error('RSVP insert failed:', error.code);
    throw new Error('Invio non riuscito. Controlla la connessione e riprova.');
  }
}
