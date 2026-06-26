import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, settings } from "@/db/tenant-schema";
import { eq, asc } from "drizzle-orm";

function fmtPrice(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return "";
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const schema = session.user.schemaName;

    const [inventoryEnabled, rows] = await withTenantDb(schema, async (db) => {
      const [s] = await db.select({ inventoryEnabled: settings.inventoryEnabled }).from(settings).limit(1);
      const inv = s?.inventoryEnabled ?? false;

      const prods = await db
        .select({
          id: products.id,
          title: products.title,
          description: products.description,
          price: products.price,
          currency: products.currency,
          active: products.active,
          featured: products.featured,
          discountPercent: products.discountPercent,
          tags: products.tags,
          stock: products.stock,
          trackStock: products.trackStock,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(asc(products.title));

      return [inv, prods];
    });

    const rows2 = rows.map((p) => {
      const base: Record<string, unknown> = {
        ID: p.id,
        Título: p.title,
        Descripción: p.description ?? "",
        Precio: fmtPrice(p.price),
        Moneda: p.currency,
        Categoría: p.categoryName ?? "",
        Activo: p.active ? "SI" : "NO",
        Destacado: p.featured ? "SI" : "NO",
        "Descuento %": p.discountPercent ?? "",
        Tags: (p.tags ?? []).join(", "),
      };
      if (inventoryEnabled) {
        base["Stock"] = p.stock ?? "";
        base["Controlar Stock"] = p.trackStock ? "SI" : "NO";
      }
      return base;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows2);

    const colWidths = [
      { wch: 36 }, // ID
      { wch: 40 }, // Título
      { wch: 50 }, // Descripción
      { wch: 14 }, // Precio
      { wch: 8  }, // Moneda
      { wch: 22 }, // Categoría
      { wch: 8  }, // Activo
      { wch: 10 }, // Destacado
      { wch: 12 }, // Descuento %
      { wch: 25 }, // Tags
    ];
    if (inventoryEnabled) {
      colWidths.push({ wch: 8 }, { wch: 14 });
    }
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Instrucciones
    const instrRows: unknown[][] = [
      ["INSTRUCCIONES DE IMPORTACIÓN"],
      [],
      ["Campo", "Requerido", "Descripción"],
      ["ID", "No", "Dejar en blanco para crear nuevo. Si se incluye, actualiza el producto existente."],
      ["Título", "SÍ", "Nombre del producto. Campo obligatorio."],
      ["Descripción", "No", "Descripción del producto."],
      ["Precio", "No", "Número sin símbolo. Ej: 150000"],
      ["Moneda", "No", "COP, USD, EUR. Por defecto: COP"],
      ["Categoría", "No", "Nombre de la categoría. Debe existir en el sistema."],
      ["Activo", "No", "SI o NO. Por defecto: SI"],
      ["Destacado", "No", "SI o NO. Por defecto: NO"],
      ["Descuento %", "No", "Número del 1 al 99"],
      ["Tags", "No", "Etiquetas separadas por coma"],
    ];
    if (inventoryEnabled) {
      instrRows.push(
        ["Stock", "No", "Número entero de unidades disponibles"],
        ["Controlar Stock", "No", "SI o NO. Por defecto: NO"]
      );
    }
    const wsI = XLSX.utils.aoa_to_sheet(instrRows);
    wsI["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsI, "Instrucciones");

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
