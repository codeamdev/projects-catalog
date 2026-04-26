// Tablas que existen en CADA schema de tenant (perfumeria, ropa, etc.)
// No llevan prefijo de schema — Drizzle usa el search_path activo en la conexión

import {
  pgTable,
  text,
  boolean,
  decimal,
  integer,
  timestamp,
  index,
  smallint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  order: integer("order").default(0).notNull(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: text("currency").default("USD").notNull(),
    active: boolean("active").default(true).notNull(),
    featured: boolean("featured").default(false).notNull(),
    discountPercent: smallint("discount_percent"),
    tags: text("tags").array().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_products_active").on(t.active),
    index("idx_products_featured").on(t.featured),
    index("idx_products_category").on(t.categoryId),
  ]
);

export const productImages = pgTable("product_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  order: integer("order").default(0).notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role", { enum: ["SUPER_ADMIN", "ADMIN", "EDITOR"] })
    .default("ADMIN")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderNumber: text("order_number").unique().notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    sequence: integer("sequence").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    items: text("items").notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    status: text("status", {
      enum: ["pending", "accepted", "preparing", "shipped", "received", "cancelled"],
    })
      .default("pending")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_orders_year_month").on(t.year, t.month),
    index("idx_orders_status").on(t.status),
  ]
);

export const settings = pgTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  heroTitle: text("hero_title").default("Bienvenidos").notNull(),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  footerText: text("footer_text"),
  discountCode: text("discount_code"),
  discountCodePercent: smallint("discount_code_percent"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Relaciones ────────────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Order = typeof orders.$inferSelect;

export type ProductWithRelations = Product & {
  category: Category | null;
  images: ProductImage[];
};
