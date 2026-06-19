"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { publicDb, withTenantDb, withTenantTransaction } from "@/db";
import {
  products,
  productImages,
  categories,
  orders,
  settings,
  adminUsers,
  filterGroups,
  filterOptions,
  productFilters,
  subscribers,
} from "@/db/tenant-schema";
import type { CampaignData, TenantEmailInfo } from "@/lib/email";
import { tenants } from "@/db/public-schema";

// ── Tipos de retorno estructurado ─────────────────────────────
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ── Jerarquía de roles ────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
  EDITOR: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("No autorizado");
  return session;
}

async function requireRole(minRole: "EDITOR" | "ADMIN" | "SUPER_ADMIN") {
  const session = await requireSession();
  const userLevel = ROLE_LEVEL[session.user.role] ?? -1;
  const requiredLevel = ROLE_LEVEL[minRole];
  if (userLevel < requiredLevel) {
    throw new Error(`Permiso insuficiente. Se requiere ${minRole}.`);
  }
  return session;
}

function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .substring(0, 80);
}

// ── Productos ──────────────────────────────────────────────────────

export async function toggleProductActive(
  productId: string,
  active: boolean
): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
    await withTenantDb(session.user.schemaName, (db) =>
      db.update(products).set({ active }).where(eq(products.id, productId))
    );
    revalidatePath("/admin/products");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

const ProductInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().default("COP"),
  categoryId: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  discountPercent: z.number().int().min(0).max(99).nullable(),
  tags: z.string().optional(),
  imageUrls: z.string().optional(),
  trackStock: z.boolean().default(false),
  stock: z.number().int().min(0).nullable(),
});

export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
    const schema = session.user.schemaName;

    const rawStock = formData.get("stock") as string | null;
    const parsed = ProductInput.parse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price") || undefined,
      currency: "COP",
      categoryId: formData.get("category_id") || undefined,
      active: formData.getAll("active").includes("true"),
      featured: formData.getAll("featured").includes("true"),
      discountPercent: formData.get("discount_percent")
        ? Number(formData.get("discount_percent"))
        : null,
      tags: formData.get("tags") || undefined,
      imageUrls: formData.get("imageUrls") || undefined,
      trackStock: formData.getAll("track_stock").includes("true"),
      stock: rawStock !== null && rawStock !== "" ? parseInt(rawStock, 10) : null,
    });

    const slug = toSlug(parsed.title);
    const tagArray = parsed.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    const urls = parsed.imageUrls?.split("\n").map((u) => u.trim()).filter(Boolean) ?? [];

    const filterOptionIds = formData.getAll("filter_option_ids") as string[];

    await withTenantTransaction(schema, async (db) => {
      const [product] = await db
        .insert(products)
        .values({
          title: parsed.title,
          slug,
          description: parsed.description ?? null,
          price: parsed.price ? String(Number(parsed.price)) : null,
          currency: parsed.currency,
          categoryId: parsed.categoryId ?? null,
          active: parsed.active,
          featured: parsed.featured,
          discountPercent: parsed.discountPercent,
          tags: tagArray,
          trackStock: parsed.trackStock,
          stock: parsed.stock,
        })
        .returning({ id: products.id });

      if (urls.length > 0) {
        await db.insert(productImages).values(
          urls.map((url, i) => ({ productId: product.id, url, order: i }))
        );
      }

      if (filterOptionIds.length > 0) {
        await db.insert(productFilters).values(
          filterOptionIds.map((optionId) => ({ productId: product.id, optionId }))
        );
      }
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Datos del formulario inválidos" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear producto" };
  }
}

export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
    const schema = session.user.schemaName;

    const rawStock2 = formData.get("stock") as string | null;
    const parsed = ProductInput.parse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price") || undefined,
      currency: "COP",
      categoryId: formData.get("category_id") || undefined,
      active: formData.getAll("active").includes("true"),
      featured: formData.getAll("featured").includes("true"),
      discountPercent: formData.get("discount_percent")
        ? Number(formData.get("discount_percent"))
        : null,
      tags: formData.get("tags") || undefined,
      imageUrls: formData.get("imageUrls") || undefined,
      trackStock: formData.getAll("track_stock").includes("true"),
      stock: rawStock2 !== null && rawStock2 !== "" ? parseInt(rawStock2, 10) : null,
    });

    const tagArray = parsed.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    const urls = parsed.imageUrls?.split("\n").map((u) => u.trim()).filter(Boolean) ?? [];
    const filterOptionIds = formData.getAll("filter_option_ids") as string[];

    await withTenantTransaction(schema, async (db) => {
      await db
        .update(products)
        .set({
          title: parsed.title,
          description: parsed.description ?? null,
          price: parsed.price ? String(Number(parsed.price)) : null,
          currency: parsed.currency,
          categoryId: parsed.categoryId ?? null,
          active: parsed.active,
          featured: parsed.featured,
          discountPercent: parsed.discountPercent,
          tags: tagArray,
          trackStock: parsed.trackStock,
          stock: parsed.stock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      await db.delete(productImages).where(eq(productImages.productId, productId));
      if (urls.length > 0) {
        await db.insert(productImages).values(
          urls.map((url, i) => ({ productId, url, order: i }))
        );
      }

      await db.delete(productFilters).where(eq(productFilters.productId, productId));
      if (filterOptionIds.length > 0) {
        await db.insert(productFilters).values(
          filterOptionIds.map((optionId) => ({ productId, optionId }))
        );
      }
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Datos del formulario inválidos" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar producto" };
  }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.delete(products).where(eq(products.id, productId))
    );
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar producto" };
  }
}

