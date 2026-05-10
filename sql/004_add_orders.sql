CREATE TABLE IF NOT EXISTS :schema.orders (
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
CREATE INDEX IF NOT EXISTS idx_orders_status     ON :schema.orders(status);
