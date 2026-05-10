import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories } from "@/db/tenant-schema";
import { eq, sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const [totalProducts, activeProducts, totalCategories] = await withTenantDb(
    schema,
    async (db) => {
      const [t, a, c] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(products),
        db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.active, true)),
        db.select({ count: sql<number>`count(*)::int` }).from(categories),
      ]);
      return [t[0].count, a[0].count, c[0].count];
    }
  );

  const stats = [
    { label: "Productos totales", value: totalProducts },
    { label: "Productos activos", value: activeProducts },
    { label: "Categorías", value: totalCategories },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bienvenido, {session!.user.name || session!.user.email}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 border">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Accesos rápidos</h2>
        <div className="flex gap-3 flex-wrap">
          <a href="/admin/products/new" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            + Nuevo producto
          </a>
          <a href="/admin/settings" className="border px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Ajustes del catálogo
          </a>
          <a href="/" target="_blank" className="border px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Ver catálogo →
          </a>
        </div>
      </div>
    </div>
  );
}
