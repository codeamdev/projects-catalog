-- Garantiza exactamente una fila en settings por tenant.
-- Idempotente: ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS.
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS singleton BOOLEAN DEFAULT TRUE NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS settings_singleton_unique ON :schema.settings (singleton);