// ── Categorías ────────────────────────────────────────────────────

export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { ok: false, error: "El nombre es requerido" };
    const slug = toSlug(name);

    await withTenantDb(session.user.schemaName, (db) =>
      db.insert(categories).values({ name, slug })
    );
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear categoría" };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.delete(categories).where(eq(categories.id, categoryId))
    );
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar categoría" };
  }
}

export async function updateCategoryImage(
  categoryId: string,
  imageUrl: string | null
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.update(categories).set({ imageUrl }).where(eq(categories.id, categoryId))
    );
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar imagen" };
  }
}

// ── Pedidos ───────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "accepted" | "preparing" | "shipped" | "received" | "cancelled"
): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
    await withTenantDb(session.user.schemaName, (db) =>
      db.update(orders).set({ status }).where(eq(orders.id, orderId))
    );
    revalidatePath("/admin/orders");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar pedido" };
  }
}

// ── Ajustes ───────────────────────────────────────────────────────

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    const rawPosition = (formData.get("hero_image_position") as string) || "center";
    const heroImagePosition = (["top", "center", "bottom"] as const).includes(rawPosition as "top" | "center" | "bottom")
      ? (rawPosition as "top" | "center" | "bottom")
      : "center";

    const VALID_STYLES = ["stories","pills","chips","tabs","bubbles","minimal","bold","grid","outline","compact"] as const;
    type CatStyle = typeof VALID_STYLES[number];
    const rawStyle = (formData.get("categories_style") as string) || "stories";
    const categoriesStyle: CatStyle = (VALID_STYLES as readonly string[]).includes(rawStyle) ? rawStyle as CatStyle : "stories";

    const values = {
      heroTitle: (formData.get("hero_title") as string) || "Bienvenidos",
      heroSubtitle: (formData.get("hero_subtitle") as string) || null,
      heroImageUrl: (formData.get("hero_image_url") as string) || null,
      heroImageUrlMobile: (formData.get("hero_image_url_mobile") as string) || null,
      heroVideoUrlMobile: (formData.get("hero_video_url_mobile") as string) || null,
      heroImagePosition,
      categoriesStyle,
      metaTitle: (formData.get("meta_title") as string) || null,
      metaDescription: (formData.get("meta_description") as string) || null,
      googleSiteVerification: (formData.get("google_site_verification") as string) || null,
      instagramUrl: (formData.get("instagram_url") as string) || null,
      facebookUrl: (formData.get("facebook_url") as string) || null,
      tiktokUrl: (formData.get("tiktok_url") as string) || null,
      youtubeUrl: (formData.get("youtube_url") as string) || null,
      footerText: (formData.get("footer_text") as string) || null,
      updatedAt: new Date(),
    };

    await withTenantDb(schema, (db) =>
      db.insert(settings)
        .values({ singleton: true, ...values })
        .onConflictDoUpdate({ target: settings.singleton, set: values })
    );

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar ajustes" };
  }
}

export async function updateDiscountCode(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    const rawCode = (formData.get("discount_code") as string)?.trim() || null;
    const rawPercent = formData.get("discount_code_percent") as string;
    const discountCodePercent = rawCode && rawPercent
      ? Math.min(99, Math.max(1, parseInt(rawPercent, 10))) || null
      : null;

    const discountValues = { discountCode: rawCode, discountCodePercent, updatedAt: new Date() };
    await withTenantDb(schema, (db) =>
      db.insert(settings)
        .values({ singleton: true, ...discountValues })
        .onConflictDoUpdate({ target: settings.singleton, set: discountValues })
    );

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar código de descuento" };
  }
}

