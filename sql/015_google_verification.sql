ALTER TABLE :schema.settings
  ADD COLUMN IF NOT EXISTS google_site_verification TEXT;
