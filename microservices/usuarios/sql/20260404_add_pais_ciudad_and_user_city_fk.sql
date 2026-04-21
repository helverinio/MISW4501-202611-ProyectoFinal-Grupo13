-- Add location model for usuarios: pais -> ciudad -> user_accounts

CREATE TABLE IF NOT EXISTS pais (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ciudad (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    pais_id INTEGER NOT NULL,
    CONSTRAINT fk_ciudad_pais_id FOREIGN KEY (pais_id) REFERENCES pais(id)
);

ALTER TABLE IF EXISTS user_accounts
    ADD COLUMN IF NOT EXISTS ciudad_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_user_accounts_ciudad_id'
    ) THEN
        ALTER TABLE user_accounts
            ADD CONSTRAINT fk_user_accounts_ciudad_id
            FOREIGN KEY (ciudad_id) REFERENCES ciudad(id);
    END IF;
END $$;
