import Link from "next/link";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories } from "@/db/tenant-schema";
import { desc, eq } from "drizzle-orm";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

export default async function AdminProductsPage() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const rows = await withTenantDb(schema, (db) =>
    db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        currency: products.currency,
        active: products.active,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
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
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Categoría</th>
                <th className="text-left px-4 py-3">Precio</th>
                <th className="text-center px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoryName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.price
                      ? `${p.currency} ${Number(p.price).toLocaleString("es-AR")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleActiveButton productId={p.id} active={p.active} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
