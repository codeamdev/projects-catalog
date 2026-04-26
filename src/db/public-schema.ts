// Tabla del schema catalogo_public — registro global de tenants
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

export type Tenant = typeof tenants.$inferSelect;
