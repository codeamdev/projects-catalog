import type { PoolClient } from "pg";

const VALID_SCHEMA = /^[a-z][a-z0-9_]{0,62}$/;

export function toSchemaName(subdomain: string): string {
  return subdomain.toLowerCase().replace(/-/g, "_").replace(/[^a-z0-9_]/g, "");
}

function assertValidSchema(name: string): void {
  if (!VALID_SCHEMA.test(name)) throw new Error(`Schema inválido: "${name}"`);
}

// SQL de cada migración inlineado para funcionar en entornos serverless
// donde no hay acceso al filesystem (Vercel).
const MIGRATION_SQLS = [
  // 002_tenant_tables
  `CREATE SCHEMA IF NOT EXISTS :schema;
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
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id      TEXT REFERENCES :schema.categories(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2),
  currency         TEXT DEFAULT 'USD' NOT NULL,
  active           BOOLEAN DEFAULT TRUE NOT NULL,
  featured         BOOLEAN DEFAULT FALSE NOT NULL,
  discount_percent SMALLINT,
  tags             TEXT[] DEFAULT '{}' NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_products_category ON :schema.products(category_id);`,

  // 003_add_discount (idempotente)
  `ALTER TABLE :schema.products ADD COLUMN IF NOT EXISTS discount_percent SMALLINT;`,

  // 004_add_orders
  `CREATE TABLE IF NOT EXISTS :schema.orders (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number   TEXT UNIQUE NOT NULL,
  year           INT NOT NULL,
  month          INT NOT NULL,
  sequence       INT NOT NULL,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  items          TEXT NOT NULL,
  total          NUMERIC(12,2) NOT NULL,
  status         TEXT DEFAULT 'pending' NOT NULL
                   CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_year_month ON :schema.orders(year, month);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON :schema.orders(status);`,

  // 005_update_order_statuses
  `ALTER TABLE :schema.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE :schema.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'received', 'cancelled'));
UPDATE :schema.orders SET status = 'accepted' WHERE status = 'confirmed';`,

  // 006_add_discount_code
  `ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE :schema.settings ADD COLUMN IF NOT EXISTS discount_code_percent SMALLINT;`,
];

export async function createTenantSchema(client: PoolClient, schemaName: string): Promise<void> {
  assertValidSchema(schemaName);
  for (const sql of MIGRATION_SQLS) {
    await client.query(sql.replace(/:schema/g, schemaName));
  }
}
