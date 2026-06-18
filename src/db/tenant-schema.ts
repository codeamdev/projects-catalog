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
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  order: integer("order").default(0).notNull(),
  imageUrl: text("image_url"),
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
    stock: integer("stock"),
    trackStock: boolean("track_stock").default(false).notNull(),
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
  // singleton garantiza exactamente una fila por tenant (constraint unique en DB)
  singleton: boolean("singleton").default(true).notNull(),
  heroTitle: text("hero_title").default("Bienvenidos").notNull(),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  heroImageUrlMobile: text("hero_image_url_mobile"),
  heroVideoUrlMobile: text("hero_video_url_mobile"),
  heroImagePosition: text("hero_image_position").default("center").notNull(),
  categoriesStyle: text("categories_style").default("stories").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  footerText: text("footer_text"),
  discountCode: text("discount_code"),
  discountCodePercent: smallint("discount_code_percent"),
  googleSiteVerification: text("google_site_verification"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  inventoryEnabled: boolean("inventory_enabled").default(false).notNull(),
  whyChooseEnabled: boolean("why_choose_enabled").default(false).notNull(),
  whyChooseTitle: text("why_choose_title"),
  whyChooseItems: text("why_choose_items"),
  footerBgColor: text("footer_bg_color"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("settings_singleton_unique").on(t.singleton),
]);

// ── Filtros ───────────────────────────────────────────────────

export const filterGroups = pgTable("filter_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  order: integer("order").default(0).notNull(),
});

export const filterOptions = pgTable(
  "filter_options",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id").notNull().references(() => filterGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    order: integer("order").default(0).notNull(),
  },
  (t) => [unique().on(t.groupId, t.slug)]
);

export const productFilters = pgTable(
  "product_filters",
  {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull().references(() => filterOptions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.optionId] })]
);

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
export type FilterGroup = typeof filterGroups.$inferSelect;
export type FilterOption = typeof filterOptions.$inferSelect;

export type ProductWithRelations = Product & {
  category: Category | null;
  images: ProductImage[];
};
