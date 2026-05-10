-- Tabla de super administradores globales (cross-tenant)
-- Vive en catalogo_public, independiente de cualquier tenant

CREATE TABLE IF NOT EXISTS catalogo_public.super_admins (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