export async function updateCategoriesStyle(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;
    const VALID = ["stories","pills","chips","tabs","bubbles","minimal","bold","grid","outline","compact"];
    const raw = (formData.get("categories_style") as string) || "stories";
    const categoriesStyle = VALID.includes(raw) ? raw : "stories";
    const styleValues = { categoriesStyle, updatedAt: new Date() };
    await withTenantDb(schema, (db) =>
      db.insert(settings)
        .values({ singleton: true, ...styleValues })
        .onConflictDoUpdate({ target: settings.singleton, set: styleValues })
    );
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar estilo" };
  }
}

// ── Configuración del tenant (WhatsApp, color, logo) ─────────────

export async function updateTenantConfig(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const raw = (formData.get("whatsapp_number") as string | null) ?? "";
    const whatsappNumber = raw.replace(/[\s+\-()]/g, "") || null;

    const primaryColor = (formData.get("primary_color") as string | null) || "#1a1a1a";
    const logoUrl = (formData.get("logo_url") as string | null) || null;

    await publicDb
      .update(tenants)
      .set({ whatsappNumber, primaryColor, logoUrl, updatedAt: new Date() })
      .where(eq(tenants.schemaName, session.user.schemaName));

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar configuración" };
  }
}

// ── Sección "¿Por qué elegirnos?" ────────────────────────────────

export async function updateWhyChooseUs(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    const title = (formData.get("why_choose_title") as string)?.trim() || null;
    const headline = (formData.get("why_choose_headline") as string)?.trim() || null;
    const description = (formData.get("why_choose_description") as string)?.trim() || null;
    const itemsRaw = formData.get("why_choose_items") as string | null;

    let whyChooseItems: string | null = null;
    if (itemsRaw) {
      try {
        const parsed = JSON.parse(itemsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) whyChooseItems = itemsRaw;
      } catch { /* inválido — ignorar */ }
    }

    const whyChooseEnabled = formData.get("why_choose_enabled") === "1";
    const whyChooseIconStyle = (formData.get("why_choose_icon_style") as string) || "outline";

    const vals = { whyChooseEnabled, whyChooseTitle: title, whyChooseHeadline: headline, whyChooseDescription: description, whyChooseItems, whyChooseIconStyle, updatedAt: new Date() };
    await withTenantDb(schema, (db) =>
      db.insert(settings)
        .values({ singleton: true, ...vals })
        .onConflictDoUpdate({ target: settings.singleton, set: vals })
    );

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar sección" };
  }
}

export async function updateFooterColor(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;
    const footerBgColor = (formData.get("footer_bg_color") as string) || "#f9fafb";
    const vals = { footerBgColor, updatedAt: new Date() };
    await withTenantDb(schema, (db) =>
      db.insert(settings)
        .values({ singleton: true, ...vals })
        .onConflictDoUpdate({ target: settings.singleton, set: vals })
    );
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar color" };
  }
}

// ── Guardar todos los ajustes en un solo paso ─────────────────────

