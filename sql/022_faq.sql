ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS faq_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS faq_title TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS faq_items TEXT;
