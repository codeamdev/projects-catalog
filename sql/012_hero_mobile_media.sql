-- Imágenes y video específicos para móvil en el hero.
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS hero_image_url_mobile TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS hero_video_url_mobile TEXT;
