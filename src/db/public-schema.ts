// Tablas del schema catalogo_public — registro global de tenants y superadmins
// Usa pgSchema() para que Drizzle genere queries con prefijo de schema explícito

import { pgSchema, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const catalogoPublic = pgSchema("catalogo_public");

export const tenants = catalogoPublic.table("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subdomain: text("subdomain").unique().notNull(),
  schemaName: text("schema_name").unique().notNull(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
  primaryColor: text("primary_color").default("#1a1a1a").notNull(),
  whatsappNumber: text("whatsapp_number"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const superAdmins = catalogoPublic.table("super_admins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type SuperAdmin = typeof superAdmins.$inferSelect;
