-- Esegui nel SQL Editor sostituendo l'email ESATTA dell'account admin.
-- Richiede i privilegi del SQL Editor; non va mai eseguito dal browser.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'SOSTITUISCI_CON_EMAIL_ADMIN';
