CREATE TABLE IF NOT EXISTS :schema.subscribers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  name TEXT,
  discount_code TEXT,
  discount_used_at TIMESTAMP,
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  unsubscribed_at TIMESTAMP,
  source TEXT DEFAULT 'welcome_popup',
  subscribed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON :schema.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_discount_code ON :schema.subscribers(discount_code);
