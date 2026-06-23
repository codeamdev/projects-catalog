import Link from "next/link";
import { Search, Download, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages } from "@/db/tenant-schema";
import { desc, eq, count, sql, ilike, and } from "drizzle-orm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import Image from "next/image";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  const schema = session!.user.schemaName;
  const { page: pageParam, q: qParam } = await searchParams;
  const q = qParam?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;
  const where = q ? ilike(products.title, `%${q}%`) : undefined;

  const [rows, [{ total }]] = await withTenantDb(schema, async (db) => {
    const data = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        currency: products.currency,
        active: products.active,
        categoryName: categories.name,
        imageUrl: sql<string | null>`(
          SELECT url FROM product_images
          WHERE product_id = ${products.id}
          ORDER BY "order" ASC
          LIMIT 1
        )`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    const [totals] = await db.select({ total: count() }).from(products).where(where);

    return [data, [totals]];
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginationBase = q ? `/admin/products?q=${encodeURIComponent(q)}` : "/admin/products";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} {q ? `resultado${total !== 1 ? "s" : ""} para "${q}"` : "en total"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/products/export"
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            title="Exportar a Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </a>
          <Link
            href="/admin/products/import"
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            title="Importar desde Excel"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      {/* Buscador */}
      <form method="GET" action="/admin/products" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            autoComplete="off"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400"
          />
          {q && (
            <Link
              href="/admin/products"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar búsqueda"
            >
              ✕
            </Link>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No hay productos aún.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 w-12"></th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Precio</th>
                <th className="text-center px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {p.categoryName ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.price
                      ? `${p.currency} ${Number(p.price).toLocaleString("es-CO")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleActiveButton productId={p.id} active={p.active} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline text-xs">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`${paginationBase}${q ? "&" : "?"}page=${page - 1}`}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`${paginationBase}${q ? "&" : "?"}page=${page + 1}`}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
