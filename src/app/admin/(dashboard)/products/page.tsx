import Link from "next/link";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages } from "@/db/tenant-schema";
import { desc, eq, count, sql } from "drizzle-orm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import Image from "next/image";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const schema = session!.user.schemaName;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, [{ total }]] = await withTenantDb(schema, async (db) => {
    const data = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        currency: products.currency,
        active: products.active,
        categoryName: categories.name,
        // Primera imagen para thumbnail
        imageUrl: sql<string | null>`(
          SELECT url FROM product_images
          WHERE product_id = ${products.id}
          ORDER BY "order" ASC
          LIMIT 1
        )`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    const [totals] = await db.select({ total: count() }).from(products);

    return [data, [totals]];
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} en total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
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
                href={`/admin/products?page=${page - 1}`}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/products?page=${page + 1}`}
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
