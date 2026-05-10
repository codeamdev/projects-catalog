-- Schema catalogo_public: registro de tenants del proyecto catalogo
-- Base de datos: project_catalogo (no toca project/Django)

CREATE SCHEMA IF NOT EXISTS catalogo_public;

CREATE TABLE IF NOT EXISTS catalogo_public.tenants (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subdomain       TEXT UNIQUE NOT NULL,
  schema_name     TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  active          BOOLEAN DEFAULT TRUE NOT NULL,
  primary_color   TEXT DEFAULT '#1a1a1a' NOT NULL,
  whatsapp_number TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO catalogo_public.tenants (subdomain, schema_name, name, primary_color)
VALUES
  ('perfumeria', 'perfumeria', 'Catalogo de Perfumes', '#8B6914'),
  ('ropa',       'ropa',       'Catalogo de Ropa',     '#1a1a1a')
ON CONFLICT (subdomain) DO NOTHING;
