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
});

export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Datos del formulario inválidos" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear producto" };
  }
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("EDITOR");
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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: "Datos del formulario inválidos" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar producto" };
  }
  redirect("/admin/products");
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
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar ajustes" };
  }
  redirect("/admin/settings?guardado=contenido");
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
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar configuración" };
  }
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
