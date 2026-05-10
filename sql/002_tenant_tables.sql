-- Tablas por schema de tenant — se ejecutan con search_path activo
-- Reemplazar :schema con el nombre del schema antes de ejecutar

CREATE SCHEMA IF NOT EXISTS :schema;

CREATE TABLE IF NOT EXISTS :schema.settings (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hero_title       TEXT DEFAULT 'Bienvenidos' NOT NULL,
  hero_subtitle    TEXT,
  hero_image_url   TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  footer_text      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS :schema.admin_users (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  name       TEXT,
  role       TEXT DEFAULT 'ADMIN' NOT NULL
              CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS :schema.categories (
  id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name    TEXT NOT NULL,
  slug    TEXT UNIQUE NOT NULL,
  "order" INT DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS :schema.products (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT REFERENCES :schema.categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  price       NUMERIC(10,2),
  currency    TEXT DEFAULT 'USD' NOT NULL,
  active           BOOLEAN DEFAULT TRUE NOT NULL,
  featured         BOOLEAN DEFAULT FALSE NOT NULL,
  discount_percent SMALLINT,
  tags             TEXT[] DEFAULT '{}' NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS :schema.product_images (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES :schema.products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  "order"    INT DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_active   ON :schema.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON :schema.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON :schema.products(category_id);
