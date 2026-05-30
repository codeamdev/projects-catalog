-- Grupos de filtros configurables por tenant
-- Ejemplos: Marca, Género, Tipo de fragancia, Talla, Material, etc.

CREATE TABLE IF NOT EXISTS :schema.filter_groups (
  id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name    TEXT NOT NULL,
  slug    TEXT UNIQUE NOT NULL,
  "order" INT DEFAULT 0 NOT NULL
);

-- Opciones dentro de cada grupo
-- Ejemplos: Versace, Mujer, Floral Frutal, XL, Algodón, etc.

CREATE TABLE IF NOT EXISTS :schema.filter_options (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES :schema.filter_groups(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  slug     TEXT NOT NULL,
  "order"  INT DEFAULT 0 NOT NULL,
  UNIQUE (group_id, slug)
);

-- Relación muchos-a-muchos: producto ↔ opción de filtro

CREATE TABLE IF NOT EXISTS :schema.product_filters (
  product_id TEXT NOT NULL REFERENCES :schema.products(id) ON DELETE CASCADE,
  option_id  TEXT NOT NULL REFERENCES :schema.filter_options(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_filter_options_group    ON :schema.filter_options(group_id);
CREATE INDEX IF NOT EXISTS idx_product_filters_product ON :schema.product_filters(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filters_option  ON :schema.product_filters(option_id);
