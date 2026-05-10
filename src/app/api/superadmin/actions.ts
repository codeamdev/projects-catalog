"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { publicDb, withRawClient } from "@/db";
import { tenants } from "@/db/public-schema";
import { createTenantSchema, toSchemaName } from "@/lib/tenant-ddl";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

// ── Queries ──────────────────────────────────────────────────────

export type TenantRow = {
  id: string;
  subdomain: string;
  schemaName: string;
  name: string;
  active: boolean;
  primaryColor: string;
  whatsappNumber: string | null;
  logoUrl: string | null;
  createdAt: Date;
};

export async function getTenants(): Promise<TenantRow[]> {
  await requireSuperAdmin();
  return publicDb
    .select()
    .from(tenants)
    .orderBy(tenants.createdAt);
}

export async function getTenantById(id: string): Promise<TenantRow | null> {
  await requireSuperAdmin();
  const rows = await publicDb
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getDashboardStats() {
  await requireSuperAdmin();
  const all = await publicDb.select().from(tenants);
  return {
    total: all.length,
    active: all.filter((t) => t.active).length,
    recent: all.slice(-5).reverse(),
  };
}

// ── Validadores ──────────────────────────────────────────────────

const SUBDOMAIN_RE = /^[a-z][a-z0-9-]{0,60}[a-z0-9]$|^[a-z0-9]$/;

const CreateSchema = z.object({
  subdomain: z.string().regex(SUBDOMAIN_RE, "Subdominio inválido"),
  tenantName: z.string().min(2, "Nombre muy corto"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  whatsappNumber: z.string().optional(),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres"),
});

const UpdateSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  whatsappNumber: z.string().optional(),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

// ── Acciones ──────────────────────────────────────────────────────

export async function createTenant(
  formData: FormData
): Promise<ActionResult<{ subdomain: string }>> {
  try {
    await requireSuperAdmin();

    const raw = {
      subdomain: (formData.get("subdomain") as string)?.trim().toLowerCase(),
      tenantName: (formData.get("tenantName") as string)?.trim(),
      primaryColor: (formData.get("primaryColor") as string) ?? "#1a1a1a",
      whatsappNumber: (formData.get("whatsappNumber") as string)?.trim() || undefined,
      logoUrl: (formData.get("logoUrl") as string)?.trim() || undefined,
      adminEmail: (formData.get("adminEmail") as string)?.trim().toLowerCase(),
      adminPassword: formData.get("adminPassword") as string,
    };

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { ok: false, error: msg };
    }

    const { subdomain, tenantName, primaryColor, whatsappNumber, logoUrl, adminEmail, adminPassword } =
      parsed.data;
    const schema = toSchemaName(subdomain);

    // Verificar unicidad
    const existing = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);
    if (existing.length > 0) {
      return { ok: false, error: `Ya existe un tenant con el subdominio "${subdomain}".` };
    }

    // Crear schema + tablas + tenant + admin
    await withRawClient(async (client) => {
      await createTenantSchema(client, schema);

      await client.query(
        `INSERT INTO catalogo_public.tenants (subdomain, schema_name, name, primary_color, whatsapp_number, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [subdomain, schema, tenantName, primaryColor, whatsappNumber ?? null, logoUrl || null]
      );

      const hash = await bcrypt.hash(adminPassword, 12);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(
        `INSERT INTO admin_users (email, password, name, role)
         VALUES ($1, $2, 'Administrador', 'ADMIN')
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, hash]
      );

      await client.query(
        `INSERT INTO settings (hero_title) VALUES ($1) ON CONFLICT DO NOTHING`,
        [tenantName]
      );
    });

    revalidatePath("/superadmin/tenants");
    return { ok: true, data: { subdomain } };
  } catch (err) {
    console.error("[createTenant]", err);
    return { ok: false, error: "Error interno al crear el tenant." };
  }
}

export async function updateTenant(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const raw = {
      name: (formData.get("name") as string)?.trim(),
      primaryColor: formData.get("primaryColor") as string,
      whatsappNumber: (formData.get("whatsappNumber") as string)?.trim() || undefined,
      logoUrl: (formData.get("logoUrl") as string)?.trim() || undefined,
    };

    const parsed = UpdateSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { ok: false, error: msg };
    }

    const { name, primaryColor, whatsappNumber, logoUrl } = parsed.data;

    await publicDb
      .update(tenants)
      .set({
        name,
        primaryColor,
        whatsappNumber: whatsappNumber ?? null,
        logoUrl: logoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id));

    revalidatePath("/superadmin/tenants");
    return { ok: true, data: undefined };
  } catch (err) {
    console.error("[updateTenant]", err);
    return { ok: false, error: "Error al actualizar el tenant." };
  }
}

export async function toggleTenantActive(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const rows = await publicDb.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!rows[0]) return { ok: false, error: "Tenant no encontrado." };

    await publicDb
      .update(tenants)
      .set({ active: !rows[0].active, updatedAt: new Date() })
      .where(eq(tenants.id, id));

    revalidatePath("/superadmin/tenants");
    return { ok: true, data: undefined };
  } catch (err) {
    console.error("[toggleTenantActive]", err);
    return { ok: false, error: "Error al cambiar el estado del tenant." };
  }
}
