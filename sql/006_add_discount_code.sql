ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS discount_code_percent SMALLINT;
