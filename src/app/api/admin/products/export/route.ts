import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages } from "@/db/tenant-schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const schema = session.user.schemaName;

    const rows = await withTenantDb(schema, async (db) => {
      const prods = await db
        .select({
          id: products.id,
          title: products.title,
          slug: products.slug,
          description: products.description,
          price: products.price,
          currency: products.currency,
          active: products.active,
          featured: products.featured,
          discountPercent: products.discountPercent,
          tags: products.tags,
          stock: products.stock,
          trackStock: products.trackStock,
          categoryId: products.categoryId,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(asc(products.title));

      const allImages = await db
        .select({ productId: productImages.productId, url: productImages.url, order: productImages.order })
        .from(productImages)
        .orderBy(asc(productImages.order));

      const imagesByProduct: Record<string, string[]> = {};
      for (const img of allImages) {
        if (!imagesByProduct[img.productId]) imagesByProduct[img.productId] = [];
        imagesByProduct[img.productId].push(img.url);
      }

      return prods.map((p) => {
        const imgs = imagesByProduct[p.id] ?? [];
        return {
          ID: p.id,
          Título: p.title,
          Slug: p.slug,
          Descripción: p.description ?? "",
          Precio: p.price !== null ? Number(p.price) : "",
          Moneda: p.currency,
          Categoría: p.categoryName ?? "",
          Activo: p.active ? "SI" : "NO",
          Destacado: p.featured ? "SI" : "NO",
          "Descuento %": p.discountPercent ?? "",
          Tags: (p.tags ?? []).join(", "),
          Stock: p.stock ?? "",
          "Controlar Stock": p.trackStock ? "SI" : "NO",
          "Imagen 1": imgs[0] ?? "",
          "Imagen 2": imgs[1] ?? "",
          "Imagen 3": imgs[2] ?? "",
          "Imagen 4": imgs[3] ?? "",
        };
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 36 }, // ID
      { wch: 40 }, // Título
      { wch: 30 }, // Slug
      { wch: 50 }, // Descripción
      { wch: 12 }, // Precio
      { wch: 8  }, // Moneda
      { wch: 20 }, // Categoría
      { wch: 8  }, // Activo
      { wch: 10 }, // Destacado
      { wch: 12 }, // Descuento %
      { wch: 25 }, // Tags
      { wch: 8  }, // Stock
      { wch: 14 }, // Controlar Stock
      { wch: 60 }, // Imagen 1
      { wch: 60 }, // Imagen 2
      { wch: 60 }, // Imagen 3
      { wch: 60 }, // Imagen 4
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Instructions sheet
    const instrRows = [
      ["INSTRUCCIONES DE IMPORTACIÓN"],
      [""],
      ["Campo", "Requerido", "Descripción"],
      ["ID", "No", "Dejar en blanco para crear nuevo. Si se incluye, actualiza el producto existente."],
      ["Título", "Sí", "Nombre del producto"],
      ["Slug", "No", "URL amigable. Se genera automáticamente si se deja vacío."],
      ["Descripción", "No", "Descripción del producto"],
      ["Precio", "No", "Número sin símbolo de moneda. Ej: 150000"],
      ["Moneda", "No", "COP, USD, EUR. Por defecto: COP"],
      ["Categoría", "No", "Nombre exacto de la categoría. Se crea si no existe."],
      ["Activo", "No", "SI o NO. Por defecto: SI"],
      ["Destacado", "No", "SI o NO. Por defecto: NO"],
      ["Descuento %", "No", "Número del 1 al 99. Ej: 20"],
      ["Tags", "No", "Etiquetas separadas por coma. Ej: nuevo, oferta"],
      ["Stock", "No", "Número entero"],
      ["Controlar Stock", "No", "SI o NO. Por defecto: NO"],
      ["Imagen 1-4", "No", "URL completa de la imagen. Ej: https://..."],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
    wsInstr["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="productos-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
