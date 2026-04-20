-- Restore username support in usuarios service schema.
-- Existing rows are backfilled with email so the column can be non-null and unique.

BEGIN;

ALTER TABLE IF EXISTS user_accounts
    ADD COLUMN IF NOT EXISTS usuario VARCHAR(100);

UPDATE user_accounts
SET usuario = email
WHERE usuario IS NULL OR TRIM(usuario) = '';

ALTER TABLE user_accounts
    ALTER COLUMN usuario SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_accounts_usuario_key'
    ) THEN
        ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_usuario_key UNIQUE (usuario);
    END IF;
END $$;

COMMIT;