export async function updateAllSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    // Hero: video tiene prioridad sobre imágenes
    const videoUrl = ((formData.get("hero_video_url") as string) ?? "").trim();
    const imageUrls = ((formData.get("hero_images") as string) ?? "").trim();
    const heroImageUrl = videoUrl || imageUrls || null;
    const heroImageUrlMobile = ((formData.get("hero_images_mobile") as string) ?? "").trim() || null;
    const heroVideoUrlMobile = ((formData.get("hero_video_url_mobile") as string) ?? "").trim() || null;

    const rawPosition = (formData.get("hero_image_position") as string) || "center";
    const heroImagePosition = (["top", "center", "bottom"] as const).includes(rawPosition as "top" | "center" | "bottom")
      ? (rawPosition as "top" | "center" | "bottom") : "center";

    const VALID_STYLES = ["stories","pills","chips","tabs","bubbles","minimal","bold","grid","outline","compact"] as const;
    type CatStyle = typeof VALID_STYLES[number];
    const rawStyle = (formData.get("categories_style") as string) || "stories";
    const categoriesStyle: CatStyle = (VALID_STYLES as readonly string[]).includes(rawStyle) ? rawStyle as CatStyle : "stories";

    // Why choose us items
    const whyItemsRaw = formData.get("why_choose_items") as string | null;
    let whyChooseItems: string | null = null;
    if (whyItemsRaw) {
      try {
        const parsed = JSON.parse(whyItemsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) whyChooseItems = whyItemsRaw;
      } catch { /* ignore */ }
    }

    // FAQ items
    const faqItemsRaw = formData.get("faq_items") as string | null;
    let faqItemsSave: string | null = null;
    if (faqItemsRaw) {
      try {
        const parsed = JSON.parse(faqItemsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) faqItemsSave = faqItemsRaw;
      } catch { /* ignore */ }
    }

    // Discount
    const rawCode = (formData.get("discount_code") as string)?.trim() || null;
    const rawPercent = formData.get("discount_code_percent") as string;
    const discountCodePercent = rawCode && rawPercent
      ? Math.min(99, Math.max(1, parseInt(rawPercent, 10))) || null : null;

    const tenantVals = {
      whatsappNumber: ((formData.get("whatsapp_number") as string) ?? "").replace(/[\s+\-()]/g, "") || null,
      primaryColor: (formData.get("primary_color") as string) || "#1a1a1a",
      logoUrl: (formData.get("logo_url") as string) || null,
      updatedAt: new Date(),
    };

    const settingsVals = {
      heroTitle: (formData.get("hero_title") as string) || "Bienvenidos",
      heroSubtitle: (formData.get("hero_subtitle") as string) || null,
      heroImageUrl,
      heroImageUrlMobile,
      heroVideoUrlMobile,
      heroImagePosition,
      categoriesStyle,
      metaTitle: (formData.get("meta_title") as string) || null,
      metaDescription: (formData.get("meta_description") as string) || null,
      googleSiteVerification: (formData.get("google_site_verification") as string) || null,
      instagramUrl: (formData.get("instagram_url") as string) || null,
      facebookUrl: (formData.get("facebook_url") as string) || null,
      tiktokUrl: (formData.get("tiktok_url") as string) || null,
      youtubeUrl: (formData.get("youtube_url") as string) || null,
      footerText: (formData.get("footer_text") as string) || null,
      footerBgColor: (formData.get("footer_bg_color") as string) || "#f9fafb",
      discountCode: rawCode,
      discountCodePercent,
      whyChooseEnabled: formData.get("why_choose_enabled") === "1",
      whyChooseTitle: (formData.get("why_choose_title") as string)?.trim() || null,
      whyChooseHeadline: (formData.get("why_choose_headline") as string)?.trim() || null,
      whyChooseDescription: (formData.get("why_choose_description") as string)?.trim() || null,
      whyChooseItems,
      whyChooseIconStyle: (formData.get("why_choose_icon_style") as string) || "color",
      faqEnabled: formData.get("faq_enabled") === "1",
      faqTitle: (formData.get("faq_title") as string)?.trim() || null,
      faqItems: faqItemsSave,
      // Welcome popup
      welcomeEnabled: formData.get("welcome_enabled") === "1",
      welcomeTitle: (formData.get("welcome_title") as string)?.trim() || null,
      welcomeSubtitle: (formData.get("welcome_subtitle") as string)?.trim() || null,
      welcomeDiscountPercent: (() => {
        const p = formData.get("welcome_discount_percent") as string;
        return p ? Math.min(99, Math.max(1, parseInt(p, 10))) || null : null;
      })(),
      welcomeMessage: (formData.get("welcome_message") as string)?.trim() || null,
      welcomeDelaySeconds: (() => {
        const d = formData.get("welcome_delay_seconds") as string;
        return d ? Math.min(30, Math.max(0, parseInt(d, 10))) : 3;
      })(),
      updatedAt: new Date(),
    };

    await Promise.all([
      publicDb.update(tenants).set(tenantVals).where(eq(tenants.schemaName, schema)),
      withTenantDb(schema, (db) =>
        db.insert(settings)
          .values({ singleton: true, ...settingsVals })
          .onConflictDoUpdate({ target: settings.singleton, set: settingsVals })
      ),
    ]);

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar ajustes" };
  }
}

// ── Filtros ───────────────────────────────────────────────────────

export async function createFilterGroup(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { ok: false, error: "El nombre es requerido" };
    const slug = toSlug(name);
    await withTenantDb(session.user.schemaName, (db) =>
      db.insert(filterGroups).values({ name, slug })
    );
    revalidatePath("/admin/filters");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear grupo" };
  }
}

export async function deleteFilterGroup(groupId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.delete(filterGroups).where(eq(filterGroups.id, groupId))
    );
    revalidatePath("/admin/filters");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar grupo" };
  }
}

export async function createFilterOption(groupId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) return { ok: false, error: "El nombre es requerido" };
    const slug = toSlug(name);
    await withTenantDb(session.user.schemaName, (db) =>
      db.insert(filterOptions).values({ groupId, name, slug })
    );
    revalidatePath("/admin/filters");
    revalidatePath("/admin/products");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear opción" };
  }
}

