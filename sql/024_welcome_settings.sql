ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_title TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_subtitle TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_discount_percent SMALLINT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS welcome_delay_seconds SMALLINT DEFAULT 3;
