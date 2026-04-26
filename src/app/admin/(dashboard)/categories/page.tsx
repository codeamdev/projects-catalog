import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { categories } from "@/db/tenant-schema";
import { createCategory, deleteCategory } from "@/app/api/admin/actions";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";

const INPUT = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1";

export default async function CategoriesPage() {
  const session = await auth();
  const cats = await withTenantDb(session!.user.schemaName, (db) =>
    db.select().from(categories).orderBy(categories.order, categories.name)
  );

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>

      {/* Crear categoría */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Nueva categoría</h2>
        <form action={createCategory} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="Nombre de la categoría"
            className={INPUT}
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Crear
          </button>
        </form>
      </section>

      {/* Lista */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Categorías existentes{" "}
          <span className="text-gray-400 font-normal text-sm">({cats.length})</span>
        </h2>

        {cats.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Todavía no hay categorías. Creá la primera arriba.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {cats.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.slug}</p>
                </div>
                <DeleteCategoryButton deleteAction={deleteCategory.bind(null, cat.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
