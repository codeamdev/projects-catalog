ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS hero_image_position TEXT DEFAULT 'center' NOT NULL;
