ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS categories_style TEXT DEFAULT 'stories' NOT NULL;
