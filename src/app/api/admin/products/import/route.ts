import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages } from "@/db/tenant-schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog-data";

function toSlug(title: string) {
  return title.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-").replace(/[^\w-]/g, "").substring(0, 80);
}

function parseBool(val: unknown, def = false): boolean {
  if (val === undefined || val === null || val === "") return def;
  return String(val).toUpperCase().trim() === "SI" || String(val) === "1" || String(val).toLowerCase() === "true";
}

function parseNum(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

interface ImportRow {
  ID?: string;
  Título?: string;
  Slug?: string;
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
  "Imagen 1"?: string;
  "Imagen 2"?: string;
  "Imagen 3"?: string;
  "Imagen 4"?: string;
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

    // Use first sheet named "Productos", or first sheet
    const sheetName = wb.SheetNames.includes("Productos") ? "Productos" : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: ImportRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) return NextResponse.json({ error: "El archivo no tiene datos" }, { status: 400 });

    const results = { created: 0, updated: 0, errors: [] as { row: number; title: string; error: string }[] };

    await withTenantDb(schema, async (db) => {
      // Cache categories by name
      const catRows = await db.select({ id: categories.id, name: categories.name }).from(categories);
      const catMap: Record<string, string> = {};
      for (const c of catRows) catMap[c.name.toLowerCase()] = c.id;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1-indexed header + 1)
        const title = String(row.Título ?? "").trim();

        if (!title) {
          results.errors.push({ row: rowNum, title: "(sin título)", error: "Título es requerido" });
          continue;
        }

        try {
          // Resolve category
          let categoryId: string | null = null;
          const catName = String(row.Categoría ?? "").trim();
          if (catName) {
            const key = catName.toLowerCase();
            if (catMap[key]) {
              categoryId = catMap[key];
            } else {
              // Create category
              const catSlug = toSlug(catName);
              const [newCat] = await db.insert(categories)
                .values({ name: catName, slug: catSlug, order: 0 })
                .onConflictDoNothing()
                .returning({ id: categories.id });
              if (newCat) {
                catMap[key] = newCat.id;
                categoryId = newCat.id;
              }
            }
          }

          const price = parseNum(row.Precio);
          const discountPct = parseNum(row["Descuento %"]);
          const stock = parseNum(row.Stock);
          const tagList = String(row.Tags ?? "").split(",").map(t => t.trim()).filter(Boolean);
          const imageUrls = [row["Imagen 1"], row["Imagen 2"], row["Imagen 3"], row["Imagen 4"]]
            .map(u => String(u ?? "").trim()).filter(Boolean);

          const productData = {
            title,
            slug: String(row.Slug ?? "").trim() || toSlug(title),
            description: String(row.Descripción ?? "").trim() || null,
            price: price !== null ? String(price) : null,
            currency: String(row.Moneda ?? "COP").trim().toUpperCase() || "COP",
            categoryId,
            active: parseBool(row.Activo, true),
            featured: parseBool(row.Destacado, false),
            discountPercent: discountPct !== null ? Math.min(99, Math.max(1, Math.round(discountPct))) : null,
            tags: tagList,
            stock: stock !== null ? Math.round(stock) : null,
            trackStock: parseBool(row["Controlar Stock"], false),
            updatedAt: new Date(),
          };

          const id = String(row.ID ?? "").trim();
          let productId = id;

          if (id) {
            // Update by ID
            const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
            if (existing.length === 0) {
              results.errors.push({ row: rowNum, title, error: `ID "${id}" no encontrado` });
              continue;
            }
            await db.update(products).set(productData).where(eq(products.id, id));
            results.updated++;
          } else {
            // Create or update by slug
            const slug = productData.slug;
            let suffix = 0;
            let finalSlug = slug;
            while (true) {
              const conflict = await db.select({ id: products.id }).from(products)
                .where(and(eq(products.slug, finalSlug))).limit(1);
              if (conflict.length === 0) break;
              suffix++;
              finalSlug = `${slug}-${suffix}`;
            }
            const [created] = await db.insert(products)
              .values({ ...productData, slug: finalSlug })
              .returning({ id: products.id });
            productId = created.id;
            results.created++;
          }

          // Sync images (replace all)
          if (imageUrls.length > 0 || id) {
            await db.delete(productImages).where(eq(productImages.productId, productId));
            if (imageUrls.length > 0) {
              await db.insert(productImages).values(
                imageUrls.map((url, idx) => ({ productId, url, order: idx }))
              );
            }
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
