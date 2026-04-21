ALTER TABLE user_accounts
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'VIAJERO',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mfa_confirmed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE user_accounts
SET role = COALESCE(role, 'VIAJERO'),
    status = COALESCE(status, 'ACTIVE'),
    mfa_enabled = COALESCE(mfa_enabled, FALSE),
    failed_login_attempts = COALESCE(failed_login_attempts, 0)
WHERE TRUE;