export async function deleteFilterOption(optionId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.delete(filterOptions).where(eq(filterOptions.id, optionId))
    );
    revalidatePath("/admin/filters");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar opción" };
  }
}

// ── Admin user (seed/setup) ───────────────────────────────────────

// ── Ajustes generales (welcome popup) ────────────────────────────

export async function updateWelcomeSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    const rawPercent = formData.get("welcome_discount_percent") as string;
    const welcomeDiscountPercent = rawPercent ? Math.min(99, Math.max(1, parseInt(rawPercent, 10))) || null : null;
    const rawDelay = formData.get("welcome_delay_seconds") as string;
    const welcomeDelaySeconds = rawDelay ? Math.min(30, Math.max(0, parseInt(rawDelay, 10))) : 3;
    const welcomeCodePrefix = ((formData.get("welcome_code_prefix") as string) ?? "DESC")
      .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "DESC";

    const vals = {
      welcomeEnabled: formData.get("welcome_enabled") === "1",
      welcomeTitle: (formData.get("welcome_title") as string)?.trim() || null,
      welcomeSubtitle: (formData.get("welcome_subtitle") as string)?.trim() || null,
      welcomeDiscountPercent,
      welcomeMessage: (formData.get("welcome_message") as string)?.trim() || null,
      welcomeDelaySeconds,
      welcomeCodePrefix,
      updatedAt: new Date(),
    };

    await withTenantDb(schema, (db) =>
      db.insert(settings).values({ singleton: true, ...vals })
        .onConflictDoUpdate({ target: settings.singleton, set: vals })
    );

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar" };
  }
}

// ── Campañas de email ─────────────────────────────────────────────

export async function sendEmailCampaign(formData: FormData): Promise<ActionResult<{ sent: number; failed: number }>> {
  try {
    const session = await requireRole("ADMIN");
    const schema = session.user.schemaName;

    const type = (formData.get("type") as string) || "general";
    const subject = (formData.get("subject") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!subject || !title || !message) {
      return { ok: false, error: "Asunto, título y mensaje son requeridos" };
    }

    // Fetch active subscribers
    const activeSubscribers = await withTenantDb(schema, (db) =>
      db.select({
        email: subscribers.email,
        name: subscribers.name,
        discountCode: subscribers.discountCode,
        unsubscribeToken: subscribers.unsubscribeToken,
      }).from(subscribers).where(isNull(subscribers.unsubscribedAt))
    );

    if (activeSubscribers.length === 0) {
      return { ok: false, error: "No hay suscriptores activos" };
    }

    // Build campaign
    const campaign: CampaignData = {
      type: type as CampaignData["type"],
      subject,
      title,
      message,
    };

    if (formData.get("discount_code")) {
      campaign.discountCode = (formData.get("discount_code") as string).toUpperCase();
      campaign.discountPercent = parseInt(formData.get("discount_percent") as string, 10) || undefined;
    }

    const productIdsRaw = formData.get("product_ids") as string | null;
    if (productIdsRaw) {
      try {
        const ids: string[] = JSON.parse(productIdsRaw);
        if (ids.length > 0) {
          const productList = await withTenantDb(schema, (db) =>
            db.select({
              title: products.title,
              price: products.price,
              imageUrl: productImages.url,
            })
              .from(products)
              .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.order, 0)))
              .where(inArray(products.id, ids))
          );
          campaign.products = productList.map((p) => ({
            title: p.title,
            price: p.price,
            imageUrl: p.imageUrl ?? null,
          }));
        }
      } catch { /* ignore */ }
    }

    const tenantInfo: TenantEmailInfo = {
      name: formData.get("tenant_name") as string || "",
      subdomain: formData.get("tenant_subdomain") as string || "",
      logoUrl: formData.get("tenant_logo_url") as string || null,
      primaryColor: formData.get("tenant_primary_color") as string || "#111827",
    };

    const { sendCampaignEmails } = await import("@/lib/email");
    const result = await sendCampaignEmails(tenantInfo, activeSubscribers, campaign);

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al enviar emails" };
  }
}

export async function deleteSubscriber(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await requireRole("ADMIN");
    await withTenantDb(session.user.schemaName, (db) =>
      db.delete(subscribers).where(eq(subscribers.id, id))
    );
    revalidatePath("/admin/subscribers");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar" };
  }
}

export async function createAdminUser(
  schemaName: string,
  email: string,
  password: string,
  name: string
) {
  const hash = await bcrypt.hash(password, 12);
  await withTenantDb(schemaName, (db) =>
    db
      .insert(adminUsers)
      .values({ email, password: hash, name, role: "ADMIN" })
      .onConflictDoNothing()
  );
}
