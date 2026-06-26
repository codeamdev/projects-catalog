import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, settings, type Product } from "@/db/tenant-schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog-data";

function toSlug(title: string) {
  return title.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-").replace(/[^\w-]/g, "").substring(0, 80);
}

function parseBool(val: unknown, def = false): boolean {
  if (val === undefined || val === null || val === "") return def;
  return String(val).toUpperCase().trim() === "SI" || String(val) === "1";
}

function parsePrice(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  // Remove thousand separators (dots or commas) and parse
  const clean = String(val).replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : String(n);
}

function parseIntOrNull(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

interface ImportRow {
  ID?: string;
  Título?: string;
  Descripción?: string;
  Precio?: unknown;
  Moneda?: string;
  Categoría?: string;
  Activo?: string;
  Destacado?: string;
  "Descuento %"?: unknown;
  Tags?: string;
  Stock?: unknown;
  "Controlar Stock"?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const schema = session.user.schemaName;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheetName = wb.SheetNames.includes("Productos") ? "Productos" : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: ImportRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) return NextResponse.json({ error: "El archivo no tiene datos" }, { status: 400 });

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { row: number; title: string; error: string }[],
    };

    await withTenantDb(schema, async (db) => {
      // Leer configuración
      const [s] = await db.select({ inventoryEnabled: settings.inventoryEnabled }).from(settings).limit(1);
      const inventoryEnabled = s?.inventoryEnabled ?? false;

      // Cache de categorías existentes
      const catRows = await db.select({ id: categories.id, name: categories.name }).from(categories);
      const catMap: Record<string, string> = {};
      for (const c of catRows) catMap[c.name.toLowerCase().trim()] = c.id;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const title = String(row.Título ?? "").trim();

        // Campo obligatorio
        if (!title) {
          results.errors.push({ row: rowNum, title: "(sin título)", error: "El campo Título es obligatorio" });
          continue;
        }

        try {
          // Categoría — debe existir, no se crea automáticamente
          let categoryId: string | null = null;
          const catName = String(row.Categoría ?? "").trim();
          if (catName) {
            const found = catMap[catName.toLowerCase().trim()];
            if (!found) {
              results.errors.push({ row: rowNum, title, error: `La categoría "${catName}" no existe en el sistema` });
              continue;
            }
            categoryId = found;
          }

          // Precio
          const price = parsePrice(row.Precio);

          // Descuento
          const discountRaw = parseIntOrNull(row["Descuento %"]);
          const discountPercent = discountRaw !== null
            ? Math.min(99, Math.max(1, discountRaw))
            : null;

          // Tags
          const tagList = String(row.Tags ?? "").split(",").map(t => t.trim()).filter(Boolean);

          // Moneda
          const currency = String(row.Moneda ?? "COP").trim().toUpperCase() || "COP";

          const productData: Partial<Product> & { title: string; slug: string } = {
            title,
            slug: toSlug(title),
            description: String(row.Descripción ?? "").trim() || null,
            price,
            currency,
            categoryId,
            active: parseBool(row.Activo, true),
            featured: parseBool(row.Destacado, false),
            discountPercent,
            tags: tagList,
            updatedAt: new Date(),
          };

          if (inventoryEnabled) {
            productData.stock = parseIntOrNull(row.Stock);
            productData.trackStock = parseBool(row["Controlar Stock"], false);
          }

          const id = String(row.ID ?? "").trim();

          if (id) {
            // Actualizar por ID
            const existing = await db.select({ id: products.id })
              .from(products).where(eq(products.id, id)).limit(1);
            if (existing.length === 0) {
              results.errors.push({ row: rowNum, title, error: `No existe un producto con ID "${id}"` });
              continue;
            }
            await db.update(products).set(productData).where(eq(products.id, id));
            results.updated++;
          } else {
            // Crear nuevo — slug único
            let slug = toSlug(title);
            let suffix = 0;
            while (true) {
              const conflict = await db.select({ id: products.id })
                .from(products).where(eq(products.slug, slug)).limit(1);
              if (conflict.length === 0) break;
              suffix++;
              slug = `${toSlug(title)}-${suffix}`;
            }
            productData.slug = slug;
            await db.insert(products).values(productData);
            results.created++;
          }
        } catch (err) {
          results.errors.push({
            row: rowNum,
            title,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
    });

    revalidateTag(CATALOG_TAG, {});

    return NextResponse.json({
      ok: true,
      created: results.created,
      updated: results.updated,
      errors: results.errors,
      total: rows.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error al procesar" }, { status: 500 });
  }
}
