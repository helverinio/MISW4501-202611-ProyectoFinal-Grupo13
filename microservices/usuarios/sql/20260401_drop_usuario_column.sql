-- Remove deprecated username column from usuarios service schema.
-- Run in PostgreSQL database used by microservices/usuarios.

BEGIN;

ALTER TABLE IF EXISTS user_accounts
    DROP COLUMN IF EXISTS usuario;

COMMIT;
