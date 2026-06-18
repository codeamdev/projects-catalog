ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS why_choose_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS footer_bg_color TEXT;
