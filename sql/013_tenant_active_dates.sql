-- Fechas de publicación del plan por tenant
ALTER TABLE catalogo_public.tenants
  ADD COLUMN IF NOT EXISTS published_from  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_until TIMESTAMPTZ;
