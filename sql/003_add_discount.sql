-- Agrega discount_percent a productos en schemas existentes
ALTER TABLE :schema.products ADD COLUMN IF NOT EXISTS discount_percent SMALLINT;
