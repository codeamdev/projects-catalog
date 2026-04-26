"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
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
} from "@/db/tenant-schema";
import { tenants } from "@/db/public-schema";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("No autorizado");
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

export async function toggleProductActive(productId: string, active: boolean) {
  const session = await requireSession();
  await withTenantDb(session.user.schemaName, (db) =>
    db.update(products).set({ active }).where(eq(products.id, productId))
  );
  revalidatePath("/admin/products");
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
});

export async function createProduct(formData: FormData) {
  const session = await requireSession();
  const schema = session.user.schemaName;

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
  });

  const slug = toSlug(parsed.title);
  const tagArray = parsed.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const urls = parsed.imageUrls?.split("\n").map((u) => u.trim()).filter(Boolean) ?? [];

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
      })
      .returning({ id: products.id });

    if (urls.length > 0) {
      await db.insert(productImages).values(
        urls.map((url, i) => ({ productId: product.id, url, order: i }))
      );
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireSession();
  const schema = session.user.schemaName;

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
  });

  const tagArray = parsed.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const urls = parsed.imageUrls?.split("\n").map((u) => u.trim()).filter(Boolean) ?? [];

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
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    await db.delete(productImages).where(eq(productImages.productId, productId));

    if (urls.length > 0) {
      await db.insert(productImages).values(
        urls.map((url, i) => ({ productId, url, order: i }))
      );
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  const session = await requireSession();
  await withTenantDb(session.user.schemaName, (db) =>
    db.delete(products).where(eq(products.id, productId))
  );
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ── Categorías ────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const session = await requireSession();
  const name = formData.get("name") as string;
  const slug = toSlug(name);

  await withTenantDb(session.user.schemaName, (db) =>
    db.insert(categories).values({ name, slug })
  );
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteCategory(categoryId: string) {
  const session = await requireSession();
  await withTenantDb(session.user.schemaName, (db) =>
    db.delete(categories).where(eq(categories.id, categoryId))
  );
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ── Pedidos ───────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "accepted" | "preparing" | "shipped" | "received" | "cancelled"
) {
  const session = await requireSession();
  await withTenantDb(session.user.schemaName, (db) =>
    db.update(orders).set({ status }).where(eq(orders.id, orderId))
  );
  revalidatePath("/admin/orders");
}

// ── Ajustes ───────────────────────────────────────────────────────

export async function updateSettings(formData: FormData) {
  const session = await requireSession();
  const schema = session.user.schemaName;

  const rawDiscountCode = (formData.get("discount_code") as string)?.trim() || null;
  const rawDiscountPercent = formData.get("discount_code_percent") as string;
  const discountCodePercent = rawDiscountCode && rawDiscountPercent
    ? Math.min(99, Math.max(1, parseInt(rawDiscountPercent, 10))) || null
    : null;

  const values = {
    heroTitle: (formData.get("hero_title") as string) || "Bienvenidos",
    heroSubtitle: (formData.get("hero_subtitle") as string) || null,
    heroImageUrl: (formData.get("hero_image_url") as string) || null,
    metaTitle: (formData.get("meta_title") as string) || null,
    metaDescription: (formData.get("meta_description") as string) || null,
    footerText: (formData.get("footer_text") as string) || null,
    discountCode: rawDiscountCode,
    discountCodePercent,
    updatedAt: new Date(),
  };

  await withTenantDb(schema, async (db) => {
    const existing = await db.select({ id: settings.id }).from(settings).limit(1);
    if (existing[0]) {
      await db.update(settings).set(values).where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values(values);
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?guardado=contenido");
}

// ── Configuración del tenant (WhatsApp, color, logo) ─────────────

export async function updateTenantConfig(formData: FormData) {
  const session = await requireSession();

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
  redirect("/admin/settings?guardado=tenant");
}

// ── Admin user (seed/setup) ───────────────────────────────────────

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
